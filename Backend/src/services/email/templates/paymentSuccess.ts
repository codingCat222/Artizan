import { escapeHtml } from "../../../utils/html";

export function paymentSuccessEmail(p: { name: string; amount: string; period: string; reference: string }) {
    return {
        subject: `Payment received: ${p.period} facilitation fee`,
        html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Thank you, ${escapeHtml(p.name)}</h2>
        <p>We've received your <strong>${escapeHtml(p.period)}</strong> facilitation fee of <strong>${escapeHtml(p.amount)}</strong>.</p>
        <p>Reference: <code>${escapeHtml(p.reference)}</code></p>
        <p>Your profile stays visible in public search.</p>
      </div>`,
    };
}