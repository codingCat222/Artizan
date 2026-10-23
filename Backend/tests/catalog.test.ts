import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => {
    const m = () => vi.fn();
    const prisma: any = {
        staffUser: { findUnique: m() },
        artisan: { findFirst: m(), findUnique: m(), findMany: m(), count: m(), create: m(), update: m(), updateMany: m(), delete: m() },
        association: { findUnique: m(), findMany: m(), updateMany: m() },
        category: { findUnique: m(), findFirst: m(), findMany: m(), create: m(), update: m() },
        payment: { findUnique: m(), findMany: m(), count: m(), groupBy: m(), update: m() },
        activationToken: { deleteMany: m() },
        refreshToken: { updateMany: m() },
        artisanDocument: { findMany: m() },
        auditLog: { create: m() },
        $transaction: m(),
    };
    return { prisma, createActivationToken: vi.fn() };
});
vi.mock("../src/config/prisma", () => ({ prisma: db.prisma }));
vi.mock("../src/modules/auth/auth.service", () => ({ createActivationToken: db.createActivationToken }));

beforeAll(() => {
    process.env.DATABASE_URL = "sqlserver://localhost:1433;database=test";
    process.env.JWT_ACCESS_SECRET = "a";
    process.env.JWT_REFRESH_SECRET = "b";
});

const SUPER = { id: "s1", name: "Super", role: "SUPER_ADMIN" as const, associationId: null };
const HEAD = { id: "h1", name: "Head", role: "ASSOCIATION_HEAD" as const, associationId: "as1" };

const artisanRow = (over: any = {}) => ({
    id: "cabcdefghijkl", name: "Ada Obi", email: "ada@x.com", category: "Tailoring", associationId: "as1",
    association: { id: "as1", name: "Tailors" }, town: "Abeokuta", area: "Kuto", phone: "08012345678",
    status: "Active", verification: "Verified", businessName: "Ada Stitches", businessDescription: null,
    whatsapp: null, businessAddress: "1 Road", shopNumber: null, dob: null, idType: "National ID (NIN)",
    idNumber: "12345678901", avatarInitials: "AO", photo: null, mustChangePassword: false, createdBy: "Super",
    verifiedBy: "Super", createdAt: new Date("2026-01-01"), passwordHash: "hash", ...over,
});

const input = {
    name: "Ada Obi", phone: "08012345678", email: "Ada@X.com", businessName: "Ada Stitches", businessAddress: "1 Road",
    town: "Abeokuta", area: "Kuto", category: "Tailoring", associationId: "as1",
};

beforeEach(() => {
    vi.clearAllMocks();
    db.prisma.auditLog.create.mockResolvedValue({});
    db.prisma.staffUser.findUnique.mockResolvedValue(null);
    db.prisma.artisan.findFirst.mockResolvedValue(null);
    db.prisma.association.findUnique.mockResolvedValue({ id: "as1", name: "Tailors", status: "Active" });
    db.prisma.category.findUnique.mockResolvedValue({ id: "c1", name: "Tailoring", status: "Active" });
    db.prisma.$transaction.mockImplementation(async (arg: any) => (typeof arg === "function" ? arg(db.prisma) : Promise.all(arg)));
});

describe("requester", () => {
    it("rejects disabled staff and heads without an association", async () => {
        const { requesterFrom } = await import("../src/utils/requester");
        const req: any = { user: { sub: "x" } };
        db.prisma.staffUser.findUnique.mockResolvedValue({ id: "x", name: "N", role: "ADMIN", status: "Disabled", associationId: null });
        await expect(requesterFrom(req)).rejects.toMatchObject({ statusCode: 401 });
        db.prisma.staffUser.findUnique.mockResolvedValue({ id: "x", name: "N", role: "ASSOCIATION_HEAD", status: "Active", associationId: null });
        await expect(requesterFrom(req)).rejects.toMatchObject({ statusCode: 403 });
        db.prisma.staffUser.findUnique.mockResolvedValue({ id: "x", name: "N", role: "ASSOCIATION_HEAD", status: "Active", associationId: "as9" });
        expect(await requesterFrom(req)).toMatchObject({ role: "ASSOCIATION_HEAD", associationId: "as9" });
    });
});

