import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/appError";
import { verifyAccessToken } from "../utils/token";

/** Requires a valid Bearer access token on the Authorization header. */
export function authenticate(req: Request, _res: Response, next: NextFunction) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
        return next(AppError.unauthorized("Authentication required."));
    }

    const token = header.slice("Bearer ".length).trim();

    try {
        req.user = verifyAccessToken(token);
        next();
    } catch {
        next(AppError.unauthorized("Invalid or expired session. Please log in again."));
    }
}