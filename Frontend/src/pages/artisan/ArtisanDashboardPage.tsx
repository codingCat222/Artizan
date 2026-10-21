import { Bell } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import PayModal from "../../components/PayModal";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Notice from "../../components/ui/Notice";
import PageHeader from "../../components/ui/PageHeader";
import { currentPeriod, daysUntil, isListed, nextPeriod, owesCurrent } from "../../lib/billing";
import { fmtDate, naira } from "../../lib/format";
import { useStore } from "../../store/AppStore";
import { useMe } from "../../store/useMe";

export default function ArtisanDashboardPage() {
  const me = useMe();
  const { payments, settings } = useStore();
  const [paying, setPaying] = useState(false);
  const mine = payments.filter((p) => p.artisanId === me.id);
  const cur = currentPeriod(settings);
  const next = nextPeriod(settings);
  const owes = owesCurrent(me, payments, settings);
  const paidNow = mine.find((p) => p.period === cur.label && p.status === "Paid");
  const hidden = me.status === "Overdue";
  const inGrace = owes && !hidden;
  const dueIn = daysUntil(next.due);

  return (
    <div className="space-y-6">
      <PageHeader title={`Welcome back, ${me.name.split(" ")[0]}`} subtitle={`${me.association} · ${me.category}`} />

      {hidden && (
        <Notice tone="error">
          <strong>Your listing is hidden from public search.</strong> Your {cur.label} fee wasn't paid before the grace period ended
          ({fmtDate(cur.graceEnd)}). Pay now and your profile will be restored once the payment is verified.
          <div className="mt-2"><Button size="sm" onClick={() => setPaying(true)}>Pay {naira(settings.fee)} now</Button></div>
        </Notice>
      )}
      {inGrace && (
        <Notice tone="warn">
          <strong>Your {cur.label} fee is overdue.</strong> Pay by {fmtDate(cur.graceEnd)} to avoid being removed from public search.
          <div className="mt-2"><Button size="sm" onClick={() => setPaying(true)}>Pay {naira(settings.fee)} now</Button></div>
        </Notice>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="bg-forest-700 text-white">
          <p className="text-sm font-medium text-forest-100/80">Account Status</p>
          <p className="mt-2 text-2xl font-bold">{me.status}</p>
          <p className="mt-1 text-sm text-forest-100/70">{isListed(me) ? "Listed in public search" : "Not listed in public search"}</p>
        </Card>
        <Card>
          <p className="text-sm font-medium text-forest-700/70">{cur.label} Fee</p>
          <p className="mt-2 text-2xl font-bold text-forest-900">{naira(settings.fee)}</p>
          {paidNow ? (
            <p className="mt-1 text-sm text-fresh-600">Paid on {paidNow.date}</p>
          ) : owes ? (
            <p className="mt-1 text-sm text-red-600">Unpaid · was due {fmtDate(cur.due)}</p>
          ) : (
            <p className="mt-1 text-sm text-forest-700/60">No payment required yet</p>
          )}
        </Card>
        <Card>
          <p className="text-sm font-medium text-forest-700/70">Next Due Date</p>
          <p className="mt-2 text-2xl font-bold text-forest-900">{fmtDate(next.due)}</p>
          <p className="mt-1 text-sm text-forest-700/60">{dueIn} days remaining · {next.label}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-forest-900">Recent Payments</h3>
            <Link to="/artisan/payments" className="text-sm font-medium text-forest-600 hover:underline">View all</Link>
          </div>
          <div className="mt-3 divide-y divide-forest-50">
            {mine.slice(0, 4).map((p) => (
              <div key={p.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-medium text-forest-900">{p.period}</p>
                  <p className="text-xs text-forest-700/60">{p.reference}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-forest-800">{naira(p.amount)}</span>
                  <Badge status={p.status} />
                </div>
              </div>
            ))}
            {mine.length === 0 && <p className="py-4 text-sm text-forest-700/60">No payments yet.</p>}
          </div>
        </Card>

        <Card>
          <h3 className="flex items-center gap-2 font-semibold text-forest-900"><Bell size={16} /> Notifications</h3>
          <ul className="mt-3 space-y-3 text-sm">
            {hidden && <li><p className="font-medium text-red-600">Listing hidden</p><p className="text-xs text-forest-700/60">Unpaid after the grace period.</p></li>}
            {paidNow && <li><p className="font-medium text-forest-900">Payment received</p><p className="text-xs text-forest-700/60">Your {cur.label} fee was confirmed.</p></li>}
            <li><p className="font-medium text-forest-900">Next fee due {fmtDate(next.due)}</p><p className="text-xs text-forest-700/60">Reminders are emailed before the due date.</p></li>
            <li><p className="font-medium text-forest-900">Welcome</p><p className="text-xs text-forest-700/60">Your account was created by {me.createdBy}.</p></li>
          </ul>
        </Card>
      </div>

      <PayModal artisanId={me.id} open={paying} onClose={() => setPaying(false)} />
    </div>
  );
}
