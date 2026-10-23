import { escapeHtml } from "../../../utils/html";

export function reminderEmail(p: { name: string; amount: string; period: string; dueDate: string; daysLeft: number; payUrl: string }) {
    const when = p.daysLeft === 0 ? "today" : p.daysLeft === 1 ? "tomorrow" : `in ${p.daysLeft} days`;
    return {
        subject: `Reminder: your ${p.period} fee is due ${when}`,
        html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Hi ${escapeHtml(p.name)},</h2>
        <p>Your <strong>${escapeHtml(p.period)}</strong> facilitation fee of <strong>${escapeHtml(p.amount)}</strong> is due <strong>${when}</strong> (${escapeHtml(p.dueDate)}).</p>
        <p><a href="${p.payUrl}" style="background:#15803d;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">Pay now</a></p>
        <p>Paying on time keeps your profile visible in public search.</p>
      </div>`,
    };
}