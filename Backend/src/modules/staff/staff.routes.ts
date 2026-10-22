import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import * as controller from "./staff.controller";
import { createStaffSchema, staffIdSchema, staffStatusSchema } from "./staff.schema";

const router = Router();

// Fine-grained rules (who may manage whom) live in staff.service.ts.
router.use(authenticate, authorize("ADMIN", "SUPER_ADMIN"));

router.get("/", controller.list);
router.post("/", validate(createStaffSchema), controller.create);
router.patch("/:id/status", validate(staffStatusSchema), controller.setStatus);
router.delete("/:id", validate(staffIdSchema), controller.remove);

export default router;