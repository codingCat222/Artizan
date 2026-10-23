import { Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ArtisanFormModal from "../../components/ArtisanFormModal";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Notice from "../../components/ui/Notice";
import PageHeader from "../../components/ui/PageHeader";
import Select from "../../components/ui/Select";
import { rowCls, Table, Td, Th } from "../../components/ui/Table";
import { useApi } from "../../lib/useApi";
import { artisansApi, isListed } from "../../services/artisans";
import { associationsApi } from "../../services/associations";
import { categoriesApi } from "../../services/categories";
import { useAuth, useBase } from "../../store/AuthContext";

const PAGE_SIZE = 20;

/** Shared by admin, super admin and association head. The server limits heads to their own association. */
export default function ManageArtisansPage() {
  const { session } = useAuth();
  const isHead = session?.role === "ASSOCIATION_HEAD";
  const base = useBase();
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [associationId, setAssociationId] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);

  const categories = useApi(categoriesApi.list);
  const associations = useApi(() => (isHead ? Promise.resolve([]) : associationsApi.list()), [isHead]);

  // Wait for the person to stop typing before querying.
  useEffect(() => {
    const t = setTimeout(() => { setSearch(query.trim()); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const { data, loading, error, reload } = useApi(
    () => artisansApi.list({ q: search, category, associationId, status, page, pageSize: PAGE_SIZE }),
    [search, category, associationId, status, page],
  );
  const rows = data?.items ?? [];
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE));
  const filtered = !!(search || category || associationId || status);

  return (
    <div className="space-y-6">
      <ArtisanFormModal open={showForm} onClose={() => setShowForm(false)} onCreated={reload} lockedAssociation={isHead ? session?.association ?? "Your association" : undefined} />
      <PageHeader
        title={isHead ? "My Artisans" : "Manage Artisans"}
        subtitle={isHead ? `Artisans registered under ${session?.association ?? "your association"}` : `${data?.total ?? 0} ${filtered ? "matching" : "registered"} artisans`}
        actions={<Button onClick={() => setShowForm(true)}><Plus size={15} /> {isHead ? "Register Artisan" : "New Artisan"}</Button>}
      />

      <Card>
        <div className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${isHead ? "lg:grid-cols-[1fr_180px_160px]" : "lg:grid-cols-[1fr_180px_200px_160px]"}`}>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-forest-700/40" />
            <input
              value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, ID, email or business..."
              className="w-full rounded-xl border border-forest-100 bg-white py-2.5 pl-9 pr-3.5 text-sm text-forest-900 placeholder:text-forest-700/40 focus:border-forest-400 focus:outline-none focus:ring-2 focus:ring-forest-100"
            />
          </div>
          <Select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            options={[{ label: "All categories", value: "" }, ...(categories.data ?? []).map((c) => ({ label: c.name, value: c.name }))]} />
          {!isHead && (
            <Select value={associationId} onChange={(e) => { setAssociationId(e.target.value); setPage(1); }}
              options={[{ label: "All associations", value: "" }, ...(associations.data ?? []).map((c) => ({ label: c.name, value: c.id }))]} />
          )}
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            options={[{ label: "All statuses", value: "" }, ...["Active", "Overdue", "Pending", "Suspended"].map((s) => ({ label: s, value: s }))]} />
        </div>
      </Card>

      {error && <Notice tone="error">{error} <button className="ml-2 font-medium underline" onClick={reload}>Retry</button></Notice>}

      <Card className="p-0">
        <Table min={860} head={<><Th>Artisan</Th><Th>Category</Th>{!isHead && <Th>Association</Th>}<Th>Location</Th><Th>Status</Th><Th>Public listing</Th><Th /></>}>
          {rows.map((a) => (
            <tr key={a.id} className={rowCls}>
              <Td><p className="font-medium text-forest-900">{a.name}</p><p className="text-xs text-forest-700/50">{a.ref}</p></Td>
              <Td className="text-forest-700/80">{a.category}</Td>
              {!isHead && <Td className="text-forest-700/80">{a.association}</Td>}
              <Td className="text-forest-700/80">{a.area}, {a.town}</Td>
              <Td><Badge status={a.status} /></Td>
              <Td className={isListed(a) ? "text-fresh-600" : "text-forest-700/50"}>{isListed(a) ? "Visible" : "Hidden"}</Td>
              <Td className="text-right"><Link to={`${base}/artisans/${a.id}`} className="font-medium text-forest-600 hover:underline">View</Link></Td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={7} className="px-5 py-12 text-center text-forest-700/60">
              {loading ? "Loading..." : filtered ? "No artisans match these filters." : "No artisans have been registered yet."}
            </td></tr>
          )}
        </Table>
      </Card>

      {(data?.total ?? 0) > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm text-forest-700/70">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button variant="secondary" size="sm" disabled={page >= totalPages || loading} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}