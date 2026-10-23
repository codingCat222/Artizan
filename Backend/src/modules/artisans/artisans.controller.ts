import { asyncHandler } from "../../utils/asyncHandler";
import { requesterFrom } from "../../utils/requester";
import { listArtisansQuery } from "./artisans.schema";
import * as service from "./artisans.service";

export const list = asyncHandler(async (req, res) => {
    const filters = listArtisansQuery.parse(req.query);
    res.json(await service.listArtisans(await requesterFrom(req), filters));
});

export const get = asyncHandler(async (req, res) => {
    res.json({ artisan: await service.getArtisan(await requesterFrom(req), req.params.id) });
});

export const create = asyncHandler(async (req, res) => {
    res.status(201).json({ artisan: await service.createArtisan(await requesterFrom(req), req.body) });
});

export const update = asyncHandler(async (req, res) => {
    res.json({ artisan: await service.updateArtisan(await requesterFrom(req), req.params.id, req.body) });
});

export const setStatus = asyncHandler(async (req, res) => {
    res.json({ artisan: await service.setArtisanStatus(await requesterFrom(req), req.params.id, req.body.status) });
});

export const setVerification = asyncHandler(async (req, res) => {
    res.json({ artisan: await service.setVerification(await requesterFrom(req), req.params.id, req.body.verification) });
});

export const requirePasswordReset = asyncHandler(async (req, res) => {
    res.json({ artisan: await service.requirePasswordReset(await requesterFrom(req), req.params.id) });
});

export const resendActivation = asyncHandler(async (req, res) => {
    await service.resendActivation(await requesterFrom(req), req.params.id);
    res.json({ message: "Activation email sent." });
});