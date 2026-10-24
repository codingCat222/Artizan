import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/appError";
import { pageArgs } from "../../utils/pagination";
import { LISTED_WHERE } from "./listing.rules";

export interface PublicSearch {
    category?: string;
    town?: string;
    area?: string;
    page: number;
    pageSize: number;
}

const SUMMARY_LENGTH = 160;

type Row = {
    id: string;
    name: string;
    avatarInitials: string;
    category: string;
    businessName: string;
    businessDescription: string | null;
    area: string;
    town: string;
    association: { name: string };
};

// Deliberately a whitelist: anything not named here (email, ID details, date of birth, who registered
// them...) can never reach a visitor, even if the table gains new columns later.
const select = {
    id: true,
    name: true,
    avatarInitials: true,
    category: true,
    businessName: true,
    businessDescription: true,
    area: true,
    town: true,
    association: { select: { name: true } },
} as const;

const toSummary = (a: Row) => ({
    id: a.id,
    name: a.name,
    initials: a.avatarInitials,
    category: a.category,
    businessName: a.businessName,
    description: (a.businessDescription ?? "").slice(0, SUMMARY_LENGTH),
    area: a.area,
    town: a.town,
    association: a.association.name,
});

/** Options for the search form, plus how many artisans are currently listed. */
export async function getFilters() {
    const [categories, towns, listedCount] = await Promise.all([
        prisma.category.findMany({ where: { status: "Active" }, orderBy: { name: "asc" }, select: { name: true } }),
        prisma.artisan.groupBy({ by: ["town"], where: LISTED_WHERE, orderBy: { town: "asc" } }),
        prisma.artisan.count({ where: LISTED_WHERE }),
    ]);
    return {
        categories: categories.map((c: { name: string }) => c.name),
        towns: towns.map((t: { town: string }) => t.town).filter(Boolean),
        listedCount,
    };
}

export async function searchArtisans(f: PublicSearch) {
    const where = {
        ...LISTED_WHERE,
        ...(f.category ? { category: f.category } : {}),
        ...(f.town ? { town: f.town } : {}),
        ...(f.area ? { area: { contains: f.area } } : {}),
    };
    const [total, rows] = await Promise.all([
        prisma.artisan.count({ where }),
        // Alphabetical, so nobody gets a better spot than anyone else.
        prisma.artisan.findMany({ where, select, orderBy: { name: "asc" }, ...pageArgs(f.page, f.pageSize) }),
    ]);
    return { total, page: f.page, pageSize: f.pageSize, items: rows.map(toSummary) };
}

/** A profile page: the summary plus the contact details visitors need to hire the artisan. */
export async function getPublicProfile(id: string) {
    const a = await prisma.artisan.findFirst({
        where: { id, ...LISTED_WHERE },
        select: { ...select, phone: true, whatsapp: true, businessAddress: true, shopNumber: true },
    });
    // Unlisted, suspended, unknown: all look identical to the outside world.
    if (!a) throw AppError.notFound("This artisan is not currently listed in the public directory.");
    return {
        ...toSummary(a),
        description: a.businessDescription ?? "",
        phone: a.phone,
        whatsapp: a.whatsapp ?? "",
        address: [a.shopNumber, a.businessAddress].filter(Boolean).join(", "),
        verified: true,
    };
}