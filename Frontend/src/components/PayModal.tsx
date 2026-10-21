import { useState } from "react";
import { currentPeriod } from "../lib/billing";
import { naira } from "../lib/format";
import { useStore } from "../store/AppStore";
import { Payment } from "../types/entities";
import Button from "./ui/Button";
import Modal from "./ui/Modal";
import Notice from "./ui/Notice";

type Step = "confirm" | "gateway" | "verifying" | "paid" | "failed";

export default function PayModal({ artisanId, open, onClose }: { artisanId: string; open: boolean; onClose: () => void }) {
  const { settings, beginPayment, verifyPayment } = useStore();
  const [step, setStep] = useState<Step>("confirm");
  const [pay, setPay] = useState<Payment | null>(null);
  const [dup, setDup] = useState(false);
  const period = currentPeriod(settings);

  const reset = () => { setStep("confirm"); setPay(null); setDup(false); onClose(); };

  const start = () => {
    const p = beginPayment(artisanId);
    if (!p) return;
    setPay(p);
    setStep("gateway");
  };

  // The browser coming back from the gateway is NOT proof of payment: we verify server-side first.
  const finish = (outcome: "success" | "failed") => {
    setStep("verifying");
    setTimeout(() => {
      const r = verifyPayment(pay!.reference, outcome);
      setStep(r === "failed" ? "failed" : "paid");
    }, 1200);
  };

  return (
    <Modal open={open} onClose={reset} title="Pay facilitation fee" subtitle={`${period.label} · reference ${pay?.reference ?? "generated on payment"}`}>
      {step === "confirm" && (
        <div className="space-y-4">
          <div className="rounded-xl bg-forest-50 p-4">
            <p className="text-sm text-forest-700/70">Amount due</p>
            <p className="text-3xl font-bold text-forest-900">{naira(settings.fee)}</p>
          </div>
          <p className="text-xs text-forest-700/60">You'll be redirected to our payment partner to complete the payment securely.</p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={reset}>Cancel</Button>
            <Button onClick={start}>Continue to payment</Button>
          </div>
        </div>
      )}

      {step === "gateway" && (
        <div className="space-y-4">
          <Notice tone="info">Demo payment gateway. In production this step is the provider's hosted checkout.</Notice>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button onClick={() => finish("success")}>Simulate successful payment</Button>
            <Button variant="danger" onClick={() => finish("failed")}>Simulate failed payment</Button>
          </div>
          <Button variant="ghost" className="w-full" onClick={reset}>Close without paying (stays pending)</Button>
        </div>
      )}

      {step === "verifying" && (
        <div className="py-10 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-forest-100 border-t-forest-700" />
          <p className="mt-4 font-semibold text-forest-900">Verifying your payment…</p>
          <p className="text-sm text-forest-700/60">Please don't close this window.</p>
        </div>
      )}

      {step === "paid" && (
        <div className="space-y-4">
          <Notice tone="success">Payment verified. Thank you — your {period.label} fee is paid and a confirmation email has been sent.</Notice>
          {dup && <Notice tone="info">Duplicate gateway notification ignored. No second payment was recorded.</Notice>}
          <div className="flex items-center justify-between gap-2">
            <button className="text-xs text-forest-600 hover:underline" onClick={() => { verifyPayment(pay!.reference, "success"); setDup(true); }}>
              Demo: resend the same gateway notification
            </button>
            <Button onClick={reset}>Done</Button>
          </div>
        </div>
      )}

      {step === "failed" && (
        <div className="space-y-4">
          <Notice tone="error">The payment could not be verified, so nothing was charged to your fee record. You can try again.</Notice>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={reset}>Close</Button>
            <Button onClick={() => setStep("confirm")}>Try again</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
