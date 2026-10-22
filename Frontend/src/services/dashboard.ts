import { api } from "../lib/api";

export interface PlatformSummary {
    artisans: { total: number; active: number; inactive: number; overdue: number; pending: number; suspended: number };
    associations: { total: number; active: number };
    byAssociation: { id: string; name: string; artisans: number; active: number; overdue: number; pending: number }[];
    byCategory: { name: string; value: number }[];
    recent: { id: string; ref: string; name: string; category: string; association: string; status: string; createdAt: string }[];
}

export const dashboardApi = {
    summary: () => api<PlatformSummary>("/dashboard"),
};