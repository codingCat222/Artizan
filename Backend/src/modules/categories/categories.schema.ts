import { z } from "zod";

const emptyQuery = z.object({}).optional();

const body = z.object({
    name: z.string().trim().min(2, "Category name is required.").max(80),
    description: z.string().trim().max(300).optional(),
});

export const createCategorySchema = z.object({ body, params: emptyQuery, query: emptyQuery });
export const updateCategorySchema = z.object({ body, params: z.object({ id: z.string().min(1) }), query: emptyQuery });
export const categoryStatusSchema = z.object({
    body: z.object({ status: z.enum(["Active", "Inactive"]) }),
    params: z.object({ id: z.string().min(1) }),
    query: emptyQuery,
});