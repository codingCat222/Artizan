export const TODAY = new Date("2026-10-16T10:00:00");
export const naira = (n: number) => `₦${n.toLocaleString("en-NG")}`;
export const fmtDate = (d: Date | string) =>
  new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
export const monthLabel = (d: Date) =>
  d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
export const stamp = () =>
  `${fmtDate(TODAY)} — ${TODAY.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;

export function passwordProblem(p: string): string | null {
  if (p.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Za-z]/.test(p) || !/\d/.test(p)) return "Use both letters and numbers.";
  return null;
}

export const isValidPhone = (p: string) => /^(0|\+234)\d{10}$/.test(p.replace(/[\s-]/g, ""));
