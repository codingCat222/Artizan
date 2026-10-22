import { escapeHtml } from "../../../utils/html";

export function activationEmail(params: { name: string; activationUrl: string }) {
  const { name, activationUrl } = params;
  return {
    subject: "Activate your FindArtisansNigeria account",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Welcome, ${escapeHtml(name)}</h2>
        <p>An account has been created for you on FindArtisansNigeria. Click below to set your password and activate your account.</p>
        <p><a href="${activationUrl}" style="background:#15803d;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">Activate account</a></p>
        <p>If the button doesn't work, copy this link into your browser:</p>
        <p>${activationUrl}</p>
        <p>This link will expire soon. If you did not expect this email, you can ignore it.</p>
      </div>
    `,
  };
}