import { api } from "../lib/api";

export interface PublicArtisan {
    id: string;
    name: string;
    initials: string;
    category: string;
    businessName: string;
    description: string;
    area: string;
    town: string;
    association: string;
}

export interface PublicProfile extends PublicArtisan {
    phone: string;
    whatsapp: string;
    address: string;
    verified: boolean;
}

export interface PublicFilters {
    categories: string[];
    towns: string[];
    listedCount: number;
}

export interface PublicSearchParams { category?: string; town?: string; area?: string; page?: number; pageSize?: number }

// These pages are for visitors who haven't signed in, so no token is sent.
export const publicApi = {
    filters: () => api<PublicFilters>("/public/filters", { auth: false }),
    search: (p: PublicSearchParams) => {
        const qs = new URLSearchParams();
        Object.entries(p).forEach(([k, v]) => { if (v !== undefined && v !== "") qs.set(k, String(v)); });
        return api<{ items: PublicArtisan[]; total: number; page: number; pageSize: number }>(`/public/artisans?${qs}`, { auth: false });
    },
    profile: async (id: string) => (await api<{ artisan: PublicProfile }>(`/public/artisans/${encodeURIComponent(id)}`, { auth: false })).artisan,
};

/** wa.me wants the number in international format without "+" or leading zero. */
export function whatsappLink(number: string): string {
    const digits = number.replace(/\D/g, "");
    const intl = digits.startsWith("234") ? digits : `234${digits.replace(/^0/, "")}`;
    return `https://wa.me/${intl}`;
}