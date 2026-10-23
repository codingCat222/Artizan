import { api } from "../lib/api";

export interface BillingPayment {
    id: string;
    period: string;
    amount: number;
    status: "Paid" | "Pending" | "Overdue" | "Failed" | "Refunded";
    reference: string;
    date: string;
}

export interface PeriodInfo { label: string; due: string; graceEnd: string }

export interface BillingInfo {
    gatewayMode: "paystack" | "mock" | "none";
    fee: number;
    period: PeriodInfo;
    nextPeriod: PeriodInfo;
    owes: boolean;
    /** Listing hidden because the fee wasn't paid before the grace period ended. */
    hidden: boolean;
    paidNow: { date: string; reference: string } | null;
    profile: {
        name: string; association: string; category: string; status: string;
        verification: string; createdBy: string; listed: boolean;
    };
    payments: BillingPayment[];
}

export type VerifyOutcome = "paid" | "duplicate" | "failed" | "pending" | "not_found";

export const meApi = {
    billing: () => api<BillingInfo>("/me/billing"),
    initializePayment: () => api<{ reference: string; authorizationUrl: string }>("/me/payments/initialize", { method: "POST" }),
    verifyPayment: (reference: string) =>
        api<{ outcome: VerifyOutcome; status: string }>("/me/payments/verify", { method: "POST", body: { reference } }),
    mockComplete: (reference: string, outcome: "success" | "failed") =>
        api<{ ok: boolean }>("/me/payments/mock-complete", { method: "POST", body: { reference, outcome } }),
};