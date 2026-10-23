import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import * as controller from "./me.controller";
import { mockCompleteSchema, referenceSchema } from "./me.schema";

const router = Router();

// Everything under /api/me is about the signed-in artisan and nobody else.
router.use(authenticate, authorize("ARTISAN"));

router.get("/billing", controller.billing);
router.post("/payments/initialize", controller.initializePayment);
router.post("/payments/verify", validate(referenceSchema), controller.verifyPayment);
router.post("/payments/mock-complete", validate(mockCompleteSchema), controller.mockComplete);

export default router;
