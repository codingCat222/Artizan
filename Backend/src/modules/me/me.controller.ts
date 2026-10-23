import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import * as service from "./me.service";

export const billing = asyncHandler(async (req: Request, res: Response) => {
    res.json(await service.getBilling(req.user!.sub));
});

export const initializePayment = asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json(await service.initializePayment(req.user!.sub));
});

export const verifyPayment = asyncHandler(async (req: Request, res: Response) => {
    res.json(await service.verifyPayment(req.user!.sub, req.body.reference));
});

export const mockComplete = asyncHandler(async (req: Request, res: Response) => {
    await service.mockComplete(req.user!.sub, req.body.reference, req.body.outcome);
    res.json({ ok: true });
});
