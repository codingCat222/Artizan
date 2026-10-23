import { Request } from "express";
import { StaffRole } from "../config/constants";
import { prisma } from "../config/prisma";
import { AppError } from "./appError";

export interface Requester {
    id: string;
    name: string;
    role: StaffRole;
    associationId: string | null;
}


export async function requesterFrom(req: Request): Promise<Requester> {
    const staff = await prisma.staffUser.findUnique({
        where: { id: req.user!.sub },
        select: { id: true, name: true, role: true, status: true, associationId: true },
    });
    if (!staff || staff.status !== "Active") {
        throw AppError.unauthorized("This account is no longer active.");
    }
    if (staff.role === "ASSOCIATION_HEAD" && !staff.associationId) {
        throw AppError.forbidden("Your account is not linked to an association.");
    }
    return {
        id: staff.id,
        name: staff.name,
        role: staff.role as StaffRole,
        associationId: staff.role === "ASSOCIATION_HEAD" ? staff.associationId : null,
    };
}