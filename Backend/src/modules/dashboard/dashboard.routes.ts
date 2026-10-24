import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import * as controller from "./dashboard.controller";

const router = Router();

router.get("/", authenticate, authorize("ADMIN", "SUPER_ADMIN"), controller.summary);
// An association head's view is always limited to their own association (see requesterFrom).
router.get("/association", authenticate, authorize("ASSOCIATION_HEAD"), controller.association);

export default router;