import { env } from "../../config/env";
import { prisma } from "../../config/prisma";
import { getGateway, gatewayMode, mockGateway } from "../../services/gateway";
import { AppError } from "../../utils/appError";
import { nextPeriodFor, periodFor } from "../../utils/dates";
import { hasPaid, isBillable, newReference } from "../billing/billing.service";
import { settlePayment } from "../payments/payments.settlement";
import { getSettings } from "../settings/settings.service";

/** The signed-in artisan, re-read from the database so a suspension takes effect immediately. */
async function currentArtisan(userId: string) {
    const a = await prisma.artisan.findUnique({ where: { id: userId }, include: { association: { select: { name: true } } } });
    if (!a || a.status === "Suspended" || a.status === "Pending") {
        throw AppError.unauthorized("This account is not active.");
    }
    return a;
}

export async function getBilling(userId: string) {
    const a = await currentArtisan(userId);
    const settings = await getSettings();
    const now = new Date();
    const period = periodFor(now, settings);
    const next = nextPeriodFor(now, settings);

    const payments = await prisma.payment.findMany({ where: { artisanId: a.id }, orderBy: { createdAt: "desc" } });
    const paidNow = payments.find((p: { period: string; status: string }) => p.period === period.label && p.status === "Paid");

    return {
        gatewayMode: gatewayMode(),
        fee: settings.fee,
        period: { label: period.label, due: period.due.toISOString(), graceEnd: period.graceEnd.toISOString() },
        nextPeriod: { label: next.label, due: next.due.toISOString(), graceEnd: next.graceEnd.toISOString() },
        owes: isBillable(a, period) && !paidNow,
        hidden: a.status === "Overdue",
        paidNow: paidNow ? { date: (paidNow.paidAt ?? paidNow.createdAt).toISOString(), reference: paidNow.reference } : null,
        profile: {
            name: a.name,
            association: a.association.name,
            category: a.category,
            status: a.status,
            verification: a.verification,
            createdBy: a.createdBy,
            listed: a.status === "Active" && a.verification === "Verified",
        },
        payments: payments.map((p: { id: string; period: string; amount: number; status: string; reference: string; paidAt: Date | null; createdAt: Date }) => ({
            id: p.id,
            period: p.period,
            amount: p.amount,
            status: p.status,
            reference: p.reference,
            date: (p.paidAt ?? p.createdAt).toISOString(),
        })),
    };
}

/** Starts a checkout for the current period's fee and returns where to send the artisan. */
export async function initializePayment(userId: string) {
    const a = await currentArtisan(userId);
    const settings = await getSettings();
    const period = periodFor(new Date(), settings);

    if (await hasPaid(a.id, period.label)) throw AppError.conflict(`Your ${period.label} fee is already paid.`);

    const gateway = getGateway();
    const reference = newReference("PAY");

    // Every attempt gets its own reference (gateways reject re-used ones), recorded before we leave the site.
    await prisma.payment.create({
        data: { artisanId: a.id, amount: settings.fee, period: period.label, status: "Pending", reference },
    });

    try {
        const { authorizationUrl } = await gateway.initialize({
            email: a.email,
            amount: settings.fee,
            reference,
            callbackUrl: `${env.clientUrl}/artisan/payments?reference=${encodeURIComponent(reference)}`,
            metadata: { artisanId: a.id, period: period.label },
        });
        // The new attempt replaces the open invoice, and earlier abandoned attempts are closed off.
        await prisma.payment.deleteMany({
            where: { artisanId: a.id, period: period.label, status: { in: ["Pending", "Overdue"] }, reference: { startsWith: "INV-" } },
        });
        await prisma.payment.updateMany({
            where: { artisanId: a.id, period: period.label, status: "Pending", reference: { not: reference } },
            data: { status: "Failed" },
        });
        return { reference, authorizationUrl };
    } catch (err) {
        await prisma.payment.deleteMany({ where: { reference } }); // nothing reached the gateway
        throw err;
    }
}

async function ownPayment(userId: string, reference: string) {
    const p = await prisma.payment.findFirst({ where: { reference, artisanId: userId } });
    if (!p) throw AppError.notFound("Payment not found.");
    return p;
}

/** Called when the artisan returns from checkout. The gateway, not the browser, decides the outcome. */
export async function verifyPayment(userId: string, reference: string) {
    await currentArtisan(userId);
    await ownPayment(userId, reference);
    const { outcome } = await settlePayment(reference);
    const p = await ownPayment(userId, reference);
    return { outcome, status: p.status };
}

/** Test gateway only: pretend the artisan completed or abandoned checkout. */
export async function mockComplete(userId: string, reference: string, outcome: "success" | "failed") {
    if (gatewayMode() !== "mock") throw AppError.notFound("Not found.");
    await ownPayment(userId, reference);
    if (!mockGateway.complete(reference, outcome)) {
        throw AppError.badRequest("This test checkout has expired (the server was restarted). Start the payment again.");
    }
}