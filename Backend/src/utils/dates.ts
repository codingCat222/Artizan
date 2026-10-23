/**
 * Billing runs on Nigerian time (WAT, UTC+1, no daylight saving) so "the 5th" means the 5th in Lagos
 * regardless of where the server is hosted. "Lagos wall time" is represented by shifting an instant
 * forward one hour and then reading its UTC fields.
 */
const LAGOS_OFFSET_MS = 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface Period {
    /** e.g. "October 2026". Stored on every payment as its period. */
    label: string;
    /** First instant of the month (Lagos). */
    start: Date;
    /** Due date (Lagos midnight). */
    due: Date;
    /** Last day of the grace period (Lagos midnight of that day). */
    graceEnd: Date;
}

/** Instant of Lagos midnight for the given Lagos calendar date (month may overflow, e.g. 12 = next January). */
const lagosMidnight = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d) - LAGOS_OFFSET_MS);

const lagosParts = (now: Date) => {
    const l = new Date(now.getTime() + LAGOS_OFFSET_MS);
    return { y: l.getUTCFullYear(), m: l.getUTCMonth(), d: l.getUTCDate() };
};

export function periodFor(now: Date, s: { dueDay: number; graceDays: number }): Period {
    const { y, m } = lagosParts(now);
    return {
        label: new Date(Date.UTC(y, m, 1)).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }),
        start: lagosMidnight(y, m, 1),
        due: lagosMidnight(y, m, s.dueDay),
        graceEnd: lagosMidnight(y, m, s.dueDay + s.graceDays),
    };
}

export function nextPeriodFor(now: Date, s: { dueDay: number; graceDays: number }): Period {
    const { y, m } = lagosParts(now);
    return periodFor(lagosMidnight(y, m + 1, 15), s);
}

/** True once the whole grace period (including its last day) has passed. */
export const isPastGrace = (now: Date, p: Period) => now.getTime() >= p.graceEnd.getTime() + DAY_MS;

/** Whole days from today (Lagos) until the given date; negative once it has passed. */
export function daysUntil(target: Date, now: Date): number {
    const { y, m, d } = lagosParts(now);
    return Math.round((target.getTime() - lagosMidnight(y, m, d).getTime()) / DAY_MS);
}

/** "2026-10-23", used to make the daily billing job run only once per day. */
export function lagosDateKey(now: Date): string {
    const { y, m, d } = lagosParts(now);
    return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}