import { escapeHtml } from "../../../utils/html";

export function staffInviteEmail(params: { name: string; roleLabel: string; inviteUrl: string; validHours: number; association?: string }) {
    const { name, roleLabel, inviteUrl, validHours, association } = params;
    const scope = association ? ` for <strong>${escapeHtml(association)}</strong>` : "";
    return {
        subject: "You've been invited to the AAON Ogun State portal",
        html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Welcome, ${escapeHtml(name)}</h2>
        <p>You've been added as <strong>${escapeHtml(roleLabel)}</strong>${scope}. Set a password to activate your account.</p>
        <p><a href="${inviteUrl}" style="background:#15803d;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">Set your password</a></p>
        <p>If the button doesn't work, copy this link into your browser:</p>
        <p>${inviteUrl}</p>
        <p>This link expires in ${validHours} hours and can only be used once. If you weren't expecting this, you can ignore this email.</p>
      </div>
    `,
    };
}