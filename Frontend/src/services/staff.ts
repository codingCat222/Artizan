import { api } from "../lib/api";

export interface StaffMember {
    id: string;
    name: string;
    email: string;
    role: "SUPER_ADMIN" | "ADMIN" | "ASSOCIATION_HEAD";
    status: "Active" | "Disabled";
    associationId: string | null;
    association: string | null;
    createdAt: string;
}

export const staffApi = {
    list: async () => (await api<{ staff: StaffMember[] }>("/staff")).staff,
    create: async (input: { name: string; email: string; role: "ADMIN" | "ASSOCIATION_HEAD"; associationId?: string }) =>
        (await api<{ staff: StaffMember }>("/staff", { method: "POST", body: input })).staff,
    setStatus: async (id: string, status: "Active" | "Disabled") =>
        (await api<{ staff: StaffMember }>(`/staff/${id}/status`, { method: "PATCH", body: { status } })).staff,
    remove: (id: string) => api<void>(`/staff/${id}`, { method: "DELETE" }),
};