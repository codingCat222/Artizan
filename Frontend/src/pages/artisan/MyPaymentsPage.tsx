import { Banknote } from "lucide-react";
import { useState } from "react";
import PayModal from "../../components/PayModal";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import { currentPeriod, nextPeriod, owesCurrent } from "../../lib/billing";
import { fmtDate, naira } from "../../lib/format";
import { useStore } from "../../store/AppStore";
import { useMe } from "../../store/useMe";

export default function MyPaymentsPage() {
  const me = useMe();
  const { payments, settings } = useStore();
  const [paying, setPaying] = useState(false);
  const cur = currentPeriod(settings);
  const next = nextPeriod(settings);
  const owes = owesCurrent(me, payments, settings);
  const mine = payments.filter((p) => p.artisanId === me.id);
  const period = owes ? cur : next;

  return (
    <div className="space-y-6">
      <PageHeader title="Payments" subtitle="Your facilitation fee obligations and history" />

      <Card className="flex flex-wrap items-center justify-between gap-4 bg-forest-700 text-white">
        <div>
          <p className="text-sm text-forest-100/80">{period.label} Fee · {owes ? "Payment due" : "Next obligation"}</p>
          <p className="mt-1 text-3xl font-bold">{naira(settings.fee)}</p>
          <p className="mt-1 text-sm text-forest-100/70">
            Due {fmtDate(period.due)} · grace period ends {fmtDate(period.graceEnd)}
          </p>
        </div>
        {owes ? (
          <Button className="!bg-mint !text-forest-900 hover:!bg-forest-300" onClick={() => setPaying(true)}>
            <Banknote size={16} /> Pay Now
          </Button>
        ) : (
          <span className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold">You're up to date</span>
        )}
      </Card>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead>
              <tr className="border-b border-forest-100 text-forest-700/60">
                <th className="px-5 py-3 font-medium">Period</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Reference</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {mine.map((p) => (
                <tr key={p.id} className="border-b border-forest-50 last:border-0">
                  <td className="px-5 py-3 font-medium text-forest-900">{p.period}</td>
                  <td className="px-5 py-3 text-forest-700/80">{naira(p.amount)}</td>
                  <td className="px-5 py-3 text-forest-700/60">{p.reference}</td>
                  <td className="px-5 py-3"><Badge status={p.status} /></td>
                  <td className="px-5 py-3 text-forest-700/60">{p.date}</td>
                  <td className="px-5 py-3 text-right">
                    {(p.status === "Pending" || p.status === "Failed") && p.period === cur.label && (
                      <button className="text-sm font-medium text-forest-600 hover:underline" onClick={() => setPaying(true)}>Retry</button>
                    )}
                  </td>
                </tr>
              ))}
              {mine.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-forest-700/60">No payment history yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      <PayModal artisanId={me.id} open={paying} onClose={() => setPaying(false)} />
    </div>
  );
}
