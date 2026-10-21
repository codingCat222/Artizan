export function resetPasswordEmail(params: { name: string; resetUrl: string }) {
    const { name, resetUrl } = params;
    return {
        subject: "Reset your FindArtisansNigeria password",
        html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Hi ${name},</h2>
        <p>We received a request to reset your password. Click below to choose a new one.</p>
        <p><a href="${resetUrl}" style="background:#15803d;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">Reset password</a></p>
        <p>If the button doesn't work, copy this link into your browser:</p>
        <p>${resetUrl}</p>
        <p>This link expires shortly. If you did not request this, you can safely ignore this email.</p>
      </div>
    `,
    };
}