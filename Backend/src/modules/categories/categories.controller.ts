import { asyncHandler } from "../../utils/asyncHandler";
import { getActor } from "../audit/audit.service";
import * as service from "./categories.service";

export const list = asyncHandler(async (_req, res) => {
    res.json({ categories: await service.listCategories() });
});

export const create = asyncHandler(async (req, res) => {
    const actor = await getActor(req.user!.sub);
    res.status(201).json({ category: await service.createCategory(req.body, actor) });
});

export const update = asyncHandler(async (req, res) => {
    const actor = await getActor(req.user!.sub);
    res.json({ category: await service.updateCategory(req.params.id, req.body, actor) });
});

export const setStatus = asyncHandler(async (req, res) => {
    const actor = await getActor(req.user!.sub);
    res.json({ category: await service.setCategoryStatus(req.params.id, req.body.status, actor) });
});