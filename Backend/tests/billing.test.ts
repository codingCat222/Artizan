import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => {
    const m = () => vi.fn();
    const prisma: any = {
        artisan: { findMany: m(), findUnique: m(), updateMany: m() },
        payment: { findMany: m(), findUnique: m(), findFirst: m(), create: m(), createMany: m(), updateMany: m(), deleteMany: m(), count: m() },
        auditLog: { findFirst: m(), create: m() },
        platformSettings: { upsert: m() },
    };
    return { prisma, sendEmail: vi.fn() };
});
vi.mock("../src/config/prisma", () => ({ prisma: db.prisma }));
vi.mock("../src/services/email/email.service", () => ({ sendEmail: db.sendEmail }));

beforeAll(() => {
    process.env.DATABASE_URL = "sqlserver://localhost:1433;database=test";
    process.env.JWT_ACCESS_SECRET = "a";
    process.env.JWT_REFRESH_SECRET = "b";
    process.env.PAYSTACK_SECRET_KEY = "";
});

const settings = { fee: 200, dueDay: 5, graceDays: 7, reminderDays: "7, 3, 1", adminsCanCreateStaff: false, revenueBasis: "gross" as const, gateway: "x", emailProvider: "x", supportEmail: "s@x.com" };
const art = (id: string, over: any = {}) => ({ id, name: `Person ${id}`, email: `${id}@x.com`, status: "Active", createdAt: new Date("2026-01-01"), ...over });
// Lagos is UTC+1, so 10:00Z is 11:00 in Lagos.
const at = (iso: string) => new Date(iso);

beforeEach(() => {
    vi.clearAllMocks();
    db.prisma.platformSettings.upsert.mockResolvedValue(settings);
    db.prisma.auditLog.findFirst.mockResolvedValue(null);
    db.prisma.auditLog.create.mockResolvedValue({});
    db.prisma.payment.findMany.mockResolvedValue([]);
    db.prisma.payment.createMany.mockResolvedValue({ count: 0 });
    db.prisma.payment.updateMany.mockResolvedValue({ count: 0 });
    db.prisma.artisan.updateMany.mockResolvedValue({ count: 0 });
    db.sendEmail.mockResolvedValue(undefined);
});

describe("billing periods (Lagos time)", () => {
    it("computes label, due date and grace end", async () => {
        const { periodFor } = await import("../src/utils/dates");
        const p = periodFor(at("2026-10-16T10:00:00Z"), { dueDay: 5, graceDays: 7 });
        expect(p.label).toBe("October 2026");
        expect(p.due.toISOString()).toBe("2026-10-04T23:00:00.000Z"); // 5 Oct 00:00 Lagos
        expect(p.graceEnd.toISOString()).toBe("2026-10-11T23:00:00.000Z"); // 12 Oct 00:00 Lagos
        expect(p.start.toISOString()).toBe("2026-09-30T23:00:00.000Z"); // 1 Oct 00:00 Lagos
    });

    it("uses the Lagos calendar at month boundaries", async () => {
        const { periodFor, lagosDateKey } = await import("../src/utils/dates");
        // 23:30 UTC on 31 Oct is already 1 Nov in Lagos.
        expect(periodFor(at("2026-10-31T23:30:00Z"), { dueDay: 5, graceDays: 7 }).label).toBe("November 2026");
        expect(lagosDateKey(at("2026-10-31T23:30:00Z"))).toBe("2026-11-01");
        expect(lagosDateKey(at("2026-10-31T22:30:00Z"))).toBe("2026-10-31");
    });

    it("knows when the grace period has fully passed and counts days to the due date", async () => {
        const { periodFor, isPastGrace, daysUntil, nextPeriodFor } = await import("../src/utils/dates");
        const s = { dueDay: 5, graceDays: 7 };
        const p = periodFor(at("2026-10-01T10:00:00Z"), s);
        expect(isPastGrace(at("2026-10-12T10:00:00Z"), p)).toBe(false); // 12 Oct is the last grace day
        expect(isPastGrace(at("2026-10-13T10:00:00Z"), p)).toBe(true);
        expect(daysUntil(p.due, at("2026-10-01T10:00:00Z"))).toBe(4);
        expect(daysUntil(p.due, at("2026-10-05T10:00:00Z"))).toBe(0);
        expect(nextPeriodFor(at("2026-12-20T10:00:00Z"), s).label).toBe("January 2027");
    });

    it("only bills active members who joined before the period started", async () => {
        const { isBillable } = await import("../src/modules/billing/billing.service");
        const { periodFor } = await import("../src/utils/dates");
        const p = periodFor(at("2026-10-16T10:00:00Z"), { dueDay: 5, graceDays: 7 });
        expect(isBillable({ status: "Active", createdAt: new Date("2026-09-01") }, p)).toBe(true);
        expect(isBillable({ status: "Overdue", createdAt: new Date("2026-09-01") }, p)).toBe(true);
        expect(isBillable({ status: "Pending", createdAt: new Date("2026-09-01") }, p)).toBe(false);
        expect(isBillable({ status: "Suspended", createdAt: new Date("2026-09-01") }, p)).toBe(false);
        expect(isBillable({ status: "Active", createdAt: new Date("2026-10-03") }, p)).toBe(false); // joined this month
    });
});

