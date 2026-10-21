import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/appError";
import { Role } from "../config/constants";

/** Restricts a route to one or more roles. Use after `authenticate`. */
export function authorize(...allowedRoles: Role[]) {
    return (req: Request, _res: Response, next: NextFunction) => {
        if (!req.user) return next(AppError.unauthorized("Authentication required."));
        if (!allowedRoles.includes(req.user.role)) {
            return next(AppError.forbidden("You do not have permission to perform this action."));
        }
        next();
    };
}