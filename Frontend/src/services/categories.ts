import { api } from "../lib/api";

export interface CategoryDto {
    id: string;
    name: string;
    description: string;
    artisanCount: number;
    status: "Active" | "Inactive";
}

export const categoriesApi = {
    list: async () => (await api<{ categories: CategoryDto[] }>("/categories")).categories,
    create: async (i: { name: string; description?: string }) =>
        (await api<{ category: CategoryDto }>("/categories", { method: "POST", body: i })).category,
    update: async (id: string, i: { name: string; description?: string }) =>
        (await api<{ category: CategoryDto }>(`/categories/${id}`, { method: "PUT", body: i })).category,
    setStatus: async (id: string, status: "Active" | "Inactive") =>
        (await api<{ category: CategoryDto }>(`/categories/${id}/status`, { method: "PATCH", body: { status } })).category,
};