import { useState } from "react";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Confirm from "../../components/ui/Confirm";
import Notice from "../../components/ui/Notice";
import PageHeader from "../../components/ui/PageHeader";
import Select from "../../components/ui/Select";
import { rowCls, Table, Td, Th } from "../../components/ui/Table";
import { fmtDate, naira } from "../../lib/format";
import { errorMessage, useApi } from "../../lib/useApi";
import { PaymentDto, paymentsApi } from "../../services/payments";
import { useAuth } from "../../store/AuthContext";

const PAGE_SIZE = 25;

/** Shared by admin, super admin and association head. The server limits heads to their own association. */
export default function ManagePaymentsPage() {
  const { session } = useAuth();
  const isHead = session?.role === "ASSOCIATION_HEAD";
  const [status, setStatus] = useState("");
  const [period, setPeriod] = useState("");
  const [page, setPage] = useState(1);
  const [refund, setRefund] = useState<PaymentDto | null>(null);
  const [actionErr, setActionErr] = useState("");

  const { data, loading, error, reload } = useApi(() => paymentsApi.list({ status, period, page, pageSize: PAGE_SIZE }), [status, period, page]);
  const rows = data?.items ?? [];
  const totals = data?.totals;
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE));

  const cards: [string, string, string][] = [
    ["Collected", naira(totals?.collected ?? 0), "text-fresh-600"],
    ["Pending", naira(totals?.pending ?? 0), "text-gold-600"],
    ["Overdue", naira(totals?.overdue ?? 0), "text-red-600"],
    ["Failed", `${totals?.failedCount ?? 0} transactions`, "text-red-600"],
  ];

  const doRefund = async () => {
    const p = refund;
    setRefund(null);
    if (!p) return;
    setActionErr("");
    try {
      await paymentsApi.refund(p.id);
      reload();
    } catch (e) {
      setActionErr(errorMessage(e));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Payments" subtitle={isHead ? `Fee payments for ${session?.association ?? "your association"}` : "All facilitation fee transactions"} />
      {error && <Notice tone="error">{error} <button className="ml-2 font-medium underline" onClick={reload}>Retry</button></Notice>}
      {actionErr && <Notice tone="error">{actionErr}</Notice>}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {cards.map(([l, v, c]) => (
          <Card key={l} className="!p-5"><p className="text-sm text-forest-700/70">{l}</p><p className={`mt-1 text-xl font-bold ${c}`}>{v}</p></Card>
        ))}
      </div>
      <Card>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:w-2/3">
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            options={[{ label: "All statuses", value: "" }, ...["Paid", "Pending", "Overdue", "Failed", "Refunded"].map((s) => ({ label: s, value: s }))]} />
          <Select value={period} onChange={(e) => { setPeriod(e.target.value); setPage(1); }}
            options={[{ label: "All periods", value: "" }, ...(data?.periods ?? []).map((s) => ({ label: s, value: s }))]} />
        </div>
      </Card>
      <Card className="p-0">
        <Table min={900} head={<><Th>Artisan</Th>{!isHead && <Th>Association</Th>}<Th>Period</Th><Th>Amount</Th><Th>Gateway fee</Th><Th>Reference</Th><Th>Status</Th><Th>Date</Th>{!isHead && <Th />}</>}>
          {rows.map((p) => (
            <tr key={p.id} className={rowCls}>
              <Td className="font-medium text-forest-900">{p.artisan}</Td>
              {!isHead && <Td className="text-forest-700/70">{p.association}</Td>}
              <Td className="text-forest-700/80">{p.period}</Td>
              <Td>{naira(p.amount)}</Td>
              <Td className="text-forest-700/60">{p.gatewayFee ? naira(p.gatewayFee) : "—"}</Td>
              <Td className="text-forest-700/60">{p.reference}</Td>
              <Td><Badge status={p.status} /></Td>
              <Td className="text-forest-700/60">{fmtDate(p.date)}</Td>
              {!isHead && (
                <Td className="text-right">
                  {p.status === "Paid" && <button className="text-sm font-medium text-forest-600 hover:underline" onClick={() => setRefund(p)}>Refund</button>}
                </Td>
              )}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={9} className="px-5 py-12 text-center text-forest-700/60">
              {loading ? "Loading..." : status || period ? "No payments match these filters." : "No payments have been recorded yet."}
            </td></tr>
          )}
        </Table>
      </Card>
      {(data?.total ?? 0) > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm text-forest-700/70">
          <span>Page {page} of {totalPages} · {data?.total} payments</span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button variant="secondary" size="sm" disabled={page >= totalPages || loading} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}
      <Confirm open={!!refund} danger title="Refund this payment?"
        message={`${refund ? naira(refund.amount) : ""} paid by ${refund?.artisan} (${refund?.reference}) will be marked as refunded and recorded in the audit log.`}
        confirmLabel="Refund" onCancel={() => setRefund(null)} onConfirm={doRefund} />
    </div>
  );
}