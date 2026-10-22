import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// ---- mocked database & email ------------------------------------------------
const db = vi.hoisted(() => {
    const m = () => vi.fn();
    const prisma: any = {
        staffUser: { findUnique: m(), findFirst: m(), findMany: m(), create: m(), update: m(), delete: m() },
        artisan: { findUnique: m(), groupBy: m(), findMany: m() },
        association: { findUnique: m(), findFirst: m(), findMany: m(), create: m(), update: m() },
        passwordResetToken: { create: m(), deleteMany: m() },
        refreshToken: { updateMany: m(), deleteMany: m() },
        auditLog: { create: m() },
        platformSettings: { upsert: m(), update: m() },
        $transaction: m(),
    };
    return { prisma, sendEmail: vi.fn() };
});
vi.mock("../src/config/prisma", () => ({ prisma: db.prisma }));
vi.mock("../src/services/email/email.service", () => ({ sendEmail: db.sendEmail }));

beforeAll(() => {
    process.env.DATABASE_URL = "sqlserver://localhost:1433;database=test";
    process.env.JWT_ACCESS_SECRET = "a";
    process.env.JWT_REFRESH_SECRET = "b";
});

const SUPER = { id: "s1", name: "Super", role: "SUPER_ADMIN" as const };
const ADMIN = { id: "a1", name: "Admin", role: "ADMIN" as const };
const settings = (adminsCanCreateStaff: boolean) => ({
    fee: 200, dueDay: 5, graceDays: 7, reminderDays: "7, 3, 1", adminsCanCreateStaff,
    revenueBasis: "gross", gateway: "Not yet selected", emailProvider: "Not yet selected", supportEmail: "s@x.com",
});
const staffRow = (over: any = {}) => ({
    id: "t1", name: "Target", email: "t@x.com", role: "ASSOCIATION_HEAD", status: "Active",
    associationId: "as1", createdAt: new Date("2026-01-01"), association: { name: "Tailors" }, ...over,
});

beforeEach(() => {
    vi.clearAllMocks();
    db.prisma.platformSettings.upsert.mockResolvedValue(settings(false));
    db.prisma.staffUser.findUnique.mockResolvedValue(null);
    db.prisma.artisan.findUnique.mockResolvedValue(null);
    db.prisma.staffUser.findFirst.mockResolvedValue(null);
    db.prisma.auditLog.create.mockResolvedValue({});
    db.prisma.$transaction.mockImplementation(async (arg: any) => (typeof arg === "function" ? arg(db.prisma) : Promise.all(arg)));
});

describe("permission rules", () => {
    it("super admin manages admins and heads, nobody manages the super admin", async () => {
        const { canManageTarget } = await import("../src/modules/staff/staff.service");
        expect(canManageTarget("SUPER_ADMIN", "ADMIN")).toBe(true);
        expect(canManageTarget("SUPER_ADMIN", "ASSOCIATION_HEAD")).toBe(true);
        expect(canManageTarget("SUPER_ADMIN", "SUPER_ADMIN")).toBe(false);
        expect(canManageTarget("ADMIN", "ASSOCIATION_HEAD")).toBe(true);
        expect(canManageTarget("ADMIN", "ADMIN")).toBe(false);
        expect(canManageTarget("ADMIN", "SUPER_ADMIN")).toBe(false);
        expect(canManageTarget("ASSOCIATION_HEAD", "ASSOCIATION_HEAD")).toBe(false);
    });

    it("admins may only create admins when the platform setting allows it", async () => {
        const { canCreateRole } = await import("../src/modules/staff/staff.service");
        expect(canCreateRole("ADMIN", "ASSOCIATION_HEAD", false)).toBe(true);
        expect(canCreateRole("ADMIN", "ADMIN", false)).toBe(false);
        expect(canCreateRole("ADMIN", "ADMIN", true)).toBe(true);
        expect(canCreateRole("SUPER_ADMIN", "ADMIN", false)).toBe(true);
        expect(canCreateRole("SUPER_ADMIN", "SUPER_ADMIN", true)).toBe(false);
        expect(canCreateRole("ASSOCIATION_HEAD", "ADMIN", true)).toBe(false);
    });
});

