import { api } from "../lib/api";

export const billingApi = {
    run: () => api<{ skipped: boolean; invoices: number; hidden: number; reminders: number }>("/billing/run", { method: "POST" }),
};