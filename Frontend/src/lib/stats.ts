import { Artisan, Payment, Settings } from "../types/entities";
import { currentPeriod, isListed, owesCurrent } from "./billing";

export function artisanStats(artisans: Artisan[], payments: Payment[], s: Settings) {
  const cur = currentPeriod(s).label;
  const curPay = payments.filter((p) => p.period === cur);
  const sum = (l: Payment[], st: Payment["status"]) => l.filter((p) => p.status === st).reduce((t, p) => t + p.amount, 0);
  return {
    total: artisans.length,
    active: artisans.filter((a) => a.status === "Active").length,
    inactive: artisans.filter((a) => a.status !== "Active").length,
    pendingActivation: artisans.filter((a) => a.status === "Pending").length,
    overdue: artisans.filter((a) => a.status === "Overdue").length,
    listed: artisans.filter(isListed).length,
    owing: artisans.filter((a) => owesCurrent(a, payments, s)).length,
    collected: sum(curPay, "Paid"),
    collectedAll: sum(payments, "Paid"),
    pendingTx: payments.filter((p) => p.status === "Pending").length,
    failedTx: payments.filter((p) => p.status === "Failed").length,
    period: cur,
  };
}
