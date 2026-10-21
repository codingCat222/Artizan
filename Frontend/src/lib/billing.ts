import { Artisan, Payment, Settings } from "../types/entities";
import { TODAY, monthLabel } from "./format";

export interface Period {
  label: string;
  start: Date;
  due: Date;
  graceEnd: Date;
}

export function periodFor(date: Date, s: Settings): Period {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const due = new Date(date.getFullYear(), date.getMonth(), s.dueDay);
  const graceEnd = new Date(due.getTime() + s.graceDays * 86400000);
  return { label: monthLabel(start), start, due, graceEnd };
}

export const currentPeriod = (s: Settings) => periodFor(TODAY, s);
export const nextPeriod = (s: Settings) =>
  periodFor(new Date(TODAY.getFullYear(), TODAY.getMonth() + 1, 1), s);

export const daysUntil = (d: Date) => Math.ceil((d.getTime() - TODAY.getTime()) / 86400000);

export const hasPaid = (payments: Payment[], artisanId: string, label: string) =>
  payments.some((p) => p.artisanId === artisanId && p.period === label && p.status === "Paid");

/** An obligation exists only for artisans who were already on the platform when the period began. */
export function owesCurrent(a: Artisan, payments: Payment[], s: Settings) {
  const p = currentPeriod(s);
  if (a.status === "Pending") return false;
  if (new Date(a.createdAt) >= p.start) return false;
  return !hasPaid(payments, a.id, p.label);
}

/** Public listing eligibility (FRD 5.1 / 5.10). */
export const isListed = (a: Artisan) => a.status === "Active" && a.verification === "Verified";
