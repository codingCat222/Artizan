import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import * as controller from "./associations.controller";
import { associationStatusSchema, createAssociationSchema, updateAssociationSchema } from "./associations.schema";

const router = Router();

router.use(authenticate, authorize("ADMIN", "SUPER_ADMIN"));

router.get("/", controller.list);
router.post("/", validate(createAssociationSchema), controller.create);
router.put("/:id", validate(updateAssociationSchema), controller.update);
router.patch("/:id/status", validate(associationStatusSchema), controller.setStatus);

export default router;