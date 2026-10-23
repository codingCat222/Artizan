import { env } from "../../config/env";
import { toKobo } from "../../utils/money";
import { InitializeInput, PaymentGateway, VerifyResult } from "./gateway.interface";

/**
 * Development-only gateway so the whole payment flow can be exercised without a Paystack account.
 * "Checkout" is a page in our own app where you choose to succeed or fail. State lives in memory,
 * so it resets when the server restarts. It is never selected in production.
 */
const attempts = new Map<string, { amountKobo: number; outcome?: "success" | "failed" }>();

export const mockGateway: PaymentGateway & { complete(reference: string, outcome: "success" | "failed"): boolean } = {
    mode: "mock",

    async initialize(input: InitializeInput) {
        attempts.set(input.reference, { amountKobo: toKobo(input.amount) });
        return { authorizationUrl: `${env.clientUrl}/artisan/pay/mock?reference=${encodeURIComponent(input.reference)}` };
    },

    async verify(reference: string): Promise<VerifyResult> {
        const a = attempts.get(reference);
        if (!a || !a.outcome) return { status: "pending", amountKobo: a?.amountKobo ?? 0, fee: 0 };
        return {
            status: a.outcome,
            amountKobo: a.amountKobo,
            fee: a.outcome === "success" ? Math.round((a.amountKobo / 100) * 0.015 + 10) : 0,
            paidAt: a.outcome === "success" ? new Date() : undefined,
        };
    },

    complete(reference, outcome) {
        const a = attempts.get(reference);
        if (!a) return false;
        a.outcome = outcome;
        return true;
    },
};