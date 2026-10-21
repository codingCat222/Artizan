import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/appError";
import { env } from "../config/env";

export function notFoundHandler(req: Request, res: Response) {
    res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message });
    }

    console.error(err);
    res.status(500).json({
        error: "Something went wrong. Please try again.",
        ...(env.isProduction ? {} : { detail: err instanceof Error ? err.message : String(err) }),
    });
}