import { env } from "../../config/env";
import { prisma } from "../../config/prisma";
import { getGateway } from "../../services/gateway/index";
import { sendEmail } from "../../services/email/email.service";
import { paymentFailedEmail } from "../../services/email/templates/paymentFailed";
import { paymentSuccessEmail } from "../../services/email/templates/paymentSuccess";
import { formatNaira, toKobo } from "../../utils/money";
import { recordAudit } from "../audit/audit.service";

export type SettleOutcome = "paid" | "duplicate" | "failed" | "pending" | "not_found";

const SYSTEM = { id: null, name: "System" };

type PaymentWithArtisan = {
    id: string;
    artisanId: string;
    amount: number;
    period: string;
    reference: string;
    artisan: { name: string; email: string };
};

async function safeEmail(to: string, mail: { subject: string; html: string }) {
    try {
        await sendEmail({ to, ...mail });
    } catch (err) {
        // The payment is already recorded; a failed notification must never undo or block that.
        console.error("[payments] Could not send notification email:", err);
    }
}

async function markFailed(payment: PaymentWithArtisan, reason: string) {
    // Only open attempts can fail. A payment that is already Paid/Refunded/Failed is left alone.
    const res = await prisma.payment.updateMany({
        where: { id: payment.id, status: { in: ["Pending", "Overdue"] } },
        data: { status: "Failed" },
    });
    if (res.count === 0) return;
    await recordAudit(SYSTEM, reason, `${payment.reference} · ${payment.artisan.name}`);
    await safeEmail(
        payment.artisan.email,
        paymentFailedEmail({
            name: payment.artisan.name.split(" ")[0],
            amount: formatNaira(payment.amount),
            period: payment.period,
            reference: payment.reference,
            payUrl: `${env.clientUrl}/artisan/payments`,
        }),
    );
}

/**
 * Confirms a payment with the gateway and updates our records. The browser coming back from checkout
 * is NOT proof of payment, and neither is a webhook body: we always ask the gateway ourselves.
 *
 * Safe to call any number of times, from the checkout return, the webhook, or both at once: only the
 * first call that sees a successful charge flips the payment to Paid; every other call is a no-op.
 */
export async function settlePayment(reference: string): Promise<{ outcome: SettleOutcome }> {
    const payment = await prisma.payment.findUnique({
        where: { reference },
        include: { artisan: { select: { name: true, email: true } } },
    });
    if (!payment) return { outcome: "not_found" };
    if (payment.status === "Paid" || payment.status === "Refunded") return { outcome: "duplicate" };

    const result = await getGateway().verify(reference);
    if (result.status === "pending") return { outcome: "pending" };

    if (result.status === "failed") {
        await markFailed(payment, "Payment failed");
        return { outcome: "failed" };
    }

    // Never trust a "success" for the wrong amount.
    if (result.amountKobo !== toKobo(payment.amount)) {
        await markFailed(payment, "Payment amount mismatch (needs review)");
        return { outcome: "failed" };
    }

    const claimed = await prisma.payment.updateMany({
        where: { id: payment.id, status: { in: ["Pending", "Overdue", "Failed"] } },
        data: { status: "Paid", gatewayFee: result.fee, paidAt: result.paidAt ?? new Date() },
    });
    if (claimed.count === 0) return { outcome: "duplicate" };

    // Paying restores a hidden listing (BR: "Pay now and your profile will be restored once verified").
    const restored = await prisma.artisan.updateMany({
        where: { id: payment.artisanId, status: "Overdue" },
        data: { status: "Active" },
    });

    await recordAudit(SYSTEM, "Payment verified", `${payment.reference} · ${payment.artisan.name}`);
    if (restored.count > 0) await recordAudit(SYSTEM, "Restored listing after payment", payment.artisan.name);
    await safeEmail(
        payment.artisan.email,
        paymentSuccessEmail({
            name: payment.artisan.name.split(" ")[0],
            amount: formatNaira(payment.amount),
            period: payment.period,
            reference: payment.reference,
        }),
    );
    return { outcome: "paid" };
}