import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ArtisanFormModal from "../../components/ArtisanFormModal";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import Select from "../../components/ui/Select";
import { rowCls, Table, Td, Th } from "../../components/ui/Table";
import { isListed } from "../../lib/billing";
import { useStore } from "../../store/AppStore";
import { useBase } from "../../store/AuthContext";
import { useScope } from "../../store/useScope";

/** Shared by admin, super admin and association head (scoped to their association). */
export default function ManageArtisansPage() {
  const { categories, associations } = useStore();
  const scope = useScope();
  const base = useBase();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [association, setAssociation] = useState("");
  const [status, setStatus] = useState("");
  const [showForm, setShowForm] = useState(false);

  const filtered = useMemo(
    () =>
      scope.artisans.filter((a) => {
        if (category && a.category !== category) return false;
        if (association && a.association !== association) return false;
        if (status && a.status !== status) return false;
        const q = query.trim().toLowerCase();
        if (q && !`${a.name} ${a.id} ${a.businessName}`.toLowerCase().includes(q)) return false;
        return true;
      }),
    [scope.artisans, query, category, association, status],
  );

  return (
    <div className="space-y-6">
      <ArtisanFormModal open={showForm} onClose={() => setShowForm(false)} lockedAssociation={scope.isHead ? scope.association : undefined} />
      <PageHeader
        title={scope.isHead ? "My Artisans" : "Manage Artisans"}
        subtitle={scope.isHead ? `Artisans registered under ${scope.association}` : `${scope.artisans.length} registered artisans`}
        actions={<Button onClick={() => setShowForm(true)}><Plus size={15} /> {scope.isHead ? "Register Artisan" : "New Artisan"}</Button>}
      />

      <Card>
        <div className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${scope.isHead ? "lg:grid-cols-[1fr_180px_160px]" : "lg:grid-cols-[1fr_180px_200px_160px]"}`}>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-forest-700/40" />
            <input
              value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, ID or business..."
              className="w-full rounded-xl border border-forest-100 bg-white py-2.5 pl-9 pr-3.5 text-sm text-forest-900 placeholder:text-forest-700/40 focus:border-forest-400 focus:outline-none focus:ring-2 focus:ring-forest-100"
            />
          </div>
          <Select value={category} onChange={(e) => setCategory(e.target.value)}
            options={[{ label: "All categories", value: "" }, ...categories.map((c) => ({ label: c.name, value: c.name }))]} />
          {!scope.isHead && (
            <Select value={association} onChange={(e) => setAssociation(e.target.value)}
              options={[{ label: "All associations", value: "" }, ...associations.map((c) => ({ label: c.name, value: c.name }))]} />
          )}
          <Select value={status} onChange={(e) => setStatus(e.target.value)}
            options={[{ label: "All statuses", value: "" }, ...["Active", "Overdue", "Pending", "Suspended"].map((s) => ({ label: s, value: s }))]} />
        </div>
      </Card>

      <Card className="p-0">
        <Table min={860} head={<><Th>Artisan</Th><Th>Category</Th>{!scope.isHead && <Th>Association</Th>}<Th>Location</Th><Th>Status</Th><Th>Public listing</Th><Th /></>}>
          {filtered.map((a) => (
            <tr key={a.id} className={rowCls}>
              <Td><p className="font-medium text-forest-900">{a.name}</p><p className="text-xs text-forest-700/50">{a.id}</p></Td>
              <Td className="text-forest-700/80">{a.category}</Td>
              {!scope.isHead && <Td className="text-forest-700/80">{a.association}</Td>}
              <Td className="text-forest-700/80">{a.area}, {a.town}</Td>
              <Td><Badge status={a.status} /></Td>
              <Td className={isListed(a) ? "text-fresh-600" : "text-forest-700/50"}>{isListed(a) ? "Visible" : "Hidden"}</Td>
              <Td className="text-right"><Link to={`${base}/artisans/${a.id}`} className="font-medium text-forest-600 hover:underline">View</Link></Td>
            </tr>
          ))}
          {filtered.length === 0 && <tr><td colSpan={7} className="px-5 py-12 text-center text-forest-700/60">No artisans match these filters.</td></tr>}
        </Table>
      </Card>
    </div>
  );
}