describe("createStaff", () => {
    const input = { name: "New Person", email: "New@X.com", role: "ADMIN" as const };

    it("rejects an admin creating an admin while the setting is off", async () => {
        const { createStaff } = await import("../src/modules/staff/staff.service");
        await expect(createStaff(ADMIN, input)).rejects.toMatchObject({ statusCode: 403 });
        expect(db.prisma.staffUser.create).not.toHaveBeenCalled();
    });

    it("rejects an email already used by staff or an artisan", async () => {
        const { createStaff } = await import("../src/modules/staff/staff.service");
        db.prisma.artisan.findUnique.mockResolvedValue({ id: "x" });
        await expect(createStaff(SUPER, input)).rejects.toMatchObject({ statusCode: 409 });
    });

    it("requires an active association for heads", async () => {
        const { createStaff } = await import("../src/modules/staff/staff.service");
        const head = { name: "H", email: "h@x.com", role: "ASSOCIATION_HEAD" as const };
        await expect(createStaff(SUPER, head)).rejects.toMatchObject({ statusCode: 400 });
        db.prisma.association.findUnique.mockResolvedValue({ id: "as1", name: "Tailors", status: "Inactive" });
        await expect(createStaff(SUPER, { ...head, associationId: "as1" })).rejects.toMatchObject({ statusCode: 400 });
    });

    it("allows only one head per association", async () => {
        const { createStaff } = await import("../src/modules/staff/staff.service");
        db.prisma.association.findUnique.mockResolvedValue({ id: "as1", name: "Tailors", status: "Active" });
        db.prisma.staffUser.findFirst.mockResolvedValue({ name: "Existing Head" });
        await expect(
            createStaff(SUPER, { name: "H", email: "h@x.com", role: "ASSOCIATION_HEAD", associationId: "as1" }),
        ).rejects.toMatchObject({ statusCode: 409 });
    });

    it("creates the account with an unusable password, emails an invite link and audits it", async () => {
        const { createStaff } = await import("../src/modules/staff/staff.service");
        db.prisma.staffUser.create.mockResolvedValue(staffRow({ role: "ADMIN", email: "new@x.com", associationId: null, association: null }));
        const dto = await createStaff(SUPER, input);

        const data = db.prisma.staffUser.create.mock.calls[0][0].data;
        expect(data.email).toBe("new@x.com"); // normalised to lowercase
        expect(data.passwordHash).toMatch(/^\$2[aby]\$/); // a real bcrypt hash of a random secret
        expect(db.prisma.passwordResetToken.create).toHaveBeenCalled();
        expect(db.sendEmail).toHaveBeenCalledOnce();
        expect(db.sendEmail.mock.calls[0][0].html).toMatch(/reset-password\?token=[0-9a-f]{64}/);
        expect(db.prisma.auditLog.create.mock.calls[0][0].data.action).toBe("Created administrator account");
        expect(dto).not.toHaveProperty("passwordHash");
    });

    it("rolls the account back if the invitation email can't be sent", async () => {
        const { createStaff } = await import("../src/modules/staff/staff.service");
        db.prisma.staffUser.create.mockResolvedValue(staffRow({ role: "ADMIN", associationId: null, association: null }));
        db.sendEmail.mockRejectedValue(new Error("smtp down"));
        await expect(createStaff(SUPER, input)).rejects.toMatchObject({ statusCode: 502 });
        expect(db.prisma.staffUser.delete).toHaveBeenCalled();
    });
});

describe("setStaffStatus / deleteStaff", () => {
    it("blocks acting on yourself, the super admin, or someone above your level", async () => {
        const { setStaffStatus } = await import("../src/modules/staff/staff.service");
        db.prisma.staffUser.findUnique.mockResolvedValue(staffRow({ id: "s1", role: "SUPER_ADMIN" }));
        await expect(setStaffStatus(SUPER, "s1", "Disabled")).rejects.toMatchObject({ statusCode: 403 });

        db.prisma.staffUser.findUnique.mockResolvedValue(staffRow({ id: "x", role: "SUPER_ADMIN" }));
        await expect(setStaffStatus(ADMIN, "x", "Disabled")).rejects.toMatchObject({ statusCode: 403 });

        db.prisma.staffUser.findUnique.mockResolvedValue(staffRow({ id: "y", role: "ADMIN" }));
        await expect(setStaffStatus(ADMIN, "y", "Disabled")).rejects.toMatchObject({ statusCode: 403 });
        expect(db.prisma.staffUser.update).not.toHaveBeenCalled();
    });

    it("404s for unknown accounts", async () => {
        const { setStaffStatus } = await import("../src/modules/staff/staff.service");
        await expect(setStaffStatus(SUPER, "nope", "Disabled")).rejects.toMatchObject({ statusCode: 404 });
    });

    it("disabling revokes all active sessions", async () => {
        const { setStaffStatus } = await import("../src/modules/staff/staff.service");
        db.prisma.staffUser.findUnique.mockResolvedValue(staffRow());
        db.prisma.staffUser.update.mockResolvedValue(staffRow({ status: "Disabled" }));
        const dto = await setStaffStatus(ADMIN, "t1", "Disabled");
        expect(dto.status).toBe("Disabled");
        expect(db.prisma.refreshToken.updateMany).toHaveBeenCalledWith(
            expect.objectContaining({ where: { staffId: "t1", revokedAt: null } }),
        );
    });

    it("delete removes dependent tokens first and audits", async () => {
        const { deleteStaff } = await import("../src/modules/staff/staff.service");
        db.prisma.staffUser.findUnique.mockResolvedValue(staffRow({ role: "ADMIN" }));
        await deleteStaff(SUPER, "t1");
        expect(db.prisma.refreshToken.deleteMany).toHaveBeenCalled();
        expect(db.prisma.passwordResetToken.deleteMany).toHaveBeenCalled();
        expect(db.prisma.staffUser.delete).toHaveBeenCalledWith({ where: { id: "t1" } });
        expect(db.prisma.auditLog.create.mock.calls[0][0].data.action).toBe("Deleted staff account");
    });
});

