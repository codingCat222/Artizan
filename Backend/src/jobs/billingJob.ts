import { runBillingCheck } from "../modules/billing/billing.service";

export async function billingJob() {
    try {
        const r = await runBillingCheck();
        if (r.skipped) console.log("[jobs] Billing check already ran today, skipping.");
        else console.log(`[jobs] Billing check: ${r.invoices} invoices, ${r.hidden} hidden, ${r.reminders} reminders.`);
    } catch (err) {
        console.error("[jobs] Billing check failed:", err);
    }
}