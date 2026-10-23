import crypto from "crypto";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => {
    const m = () => vi.fn();
    const prisma: any = {
        artisan: { updateMany: m() },
        payment: { findUnique: m(), updateMany: m() },
        auditLog: { create: m() },
    };
    return { prisma, sendEmail: vi.fn() };
});
vi.mock("../src/config/prisma", () => ({ prisma: db.prisma }));
vi.mock("../src/services/email/email.service", () => ({ sendEmail: db.sendEmail }));

const SECRET = "sk_test_unit_test_secret";
const realFetch = globalThis.fetch; // keep a handle on the real one: we stub fetch for calls to Paystack only

beforeAll(() => {
    process.env.DATABASE_URL = "sqlserver://localhost:1433;database=test";
    process.env.JWT_ACCESS_SECRET = "a";
    process.env.JWT_REFRESH_SECRET = "b";
    process.env.PAYSTACK_SECRET_KEY = SECRET;
});

const sign = (body: string) => crypto.createHmac("sha512", SECRET).update(body).digest("hex");
const payment = { id: "p1", artisanId: "a1", amount: 200, period: "October 2026", reference: "PAY-W1", status: "Pending", artisan: { name: "Ada Obi", email: "ada@x.com" } };
const event = JSON.stringify({ event: "charge.success", data: { reference: "PAY-W1" } });

let paystackReply: any;

beforeEach(() => {
    vi.clearAllMocks();
    paystackReply = { status: true, data: { status: "success", amount: 20000, fees: 1300, paid_at: "2026-10-05T10:00:00Z" } };
    db.prisma.auditLog.create.mockResolvedValue({});
    db.prisma.payment.findUnique.mockResolvedValue(payment);
    db.prisma.payment.updateMany.mockResolvedValue({ count: 1 });
    db.prisma.artisan.updateMany.mockResolvedValue({ count: 0 });
    db.sendEmail.mockResolvedValue(undefined);
    // Requests to our own test server go through; anything else is "Paystack".
    vi.stubGlobal("fetch", vi.fn(async (url: any, init?: any) =>
        String(url).includes("127.0.0.1") ? realFetch(url, init) : new Response(JSON.stringify(paystackReply), { status: 200 }),
    ));
});

async function withServer(fn: (url: string) => Promise<void>) {
    const { default: app } = await import("../src/app");
    const server = app.listen(0);
    try {
        await fn(`http://127.0.0.1:${(server.address() as { port: number }).port}/api/payments/webhook`);
    } finally {
        server.close();
    }
}

const post = (url: string, body: string, signature?: string) =>
    fetch(url, { method: "POST", headers: { "Content-Type": "application/json", ...(signature ? { "x-paystack-signature": signature } : {}) }, body });

describe("Paystack webhook", () => {
    it("validates signatures in constant time", async () => {
        const { validSignature } = await import("../src/modules/payments/webhook.controller");
        const body = Buffer.from('{"a":1}');
        expect(validSignature(body, sign('{"a":1}'), SECRET)).toBe(true);
        expect(validSignature(body, sign('{"a":2}'), SECRET)).toBe(false);
        expect(validSignature(body, "short", SECRET)).toBe(false);
        expect(validSignature(body, undefined, SECRET)).toBe(false);
        expect(validSignature(body, sign('{"a":1}'), "")).toBe(false);
    });

    it("rejects unsigned and wrongly signed requests without touching any payment", async () => {
        await withServer(async (url) => {
            expect((await post(url, event)).status).toBe(401);
            expect((await post(url, event, sign("tampered"))).status).toBe(401);
            expect(db.prisma.payment.updateMany).not.toHaveBeenCalled();
        });
    });

    it("a correctly signed charge.success is verified with Paystack and recorded", async () => {
        await withServer(async (url) => {
            const res = await post(url, event, sign(event));
            expect(res.status).toBe(200);
            const claim = db.prisma.payment.updateMany.mock.calls[0][0];
            expect(claim.data).toMatchObject({ status: "Paid", gatewayFee: 13 }); // ₦13 from Paystack's 1300 kobo
            expect(db.sendEmail).toHaveBeenCalledOnce();
        });
    });

    it("doesn't take the webhook's word for it: if Paystack says it failed, nothing is marked paid", async () => {
        paystackReply = { status: true, data: { status: "failed", amount: 20000, fees: 0 } };
        await withServer(async (url) => {
            expect((await post(url, event, sign(event))).status).toBe(200);
            expect(db.prisma.payment.updateMany.mock.calls[0][0].data).toEqual({ status: "Failed" });
        });
    });

    it("a wrong-amount charge is not accepted as payment", async () => {
        paystackReply = { status: true, data: { status: "success", amount: 5000, fees: 0 } }; // ₦50 instead of ₦200
        await withServer(async (url) => {
            await post(url, event, sign(event));
            expect(db.prisma.payment.updateMany.mock.calls[0][0].data.status).toBe("Failed");
        });
    });

    it("an already-paid payment is acknowledged but not processed again", async () => {
        db.prisma.payment.findUnique.mockResolvedValue({ ...payment, status: "Paid" });
        await withServer(async (url) => {
            expect((await post(url, event, sign(event))).status).toBe(200);
            expect(db.prisma.payment.updateMany).not.toHaveBeenCalled();
            expect(db.sendEmail).not.toHaveBeenCalled();
        });
    });

    it("tells Paystack to retry if our side fails, and ignores unrelated events", async () => {
        const spy = vi.spyOn(console, "error").mockImplementation(() => { });
        await withServer(async (url) => {
            db.prisma.payment.findUnique.mockRejectedValueOnce(new Error("db down"));
            expect((await post(url, event, sign(event))).status).toBe(500);
            const other = JSON.stringify({ event: "transfer.success", data: {} });
            expect((await post(url, other, sign(other))).status).toBe(200);
        });
        spy.mockRestore();
    });
});