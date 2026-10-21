import { Link } from "react-router-dom";
import CategoryPieChart from "./CategoryPieChart";
import RecentArtisansTable from "./RecentArtisansTable";
import StatCard from "./StatCard";
import Card from "./ui/Card";
import PageHeader from "./ui/PageHeader";
import { rowCls, Table, Td, Th } from "./ui/Table";
import { artisanStats } from "../lib/stats";
import { naira } from "../lib/format";
import { useStore } from "../store/AppStore";

const colors = ["#0B3F24", "#127A34", "#2E9B52", "#5FB57D", "#145C34", "#6F8F7A", "#3E7A55", "#4F9E78"];

export default function PlatformDashboard({ title, subtitle, base }: { title: string; subtitle: string; base: string }) {
  const { artisans, payments, associations, categories, settings } = useStore();
  const st = artisanStats(artisans, payments, settings);

  const cards = [
    { id: "a", label: "Total Artisans", value: String(st.total), icon: "users", hint: `${st.active} active · ${st.inactive} inactive` },
    { id: "b", label: "Associations", value: String(associations.filter((a) => a.status === "Active").length), icon: "building", hint: `${categories.filter((c) => c.status === "Active").length} active categories` },
    { id: "c", label: `Collected (${st.period})`, value: naira(st.collected), icon: "banknote", hint: `${naira(st.collectedAll)} all time` },
    { id: "d", label: "Overdue / Hidden", value: String(st.overdue), icon: "alert-triangle", hint: `${st.pendingTx} pending · ${st.failedTx} failed transactions` },
  ];

  const slices = categories
    .map((c, i) => ({ name: c.name, value: artisans.filter((a) => a.category === c.name).length, color: colors[i % colors.length] }))
    .filter((s) => s.value > 0);

  const recent = [...artisans]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5)
    .map((a) => ({ id: a.id, name: a.name, category: a.category, association: a.association, status: a.status, joined: a.joined }));

  return (
    <div className="space-y-6">
      <PageHeader title={title} subtitle={subtitle} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => <StatCard key={c.id} data={c} />)}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-1"><CategoryPieChart data={slices} /></div>
        <Card className="p-0 xl:col-span-2">
          <div className="px-6 pt-5"><h3 className="font-semibold text-forest-900">Artisans by association</h3></div>
          <Table min={520} head={<><Th>Association</Th><Th>Artisans</Th><Th>Active</Th><Th>Overdue</Th><Th>Pending</Th></>}>
            {associations.map((a) => {
              const l = artisans.filter((x) => x.association === a.name);
              return (
                <tr key={a.id} className={rowCls}>
                  <Td className="font-medium text-forest-900">{a.name}</Td><Td>{l.length}</Td>
                  <Td>{l.filter((x) => x.status === "Active").length}</Td>
                  <Td className="text-red-600">{l.filter((x) => x.status === "Overdue").length}</Td>
                  <Td>{l.filter((x) => x.status === "Pending").length}</Td>
                </tr>
              );
            })}
          </Table>
        </Card>
      </div>

      <RecentArtisansTable rows={recent} viewAllTo={`${base}/artisans`} />
      <p className="text-xs text-forest-700/60">
        {st.listed} artisans are currently visible in public search. <Link to={`${base}/reports`} className="font-medium text-forest-600 hover:underline">Open financial reports</Link>
      </p>
    </div>
  );
}
