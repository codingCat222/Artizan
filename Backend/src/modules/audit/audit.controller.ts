import { asyncHandler } from "../../utils/asyncHandler";
import { listAuditQuery } from "./audit.schema";
import * as auditService from "./audit.service";

export const list = asyncHandler(async (req, res) => {
    const query = listAuditQuery.parse(req.query);
    res.json(await auditService.listAudit(query));
});