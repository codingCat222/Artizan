import { asyncHandler } from "../../utils/asyncHandler";
import { requesterFrom } from "../../utils/requester";
import * as dashboardService from "./dashboard.service";

export const summary = asyncHandler(async (_req, res) => {
    res.json(await dashboardService.getPlatformSummary());
});

export const association = asyncHandler(async (req, res) => {
    res.json(await dashboardService.getAssociationSummary(await requesterFrom(req)));
});