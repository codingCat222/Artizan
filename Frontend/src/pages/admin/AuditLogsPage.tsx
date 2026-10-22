import { useEffect, useState } from "react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Notice from "../../components/ui/Notice";
import PageHeader from "../../components/ui/PageHeader";
import { rowCls, Table, Td, Th } from "../../components/ui/Table";
import { useApi } from "../../lib/useApi";
import { auditApi } from "../../services/audit";

const PAGE_SIZE = 25;
const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default function AuditLogsPage() {
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Wait for the person to stop typing before hitting the server.
  useEffect(() => {
    const t = setTimeout(() => { setSearch(q.trim()); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const { data, loading, error, reload } = useApi(() => auditApi.list({ q: search, page, pageSize: PAGE_SIZE }), [search, page]);
  const rows = data?.items ?? [];
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <PageHeader title="Audit Logs" subtitle="Significant administrative and financial actions" />
      <Card>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by actor, action or record..."
          className="w-full rounded-xl border border-forest-100 px-3.5 py-2.5 text-sm focus:border-forest-400 focus:outline-none focus:ring-2 focus:ring-forest-100 sm:w-96" />
      </Card>
      {error && <Notice tone="error">{error} <button className="ml-2 font-medium underline" onClick={reload}>Retry</button></Notice>}
      <Card className="p-0">
        <Table min={640} head={<><Th>Time</Th><Th>Actor</Th><Th>Action</Th><Th>Affected record</Th></>}>
          {rows.map((a) => (
            <tr key={a.id} className={rowCls}>
              <Td className="whitespace-nowrap text-forest-700/60">{fmt(a.timestamp)}</Td>
              <Td className="font-medium text-forest-900">{a.actor}</Td>
              <Td className="text-forest-800">{a.action}</Td>
              <Td className="text-forest-700/70">{a.target}</Td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={4} className="px-5 py-10 text-center text-forest-700/60">{loading ? "Loading..." : "No matching entries."}</td></tr>}
        </Table>
      </Card>
      {(data?.total ?? 0) > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm text-forest-700/70">
          <span>Page {page} of {totalPages} · {data?.total} entries</span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button variant="secondary" size="sm" disabled={page >= totalPages || loading} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}