describe("billing job", () => {
    it("issues invoices only to people who owe and have no open row", async () => {
        const { runBillingCheck } = await import("../src/modules/billing/billing.service");
        db.prisma.artisan.findMany.mockResolvedValue([art("a"), art("b"), art("c"), art("new", { createdAt: new Date("2026-10-02") })]);
        db.prisma.payment.findMany.mockResolvedValue([
            { artisanId: "a", status: "Paid" },
            { artisanId: "b", status: "Pending" },
        ]);
        const r = await runBillingCheck({ now: at("2026-10-02T10:00:00Z"), settings });
        expect(r).toMatchObject({ skipped: false, invoices: 1, hidden: 0 });
        const created = db.prisma.payment.createMany.mock.calls[0][0].data;
        expect(created).toHaveLength(1);
        expect(created[0]).toMatchObject({ artisanId: "c", amount: 200, status: "Pending", period: "October 2026" });
        expect(created[0].reference).toMatch(/^INV-/);
    });

    it("hides unpaid artisans after the grace period, marks invoices overdue and emails them", async () => {
        const { runBillingCheck } = await import("../src/modules/billing/billing.service");
        db.prisma.artisan.findMany.mockResolvedValue([art("paid"), art("late"), art("already", { status: "Overdue" })]);
        db.prisma.payment.findMany.mockResolvedValue([{ artisanId: "paid", status: "Paid" }]);
        const r = await runBillingCheck({ now: at("2026-10-14T10:00:00Z"), settings });
        expect(r.hidden).toBe(1); // only "late" was Active; "already" is already hidden
        const hide = db.prisma.artisan.updateMany.mock.calls[0][0];
        expect(hide.where.id.in).toEqual(["late"]);
        expect(hide.data).toEqual({ status: "Overdue" });
        const overdueRows = db.prisma.payment.updateMany.mock.calls[0][0];
        expect(overdueRows.where.artisanId.in.sort()).toEqual(["already", "late"]);
        expect(overdueRows.where.reference).toEqual({ startsWith: "INV-" });
        expect(db.sendEmail).toHaveBeenCalledOnce();
        expect(db.sendEmail.mock.calls[0][0].to).toBe("late@x.com");
    });

    it("does not hide anyone during the grace period", async () => {
        const { runBillingCheck } = await import("../src/modules/billing/billing.service");
        db.prisma.artisan.findMany.mockResolvedValue([art("late")]);
        const r = await runBillingCheck({ now: at("2026-10-10T10:00:00Z"), settings });
        expect(r.hidden).toBe(0);
        expect(db.prisma.artisan.updateMany).not.toHaveBeenCalled();
    });

    it("sends reminders only on the configured days, and only to people still unpaid", async () => {
        const { runBillingCheck } = await import("../src/modules/billing/billing.service");
        db.prisma.artisan.findMany.mockResolvedValue([art("paid"), art("owes")]);
        db.prisma.payment.findMany.mockResolvedValue([{ artisanId: "paid", status: "Paid" }]);
        // Due 5 Oct. On 2 Oct there are 3 days left (configured), on 3 Oct there are 2 (not configured).
        const on3 = await runBillingCheck({ now: at("2026-10-02T10:00:00Z"), settings });
        expect(on3.reminders).toBe(1);
        expect(db.sendEmail.mock.calls[0][0].to).toBe("owes@x.com");
        expect(db.sendEmail.mock.calls[0][0].subject).toMatch(/due in 3 days/);
        db.sendEmail.mockClear();
        const on2 = await runBillingCheck({ now: at("2026-10-03T10:00:00Z"), settings });
        expect(on2.reminders).toBe(0);
        expect(db.sendEmail).not.toHaveBeenCalled();
    });

    it("runs once per day unless forced", async () => {
        const { runBillingCheck } = await import("../src/modules/billing/billing.service");
        db.prisma.artisan.findMany.mockResolvedValue([]);
        db.prisma.auditLog.findFirst.mockResolvedValue({ id: "marker" });
        expect((await runBillingCheck({ now: at("2026-10-02T10:00:00Z"), settings })).skipped).toBe(true);
        expect(db.prisma.artisan.findMany).not.toHaveBeenCalled();
        expect((await runBillingCheck({ now: at("2026-10-02T10:00:00Z"), settings, force: true })).skipped).toBe(false);
    });

    it("a failing email doesn't stop the run", async () => {
        const { runBillingCheck } = await import("../src/modules/billing/billing.service");
        const spy = vi.spyOn(console, "error").mockImplementation(() => { });
        db.prisma.artisan.findMany.mockResolvedValue([art("a"), art("b")]);
        db.sendEmail.mockRejectedValueOnce(new Error("smtp")).mockResolvedValue(undefined);
        const r = await runBillingCheck({ now: at("2026-10-14T10:00:00Z"), settings });
        expect(r.hidden).toBe(2);
        expect(db.sendEmail).toHaveBeenCalledTimes(2);
        spy.mockRestore();
    });
});

