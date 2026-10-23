import { useState } from "react";
import { naira } from "../lib/format";
import { errorMessage } from "../lib/useApi";
import { meApi } from "../services/me";
import Button from "./ui/Button";
import Modal from "./ui/Modal";
import Notice from "./ui/Notice";

interface Props {
  open: boolean;
  onClose: () => void;
  fee: number;
  periodLabel: string;
  /** "none" means no gateway is configured on the server (production without keys). */
  gatewayMode: "paystack" | "mock" | "none";
}

/**
 * Starts a payment. Confirmation never happens here: after checkout the gateway sends the artisan back to
 * the Payments page, which asks our server to verify with the gateway before anything is marked paid.
 */
export default function PayModal({ open, onClose, fee, periodLabel, gatewayMode }: Props) {
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  const close = () => { setError(""); setStarting(false); onClose(); };

  const start = async () => {
    setError("");
    setStarting(true);
    try {
      const { authorizationUrl } = await meApi.initializePayment();
      window.location.assign(authorizationUrl); // leave for the provider's hosted checkout
    } catch (e) {
      setError(errorMessage(e));
      setStarting(false);
    }
  };

  return (
    <Modal open={open} onClose={close} title="Pay facilitation fee" subtitle={`${periodLabel} fee`}>
      <div className="space-y-4">
        {error && <Notice tone="error">{error}</Notice>}
        {gatewayMode === "none" && <Notice tone="warn">Online payments aren't available right now. Please contact your association.</Notice>}
        {gatewayMode === "mock" && <Notice tone="info">Test mode: you'll be taken to a practice checkout where you choose whether the payment succeeds.</Notice>}
        <div className="rounded-xl bg-forest-50 p-4">
          <p className="text-sm text-forest-700/70">Amount due</p>
          <p className="text-3xl font-bold text-forest-900">{naira(fee)}</p>
        </div>
        <p className="text-xs text-forest-700/60">You'll be redirected to our payment partner to complete the payment securely. We never see your card details.</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={close}>Cancel</Button>
          <Button onClick={start} disabled={starting || gatewayMode === "none"}>{starting ? "Redirecting..." : "Continue to payment"}</Button>
        </div>
      </div>
    </Modal>
  );
}