import { prisma } from "../../config/prisma";
import { periodFor } from "../../utils/dates";

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