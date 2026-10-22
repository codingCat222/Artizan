import { z } from "zod";

const emptyQuery = z.object({}).optional();

export const createStaffSchema = z.object({
    body: z.object({
        name: z.string().trim().min(2, "Enter the person's full name.").max(120),
        email: z.string().trim().email("Enter a valid email address."),
        role: z.enum(["ADMIN", "ASSOCIATION_HEAD"]),
        associationId: z.string().min(1).optional(),
    }),
    params: emptyQuery,
    query: emptyQuery,
});

export const staffStatusSchema = z.object({
    body: z.object({ status: z.enum(["Active", "Disabled"]) }),
    params: z.object({ id: z.string().min(1) }),
    query: emptyQuery,
});

export const staffIdSchema = z.object({
    body: z.any().optional(),
    params: z.object({ id: z.string().min(1) }),
    query: emptyQuery,
});