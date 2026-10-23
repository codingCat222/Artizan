import crypto from "crypto";
import { Request, Response } from "express";
import { env } from "../../config/env";
import { settlePayment } from "./payments.settlement";

/** Constant-time comparison so the signature can't be guessed byte by byte. */
export function validSignature(rawBody: Buffer, signature: string | undefined, secret: string): boolean {
    if (!signature || !secret) return false;
    const expected = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Paystack calls this when a charge succeeds. It is registered with a raw body parser (see app.ts)
 * because the signature is computed over the exact bytes Paystack sent.
 */
export async function paystackWebhook(req: Request, res: Response) {
    if (!env.paystack.secretKey) return res.status(404).end();

    const raw = req.body as Buffer;
    if (!Buffer.isBuffer(raw) || !validSignature(raw, req.header("x-paystack-signature"), env.paystack.secretKey)) {
        return res.status(401).json({ error: "Invalid signature." });
    }

    let event: { event?: string; data?: { reference?: string } };
    try {
        event = JSON.parse(raw.toString("utf8"));
    } catch {
        return res.status(400).json({ error: "Invalid payload." });
    }

    if (event.event === "charge.success" && event.data?.reference) {
        try {
            await settlePayment(event.data.reference);
        } catch (err) {
            console.error("[webhook] Failed to settle payment:", err);
            return res.status(500).end(); // non-2xx makes Paystack retry later
        }
    }
    // Acknowledge everything else so Paystack stops retrying events we don't act on.
    return res.status(200).json({ received: true });
}