describe("artisans: scoping", () => {
    it("always limits an association head's list to their own association", async () => {
        const { listArtisans } = await import("../src/modules/artisans/artisans.service");
        db.prisma.artisan.count.mockResolvedValue(0);
        db.prisma.artisan.findMany.mockResolvedValue([]);
        await listArtisans(HEAD, { associationId: "OTHER", page: 1, pageSize: 20 });
        expect(db.prisma.artisan.count.mock.calls[0][0].where).toMatchObject({ associationId: "as1" });
    });

    it("admins can filter by association, status and category", async () => {
        const { listArtisans } = await import("../src/modules/artisans/artisans.service");
        db.prisma.artisan.count.mockResolvedValue(0);
        db.prisma.artisan.findMany.mockResolvedValue([]);
        await listArtisans(SUPER, { associationId: "as2", status: "Overdue", category: "Plumbing", page: 2, pageSize: 10 });
        expect(db.prisma.artisan.count.mock.calls[0][0].where).toMatchObject({ associationId: "as2", status: "Overdue", category: "Plumbing" });
        expect(db.prisma.artisan.findMany.mock.calls[0][0]).toMatchObject({ skip: 10, take: 10 });
    });

    it("returns 404 (not 403) for another association's artisan", async () => {
        const { getArtisan } = await import("../src/modules/artisans/artisans.service");
        await expect(getArtisan(HEAD, "cabcdefghijkl")).rejects.toMatchObject({ statusCode: 404 });
        expect(db.prisma.artisan.findFirst.mock.calls[0][0].where).toMatchObject({ id: "cabcdefghijkl", associationId: "as1" });
    });

    it("never exposes the full ID number or password hash", async () => {
        const { getArtisan } = await import("../src/modules/artisans/artisans.service");
        db.prisma.artisan.findFirst.mockResolvedValue(artisanRow());
        db.prisma.artisanDocument.findMany.mockResolvedValue([]);
        db.prisma.payment.findMany.mockResolvedValue([]);
        const a = await getArtisan(SUPER, "cabcdefghijkl");
        const json = JSON.stringify(a);
        expect(a.idNumberMasked).toBe("••••••••901");
        expect(json).not.toContain("12345678901");
        expect(json).not.toContain("passwordHash");
        expect(a.ref).toBe("AON-GHIJKL");
    });
});

