import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Notice from "../../components/ui/Notice";
import PageHeader from "../../components/ui/PageHeader";
import { errorMessage } from "../../lib/useApi";
import { meApi } from "../../services/me";

/**
 * Practice checkout, used only while the server runs without a Paystack key (development).
 * It plays the part of the provider's hosted page, then returns to Payments where the server verifies.
 */
export default function MockCheckoutPage() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const reference = params.get("reference");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    const finish = async (outcome: "success" | "failed") => {
        if (!reference) return;
        setBusy(true);
        setError("");
        try {
            await meApi.mockComplete(reference, outcome);
            navigate(`/artisan/payments?reference=${encodeURIComponent(reference)}`, { replace: true });
        } catch (e) {
            setError(errorMessage(e));
            setBusy(false);
        }
    };

    if (!reference) return <Notice tone="error">Missing payment reference.</Notice>;

    return (
        <div className="mx-auto max-w-lg space-y-6">
            <PageHeader title="Practice checkout" subtitle={`Reference ${reference}`} />
            <Notice tone="info">
                This stands in for the payment provider's page and only appears in test mode. Choose what should happen to this payment.
            </Notice>
            {error && <Notice tone="error">{error}</Notice>}
            <Card className="space-y-3">
                <Button className="w-full" disabled={busy} onClick={() => finish("success")}>Simulate successful payment</Button>
                <Button className="w-full" variant="danger" disabled={busy} onClick={() => finish("failed")}>Simulate failed payment</Button>
                <Button className="w-full" variant="ghost" disabled={busy} onClick={() => navigate("/artisan/payments")}>Close without paying</Button>
            </Card>
        </div>
    );
}