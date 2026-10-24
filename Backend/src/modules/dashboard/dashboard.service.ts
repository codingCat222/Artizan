import { prisma } from "../../config/prisma";
import { periodFor } from "../../utils/dates";
import { Requester } from "../../utils/requester";
import { isBillable } from "../billing/billing.service";
import { LISTED_WHERE } from "../public/listing.rules";
import { getSettings } from "../settings/settings.service";

type StatusCounts = { Active: number; Overdue: number; Pending: number; Suspended: number };

const emptyCounts = (): StatusCounts => ({ Active: 0, Overdue: 0, Pending: 0, Suspended: 0 });

/** Platform-wide numbers for the admin / super admin dashboard, straight from the database. */
export async function getPlatformSummary() {
    const period = periodFor(new Date(), { dueDay: 1, graceDays: 0 }).label; // Lagos month, same as billing
    const [byStatus, byCategory, byAssocStatus, associations, recent, paidAll, paidNow, byPayStatus, activeCategories] = await Promise.all([
        prisma.artisan.groupBy({ by: ["status"], _count: { _all: true } }),
        prisma.artisan.groupBy({ by: ["category"], _count: { _all: true } }),
        prisma.artisan.groupBy({ by: ["associationId", "status"], _count: { _all: true } }),
        prisma.association.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, status: true } }),
        prisma.artisan.findMany({
            orderBy: { createdAt: "desc" },
            take: 5,
            select: {
                id: true,
                name: true,
                category: true,
                status: true,
                createdAt: true,
                association: { select: { name: true } },
            },
        }),
        prisma.payment.aggregate({ where: { status: "Paid" }, _sum: { amount: true } }),
        prisma.payment.aggregate({ where: { status: "Paid", period }, _sum: { amount: true } }),
        prisma.payment.groupBy({ by: ["status"], _count: { _all: true } }),
        prisma.category.count({ where: { status: "Active" } }),
    ]);
    const txCount = (s: string) => byPayStatus.find((x) => x.status === s)?._count._all ?? 0;

    const totals = emptyCounts();
    for (const row of byStatus) {
        if (row.status in totals) totals[row.status as keyof StatusCounts] += row._count._all;
    }
    const total = totals.Active + totals.Overdue + totals.Pending + totals.Suspended;

    const perAssociation = new Map<string, StatusCounts>();
    for (const row of byAssocStatus) {
        const c = perAssociation.get(row.associationId) ?? emptyCounts();
        if (row.status in c) c[row.status as keyof StatusCounts] += row._count._all;
        perAssociation.set(row.associationId, c);
    }

    return {
        artisans: {
            total,
            active: totals.Active,
            inactive: total - totals.Active,
            overdue: totals.Overdue,
            pending: totals.Pending,
            suspended: totals.Suspended,
        },
        associations: {
            total: associations.length,
            active: associations.filter((a) => a.status === "Active").length,
        },
        categories: { active: activeCategories },
        payments: {
            period,
            collected: paidNow._sum.amount ?? 0,
            collectedAll: paidAll._sum.amount ?? 0,
            pendingCount: txCount("Pending"),
            failedCount: txCount("Failed"),
        },
        byAssociation: associations.map((a) => {
            const c = perAssociation.get(a.id) ?? emptyCounts();
            return {
                id: a.id,
                name: a.name,
                artisans: c.Active + c.Overdue + c.Pending + c.Suspended,
                active: c.Active,
                overdue: c.Overdue,
                pending: c.Pending,
            };
        }),
        byCategory: byCategory
            .map((c) => ({ name: c.category, value: c._count._all }))
            .sort((a, b) => b.value - a.value),
        recent: recent.map((a) => ({
            id: a.id,
            ref: `AON-${a.id.slice(-6).toUpperCase()}`,
            name: a.name,
            category: a.category,
            association: a.association.name,
            status: a.status,
            createdAt: a.createdAt.toISOString(),
        })),
    };
}

/**
 * Dashboard for an association head: the same kind of numbers as the platform overview, but only for the
 * head's own association. "Outstanding" uses the billing rules (who owes this month), so it matches what the
 * daily billing job will act on.
 */
export async function getAssociationSummary(requester: Requester) {
    const associationId = requester.associationId!;
    const settings = await getSettings();
    const period = periodFor(new Date(), settings);

    const [association, byStatus, listed, billable, paidRows, paidThisPeriod, paidAll, recent] = await Promise.all([
        prisma.association.findUnique({ where: { id: associationId }, select: { name: true } }),
        prisma.artisan.groupBy({ by: ["status"], where: { associationId }, _count: { _all: true } }),
        prisma.artisan.count({ where: { associationId, ...LISTED_WHERE } }),
        prisma.artisan.findMany({
            where: { associationId, status: { in: ["Active", "Overdue"] } },
            select: { id: true, name: true, status: true, createdAt: true },
            orderBy: { name: "asc" },
        }),
        prisma.payment.findMany({
            where: { period: period.label, status: "Paid", artisan: { associationId } },
            select: { artisanId: true },
        }),
        prisma.payment.aggregate({
            where: { period: period.label, status: "Paid", artisan: { associationId } },
            _sum: { amount: true },
        }),
        prisma.payment.aggregate({ where: { status: "Paid", artisan: { associationId } }, _sum: { amount: true } }),
        prisma.artisan.findMany({
            where: { associationId },
            orderBy: { createdAt: "desc" },
            take: 5,
            select: { id: true, name: true, category: true, status: true, createdAt: true },
        }),
    ]);

    const counts: Record<string, number> = { Active: 0, Overdue: 0, Pending: 0, Suspended: 0 };
    for (const row of byStatus as { status: string; _count: { _all: number } }[]) counts[row.status] = (counts[row.status] ?? 0) + row._count._all;
    const total = counts.Active + counts.Overdue + counts.Pending + counts.Suspended;

    const paid = new Set((paidRows as { artisanId: string }[]).map((r) => r.artisanId));
    const owing = (billable as { id: string; name: string; status: string; createdAt: Date }[]).filter(
        (a) => isBillable(a, period) && !paid.has(a.id),
    );

    return {
        association: association?.name ?? "",
        fee: settings.fee,
        artisans: {
            total,
            active: counts.Active,
            inactive: total - counts.Active,
            overdue: counts.Overdue,
            pending: counts.Pending,
            listed,
        },
        outstanding: {
            count: owing.length,
            // The list on the page is a short worklist; the full picture is on the Payments page.
            items: owing.slice(0, 25).map((a) => ({ id: a.id, name: a.name, status: a.status })),
        },
        revenue: {
            period: period.label,
            collected: (paidThisPeriod as { _sum: { amount: number | null } })._sum.amount ?? 0,
            collectedAll: (paidAll as { _sum: { amount: number | null } })._sum.amount ?? 0,
        },
        recent: (recent as { id: string; name: string; category: string; status: string; createdAt: Date }[]).map((a) => ({
            id: a.id,
            ref: `AON-${a.id.slice(-6).toUpperCase()}`,
            name: a.name,
            category: a.category,
            status: a.status,
            createdAt: a.createdAt.toISOString(),
        })),
    };
}