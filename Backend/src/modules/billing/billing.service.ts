import crypto from "crypto";
import { env } from "../../config/env";
import { prisma } from "../../config/prisma";
import { sendEmail } from "../../services/email/email.service";
import { overdueEmail } from "../../services/email/templates/overdue";
import { reminderEmail } from "../../services/email/templates/reminder";
import { daysUntil, isPastGrace, lagosDateKey, periodFor, Period } from "../../utils/dates";
import { formatNaira } from "../../utils/money";
import { recordAudit } from "../audit/audit.service";
import { getSettings, SettingsDto } from "../settings/settings.service";

const SYSTEM = { id: null, name: "System" };
const CHUNK = 500; // SQL Server allows ~2100 parameters per query

export const newReference = (prefix = "PAY") => `${prefix}-${Date.now().toString(36).toUpperCase()}${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

/**
 * An artisan owes a period's fee only if they were already on the platform when it began, have
 * activated their account, and aren't suspended (BR: no obligation for brand-new members).
 */
export const isBillable = (a: { status: string; createdAt: Date }, period: Period) =>
    a.status !== "Pending" && a.status !== "Suspended" && a.createdAt.getTime() < period.start.getTime();

const chunk = <T>(list: T[], size = CHUNK): T[][] => {
    const out: T[][] = [];
    for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
    return out;
};

export async function hasPaid(artisanId: string, periodLabel: string): Promise<boolean> {
    return (await prisma.payment.count({ where: { artisanId, period: periodLabel, status: "Paid" } })) > 0;
}

async function safeEmail(to: string, mail: { subject: string; html: string }) {
    try {
        await sendEmail({ to, ...mail });
        return true;
    } catch (err) {
        console.error("[billing] Could not send email to", to, err);
        return false;
    }
}

interface ArtisanRow {
    id: string;
    name: string;
    email: string;
    status: string;
    createdAt: Date;
}
interface PaymentRow {
    artisanId: string;
    status: string;
}

export interface BillingRunResult {
    skipped: boolean;
    invoices: number;
    hidden: number;
    reminders: number;
}

async function alreadyRan(key: string) {
    return !!(await prisma.auditLog.findFirst({ where: { action: "Billing check", target: { startsWith: `${key}:` } } }));
}

/**
 * The daily billing job (also runnable on demand by the super administrator):
 *  1. makes sure everyone who owes this month has an open "Pending" invoice row (visible in reports),
 *  2. after the grace period, hides unpaid artisans (status Overdue) and emails them,
 *  3. on the configured reminder days before the due date, emails everyone still unpaid.
 * A marker in the audit log keeps the scheduled run to once per day.
 */
export async function runBillingCheck(opts: { force?: boolean; now?: Date; settings?: SettingsDto } = {}): Promise<BillingRunResult> {
    const now = opts.now ?? new Date();
    const settings = opts.settings ?? (await getSettings());
    const period = periodFor(now, settings);
    const key = lagosDateKey(now);

    if (!opts.force && (await alreadyRan(key))) return { skipped: true, invoices: 0, hidden: 0, reminders: 0 };

    const artisans: ArtisanRow[] = await prisma.artisan.findMany({
        where: { status: { in: ["Active", "Overdue"] } },
        select: { id: true, name: true, email: true, status: true, createdAt: true },
    });
    const billable = artisans.filter((a) => isBillable(a, period));

    const rows: PaymentRow[] = await prisma.payment.findMany({
        where: { period: period.label, status: { in: ["Paid", "Pending", "Overdue"] } },
        select: { artisanId: true, status: true },
    });
    const paid = new Set<string>(rows.filter((r) => r.status === "Paid").map((r) => r.artisanId));
    const hasOpenRow = new Set<string>(rows.filter((r) => r.status !== "Paid").map((r) => r.artisanId));
    const owing = billable.filter((a) => !paid.has(a.id));

    // 1. Invoices
    const missing = owing.filter((a) => !hasOpenRow.has(a.id));
    for (const part of chunk(missing)) {
        await prisma.payment.createMany({
            data: part.map((a) => ({
                artisanId: a.id,
                amount: settings.fee,
                period: period.label,
                status: "Pending",
                reference: newReference("INV"),
            })),
        });
    }

    // 2. Past the grace period: hide, mark invoices overdue, tell them.
    let hidden = 0;
    if (isPastGrace(now, period) && owing.length > 0) {
        const ids = owing.map((a) => a.id);
        for (const part of chunk<string>(ids)) {
            await prisma.payment.updateMany({
                where: { artisanId: { in: part }, period: period.label, status: "Pending", reference: { startsWith: "INV-" } },
                data: { status: "Overdue" },
            });
        }
        const toHide = owing.filter((a) => a.status === "Active");
        for (const part of chunk(toHide)) {
            await prisma.artisan.updateMany({
                where: { id: { in: part.map((a) => a.id) }, status: "Active" },
                data: { status: "Overdue" },
            });
        }
        for (const a of toHide) {
            await recordAudit(SYSTEM, "Hid listing after grace period", a.name);
            await safeEmail(
                a.email,
                overdueEmail({ name: a.name.split(" ")[0], amount: formatNaira(settings.fee), period: period.label, payUrl: `${env.clientUrl}/artisan/payments` }),
            );
        }
        hidden = toHide.length;
    }

    // 3. Reminders before the due date
    let reminders = 0;
    const left = daysUntil(period.due, now);
    const reminderDays = settings.reminderDays.split(",").map((n) => Number(n.trim())).filter((n) => Number.isInteger(n) && n >= 0);
    if (left >= 0 && reminderDays.includes(left)) {
        for (const a of owing) {
            const ok = await safeEmail(
                a.email,
                reminderEmail({
                    name: a.name.split(" ")[0],
                    amount: formatNaira(settings.fee),
                    period: period.label,
                    dueDate: period.due.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Lagos" }),
                    daysLeft: left,
                    payUrl: `${env.clientUrl}/artisan/payments`,
                }),
            );
            if (ok) reminders++;
        }
    }

    await recordAudit(SYSTEM, "Billing check", `${key}: ${missing.length} invoices, ${hidden} hidden, ${reminders} reminders`);
    return { skipped: false, invoices: missing.length, hidden, reminders };
}