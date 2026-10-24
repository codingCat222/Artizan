import { Router } from "express";
import { publicRateLimit } from "../../middleware/rateLimit";
import { validate } from "../../middleware/validate";
import * as controller from "./public.controller";
import { publicProfileSchema, publicSearchSchema } from "./public.schema";

const router = Router();

// No login required, so everything here is rate limited and returns whitelisted fields only.
router.use(publicRateLimit);

router.get("/filters", controller.filters);
router.get("/artisans", validate(publicSearchSchema), controller.search);
router.get("/artisans/:id", validate(publicProfileSchema), controller.profile);

export default router;