import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => {
    const m = () => vi.fn();
    const prisma: any = {
        staffUser: { findUnique: m() },
        association: { findUnique: m() },
        artisan: { groupBy: m(), count: m(), findMany: m() },
        payment: { findMany: m(), aggregate: m() },
        platformSettings: { upsert: m() },
    };
    return { prisma };
});
vi.mock("../src/config/prisma", () => ({ prisma: db.prisma }));

beforeAll(() => {
    process.env.DATABASE_URL = "sqlserver://localhost:1433;database=test";
    process.env.JWT_ACCESS_SECRET = "a";
    process.env.JWT_REFRESH_SECRET = "b";
});

const HEAD = { id: "h1", name: "Head", role: "ASSOCIATION_HEAD" as const, associationId: "as1" };
const settings = { fee: 200, dueDay: 5, graceDays: 7, reminderDays: "7, 3, 1", adminsCanCreateStaff: false, revenueBasis: "gross", gateway: "x", emailProvider: "x", supportEmail: "s@x.com" };

beforeEach(() => {
    vi.clearAllMocks();
    db.prisma.platformSettings.upsert.mockResolvedValue(settings);
    db.prisma.association.findUnique.mockResolvedValue({ name: "Tailors" });
});

describe("association dashboard", () => {
    it("is scoped to the head's association on every query", async () => {
        const { getAssociationSummary } = await import("../src/modules/dashboard/dashboard.service");
        db.prisma.artisan.groupBy.mockResolvedValue([]);
        db.prisma.artisan.count.mockResolvedValue(0);
        db.prisma.artisan.findMany.mockResolvedValue([]);
        db.prisma.payment.findMany.mockResolvedValue([]);
        db.prisma.payment.aggregate.mockResolvedValue({ _sum: { amount: null } });
        await getAssociationSummary(HEAD);

        expect(db.prisma.association.findUnique.mock.calls[0][0].where).toEqual({ id: "as1" });
        expect(db.prisma.artisan.groupBy.mock.calls[0][0].where).toEqual({ associationId: "as1" });
        expect(db.prisma.artisan.count.mock.calls[0][0].where).toMatchObject({ associationId: "as1", status: "Active", verification: "Verified" });
        for (const call of db.prisma.artisan.findMany.mock.calls) expect(call[0].where).toMatchObject({ associationId: "as1" });
        for (const call of db.prisma.payment.aggregate.mock.calls) expect(call[0].where.artisan).toEqual({ associationId: "as1" });
        expect(db.prisma.payment.findMany.mock.calls[0][0].where.artisan).toEqual({ associationId: "as1" });
    });

    it("counts people who owe this month, ignoring the paid and brand-new members", async () => {
        const { getAssociationSummary } = await import("../src/modules/dashboard/dashboard.service");
        const { periodFor } = await import("../src/utils/dates");
        const period = periodFor(new Date(), settings);
        const before = new Date(period.start.getTime() - 86_400_000 * 40);
        const after = new Date(period.start.getTime() + 3_600_000); // joined this month

        db.prisma.artisan.groupBy.mockResolvedValue([
            { status: "Active", _count: { _all: 3 } }, { status: "Overdue", _count: { _all: 1 } },
            { status: "Pending", _count: { _all: 2 } }, { status: "Suspended", _count: { _all: 1 } },
        ]);
        db.prisma.artisan.count.mockResolvedValue(2);
        db.prisma.artisan.findMany
            .mockResolvedValueOnce([
                { id: "paid", name: "Paid Pat", status: "Active", createdAt: before },
                { id: "owes", name: "Owes Ola", status: "Active", createdAt: before },
                { id: "late", name: "Late Lola", status: "Overdue", createdAt: before },
                { id: "new", name: "New Nia", status: "Active", createdAt: after },
            ])
            .mockResolvedValueOnce([{ id: "abcdefghijkl", name: "Ada", category: "Tailoring", status: "Active", createdAt: new Date("2026-10-01") }]);
        db.prisma.payment.findMany.mockResolvedValue([{ artisanId: "paid" }]);
        db.prisma.payment.aggregate
            .mockResolvedValueOnce({ _sum: { amount: 400 } })
            .mockResolvedValueOnce({ _sum: { amount: 1200 } });

        const s = await getAssociationSummary(HEAD);
        expect(s.association).toBe("Tailors");
        expect(s.artisans).toEqual({ total: 7, active: 3, inactive: 4, overdue: 1, pending: 2, listed: 2 });
        expect(s.outstanding.count).toBe(2);
        expect(s.outstanding.items.map((i: { id: string }) => i.id)).toEqual(["owes", "late"]);
        expect(s.revenue).toMatchObject({ collected: 400, collectedAll: 1200 });
        expect(s.recent[0]).toMatchObject({ ref: "AON-GHIJKL", name: "Ada" });
        expect(JSON.stringify(s)).not.toContain("passwordHash");
    });

    it("is only available to association heads", async () => {
        const { default: app } = await import("../src/app");
        const { signAccessToken } = await import("../src/utils/token");
        const server = app.listen(0);
        try {
            const { port } = server.address() as { port: number };
            const url = `http://127.0.0.1:${port}/api/dashboard/association`;
            expect((await fetch(url)).status).toBe(401);
            for (const role of ["ADMIN", "SUPER_ADMIN", "ARTISAN"]) {
                const token = signAccessToken({ sub: "x", role: role as any, userType: role === "ARTISAN" ? "ARTISAN" : "STAFF" });
                expect((await fetch(url, { headers: { Authorization: `Bearer ${token}` } })).status).toBe(403);
            }
            // A head whose account was moved/removed is refused even with a valid token.
            db.prisma.staffUser.findUnique.mockResolvedValue({ id: "h", name: "H", role: "ASSOCIATION_HEAD", status: "Disabled", associationId: "as1" });
            const head = signAccessToken({ sub: "h", role: "ASSOCIATION_HEAD", userType: "STAFF" });
            expect((await fetch(url, { headers: { Authorization: `Bearer ${head}` } })).status).toBe(401);
        } finally {
            server.close();
        }
    });
});