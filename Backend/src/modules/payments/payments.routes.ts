import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import * as controller from "./payments.controller";
import { listPaymentsSchema, paymentIdSchema } from "./payments.schema";

const router = Router();

router.use(authenticate);

router.get("/", authorize("ADMIN", "SUPER_ADMIN", "ASSOCIATION_HEAD"), validate(listPaymentsSchema), controller.list);
router.post("/:id/refund", authorize("ADMIN", "SUPER_ADMIN"), validate(paymentIdSchema), controller.refund);

export default router;