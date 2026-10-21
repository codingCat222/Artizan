import { Download } from "lucide-react";
import { useMemo, useState } from "react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Notice from "../../components/ui/Notice";
import PageHeader from "../../components/ui/PageHeader";
import Select from "../../components/ui/Select";
import { rowCls, Table, Td, Th } from "../../components/ui/Table";
import { naira } from "../../lib/format";
import { Payment } from "../../types/entities";
import { useStore } from "../../store/AppStore";
import { useScope } from "../../store/useScope";

function summarise(list: Payment[]) {
  const by = (st: Payment["status"]) => list.filter((p) => p.status === st);
  const amt = (l: Payment[]) => l.reduce((t, p) => t + p.amount, 0);
  const paid = by("Paid");
  const fees = paid.reduce((t, p) => t + p.gatewayFee, 0);
  return {
    due: amt(list), paid: amt(paid), pending: amt(by("Pending")), failed: amt(by("Failed")),
    overdue: amt(by("Overdue")), refunded: amt(by("Refunded")), fees, net: amt(paid) - fees,
  };
}

/** Financial & operational reports (FRD 6.5). Shared by staff; heads see only their association. */
export default function ReportsPage() {
  const { settings, associations } = useStore();
  const scope = useScope();
  const [period, setPeriod] = useState("");
  const periods = Array.from(new Set(scope.payments.map((p) => p.period)));
  const rows = useMemo(() => scope.payments.filter((p) => !period || p.period === period), [scope.payments, period]);
  const s = summarise(rows);
  const revenue = settings.revenueBasis === "gross" ? s.paid : s.net;

  const byAssoc = associations
    .filter((a) => !scope.isHead || a.name === scope.association)
    .map((a) => ({ name: a.name, ...summarise(rows.filter((p) => p.association === a.name)) }));
  const byPeriod = periods.map((p) => ({ name: p, ...summarise(scope.payments.filter((x) => x.period === p)) }));

  const exportCsv = () => {
    const head = "Artisan,Association,Period,Amount,Gateway fee,Reference,Status,Date";
    const body = rows.map((p) => [p.artisan, p.association, p.period, p.amount, p.gatewayFee, p.reference, p.status, p.date].join(","));
    const url = URL.createObjectURL(new Blob([[head, ...body].join("\n")], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = "payments-report.csv"; a.click(); URL.revokeObjectURL(url);
  };

  const stat = (l: string, v: number, tone = "text-forest-900") => (
    <Card key={l} className="!p-5"><p className="text-sm text-forest-700/70">{l}</p><p className={`mt-1 text-xl font-bold ${tone}`}>{naira(v)}</p></Card>
  );

  const table = (title: string, data: ({ name: string } & ReturnType<typeof summarise>)[]) => (
    <Card className="p-0">
      <div className="px-6 pt-5"><h3 className="font-semibold text-forest-900">{title}</h3></div>
      <Table min={820} head={<><Th>{title.replace("By ", "")}</Th><Th>Due</Th><Th>Paid</Th><Th>Pending</Th><Th>Failed</Th><Th>Overdue</Th><Th>Refunded</Th><Th>Gateway fees</Th></>}>
        {data.map((r) => (
          <tr key={r.name} className={rowCls}>
            <Td className="font-medium text-forest-900">{r.name}</Td><Td>{naira(r.due)}</Td><Td className="text-fresh-600">{naira(r.paid)}</Td>
            <Td>{naira(r.pending)}</Td><Td>{naira(r.failed)}</Td><Td className="text-red-600">{naira(r.overdue)}</Td><Td>{naira(r.refunded)}</Td><Td>{naira(r.fees)}</Td>
          </tr>
        ))}
      </Table>
    </Card>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={scope.isHead ? "Association Reports" : "Reports"}
        subtitle={scope.isHead ? `Revenue and payments for ${scope.association}` : "Platform-wide financial and operational reports"}
        actions={<Button variant="secondary" onClick={exportCsv}><Download size={15} /> Export CSV</Button>}
      />
      <div className="sm:w-60">
        <Select value={period} onChange={(e) => setPeriod(e.target.value)}
          options={[{ label: "All periods", value: "" }, ...periods.map((p) => ({ label: p, value: p }))]} />
      </div>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stat(`Revenue (${settings.revenueBasis})`, revenue, "text-fresh-600")}
        {stat("Amount due", s.due)}
        {stat("Pending", s.pending, "text-gold-600")}
        {stat("Overdue", s.overdue, "text-red-600")}
        {stat("Failed", s.failed)}
        {stat("Refunded", s.refunded)}
        {stat("Gateway charges", s.fees)}
        {stat("Net after charges", s.net)}
      </div>
      <Notice tone="info">
        Revenue is shown as {settings.revenueBasis === "gross" ? "gross collections" : "net collections after gateway charges"}. The accounting
        definition is set by the super administrator in Platform Settings.
      </Notice>
      {table("By Period", byPeriod)}
      {table("By Association", byAssoc)}
    </div>
  );
}
