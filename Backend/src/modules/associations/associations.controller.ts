import { asyncHandler } from "../../utils/asyncHandler";
import { getActor } from "../audit/audit.service";
import * as service from "./associations.service";

export const list = asyncHandler(async (_req, res) => {
    res.json({ associations: await service.listAssociations() });
});

export const create = asyncHandler(async (req, res) => {
    const actor = await getActor(req.user!.sub);
    res.status(201).json({ association: await service.createAssociation(req.body, actor) });
});

export const update = asyncHandler(async (req, res) => {
    const actor = await getActor(req.user!.sub);
    res.json({ association: await service.updateAssociation(req.params.id, req.body, actor) });
});

export const setStatus = asyncHandler(async (req, res) => {
    const actor = await getActor(req.user!.sub);
    res.json({ association: await service.setAssociationStatus(req.params.id, req.body.status, actor) });
});