import { api, apiDownload } from "../lib/api";

export type PaymentStatus = "Paid" | "Pending" | "Overdue" | "Failed" | "Refunded";

export interface PaymentDto {
    id: string;
    artisanId: string;
    artisan: string;
    association: string;
    amount: number;
    gatewayFee: number;
    period: string;
    status: PaymentStatus;
    reference: string;
    date: string;
}

export interface PaymentsPage {
    items: PaymentDto[];
    total: number;
    page: number;
    pageSize: number;
    periods: string[];
    totals: { collected: number; pending: number; overdue: number; failedCount: number };
}

export interface Summary { due: number; paid: number; pending: number; failed: number; overdue: number; refunded: number; fees: number; net: number }
export interface PaymentReport {
    periods: string[];
    summary: Summary;
    byPeriod: ({ name: string } & Summary)[];
    byAssociation: ({ name: string } & Summary)[];
}

export const paymentsApi = {
    list: (f: { status?: string; period?: string; page?: number; pageSize?: number }) => {
        const qs = new URLSearchParams();
        Object.entries(f).forEach(([k, v]) => { if (v !== undefined && v !== "") qs.set(k, String(v)); });
        return api<PaymentsPage>(`/payments?${qs}`);
    },
    refund: (id: string) => api(`/payments/${id}/refund`, { method: "POST" }),
    report: (period?: string) => api<PaymentReport>(`/reports/payments${period ? `?period=${encodeURIComponent(period)}` : ""}`),
    exportCsv: (period?: string) =>
        apiDownload(`/reports/payments/export${period ? `?period=${encodeURIComponent(period)}` : ""}`, "payments-report.csv"),
};