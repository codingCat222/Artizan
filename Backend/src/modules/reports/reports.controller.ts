import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { requesterFrom } from "../../utils/requester";
import * as service from "./reports.service";

const query = z.object({ period: z.string().max(40).optional() });

export const payments = asyncHandler(async (req, res) => {
    const { period } = query.parse(req.query);
    res.json(await service.paymentReport(await requesterFrom(req), period || undefined));
});

export const paymentsCsv = asyncHandler(async (req, res) => {
    const { period } = query.parse(req.query);
    const csv = await service.paymentsCsv(await requesterFrom(req), period || undefined);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="payments-report.csv"');
    res.send(csv);
});