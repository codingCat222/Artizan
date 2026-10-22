import { z } from "zod";

const emptyQuery = z.object({}).optional();

const associationBody = z.object({
    name: z.string().trim().min(2, "Association name is required.").max(150),
    code: z.string().trim().max(30).regex(/^[A-Za-z0-9-]*$/, "Code may only contain letters, numbers and hyphens.").optional(),
    category: z.string().trim().min(1, "Category is required."),
    description: z.string().trim().max(1000).optional(),
    contactEmail: z.union([z.literal(""), z.string().trim().email("Enter a valid contact email.")]).optional(),
    contactPhone: z.string().trim().max(30).optional(),
});

export const createAssociationSchema = z.object({ body: associationBody, params: emptyQuery, query: emptyQuery });

export const updateAssociationSchema = z.object({
    body: associationBody,
    params: z.object({ id: z.string().min(1) }),
    query: emptyQuery,
});

export const associationStatusSchema = z.object({
    body: z.object({ status: z.enum(["Active", "Inactive"]) }),
    params: z.object({ id: z.string().min(1) }),
    query: emptyQuery,
});