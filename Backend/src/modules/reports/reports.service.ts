import { prisma } from "../../config/prisma";
import { Requester } from "../../utils/requester";
import { paymentScope } from "../payments/payments.service";

interface Row {
    amount: number;
    gatewayFee: number;
    period: string;
    status: string;
    reference: string;
    createdAt: Date;
    paidAt: Date | null;
    artisan: { name: string; association: { name: string } };
}

export function summarise(list: Pick<Row, "amount" | "gatewayFee" | "status">[]) {
    const amt = (l: typeof list) => l.reduce((t, p) => t + p.amount, 0);
    const by = (s: string) => list.filter((p) => p.status === s);
    const paid = by("Paid");
    const fees = paid.reduce((t, p) => t + p.gatewayFee, 0);
    return {
        due: amt(list),
        paid: amt(paid),
        pending: amt(by("Pending")),
        failed: amt(by("Failed")),
        overdue: amt(by("Overdue")),
        refunded: amt(by("Refunded")),
        fees,
        net: amt(paid) - fees,
    };
}

async function loadRows(requester: Requester): Promise<Row[]> {
    return prisma.payment.findMany({
        where: paymentScope(requester),
        orderBy: { createdAt: "desc" },
        select: {
            amount: true,
            gatewayFee: true,
            period: true,
            status: true,
            reference: true,
            createdAt: true,
            paidAt: true,
            artisan: { select: { name: true, association: { select: { name: true } } } },
        },
    });
}

// Aggregation is done in memory over the payments in scope. That is fine for a chapter-sized
// platform; move to SQL GROUP BY if the table ever grows into the hundreds of thousands.
export async function paymentReport(requester: Requester, period?: string) {
    const all = await loadRows(requester);
    const periods = Array.from(new Set(all.map((p) => p.period))); // already newest first
    const rows = period ? all.filter((p) => p.period === period) : all;

    const associations = await prisma.association.findMany({
        where: requester.role === "ASSOCIATION_HEAD" ? { id: requester.associationId! } : {},
        orderBy: { name: "asc" },
        select: { name: true },
    });

    return {
        periods,
        summary: summarise(rows),
        byPeriod: periods.map((name) => ({ name, ...summarise(all.filter((p) => p.period === name)) })),
        byAssociation: associations.map((a) => ({
            name: a.name,
            ...summarise(rows.filter((p) => p.artisan.association.name === a.name)),
        })),
    };
}

/** Spreadsheet apps run cells starting with = + - @ as formulas, so those are neutralised. */
export function csvCell(value: string | number): string {
    let s = String(value);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function paymentsCsv(requester: Requester, period?: string): Promise<string> {
    const all = await loadRows(requester);
    const rows = period ? all.filter((p) => p.period === period) : all;
    const head = ["Artisan", "Association", "Period", "Amount", "Gateway fee", "Reference", "Status", "Date"];
    const lines = rows.map((p) =>
        [
            p.artisan.name,
            p.artisan.association.name,
            p.period,
            p.amount,
            p.gatewayFee,
            p.reference,
            p.status,
            (p.paidAt ?? p.createdAt).toISOString().slice(0, 10),
        ]
            .map(csvCell)
            .join(","),
    );
    return [head.join(","), ...lines].join("\n");
}