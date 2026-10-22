import { asyncHandler } from "../../utils/asyncHandler";
import * as dashboardService from "./dashboard.service";

export const summary = asyncHandler(async (_req, res) => {
    res.json(await dashboardService.getPlatformSummary());
});