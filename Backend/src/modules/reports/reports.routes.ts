import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import * as controller from "./reports.controller";

const router = Router();

// Heads get the same reports, automatically limited to their own association.
router.use(authenticate, authorize("ADMIN", "SUPER_ADMIN", "ASSOCIATION_HEAD"));

router.get("/payments", controller.payments);
router.get("/payments/export", controller.paymentsCsv);

export default router;