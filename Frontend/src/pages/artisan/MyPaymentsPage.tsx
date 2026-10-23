import { Banknote } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PayModal from "../../components/PayModal";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Notice from "../../components/ui/Notice";
import PageHeader from "../../components/ui/PageHeader";
import { fmtDate, naira } from "../../lib/format";
import { errorMessage, useApi } from "../../lib/useApi";
import { meApi } from "../../services/me";

type Banner = { tone: "success" | "error" | "info"; text: string } | null;

export default function MyPaymentsPage() {
  const { data: b, loading, error, reload } = useApi(meApi.billing);
  const [params, setParams] = useSearchParams();
  const [paying, setPaying] = useState(false);
  const [banner, setBanner] = useState<Banner>(null);
  const [verifying, setVerifying] = useState(false);
  const handled = useRef<string | null>(null);

  const verify = async (reference: string) => {
    setVerifying(true);
    try {
      const r = await meApi.verifyPayment(reference);
      if (r.outcome === "paid" || r.outcome === "duplicate")
        setBanner({ tone: "success", text: "Payment verified. Thank you, your fee is paid and a confirmation email has been sent." });
      else if (r.outcome === "failed")
        setBanner({ tone: "error", text: "The payment could not be verified, so nothing was recorded as paid. You can try again." });
      else setBanner({ tone: "info", text: "We haven't received confirmation of this payment yet. It can take a minute. Check again shortly." });
    } catch (e) {
      setBanner({ tone: "error", text: errorMessage(e) });
    } finally {
      setVerifying(false);
      reload();
    }
  };

  // Returning from the provider's checkout: ask our server (not the browser) whether it was paid.
  useEffect(() => {
    const ref = params.get("reference");
    if (!ref || handled.current === ref) return;
    handled.current = ref;
    setParams({}, { replace: true });
    void verify(ref);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  if (!b)
    return (
      <div className="space-y-4">
        <PageHeader title="Payments" subtitle="Your facilitation fee obligations and history" />
        {error ? <Notice tone="error">{error} <button className="ml-2 font-medium underline" onClick={reload}>Retry</button></Notice> : <p className="text-sm text-forest-700/70">{loading ? "Loading..." : ""}</p>}
      </div>
    );

  const period = b.owes ? b.period : b.nextPeriod;
  const lastPending = b.payments.find((p) => p.status === "Pending" && p.reference.startsWith("PAY-"));

  return (
    <div className="space-y-6">
      <PageHeader title="Payments" subtitle="Your facilitation fee obligations and history" />
      {verifying && <Notice tone="info">Verifying your payment…</Notice>}
      {banner && <Notice tone={banner.tone}>{banner.text}{banner.tone === "info" && lastPending && (
        <button className="ml-2 font-medium underline" onClick={() => verify(lastPending.reference)}>Check again</button>
      )}</Notice>}

      <Card className="flex flex-wrap items-center justify-between gap-4 bg-forest-700 text-white">
        <div>
          <p className="text-sm text-forest-100/80">{period.label} Fee · {b.owes ? "Payment due" : "Next obligation"}</p>
          <p className="mt-1 text-3xl font-bold">{naira(b.fee)}</p>
          <p className="mt-1 text-sm text-forest-100/70">
            Due {fmtDate(period.due)} · grace period ends {fmtDate(period.graceEnd)}
          </p>
        </div>
        {b.owes ? (
          <Button className="!bg-mint !text-forest-900 hover:!bg-forest-300" onClick={() => setPaying(true)}>
            <Banknote size={16} /> Pay Now
          </Button>
        ) : (
          <span className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold">You're up to date</span>
        )}
      </Card>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead>
              <tr className="border-b border-forest-100 text-forest-700/60">
                <th className="px-5 py-3 font-medium">Period</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Reference</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {b.payments.map((p) => (
                <tr key={p.id} className="border-b border-forest-50 last:border-0">
                  <td className="px-5 py-3 font-medium text-forest-900">{p.period}</td>
                  <td className="px-5 py-3 text-forest-700/80">{naira(p.amount)}</td>
                  <td className="px-5 py-3 text-forest-700/60">{p.reference}</td>
                  <td className="px-5 py-3"><Badge status={p.status} /></td>
                  <td className="px-5 py-3 text-forest-700/60">{fmtDate(p.date)}</td>
                  <td className="px-5 py-3 text-right">
                    {b.owes && p.period === b.period.label && (p.status === "Failed" || p.status === "Pending" || p.status === "Overdue") && p.reference.startsWith("PAY-") && (
                      <button className="text-sm font-medium text-forest-600 hover:underline" onClick={() => setPaying(true)}>Retry</button>
                    )}
                  </td>
                </tr>
              ))}
              {b.payments.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-forest-700/60">No payment history yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      <PayModal open={paying} onClose={() => setPaying(false)} fee={b.fee} periodLabel={b.period.label} gatewayMode={b.gatewayMode} />
    </div>
  );
}