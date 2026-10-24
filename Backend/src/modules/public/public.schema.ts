import { z } from "zod";

const emptyBody = z.any().optional();

export const publicSearchQuery = z.object({
    category: z.string().trim().max(80).optional(),
    town: z.string().trim().max(100).optional(),
    area: z.string().trim().max(150).optional(),
    page: z.coerce.number().int().min(1).max(1000).default(1),
    pageSize: z.coerce.number().int().min(1).max(48).default(12),
});

export const publicSearchSchema = z.object({ query: publicSearchQuery, body: emptyBody, params: z.object({}).optional() });

export const publicProfileSchema = z.object({
    params: z.object({ id: z.string().min(1).max(60) }),
    body: emptyBody,
    query: z.object({}).optional(),
});