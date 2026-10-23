import { z } from "zod";

const emptyQuery = z.object({}).optional();

export const referenceSchema = z.object({
    body: z.object({ reference: z.string().min(3).max(80) }),
    params: emptyQuery,
    query: emptyQuery,
});

export const mockCompleteSchema = z.object({
    body: z.object({ reference: z.string().min(3).max(80), outcome: z.enum(["success", "failed"]) }),
    params: emptyQuery,
    query: emptyQuery,
});