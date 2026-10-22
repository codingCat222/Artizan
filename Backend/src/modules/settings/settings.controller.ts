import { asyncHandler } from "../../utils/asyncHandler";
import { getActor } from "../audit/audit.service";
import * as settingsService from "./settings.service";

export const get = asyncHandler(async (_req, res) => {
    res.json({ settings: await settingsService.getSettings() });
});

export const update = asyncHandler(async (req, res) => {
    const actor = await getActor(req.user!.sub);
    res.json({ settings: await settingsService.updateSettings(req.body, actor) });
});