describe("settings", () => {
    it("validates ranges and formats", async () => {
        const { updateSettingsSchema } = await import("../src/modules/settings/settings.schema");
        const ok = { ...settings(false), reminderDays: "7,3,1" };
        const parse = (b: object) => updateSettingsSchema.safeParse({ body: b });
        const res = parse(ok);
        expect(res.success).toBe(true);
        if (res.success) expect(res.data.body.reminderDays).toBe("7, 3, 1");
        expect(parse({ ...ok, fee: 0 }).success).toBe(false);
        expect(parse({ ...ok, dueDay: 29 }).success).toBe(false);
        expect(parse({ ...ok, graceDays: 61 }).success).toBe(false);
        expect(parse({ ...ok, reminderDays: "soon" }).success).toBe(false);
        expect(parse({ ...ok, gateway: "Bitcoin" }).success).toBe(false);
        expect(parse({ ...ok, supportEmail: "nope" }).success).toBe(false);
    });

    it("records an audit entry for each changed policy", async () => {
        const { updateSettings } = await import("../src/modules/settings/settings.service");
        db.prisma.platformSettings.update.mockResolvedValue({ ...settings(true), fee: 500 });
        await updateSettings({ ...settings(true), fee: 500 } as any, { id: "s1", name: "Super" });
        const actions = db.prisma.auditLog.create.mock.calls.map((c: any) => c[0].data.action);
        expect(actions).toEqual(["Updated facilitation fee", "Changed administrator permissions"]);
    });
});

describe("associations", () => {
    it("generates a unique code from the name", async () => {
        const { generateCode } = await import("../src/modules/associations/associations.service");
        db.prisma.association.findUnique.mockResolvedValueOnce({ id: "taken" }).mockResolvedValueOnce(null);
        expect(await generateCode("Tailors Association")).toBe("AAON-TA2");
    });
});

describe("audit logging", () => {
    it("never throws if the audit write fails", async () => {
        const { recordAudit } = await import("../src/modules/audit/audit.service");
        db.prisma.auditLog.create.mockRejectedValue(new Error("db down"));
        const spy = vi.spyOn(console, "error").mockImplementation(() => { });
        await expect(recordAudit({ id: "1", name: "x" }, "a", "t")).resolves.toBeUndefined();
        spy.mockRestore();
    });
});

