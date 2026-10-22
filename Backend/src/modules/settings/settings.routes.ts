import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import * as controller from "./settings.controller";
import { updateSettingsSchema } from "./settings.schema";

const router = Router();

// Anyone signed in may read the policies (fee, due day...). Only the super admin may change them.
router.get("/", authenticate, controller.get);
router.put("/", authenticate, authorize("SUPER_ADMIN"), validate(updateSettingsSchema), controller.update);

export default router;