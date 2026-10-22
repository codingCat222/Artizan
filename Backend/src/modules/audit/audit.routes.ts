import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import * as controller from "./audit.controller";
import { listAuditSchema } from "./audit.schema";

const router = Router();

router.get("/", authenticate, authorize("ADMIN", "SUPER_ADMIN"), validate(listAuditSchema), controller.list);

export default router;