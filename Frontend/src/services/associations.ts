import { api } from "../lib/api";
import { Association } from "../types/entities";

export interface AssociationInput {
    name: string;
    code?: string;
    category: string;
    description?: string;
    contactEmail?: string;
    contactPhone?: string;
}

export const associationsApi = {
    list: async () => (await api<{ associations: Association[] }>("/associations")).associations,
    create: async (i: AssociationInput) =>
        (await api<{ association: Association }>("/associations", { method: "POST", body: i })).association,
    update: async (id: string, i: AssociationInput) =>
        (await api<{ association: Association }>(`/associations/${id}`, { method: "PUT", body: i })).association,
    setStatus: async (id: string, status: "Active" | "Inactive") =>
        (await api<{ association: Association }>(`/associations/${id}/status`, { method: "PATCH", body: { status } })).association,
};