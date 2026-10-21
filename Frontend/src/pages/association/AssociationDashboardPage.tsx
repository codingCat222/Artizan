import { Link } from "react-router-dom";
import RecentArtisansTable from "../../components/RecentArtisansTable";
import StatCard from "../../components/StatCard";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import { owesCurrent } from "../../lib/billing";
import { naira } from "../../lib/format";
import { artisanStats } from "../../lib/stats";
import { useStore } from "../../store/AppStore";
import { useScope } from "../../store/useScope";

export default function AssociationDashboardPage() {
  const { settings } = useStore();
  const scope = useScope();
  const st = artisanStats(scope.artisans, scope.payments, settings);
  const owing = scope.artisans.filter((a) => owesCurrent(a, scope.payments, settings));

  const cards = [
    { id: "1", label: "Total Artisans", value: String(st.total), icon: "users", hint: `${st.pendingActivation} awaiting activation` },
    { id: "2", label: "Active / Inactive", value: `${st.active} / ${st.inactive}`, icon: "users", hint: `${st.listed} visible in public search` },
    { id: "3", label: "Outstanding Fees", value: String(owing.length), icon: "alert-triangle", hint: `${st.overdue} hidden from search` },
    { id: "4", label: `Revenue (${st.period})`, value: naira(st.collected), icon: "banknote", hint: `${naira(st.collectedAll)} all time` },
  ];

  const recent = [...scope.artisans].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5)
    .map((a) => ({ id: a.id, name: a.name, category: a.category, association: a.association, status: a.status, joined: a.joined }));

  return (
    <div className="space-y-6">
      <PageHeader title={`${scope.association} Dashboard`} subtitle="Overview of your association's artisans and revenue" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map((c) => <StatCard key={c.id} data={c} />)}</div>

      <Card>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-forest-900">Outstanding monthly fees</h3>
          <Link to="/association/payments" className="text-sm font-medium text-forest-600 hover:underline">All payments</Link>
        </div>
        <ul className="mt-3 divide-y divide-forest-50 text-sm">
          {owing.map((a) => (
            <li key={a.id} className="flex items-center justify-between py-2.5">
              <Link to={`/association/artisans/${a.id}`} className="font-medium text-forest-900 hover:underline">{a.name}</Link>
              <span className="flex items-center gap-3"><span className="text-forest-700/70">{naira(settings.fee)}</span><Badge status={a.status} /></span>
            </li>
          ))}
          {owing.length === 0 && <li className="py-3 text-forest-700/60">Everyone is paid up.</li>}
        </ul>
      </Card>

      <RecentArtisansTable rows={recent} viewAllTo="/association/artisans" hideAssociation />
    </div>
  );
}
