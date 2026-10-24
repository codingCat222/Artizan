import { api } from "../lib/api";

export interface PlatformSummary {
    artisans: { total: number; active: number; inactive: number; overdue: number; pending: number; suspended: number };
    associations: { total: number; active: number };
    categories: { active: number };
    payments: { period: string; collected: number; collectedAll: number; pendingCount: number; failedCount: number };
    byAssociation: { id: string; name: string; artisans: number; active: number; overdue: number; pending: number }[];
    byCategory: { name: string; value: number }[];
    recent: { id: string; ref: string; name: string; category: string; association: string; status: string; createdAt: string }[];
}

export interface AssociationSummary {
    association: string;
    fee: number;
    artisans: { total: number; active: number; inactive: number; overdue: number; pending: number; listed: number };
    outstanding: { count: number; items: { id: string; name: string; status: string }[] };
    revenue: { period: string; collected: number; collectedAll: number };
    recent: { id: string; ref: string; name: string; category: string; status: string; createdAt: string }[];
}

export const dashboardApi = {
    summary: () => api<PlatformSummary>("/dashboard"),
    association: () => api<AssociationSummary>("/dashboard/association"),
};