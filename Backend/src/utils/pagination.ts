import { z } from "zod";

export const paginationFields = {
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(25),
};

export function pageArgs(page: number, pageSize: number) {
    return { skip: (page - 1) * pageSize, take: pageSize };
}