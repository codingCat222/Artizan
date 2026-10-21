import { useState } from "react";
import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import { rowCls, Table, Td, Th } from "../../components/ui/Table";
import { useStore } from "../../store/AppStore";

export default function AuditLogsPage() {
  const { audit } = useStore();
  const [q, setQ] = useState("");
  const rows = audit.filter((a) => `${a.actor} ${a.action} ${a.target}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-6">
      <PageHeader title="Audit Logs" subtitle="Significant administrative and financial actions" />
      <Card>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by actor, action or record..."
          className="w-full rounded-xl border border-forest-100 px-3.5 py-2.5 text-sm focus:border-forest-400 focus:outline-none focus:ring-2 focus:ring-forest-100 sm:w-96" />
      </Card>
      <Card className="p-0">
        <Table min={640} head={<><Th>Time</Th><Th>Actor</Th><Th>Action</Th><Th>Affected record</Th></>}>
          {rows.map((a) => (
            <tr key={a.id} className={rowCls}>
              <Td className="whitespace-nowrap text-forest-700/60">{a.timestamp}</Td>
              <Td className="font-medium text-forest-900">{a.actor}</Td>
              <Td className="text-forest-800">{a.action}</Td>
              <Td className="text-forest-700/70">{a.target}</Td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={4} className="px-5 py-10 text-center text-forest-700/60">No matching entries.</td></tr>}
        </Table>
      </Card>
    </div>
  );
}
