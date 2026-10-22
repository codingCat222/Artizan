import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import * as controller from "./dashboard.controller";

const router = Router();

router.get("/", authenticate, authorize("ADMIN", "SUPER_ADMIN"), controller.summary);

export default router;