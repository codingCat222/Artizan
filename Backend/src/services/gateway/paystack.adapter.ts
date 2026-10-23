import { env } from "../../config/env";
import { AppError } from "../../utils/appError";
import { fromKobo, toKobo } from "../../utils/money";
import { InitializeInput, PaymentGateway, VerifyResult } from "./gateway.interface";

const BASE = "https://api.paystack.co";

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
    let res: Response;
    try {
        res = await fetch(`${BASE}${path}`, {
            ...init,
            headers: { Authorization: `Bearer ${env.paystack.secretKey}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
            signal: AbortSignal.timeout(15_000),
        });
    } catch (err) {
        console.error("[paystack] request failed:", err);
        throw new AppError("The payment provider could not be reached. Please try again.", 502);
    }
    const json = (await res.json().catch(() => null)) as { status?: boolean; message?: string; data?: unknown } | null;
    if (!res.ok || !json?.status) {
        console.error("[paystack] error response:", res.status, json?.message);
        throw new AppError("The payment provider rejected the request. Please try again.", 502);
    }
    return json.data as T;
}

export const paystackGateway: PaymentGateway = {
    mode: "paystack",

    async initialize(input: InitializeInput) {
        const data = await call<{ authorization_url: string }>("/transaction/initialize", {
            method: "POST",
            body: JSON.stringify({
                email: input.email,
                amount: toKobo(input.amount),
                reference: input.reference,
                callback_url: input.callbackUrl,
                currency: "NGN",
                metadata: input.metadata,
            }),
        });
        return { authorizationUrl: data.authorization_url };
    },

    async verify(reference: string): Promise<VerifyResult> {
        const data = await call<{ status: string; amount: number; fees?: number | null; paid_at?: string | null }>(
            `/transaction/verify/${encodeURIComponent(reference)}`,
        );
        // "abandoned", "ongoing", "pending", "queued" are all "not finished yet", not failures.
        const status = data.status === "success" ? "success" : data.status === "failed" || data.status === "reversed" ? "failed" : "pending";
        return {
            status,
            amountKobo: data.amount,
            fee: fromKobo(data.fees ?? 0),
            paidAt: data.paid_at ? new Date(data.paid_at) : undefined,
        };
    },
};