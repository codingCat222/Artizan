import { api } from "../lib/api";

export interface AuditEntry {
    id: string;
    actor: string;
    action: string;
    target: string;
    timestamp: string; // ISO
}

export interface AuditPage {
    items: AuditEntry[];
    total: number;
    page: number;
    pageSize: number;
}

export const auditApi = {
    list: (p: { q?: string; page?: number; pageSize?: number }) => {
        const qs = new URLSearchParams();
        if (p.q) qs.set("q", p.q);
        qs.set("page", String(p.page ?? 1));
        qs.set("pageSize", String(p.pageSize ?? 25));
        return api<AuditPage>(`/audit?${qs}`);
    },
};