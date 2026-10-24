import { Link } from "react-router-dom";
import RecentArtisansTable from "../../components/RecentArtisansTable";
import StatCard from "../../components/StatCard";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import Notice from "../../components/ui/Notice";
import PageHeader from "../../components/ui/PageHeader";
import { fmtDate, naira } from "../../lib/format";
import { useApi } from "../../lib/useApi";
import { dashboardApi } from "../../services/dashboard";
import { useAuth } from "../../store/AuthContext";

/** The association head's overview. The server only ever returns figures for their own association. */
export default function AssociationDashboardPage() {
  const { session } = useAuth();
  const { data, loading, error, reload } = useApi(dashboardApi.association);

  if (!data) {
    return (
      <div className="space-y-6">
        <PageHeader title={`${session?.association ?? "Association"} Dashboard`} subtitle="Overview of your association's artisans and revenue" />
        {error ? (
          <Notice tone="error">{error} <button className="ml-2 font-medium underline" onClick={reload}>Retry</button></Notice>
        ) : (
          <p className="text-sm text-forest-700/70">{loading ? "Loading dashboard..." : ""}</p>
        )}
      </div>
    );
  }

  const { artisans: a, outstanding, revenue, recent, fee } = data;

  const cards = [
    { id: "1", label: "Total Artisans", value: String(a.total), icon: "users", hint: `${a.pending} awaiting activation` },
    { id: "2", label: "Active / Inactive", value: `${a.active} / ${a.inactive}`, icon: "users", hint: `${a.listed} visible in public search` },
    { id: "3", label: "Outstanding Fees", value: String(outstanding.count), icon: "alert-triangle", hint: `${a.overdue} hidden from search` },
    { id: "4", label: `Revenue (${revenue.period})`, value: naira(revenue.collected), icon: "banknote", hint: `${naira(revenue.collectedAll)} all time` },
  ];

  const rows = recent.map((r) => ({ id: r.ref, name: r.name, category: r.category, association: data.association, status: r.status, joined: fmtDate(r.createdAt) }));

  return (
    <div className="space-y-6">
      <PageHeader title={`${data.association} Dashboard`} subtitle="Overview of your association's artisans and revenue" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map((c) => <StatCard key={c.id} data={c} />)}</div>

      <Card>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-forest-900">Outstanding monthly fees</h3>
          <Link to="/association/payments" className="text-sm font-medium text-forest-600 hover:underline">All payments</Link>
        </div>
        <ul className="mt-3 divide-y divide-forest-50 text-sm">
          {outstanding.items.map((x) => (
            <li key={x.id} className="flex items-center justify-between py-2.5">
              <Link to={`/association/artisans/${x.id}`} className="font-medium text-forest-900 hover:underline">{x.name}</Link>
              <span className="flex items-center gap-3"><span className="text-forest-700/70">{naira(fee)}</span><Badge status={x.status} /></span>
            </li>
          ))}
          {outstanding.count === 0 && <li className="py-3 text-forest-700/60">Everyone is paid up.</li>}
          {outstanding.count > outstanding.items.length && (
            <li className="py-3 text-forest-700/60">
              Showing {outstanding.items.length} of {outstanding.count}. <Link to="/association/payments" className="font-medium text-forest-600 hover:underline">See all payments</Link>
            </li>
          )}
        </ul>
      </Card>

      {rows.length > 0 ? (
        <RecentArtisansTable rows={rows} viewAllTo="/association/artisans" hideAssociation />
      ) : (
        <Card><p className="text-sm text-forest-700/60">No artisans are registered under your association yet. Use "Register Artisan" to add the first one.</p></Card>
      )}
    </div>
  );
}