describe("artisans: create", () => {
    it("forces a head's own association, ignoring what the client sent", async () => {
        const { createArtisan } = await import("../src/modules/artisans/artisans.service");
        db.prisma.artisan.create.mockResolvedValue(artisanRow());
        await createArtisan(HEAD, { ...input, associationId: "as-other" });
        expect(db.prisma.association.findUnique).toHaveBeenCalledWith({ where: { id: "as1" } });
        expect(db.prisma.artisan.create.mock.calls[0][0].data.associationId).toBe("as1");
    });

    it("registers as Pending, lowercases the email and sends the activation email", async () => {
        const { createArtisan } = await import("../src/modules/artisans/artisans.service");
        db.prisma.artisan.create.mockResolvedValue(artisanRow({ status: "Pending" }));
        await createArtisan(SUPER, input);
        const data = db.prisma.artisan.create.mock.calls[0][0].data;
        expect(data).toMatchObject({ email: "ada@x.com", status: "Pending", mustChangePassword: true, createdBy: "Super" });
        expect(db.createActivationToken).toHaveBeenCalledOnce();
        expect(db.prisma.auditLog.create.mock.calls[0][0].data.action).toBe("Registered artisan");
    });

    it("rejects duplicate emails, inactive categories and inactive associations", async () => {
        const { createArtisan } = await import("../src/modules/artisans/artisans.service");
        db.prisma.staffUser.findUnique.mockResolvedValueOnce({ id: "staff" });
        await expect(createArtisan(SUPER, input)).rejects.toMatchObject({ statusCode: 409 });

        db.prisma.category.findUnique.mockResolvedValueOnce({ name: "Tailoring", status: "Inactive" });
        await expect(createArtisan(SUPER, input)).rejects.toMatchObject({ statusCode: 400 });

        db.prisma.association.findUnique.mockResolvedValueOnce({ id: "as1", status: "Inactive" });
        await expect(createArtisan(SUPER, input)).rejects.toMatchObject({ statusCode: 400 });
        expect(db.prisma.artisan.create).not.toHaveBeenCalled();
    });

    it("rolls back if the activation email can't be sent", async () => {
        const { createArtisan } = await import("../src/modules/artisans/artisans.service");
        db.prisma.artisan.create.mockResolvedValue(artisanRow());
        db.createActivationToken.mockRejectedValueOnce(new Error("smtp"));
        await expect(createArtisan(SUPER, input)).rejects.toMatchObject({ statusCode: 502 });
        expect(db.prisma.artisan.delete).toHaveBeenCalled();
    });
});

describe("artisans: update & lifecycle", () => {
    it("a head cannot move an artisan to another association", async () => {
        const { updateArtisan } = await import("../src/modules/artisans/artisans.service");
        db.prisma.artisan.findFirst.mockResolvedValueOnce(artisanRow());
        db.prisma.artisan.update.mockResolvedValue(artisanRow());
        await updateArtisan(HEAD, "cabcdefghijkl", { ...input, associationId: "as2" });
        expect(db.prisma.artisan.update.mock.calls[0][0].data.associationId).toBe("as1");
    });

    it("keeps the ID number on file when the field is left blank", async () => {
        const { updateArtisan } = await import("../src/modules/artisans/artisans.service");
        db.prisma.artisan.findFirst.mockResolvedValueOnce(artisanRow());
        db.prisma.artisan.update.mockResolvedValue(artisanRow());
        await updateArtisan(SUPER, "cabcdefghijkl", { ...input, idType: "National ID (NIN)", idNumber: "" });
        expect(db.prisma.artisan.update.mock.calls[0][0].data).not.toHaveProperty("idNumber");
    });

    it("suspending revokes sessions; reactivating an un-activated artisan returns them to Pending", async () => {
        const { setArtisanStatus } = await import("../src/modules/artisans/artisans.service");
        db.prisma.artisan.findFirst.mockResolvedValueOnce(artisanRow());
        db.prisma.artisan.update.mockResolvedValue(artisanRow({ status: "Suspended" }));
        await setArtisanStatus(SUPER, "cabcdefghijkl", "Suspended");
        expect(db.prisma.refreshToken.updateMany).toHaveBeenCalled();

        db.prisma.artisan.findFirst.mockResolvedValueOnce(artisanRow({ status: "Suspended", passwordHash: null }));
        db.prisma.artisan.update.mockResolvedValue(artisanRow({ status: "Pending" }));
        await setArtisanStatus(SUPER, "cabcdefghijkl", "Active");
        expect(db.prisma.artisan.update.mock.calls[1][0].data.status).toBe("Pending");
    });

    it("password reset is refused for artisans who haven't activated; resend only for pending", async () => {
        const { requirePasswordReset, resendActivation } = await import("../src/modules/artisans/artisans.service");
        db.prisma.artisan.findFirst.mockResolvedValueOnce(artisanRow({ status: "Pending" }));
        await expect(requirePasswordReset(SUPER, "x")).rejects.toMatchObject({ statusCode: 400 });
        db.prisma.artisan.findFirst.mockResolvedValueOnce(artisanRow({ status: "Active" }));
        await expect(resendActivation(SUPER, "x")).rejects.toMatchObject({ statusCode: 400 });
        db.prisma.artisan.findFirst.mockResolvedValueOnce(artisanRow({ status: "Pending" }));
        await resendActivation(SUPER, "x");
        expect(db.createActivationToken).toHaveBeenCalledOnce();
    });
});

