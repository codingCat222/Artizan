/** Parses values like "15m", "12h", "7d" (or a bare number of seconds) into milliseconds. */
export function parseDurationMs(value: string): number {
    const match = /^(\d+)\s*(s|m|h|d)?$/.exec(value.trim());
    if (!match) throw new Error(`Invalid duration: "${value}" (use e.g. 15m, 12h, 7d)`);
    const n = Number(match[1]);
    const unit = match[2] ?? "s";
    const mult = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit as "s" | "m" | "h" | "d"];
    return n * mult;
}