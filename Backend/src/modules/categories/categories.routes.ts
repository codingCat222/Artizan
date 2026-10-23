import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import * as controller from "./categories.controller";
import { categoryStatusSchema, createCategorySchema, updateCategorySchema } from "./categories.schema";

const router = Router();

router.use(authenticate);

// Heads need the list to register artisans; only admins may change it.
router.get("/", authorize("ADMIN", "SUPER_ADMIN", "ASSOCIATION_HEAD"), controller.list);
router.post("/", authorize("ADMIN", "SUPER_ADMIN"), validate(createCategorySchema), controller.create);
router.put("/:id", authorize("ADMIN", "SUPER_ADMIN"), validate(updateCategorySchema), controller.update);
router.patch("/:id/status", authorize("ADMIN", "SUPER_ADMIN"), validate(categoryStatusSchema), controller.setStatus);

export default router;