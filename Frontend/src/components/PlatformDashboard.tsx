import { Link } from "react-router-dom";
import CategoryPieChart from "./CategoryPieChart";
import RecentArtisansTable from "./RecentArtisansTable";
import StatCard from "./StatCard";
import Card from "./ui/Card";
import Notice from "./ui/Notice";
import PageHeader from "./ui/PageHeader";
import { rowCls, Table, Td, Th } from "./ui/Table";
import { fmtDate, naira } from "../lib/format";
import { useApi } from "../lib/useApi";
import { dashboardApi } from "../services/dashboard";

const colors = ["#0B3F24", "#127A34", "#2E9B52", "#5FB57D", "#145C34", "#6F8F7A", "#3E7A55", "#4F9E78"];

export default function PlatformDashboard({ title, subtitle, base }: { title: string; subtitle: string; base: string }) {
  const { data, loading, error, reload } = useApi(dashboardApi.summary);

  if (!data) {
    return (
      <div className="space-y-6">
        <PageHeader title={title} subtitle={subtitle} />
        {error ? (
          <Notice tone="error">{error} <button className="ml-2 font-medium underline" onClick={reload}>Retry</button></Notice>
        ) : (
          <p className="text-sm text-forest-700/70">{loading ? "Loading dashboard..." : ""}</p>
        )}
      </div>
    );
  }

  const { artisans: a, associations, byAssociation, byCategory, recent, payments, categories } = data;

  const cards = [
    { id: "a", label: "Total Artisans", value: String(a.total), icon: "users", hint: `${a.active} active · ${a.inactive} inactive` },
    { id: "b", label: "Associations", value: String(associations.active), icon: "building", hint: `${categories.active} active categories` },
    { id: "c", label: `Collected (${payments.period})`, value: naira(payments.collected), icon: "banknote", hint: `${naira(payments.collectedAll)} all time` },
    { id: "d", label: "Overdue / Hidden", value: String(a.overdue), icon: "alert-triangle", hint: `${payments.pendingCount} pending · ${payments.failedCount} failed transactions` },
  ];

  const slices = byCategory.map((c, i) => ({ name: c.name, value: c.value, color: colors[i % colors.length] }));
  const rows = recent.map((r) => ({ id: r.ref, name: r.name, category: r.category, association: r.association, status: r.status, joined: fmtDate(r.createdAt) }));

  return (
    <div className="space-y-6">
      <PageHeader title={title} subtitle={subtitle} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => <StatCard key={c.id} data={c} />)}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-1">
          {slices.length > 0 ? (
            <CategoryPieChart data={slices} />
          ) : (
            <Card>
              <h3 className="font-semibold text-forest-900">Artisans by Category</h3>
              <p className="mt-6 text-sm text-forest-700/60">No artisans registered yet.</p>
            </Card>
          )}
        </div>
        <Card className="p-0 xl:col-span-2">
          <div className="px-6 pt-5"><h3 className="font-semibold text-forest-900">Artisans by association</h3></div>
          <Table min={520} head={<><Th>Association</Th><Th>Artisans</Th><Th>Active</Th><Th>Overdue</Th><Th>Pending</Th></>}>
            {byAssociation.map((x) => (
              <tr key={x.id} className={rowCls}>
                <Td className="font-medium text-forest-900">{x.name}</Td><Td>{x.artisans}</Td>
                <Td>{x.active}</Td>
                <Td className="text-red-600">{x.overdue}</Td>
                <Td>{x.pending}</Td>
              </tr>
            ))}
            {byAssociation.length === 0 && <tr><td colSpan={5} className="px-5 py-8 text-center text-forest-700/60">No associations yet.</td></tr>}
          </Table>
        </Card>
      </div>

      {rows.length > 0 ? (
        <RecentArtisansTable rows={rows} viewAllTo={`${base}/artisans`} />
      ) : (
        <Card><p className="text-sm text-forest-700/60">No artisans have been registered yet.</p></Card>
      )}
      <p className="text-xs text-forest-700/60">
        {a.active} active artisans. <Link to={`${base}/reports`} className="font-medium text-forest-600 hover:underline">Open financial reports</Link>
      </p>
    </div>
  );
}