describe("settlement", () => {
    const pay = (over: any = {}) => ({
        id: "p1", artisanId: "a1", amount: 200, period: "October 2026", reference: "PAY-1", status: "Pending",
        artisan: { name: "Ada Obi", email: "ada@x.com" }, ...over,
    });

    async function gateway() {
        return (await import("../src/services/gateway")).mockGateway;
    }

    it("is pending until the gateway says otherwise", async () => {
        const { settlePayment } = await import("../src/modules/payments/payments.settlement");
        db.prisma.payment.findUnique.mockResolvedValue(pay({ reference: "PAY-NEVER" }));
        expect((await settlePayment("PAY-NEVER")).outcome).toBe("pending");
        expect(db.prisma.payment.updateMany).not.toHaveBeenCalled();
    });

    it("marks a verified payment paid, restores a hidden listing, audits and emails", async () => {
        const { settlePayment } = await import("../src/modules/payments/payments.settlement");
        const gw = await gateway();
        await gw.initialize({ email: "a", amount: 200, reference: "PAY-OK", callbackUrl: "x" });
        gw.complete("PAY-OK", "success");
        db.prisma.payment.findUnique.mockResolvedValue(pay({ reference: "PAY-OK" }));
        db.prisma.payment.updateMany.mockResolvedValue({ count: 1 });
        db.prisma.artisan.updateMany.mockResolvedValue({ count: 1 });

        expect((await settlePayment("PAY-OK")).outcome).toBe("paid");
        const claim = db.prisma.payment.updateMany.mock.calls[0][0];
        expect(claim.data).toMatchObject({ status: "Paid", gatewayFee: 13 }); // 1.5% of 200 + 10
        expect(claim.where.status.in).toContain("Overdue");
        expect(db.prisma.artisan.updateMany).toHaveBeenCalledWith({ where: { id: "a1", status: "Overdue" }, data: { status: "Active" } });
        const actions = db.prisma.auditLog.create.mock.calls.map((c: any) => c[0].data.action);
        expect(actions).toEqual(["Payment verified", "Restored listing after payment"]);
        expect(db.sendEmail.mock.calls[0][0].subject).toMatch(/Payment received/);
    });

    it("ignores repeat notifications for a payment that's already paid", async () => {
        const { settlePayment } = await import("../src/modules/payments/payments.settlement");
        db.prisma.payment.findUnique.mockResolvedValue(pay({ status: "Paid" }));
        expect((await settlePayment("PAY-OK")).outcome).toBe("duplicate");
        expect(db.prisma.payment.updateMany).not.toHaveBeenCalled();
        expect(db.sendEmail).not.toHaveBeenCalled();
    });

    it("only the first of two simultaneous confirmations takes effect", async () => {
        const { settlePayment } = await import("../src/modules/payments/payments.settlement");
        const gw = await gateway();
        await gw.initialize({ email: "a", amount: 200, reference: "PAY-RACE", callbackUrl: "x" });
        gw.complete("PAY-RACE", "success");
        db.prisma.payment.findUnique.mockResolvedValue(pay({ reference: "PAY-RACE" }));
        db.prisma.payment.updateMany.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 });
        const [a, b] = await Promise.all([settlePayment("PAY-RACE"), settlePayment("PAY-RACE")]);
        expect([a.outcome, b.outcome].sort()).toEqual(["duplicate", "paid"]);
        expect(db.sendEmail).toHaveBeenCalledTimes(1); // one confirmation email, not two
    });

    it("records a failed payment and tells the artisan", async () => {
        const { settlePayment } = await import("../src/modules/payments/payments.settlement");
        const gw = await gateway();
        await gw.initialize({ email: "a", amount: 200, reference: "PAY-BAD", callbackUrl: "x" });
        gw.complete("PAY-BAD", "failed");
        db.prisma.payment.findUnique.mockResolvedValue(pay({ reference: "PAY-BAD" }));
        db.prisma.payment.updateMany.mockResolvedValue({ count: 1 });
        expect((await settlePayment("PAY-BAD")).outcome).toBe("failed");
        expect(db.prisma.payment.updateMany.mock.calls[0][0].data).toEqual({ status: "Failed" });
        expect(db.sendEmail.mock.calls[0][0].subject).toMatch(/didn't go through/);
    });

    it("refuses a 'success' for the wrong amount", async () => {
        const { settlePayment } = await import("../src/modules/payments/payments.settlement");
        const gw = await gateway();
        await gw.initialize({ email: "a", amount: 50, reference: "PAY-SHORT", callbackUrl: "x" }); // gateway collected ₦50
        gw.complete("PAY-SHORT", "success");
        db.prisma.payment.findUnique.mockResolvedValue(pay({ reference: "PAY-SHORT", amount: 200 }));
        db.prisma.payment.updateMany.mockResolvedValue({ count: 1 });
        expect((await settlePayment("PAY-SHORT")).outcome).toBe("failed");
        expect(db.prisma.payment.updateMany.mock.calls[0][0].data.status).toBe("Failed");
        expect(db.prisma.auditLog.create.mock.calls[0][0].data.action).toMatch(/amount mismatch/i);
    });

    it("unknown references are reported, not crashed on", async () => {
        const { settlePayment } = await import("../src/modules/payments/payments.settlement");
        db.prisma.payment.findUnique.mockResolvedValue(null);
        expect((await settlePayment("nope")).outcome).toBe("not_found");
    });
});

