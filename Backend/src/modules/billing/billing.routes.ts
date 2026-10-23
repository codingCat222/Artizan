import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { asyncHandler } from "../../utils/asyncHandler";
import { getActor, recordAudit } from "../audit/audit.service";
import { runBillingCheck } from "./billing.service";

const router = Router();

/** Super administrator can trigger the billing check immediately (it otherwise runs daily). */
router.post(
    "/run",
    authenticate,
    authorize("SUPER_ADMIN"),
    asyncHandler(async (req, res) => {
        const actor = await getActor(req.user!.sub);
        const result = await runBillingCheck({ force: true });
        await recordAudit(actor, "Ran billing check", `${result.invoices} invoices, ${result.hidden} hidden, ${result.reminders} reminders`);
        res.json(result);
    }),
);

export default router;