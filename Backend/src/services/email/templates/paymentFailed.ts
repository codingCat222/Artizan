import { escapeHtml } from "../../../utils/html";

export function paymentFailedEmail(p: { name: string; amount: string; period: string; reference: string; payUrl: string }) {
    return {
        subject: `Your ${p.period} payment didn't go through`,
        html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Hi ${escapeHtml(p.name)},</h2>
        <p>Your payment of <strong>${escapeHtml(p.amount)}</strong> for ${escapeHtml(p.period)} could not be completed, and you have not been charged for it.</p>
        <p>Reference: <code>${escapeHtml(p.reference)}</code></p>
        <p><a href="${p.payUrl}" style="background:#15803d;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">Try again</a></p>
      </div>`,
    };
}