describe("artisan input validation", () => {
    it("validates phone numbers and requires an ID number with an ID type", async () => {
        const { createArtisanSchema } = await import("../src/modules/artisans/artisans.schema");
        const parse = (b: object) => createArtisanSchema.safeParse({ body: { ...input, ...b } });
        expect(parse({}).success).toBe(true);
        expect(parse({ phone: "123" }).success).toBe(false);
        expect(parse({ phone: "+234 801 234 5678" }).success).toBe(true);
        expect(parse({ whatsapp: "abc" }).success).toBe(false);
        expect(parse({ idType: "National ID (NIN)" }).success).toBe(false);
        expect(parse({ idType: "National ID (NIN)", idNumber: "123" }).success).toBe(true);
        expect(parse({ idType: "Library card", idNumber: "1" }).success).toBe(false);
    });
});

describe("categories", () => {
    it("renaming cascades to artisans and associations", async () => {
        const { updateCategory } = await import("../src/modules/categories/categories.service");
        db.prisma.category.findUnique.mockResolvedValue({ id: "c1", name: "Tailoring", status: "Active" });
        db.prisma.category.findFirst.mockResolvedValue(null);
        db.prisma.category.update.mockReturnValue({ id: "c1", name: "Fashion", description: null, status: "Active" });
        db.prisma.artisan.updateMany.mockReturnValue("a");
        db.prisma.association.updateMany.mockReturnValue("b");
        db.prisma.artisan.count.mockResolvedValue(3);
        const dto = await updateCategory("c1", { name: "Fashion" }, { id: "s", name: "S" });
        expect(db.prisma.artisan.updateMany).toHaveBeenCalledWith({ where: { category: "Tailoring" }, data: { category: "Fashion" } });
        expect(db.prisma.association.updateMany).toHaveBeenCalled();
        expect(dto).toMatchObject({ name: "Fashion", artisanCount: 3 });
    });

    it("rejects duplicate names", async () => {
        const { createCategory } = await import("../src/modules/categories/categories.service");
        db.prisma.category.findFirst.mockResolvedValue({ id: "c9" });
        await expect(createCategory({ name: "Tailoring" }, { id: "s", name: "S" })).rejects.toMatchObject({ statusCode: 409 });
    });
});

