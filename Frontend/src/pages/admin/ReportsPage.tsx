import { Download } from "lucide-react";
import { useState } from "react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Notice from "../../components/ui/Notice";
import PageHeader from "../../components/ui/PageHeader";
import Select from "../../components/ui/Select";
import { rowCls, Table, Td, Th } from "../../components/ui/Table";
import { naira } from "../../lib/format";
import { errorMessage, useApi } from "../../lib/useApi";
import { Summary, paymentsApi } from "../../services/payments";
import { settingsApi } from "../../services/settings";
import { useAuth } from "../../store/AuthContext";

/** Financial & operational reports (FRD 6.5). Shared by staff; the server limits heads to their association. */
export default function ReportsPage() {
  const { session } = useAuth();
  const isHead = session?.role === "ASSOCIATION_HEAD";
  const [period, setPeriod] = useState("");
  const [exportErr, setExportErr] = useState("");
  const report = useApi(() => paymentsApi.report(period), [period]);
  const settings = useApi(settingsApi.get);

  const r = report.data;
  const basis = settings.data?.revenueBasis ?? "gross";
  const s: Summary = r?.summary ?? { due: 0, paid: 0, pending: 0, failed: 0, overdue: 0, refunded: 0, fees: 0, net: 0 };
  const revenue = basis === "gross" ? s.paid : s.net;

  const exportCsv = async () => {
    setExportErr("");
    try { await paymentsApi.exportCsv(period); } catch (e) { setExportErr(errorMessage(e)); }
  };

  const stat = (l: string, v: number, tone = "text-forest-900") => (
    <Card key={l} className="!p-5"><p className="text-sm text-forest-700/70">{l}</p><p className={`mt-1 text-xl font-bold ${tone}`}>{naira(v)}</p></Card>
  );

  const table = (title: string, data: ({ name: string } & Summary)[]) => (
    <Card className="p-0">
      <div className="px-6 pt-5"><h3 className="font-semibold text-forest-900">{title}</h3></div>
      <Table min={820} head={<><Th>{title.replace("By ", "")}</Th><Th>Due</Th><Th>Paid</Th><Th>Pending</Th><Th>Failed</Th><Th>Overdue</Th><Th>Refunded</Th><Th>Gateway fees</Th></>}>
        {data.map((x) => (
          <tr key={x.name} className={rowCls}>
            <Td className="font-medium text-forest-900">{x.name}</Td><Td>{naira(x.due)}</Td><Td className="text-fresh-600">{naira(x.paid)}</Td>
            <Td>{naira(x.pending)}</Td><Td>{naira(x.failed)}</Td><Td className="text-red-600">{naira(x.overdue)}</Td><Td>{naira(x.refunded)}</Td><Td>{naira(x.fees)}</Td>
          </tr>
        ))}
        {data.length === 0 && <tr><td colSpan={8} className="px-5 py-8 text-center text-forest-700/60">{report.loading ? "Loading..." : "Nothing to report yet."}</td></tr>}
      </Table>
    </Card>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={isHead ? "Association Reports" : "Reports"}
        subtitle={isHead ? `Revenue and payments for ${session?.association ?? "your association"}` : "Platform-wide financial and operational reports"}
        actions={<Button variant="secondary" onClick={exportCsv}><Download size={15} /> Export CSV</Button>}
      />
      {report.error && <Notice tone="error">{report.error} <button className="ml-2 font-medium underline" onClick={report.reload}>Retry</button></Notice>}
      {exportErr && <Notice tone="error">{exportErr}</Notice>}
      <div className="sm:w-60">
        <Select value={period} onChange={(e) => setPeriod(e.target.value)}
          options={[{ label: "All periods", value: "" }, ...(r?.periods ?? []).map((p) => ({ label: p, value: p }))]} />
      </div>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stat(`Revenue (${basis})`, revenue, "text-fresh-600")}
        {stat("Amount due", s.due)}
        {stat("Pending", s.pending, "text-gold-600")}
        {stat("Overdue", s.overdue, "text-red-600")}
        {stat("Failed", s.failed)}
        {stat("Refunded", s.refunded)}
        {stat("Gateway charges", s.fees)}
        {stat("Net after charges", s.net)}
      </div>
      <Notice tone="info">
        Revenue is shown as {basis === "gross" ? "gross collections" : "net collections after gateway charges"}. The accounting
        definition is set by the super administrator in Platform Settings.
      </Notice>
      {table("By Period", r?.byPeriod ?? [])}
      {table("By Association", r?.byAssociation ?? [])}
    </div>
  );
}