import { Resend } from "resend";
import { env } from "../../config/env";

const resend = env.resend.apiKey ? new Resend(env.resend.apiKey) : null;

interface SendEmailInput {
    to: string;
    subject: string;
    html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<void> {
    if (!resend) {
        console.warn(`[email] RESEND_API_KEY not set — logging email instead of sending.`);
        console.log(`[email] To: ${to}\n[email] Subject: ${subject}\n[email] HTML:\n${html}`);
        return;
    }

    const { error } = await resend.emails.send({
        from: env.resend.emailFrom,
        to,
        subject,
        html,
    });

    if (error) {
        console.error("[email] Resend error:", error);
        throw new Error("Failed to send email.");
    }
}