import { escapeHtml } from "../../../utils/html";

export function overdueEmail(p: { name: string; amount: string; period: string; payUrl: string }) {
    return {
        subject: "Your listing has been hidden from public search",
        html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Hi ${escapeHtml(p.name)},</h2>
        <p>Your <strong>${escapeHtml(p.period)}</strong> facilitation fee of <strong>${escapeHtml(p.amount)}</strong> was not paid before the grace period ended, so your profile is now <strong>hidden from public search</strong>.</p>
        <p>Pay now and your profile will be restored as soon as the payment is confirmed.</p>
        <p><a href="${p.payUrl}" style="background:#15803d;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">Pay now</a></p>
      </div>`,
    };
}