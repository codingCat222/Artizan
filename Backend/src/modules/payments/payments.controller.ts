import { asyncHandler } from "../../utils/asyncHandler";
import { requesterFrom } from "../../utils/requester";
import { listPaymentsQuery } from "./payments.schema";
import * as service from "./payments.service";

export const list = asyncHandler(async (req, res) => {
    const filters = listPaymentsQuery.parse(req.query);
    res.json(await service.listPayments(await requesterFrom(req), filters));
});

export const refund = asyncHandler(async (req, res) => {
    res.json({ payment: await service.refundPayment(await requesterFrom(req), req.params.id) });
});