import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/appError";
import { pageArgs } from "../../utils/pagination";
import { Requester } from "../../utils/requester";
import { recordAudit } from "../audit/audit.service";

export const PAYMENT_STATUSES = ["Paid", "Pending", "Overdue", "Failed", "Refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/** Association heads only ever see payments made by artisans of their own association. */
export function paymentScope(requester: Requester) {
    return requester.role === "ASSOCIATION_HEAD" ? { artisan: { associationId: requester.associationId! } } : {};
}

type Row = {
    id: string;
    artisanId: string;
    amount: number;
    gatewayFee: number;
    period: string;
    status: string;
    reference: string;
    paidAt: Date | null;
    createdAt: Date;
    artisan: { name: string; association: { name: string } };
};

const include = { artisan: { select: { name: true, association: { select: { name: true } } } } } as const;

const toDto = (p: Row) => ({
    id: p.id,
    artisanId: p.artisanId,
    artisan: p.artisan.name,
    association: p.artisan.association.name,
    amount: p.amount,
    gatewayFee: p.gatewayFee,
    period: p.period,
    status: p.status as PaymentStatus,
    reference: p.reference,
    date: (p.paidAt ?? p.createdAt).toISOString(),
});

export async function listPayments(
    requester: Requester,
    f: { status?: string; period?: string; page: number; pageSize: number },
) {
    const scope = paymentScope(requester);
    const where = { ...scope, ...(f.status ? { status: f.status } : {}), ...(f.period ? { period: f.period } : {}) };

    const [total, rows, byStatus, periods] = await Promise.all([
        prisma.payment.count({ where }),
        prisma.payment.findMany({ where, include, orderBy: { createdAt: "desc" }, ...pageArgs(f.page, f.pageSize) }),
        // Summary cards cover everything in scope, whatever filter is applied to the table.
        prisma.payment.groupBy({ by: ["status"], where: scope, _sum: { amount: true }, _count: { _all: true } }),
        prisma.payment.groupBy({
            by: ["period"],
            where: scope,
            _max: { createdAt: true },
            orderBy: { _max: { createdAt: "desc" } },
        }),
    ]);

    const sum = (s: PaymentStatus) => byStatus.find((x) => x.status === s)?._sum.amount ?? 0;
    return {
        total,
        page: f.page,
        pageSize: f.pageSize,
        items: rows.map(toDto),
        periods: periods.map((p) => p.period),
        totals: {
            collected: sum("Paid"),
            pending: sum("Pending"),
            overdue: sum("Overdue"),
            failedCount: byStatus.find((x) => x.status === "Failed")?._count._all ?? 0,
        },
    };
}

export async function refundPayment(requester: Requester, id: string) {
    if (requester.role === "ASSOCIATION_HEAD") throw AppError.forbidden("You do not have permission to refund payments.");
    const payment = await prisma.payment.findUnique({ where: { id }, include });
    if (!payment) throw AppError.notFound("Payment not found.");
    if (payment.status !== "Paid") throw AppError.badRequest("Only completed payments can be refunded.");

    const updated = await prisma.payment.update({ where: { id }, data: { status: "Refunded" }, include });
    await recordAudit(requester, "Refunded payment", `${updated.reference} · ${updated.artisan.name}`);
    return toDto(updated);
}