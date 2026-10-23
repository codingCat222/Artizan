import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import * as c from "./artisans.controller";
import {
    artisanIdSchema,
    artisanStatusSchema,
    artisanVerificationSchema,
    createArtisanSchema,
    listArtisansSchema,
    updateArtisanSchema,
} from "./artisans.schema";

const router = Router();

// Association heads are limited to their own association inside the service (see scopeWhere).
router.use(authenticate, authorize("ADMIN", "SUPER_ADMIN", "ASSOCIATION_HEAD"));

router.get("/", validate(listArtisansSchema), c.list);
router.post("/", validate(createArtisanSchema), c.create);
router.get("/:id", validate(artisanIdSchema), c.get);
router.put("/:id", validate(updateArtisanSchema), c.update);
router.patch("/:id/status", validate(artisanStatusSchema), c.setStatus);
router.patch("/:id/verification", validate(artisanVerificationSchema), c.setVerification);
router.post("/:id/require-password-reset", validate(artisanIdSchema), c.requirePasswordReset);
router.post("/:id/resend-activation", validate(artisanIdSchema), c.resendActivation);

export default router;