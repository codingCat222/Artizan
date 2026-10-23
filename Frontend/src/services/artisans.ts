import { api } from "../lib/api";

export type ArtisanStatus = "Active" | "Overdue" | "Pending" | "Suspended";

export interface ArtisanDto {
    id: string;
    /** Short reference shown in the UI (e.g. AON-4F2A9C). Use `id` for links and API calls. */
    ref: string;
    name: string;
    email: string;
    category: string;
    associationId: string;
    association: string;
    town: string;
    area: string;
    phone: string;
    status: ArtisanStatus;
    verification: "Verified" | "Unverified";
    businessName: string;
    businessDescription: string;
    whatsapp: string;
    businessAddress: string;
    shopNumber: string;
    dob: string;
    idType: string;
    /** The real ID number never leaves the server. */
    idNumberMasked: string;
    avatarInitials: string;
    mustChangePassword: boolean;
    createdBy: string;
    verifiedBy: string;
    createdAt: string;
}

export interface ArtisanDetail extends ArtisanDto {
    documents: { id: string; name: string; type: string; review: string; uploaded: string }[];
    payments: { id: string; period: string; amount: number; status: string; reference: string; date: string }[];
}

export interface ArtisanInput {
    name: string;
    dob?: string;
    phone: string;
    whatsapp?: string;
    email: string;
    businessName: string;
    shopNumber?: string;
    businessAddress: string;
    businessDescription?: string;
    town: string;
    area: string;
    category: string;
    associationId?: string;
    idType?: string;
    idNumber?: string;
}

export interface ArtisanFilters {
    q?: string;
    category?: string;
    associationId?: string;
    status?: string;
    page?: number;
    pageSize?: number;
}

/** A listing is public only when the account is active and verified (FRD 5.1 / 5.10). */
export const isListed = (a: Pick<ArtisanDto, "status" | "verification">) => a.status === "Active" && a.verification === "Verified";

export const artisansApi = {
    list: (f: ArtisanFilters) => {
        const qs = new URLSearchParams();
        (Object.entries(f) as [string, string | number | undefined][]).forEach(([k, v]) => {
            if (v !== undefined && v !== "") qs.set(k, String(v));
        });
        return api<{ items: ArtisanDto[]; total: number; page: number; pageSize: number }>(`/artisans?${qs}`);
    },
    get: async (id: string) => (await api<{ artisan: ArtisanDetail }>(`/artisans/${id}`)).artisan,
    create: async (i: ArtisanInput) => (await api<{ artisan: ArtisanDto }>("/artisans", { method: "POST", body: i })).artisan,
    update: async (id: string, i: ArtisanInput) => (await api<{ artisan: ArtisanDto }>(`/artisans/${id}`, { method: "PUT", body: i })).artisan,
    setStatus: (id: string, status: "Suspended" | "Active") => api(`/artisans/${id}/status`, { method: "PATCH", body: { status } }),
    setVerification: (id: string, verification: "Verified" | "Unverified") =>
        api(`/artisans/${id}/verification`, { method: "PATCH", body: { verification } }),
    requirePasswordReset: (id: string) => api(`/artisans/${id}/require-password-reset`, { method: "POST" }),
    resendActivation: (id: string) => api(`/artisans/${id}/resend-activation`, { method: "POST" }),
};