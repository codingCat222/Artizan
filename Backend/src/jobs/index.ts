import cron from "node-cron";
import { env } from "../config/env";
import { billingJob } from "./billingJob";

/** Starts scheduled work. Runs at 06:00 Lagos time daily, plus a catch-up shortly after boot. */
export function startJobs() {
    if (!env.jobsEnabled) {
        console.log("[jobs] Disabled (JOBS_ENABLED=false).");
        return;
    }
    cron.schedule("0 6 * * *", billingJob, { timezone: "Africa/Lagos" });
    // If the server was down at 06:00, this still runs today's check (the once-a-day marker prevents repeats).
    setTimeout(billingJob, 30_000);
    console.log("[jobs] Billing check scheduled for 06:00 Africa/Lagos.");
}