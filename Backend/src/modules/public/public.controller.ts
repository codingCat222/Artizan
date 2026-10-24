import { asyncHandler } from "../../utils/asyncHandler";
import { publicSearchQuery } from "./public.schema";
import * as service from "./public.service";

export const filters = asyncHandler(async (_req, res) => {
    res.json(await service.getFilters());
});

export const search = asyncHandler(async (req, res) => {
    // Empty strings from the search form mean "no filter".
    const raw = Object.fromEntries(Object.entries(req.query).filter(([, v]) => v !== ""));
    res.json(await service.searchArtisans(publicSearchQuery.parse(raw)));
});

export const profile = asyncHandler(async (req, res) => {
    res.json({ artisan: await service.getPublicProfile(req.params.id) });
});