import { z } from "zod";

export const GATEWAYS = ["Not yet selected", "Paystack", "Flutterwave", "Other"] as const;
export const EMAIL_PROVIDERS = ["Not yet selected", "SendGrid", "Mailgun", "Amazon SES", "Other"] as const;

export const updateSettingsSchema = z.object({
    body: z.object({
        fee: z.number().int("Monthly fee must be a whole number of naira.").positive("Monthly fee must be greater than zero."),
        dueDay: z.number().int().min(1, "Due day must be between 1 and 28.").max(28, "Due day must be between 1 and 28."),
        graceDays: z.number().int().min(0, "Grace period must be between 0 and 60 days.").max(60, "Grace period must be between 0 and 60 days."),
        reminderDays: z
            .string()
            .regex(/^\s*\d+(\s*,\s*\d+)*\s*$/, "Reminders must be comma-separated day counts, e.g. 7, 3, 1.")
            .transform((s) => s.split(",").map((n) => n.trim()).join(", ")),
        adminsCanCreateStaff: z.boolean(),
        revenueBasis: z.enum(["gross", "net"]),
        gateway: z.enum(GATEWAYS),
        emailProvider: z.enum(EMAIL_PROVIDERS),
        supportEmail: z.string().trim().email("Enter a valid support email address."),
    }),
    params: z.object({}).optional(),
    query: z.object({}).optional(),
});