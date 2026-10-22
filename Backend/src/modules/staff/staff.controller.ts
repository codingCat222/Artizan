import { Request } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { getActor } from "../audit/audit.service";
import * as staffService from "./staff.service";

async function requester(req: Request): Promise<staffService.Requester> {
    const actor = await getActor(req.user!.sub);
    return { id: req.user!.sub, name: actor.name, role: req.user!.role as staffService.Requester["role"] };
}

export const list = asyncHandler(async (_req, res) => {
    res.json({ staff: await staffService.listStaff() });
});

export const create = asyncHandler(async (req, res) => {
    res.status(201).json({ staff: await staffService.createStaff(await requester(req), req.body) });
});

export const setStatus = asyncHandler(async (req, res) => {
    res.json({ staff: await staffService.setStaffStatus(await requester(req), req.params.id, req.body.status) });
});

export const remove = asyncHandler(async (req, res) => {
    await staffService.deleteStaff(await requester(req), req.params.id);
    res.status(204).end();
});