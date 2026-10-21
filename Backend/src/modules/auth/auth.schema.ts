import { z } from "zod";

const passwordSchema = z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .refine((p) => /[A-Za-z]/.test(p) && /\d/.test(p), "Use both letters and numbers.");

export const loginSchema = z.object({
    body: z.object({
        identifier: z.string().min(1, "Email or username is required."),
        password: z.string().min(1, "Password is required."),
    }),
    params: z.object({}).optional(),
    query: z.object({}).optional(),
});

export const forgotPasswordSchema = z.object({
    body: z.object({
        email: z.string().email("Enter a valid email address."),
    }),
    params: z.object({}).optional(),
    query: z.object({}).optional(),
});

export const resetPasswordSchema = z.object({
    body: z.object({
        token: z.string().min(1, "Reset token is required."),
        password: passwordSchema,
    }),
    params: z.object({}).optional(),
    query: z.object({}).optional(),
});

export const activateAccountSchema = z.object({
    body: z.object({
        token: z.string().min(1, "Activation token is required."),
        password: passwordSchema,
    }),
    params: z.object({}).optional(),
    query: z.object({}).optional(),
});

export const changePasswordSchema = z.object({
    body: z
        .object({
            currentPassword: z.string().min(1, "Current password is required."),
            newPassword: passwordSchema,
        })
        .refine((d) => d.currentPassword !== d.newPassword, {
            message: "New password must be different from the current password.",
            path: ["newPassword"],
        }),
    params: z.object({}).optional(),
    query: z.object({}).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>["body"];
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>["body"];
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>["body"];
export type ActivateAccountInput = z.infer<typeof activateAccountSchema>["body"];
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>["body"];