describe("artisan payment flow", () => {
    const artisan = { id: "a1", name: "Ada Obi", email: "ada@x.com", status: "Active", verification: "Verified", category: "Tailoring", createdBy: "Super", createdAt: new Date("2026-01-01"), association: { name: "Tailors" } };

    beforeEach(() => {
        db.prisma.artisan.findUnique.mockResolvedValue(artisan);
        db.prisma.payment.count.mockResolvedValue(0);
        db.prisma.payment.create.mockResolvedValue({});
        db.prisma.payment.deleteMany.mockResolvedValue({ count: 1 });
    });

    it("starts checkout: records the attempt, then closes off the old invoice and abandoned attempts", async () => {
        const { initializePayment } = await import("../src/modules/me/me.service");
        const r = await initializePayment("a1");
        expect(r.reference).toMatch(/^PAY-/);
        expect(r.authorizationUrl).toContain("/artisan/pay/mock?reference=");
        expect(db.prisma.payment.create.mock.calls[0][0].data).toMatchObject({ artisanId: "a1", amount: 200, status: "Pending", reference: r.reference });
        expect(db.prisma.payment.deleteMany.mock.calls[0][0].where.reference).toEqual({ startsWith: "INV-" });
        expect(db.prisma.payment.updateMany.mock.calls[0][0]).toMatchObject({ data: { status: "Failed" } });
    });

    it("won't take a second payment for a month that's already paid", async () => {
        const { initializePayment } = await import("../src/modules/me/me.service");
        db.prisma.payment.count.mockResolvedValue(1);
        await expect(initializePayment("a1")).rejects.toMatchObject({ statusCode: 409 });
        expect(db.prisma.payment.create).not.toHaveBeenCalled();
    });

    it("rejects suspended and pending accounts, even with a live token", async () => {
        const { initializePayment, getBilling } = await import("../src/modules/me/me.service");
        db.prisma.artisan.findUnique.mockResolvedValue({ ...artisan, status: "Suspended" });
        await expect(initializePayment("a1")).rejects.toMatchObject({ statusCode: 401 });
        db.prisma.artisan.findUnique.mockResolvedValue({ ...artisan, status: "Pending" });
        await expect(getBilling("a1")).rejects.toMatchObject({ statusCode: 401 });
    });

    it("an artisan can only verify their own payments", async () => {
        const { verifyPayment } = await import("../src/modules/me/me.service");
        db.prisma.payment.findFirst.mockResolvedValue(null); // someone else's reference
        await expect(verifyPayment("a1", "PAY-OTHERS")).rejects.toMatchObject({ statusCode: 404 });
        expect(db.prisma.payment.findFirst.mock.calls[0][0].where).toEqual({ reference: "PAY-OTHERS", artisanId: "a1" });
    });

    it("billing summary says what's owed and what's been paid", async () => {
        const { getBilling } = await import("../src/modules/me/me.service");
        db.prisma.payment.findMany.mockResolvedValue([]);
        const unpaid = await getBilling("a1");
        expect(unpaid).toMatchObject({ fee: 200, owes: true, hidden: false, paidNow: null, gatewayMode: "mock" });
        expect(unpaid.profile).toMatchObject({ name: "Ada Obi", listed: true });

        const period = unpaid.period.label;
        db.prisma.payment.findMany.mockResolvedValue([
            { id: "p", period, amount: 200, status: "Paid", reference: "R", paidAt: new Date(), createdAt: new Date() },
        ]);
        const paid = await getBilling("a1");
        expect(paid.owes).toBe(false);
        expect(paid.paidNow?.reference).toBe("R");
    });

    it("the test checkout can't be used when a real gateway is configured", async () => {
        const { mockComplete } = await import("../src/modules/me/me.service");
        db.prisma.payment.findFirst.mockResolvedValue({ id: "p" });
        await expect(mockComplete("a1", "PAY-X", "success")).rejects.toMatchObject({ statusCode: 400 }); // unknown test checkout
    });
});

describe("HTTP", () => {
    it("billing endpoints are protected", async () => {
        const { default: app } = await import("../src/app");
        const { signAccessToken } = await import("../src/utils/token");
        const server = app.listen(0);
        try {
            const { port } = server.address() as { port: number };
            const base = `http://127.0.0.1:${port}/api`;
            expect((await fetch(base + "/me/billing")).status).toBe(401);
            const staff = { Authorization: `Bearer ${signAccessToken({ sub: "s", role: "ADMIN", userType: "STAFF" })}` };
            expect((await fetch(base + "/me/billing", { headers: staff })).status).toBe(403);
            const post = (path: string, headers: any) => fetch(base + path, { method: "POST", headers });
            expect((await post("/billing/run", staff)).status).toBe(403); // only the super admin
            expect((await post("/billing/run", {})).status).toBe(401);
            // Without a Paystack key the webhook doesn't exist at all.
            expect((await fetch(base + "/payments/webhook", { method: "POST", body: "{}" })).status).toBe(404);
        } finally {
            server.close();
        }
    });
});