import { Router } from "express";
import * as authController from "./auth.controller";
import { authenticate } from "../../middleware/authenticate";
import { authRateLimit } from "../../middleware/rateLimit";
import { validate } from "../../middleware/validate";
import {
    activateAccountSchema,
    changePasswordSchema,
    forgotPasswordSchema,
    loginSchema,
    resetPasswordSchema,
} from "./auth.schema";

const router = Router();

router.post("/login", authRateLimit, validate(loginSchema), authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);

router.post(
    "/forgot-password",
    authRateLimit,
    validate(forgotPasswordSchema),
    authController.forgotPassword
);
router.post("/reset-password", authRateLimit, validate(resetPasswordSchema), authController.resetPassword);
router.post("/activate", authRateLimit, validate(activateAccountSchema), authController.activateAccount);

router.post(
    "/change-password",
    authenticate,
    authRateLimit,
    validate(changePasswordSchema),
    authController.changePassword
);
router.get("/me", authenticate, authController.me);

export default router;