describe("HTTP layer", () => {
    async function withServer(fn: (url: string) => Promise<void>) {
        const { default: app } = await import("../src/app");
        const server = app.listen(0);
        try {
            const { port } = server.address() as { port: number };
            await fn(`http://127.0.0.1:${port}`);
        } finally {
            server.close();
        }
    }
    const bearer = async (role: string) => {
        const { signAccessToken } = await import("../src/utils/token");
        const userType = role === "ARTISAN" ? "ARTISAN" : "STAFF";
        return { Authorization: `Bearer ${signAccessToken({ sub: "u1", role: role as any, userType })}` };
    };

    it("rejects unauthenticated requests to every admin endpoint", async () => {
        await withServer(async (url) => {
            for (const path of ["/api/staff", "/api/audit", "/api/settings", "/api/associations"]) {
                expect((await fetch(url + path)).status).toBe(401);
            }
        });
    });

    it("forbids artisans and association heads from admin endpoints", async () => {
        await withServer(async (url) => {
            for (const role of ["ARTISAN", "ASSOCIATION_HEAD"]) {
                const headers = await bearer(role);
                for (const path of ["/api/staff", "/api/audit", "/api/associations"]) {
                    expect((await fetch(url + path, { headers })).status).toBe(403);
                }
            }
        });
    });

    it("only the super admin can change settings", async () => {
        await withServer(async (url) => {
            const body = JSON.stringify({ ...settings(false) });
            const put = async (role: string) =>
                fetch(url + "/api/settings", { method: "PUT", body, headers: { ...(await bearer(role)), "Content-Type": "application/json" } });
            expect((await put("ADMIN")).status).toBe(403);
            db.prisma.platformSettings.update.mockResolvedValue(settings(false));
            expect((await put("SUPER_ADMIN")).status).toBe(200);
        });
    });

    it("validates input before touching the database", async () => {
        await withServer(async (url) => {
            const res = await fetch(url + "/api/staff", {
                method: "POST",
                headers: { ...(await bearer("SUPER_ADMIN")), "Content-Type": "application/json" },
                body: JSON.stringify({ name: "X", email: "not-an-email", role: "SUPER_ADMIN" }),
            });
            expect(res.status).toBe(400);
            expect(db.prisma.staffUser.create).not.toHaveBeenCalled();
        });
    });

    it("returns audit entries with search and paging for admins", async () => {
        await withServer(async (url) => {
            db.prisma.auditLog.count = vi.fn().mockResolvedValue(1);
            db.prisma.auditLog.findMany = vi.fn().mockResolvedValue([
                { id: "1", actorName: "Super", action: "Disabled staff account", target: "t@x.com", createdAt: new Date("2026-10-01") },
            ]);
            const res = await fetch(url + "/api/audit?q=staff&page=1&pageSize=10", { headers: await bearer("ADMIN") });
            expect(res.status).toBe(200);
            const json = await res.json();
            expect(json.total).toBe(1);
            expect(json.items[0]).toMatchObject({ actor: "Super", action: "Disabled staff account" });
            expect(db.prisma.auditLog.findMany.mock.calls[0][0]).toMatchObject({ skip: 0, take: 10 });
        });
    });
});

describe("dashboard summary", () => {
    it("aggregates real counts per status, association and category", async () => {
        const { getPlatformSummary } = await import("../src/modules/dashboard/dashboard.service");
        db.prisma.artisan.groupBy
            .mockResolvedValueOnce([
                { status: "Active", _count: { _all: 3 } },
                { status: "Overdue", _count: { _all: 1 } },
                { status: "Pending", _count: { _all: 2 } },
            ])
            .mockResolvedValueOnce([
                { category: "Tailoring", _count: { _all: 2 } },
                { category: "Plumbing", _count: { _all: 4 } },
            ])
            .mockResolvedValueOnce([
                { associationId: "as1", status: "Active", _count: { _all: 3 } },
                { associationId: "as1", status: "Pending", _count: { _all: 2 } },
            ]);
        db.prisma.association.findMany.mockResolvedValue([
            { id: "as1", name: "Tailors", status: "Active" },
            { id: "as2", name: "Plumbers", status: "Inactive" },
        ]);
        db.prisma.artisan.findMany.mockResolvedValue([
            { id: "abcdefghijkl", name: "Ada", category: "Tailoring", status: "Active", createdAt: new Date("2026-10-01"), association: { name: "Tailors" } },
        ]);

        const s = await getPlatformSummary();
        expect(s.artisans).toMatchObject({ total: 6, active: 3, inactive: 3, overdue: 1, pending: 2 });
        expect(s.associations).toEqual({ total: 2, active: 1 });
        expect(s.byAssociation[0]).toMatchObject({ name: "Tailors", artisans: 5, active: 3, pending: 2 });
        expect(s.byAssociation[1]).toMatchObject({ name: "Plumbers", artisans: 0 });
        expect(s.byCategory[0]).toEqual({ name: "Plumbing", value: 4 }); // sorted by size
        expect(s.recent[0].ref).toBe("AON-GHIJKL");
    });

    it("is restricted to admins", async () => {
        const { default: app } = await import("../src/app");
        const { signAccessToken } = await import("../src/utils/token");
        const server = app.listen(0);
        try {
            const { port } = server.address() as { port: number };
            const url = `http://127.0.0.1:${port}/api/dashboard`;
            expect((await fetch(url)).status).toBe(401);
            const head = signAccessToken({ sub: "h", role: "ASSOCIATION_HEAD", userType: "STAFF" });
            expect((await fetch(url, { headers: { Authorization: `Bearer ${head}` } })).status).toBe(403);
        } finally {
            server.close();
        }
    });
});