describe("payments & reports", () => {
    const pay = (over: any = {}) => ({
        id: "p1", artisanId: "a1", amount: 200, gatewayFee: 10, period: "October 2026", status: "Paid", reference: "REF1",
        paidAt: new Date("2026-10-05"), createdAt: new Date("2026-10-05"),
        artisan: { name: "Ada", association: { name: "Tailors" } }, ...over,
    });

    it("scopes payments to a head's association and totals every status", async () => {
        const { listPayments } = await import("../src/modules/payments/payments.service");
        db.prisma.payment.count.mockResolvedValue(1);
        db.prisma.payment.findMany.mockResolvedValue([pay()]);
        db.prisma.payment.groupBy
            .mockResolvedValueOnce([{ status: "Paid", _sum: { amount: 400 }, _count: { _all: 2 } }, { status: "Failed", _sum: { amount: 200 }, _count: { _all: 1 } }])
            .mockResolvedValueOnce([{ period: "October 2026" }]);
        const r = await listPayments(HEAD, { status: "Paid", page: 1, pageSize: 20 });
        expect(db.prisma.payment.count.mock.calls[0][0].where).toMatchObject({ artisan: { associationId: "as1" }, status: "Paid" });
        expect(r.totals).toEqual({ collected: 400, pending: 0, overdue: 0, failedCount: 1 });
        expect(r.periods).toEqual(["October 2026"]);
    });

    it("only completed payments can be refunded, and heads can't refund", async () => {
        const { refundPayment } = await import("../src/modules/payments/payments.service");
        await expect(refundPayment(HEAD, "p1")).rejects.toMatchObject({ statusCode: 403 });
        db.prisma.payment.findUnique.mockResolvedValueOnce(pay({ status: "Pending" }));
        await expect(refundPayment(SUPER, "p1")).rejects.toMatchObject({ statusCode: 400 });
        db.prisma.payment.findUnique.mockResolvedValueOnce(pay());
        db.prisma.payment.update.mockResolvedValue(pay({ status: "Refunded" }));
        expect((await refundPayment(SUPER, "p1")).status).toBe("Refunded");
        expect(db.prisma.auditLog.create.mock.calls[0][0].data.action).toBe("Refunded payment");
    });

    it("summarises amounts, gateway fees and net", async () => {
        const { summarise } = await import("../src/modules/reports/reports.service");
        const s = summarise([
            { amount: 200, gatewayFee: 10, status: "Paid" },
            { amount: 200, gatewayFee: 0, status: "Pending" },
            { amount: 200, gatewayFee: 0, status: "Failed" },
            { amount: 200, gatewayFee: 0, status: "Refunded" },
        ]);
        expect(s).toMatchObject({ due: 800, paid: 200, pending: 200, failed: 200, refunded: 200, fees: 10, net: 190 });
    });

    it("neutralises spreadsheet formulas and escapes CSV cells", async () => {
        const { csvCell } = await import("../src/modules/reports/reports.service");
        expect(csvCell("=HYPERLINK(1)")).toBe("'=HYPERLINK(1)");
        expect(csvCell("+1")).toBe("'+1");
        expect(csvCell('Ada, "The" Tailor')).toBe('"Ada, ""The"" Tailor"');
        expect(csvCell(200)).toBe("200");
    });

    it("report lists only the head's association", async () => {
        const { paymentReport } = await import("../src/modules/reports/reports.service");
        db.prisma.payment.findMany.mockResolvedValue([pay()]);
        db.prisma.association.findMany.mockResolvedValue([{ name: "Tailors" }]);
        const r = await paymentReport(HEAD, "October 2026");
        expect(db.prisma.association.findMany.mock.calls[0][0].where).toEqual({ id: "as1" });
        expect(r.byAssociation).toHaveLength(1);
        expect(r.summary.paid).toBe(200);
    });
});

describe("HTTP guards", () => {
    it("requires authentication and the right role", async () => {
        const { default: app } = await import("../src/app");
        const { signAccessToken } = await import("../src/utils/token");
        const server = app.listen(0);
        try {
            const { port } = server.address() as { port: number };
            const base = `http://127.0.0.1:${port}/api`;
            for (const p of ["/artisans", "/categories", "/payments", "/reports/payments"]) {
                expect((await fetch(base + p)).status).toBe(401);
            }
            const artisan = { Authorization: `Bearer ${signAccessToken({ sub: "x", role: "ARTISAN", userType: "ARTISAN" })}` };
            for (const p of ["/artisans", "/categories", "/payments", "/reports/payments"]) {
                expect((await fetch(base + p, { headers: artisan })).status).toBe(403);
            }
            const head = { Authorization: `Bearer ${signAccessToken({ sub: "h", role: "ASSOCIATION_HEAD", userType: "STAFF" })}` };
            const post = (p: string) => fetch(base + p, { method: "POST", headers: { ...head, "Content-Type": "application/json" }, body: JSON.stringify({ name: "X" }) });
            expect((await post("/categories")).status).toBe(403); // heads can't edit categories
            expect((await post("/payments/p1/refund")).status).toBe(403); // or refund
        } finally {
            server.close();
        }
    });
});