import { z } from "zod";
import { paginationFields } from "../../utils/pagination";

export const listPaymentsQuery = z.object({
    status: z.enum(["Paid", "Pending", "Overdue", "Failed", "Refunded"]).optional(),
    period: z.string().max(40).optional(),
    ...paginationFields,
});

export const listPaymentsSchema = z.object({
    query: listPaymentsQuery,
    body: z.any().optional(),
    params: z.object({}).optional(),
});

export const paymentIdSchema = z.object({
    body: z.any().optional(),
    params: z.object({ id: z.string().min(1) }),
    query: z.object({}).optional(),
});