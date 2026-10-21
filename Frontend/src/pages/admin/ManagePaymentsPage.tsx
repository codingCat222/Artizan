import { useMemo, useState } from "react";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import Confirm from "../../components/ui/Confirm";
import PageHeader from "../../components/ui/PageHeader";
import Select from "../../components/ui/Select";
import { rowCls, Table, Td, Th } from "../../components/ui/Table";
import { naira } from "../../lib/format";
import { Payment } from "../../types/entities";
import { useStore } from "../../store/AppStore";
import { useAuth } from "../../store/AuthContext";
import { useScope } from "../../store/useScope";

/** Shared by admin, super admin and association head (scoped). */
export default function ManagePaymentsPage() {
  const { refundPayment } = useStore();
  const { session } = useAuth();
  const scope = useScope();
  const [status, setStatus] = useState("");
  const [period, setPeriod] = useState("");
  const [refund, setRefund] = useState<Payment | null>(null);

  const periods = Array.from(new Set(scope.payments.map((p) => p.period)));
  const rows = useMemo(
    () => scope.payments.filter((p) => (!status || p.status === status) && (!period || p.period === period)),
    [scope.payments, status, period],
  );
  const sum = (st: Payment["status"]) => scope.payments.filter((p) => p.status === st).reduce((t, p) => t + p.amount, 0);

  const cards = [
    ["Collected", naira(sum("Paid")), "text-fresh-600"],
    ["Pending", naira(sum("Pending")), "text-gold-600"],
    ["Overdue", naira(sum("Overdue")), "text-red-600"],
    ["Failed", `${scope.payments.filter((p) => p.status === "Failed").length} transactions`, "text-red-600"],
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Payments" subtitle={scope.isHead ? `Fee payments for ${scope.association}` : "All facilitation fee transactions"} />
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {cards.map(([l, v, c]) => (
          <Card key={l} className="!p-5"><p className="text-sm text-forest-700/70">{l}</p><p className={`mt-1 text-xl font-bold ${c}`}>{v}</p></Card>
        ))}
      </div>
      <Card>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:w-2/3">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}
            options={[{ label: "All statuses", value: "" }, ...["Paid", "Pending", "Overdue", "Failed", "Refunded"].map((s) => ({ label: s, value: s }))]} />
          <Select value={period} onChange={(e) => setPeriod(e.target.value)}
            options={[{ label: "All periods", value: "" }, ...periods.map((s) => ({ label: s, value: s }))]} />
        </div>
      </Card>
      <Card className="p-0">
        <Table min={900} head={<><Th>Artisan</Th>{!scope.isHead && <Th>Association</Th>}<Th>Period</Th><Th>Amount</Th><Th>Gateway fee</Th><Th>Reference</Th><Th>Status</Th><Th>Date</Th>{!scope.isHead && <Th />}</>}>
          {rows.map((p) => (
            <tr key={p.id} className={rowCls}>
              <Td className="font-medium text-forest-900">{p.artisan}</Td>
              {!scope.isHead && <Td className="text-forest-700/70">{p.association}</Td>}
              <Td className="text-forest-700/80">{p.period}</Td>
              <Td>{naira(p.amount)}</Td>
              <Td className="text-forest-700/60">{p.gatewayFee ? naira(p.gatewayFee) : "—"}</Td>
              <Td className="text-forest-700/60">{p.reference}</Td>
              <Td><Badge status={p.status} /></Td>
              <Td className="text-forest-700/60">{p.date}</Td>
              {!scope.isHead && (
                <Td className="text-right">
                  {p.status === "Paid" && <button className="text-sm font-medium text-forest-600 hover:underline" onClick={() => setRefund(p)}>Refund</button>}
                </Td>
              )}
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={9} className="px-5 py-12 text-center text-forest-700/60">No payments match these filters.</td></tr>}
        </Table>
      </Card>
      <Confirm open={!!refund} danger title="Refund this payment?"
        message={`${refund ? naira(refund.amount) : ""} paid by ${refund?.artisan} (${refund?.reference}) will be marked as refunded and recorded in the audit log.`}
        confirmLabel="Refund" onCancel={() => setRefund(null)}
        onConfirm={() => { if (refund) refundPayment(refund.id, session?.name ?? "Staff"); setRefund(null); }} />
    </div>
  );
}
