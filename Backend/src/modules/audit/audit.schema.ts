import { z } from "zod";
import { paginationFields } from "../../utils/pagination";

export const listAuditQuery = z.object({
    q: z.string().max(200).optional(),
    ...paginationFields,
});

export const listAuditSchema = z.object({
    query: listAuditQuery,
    body: z.any().optional(),
    params: z.object({}).optional(),
});