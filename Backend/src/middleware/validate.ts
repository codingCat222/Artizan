import { NextFunction, Request, Response } from "express";
import { AnyZodObject, ZodError } from "zod";
import { AppError } from "../utils/appError";

/** Validates req.body (and optionally params/query) against a Zod schema. */
export function validate(schema: AnyZodObject) {
    return (req: Request, _res: Response, next: NextFunction) => {
        try {
            const parsed = schema.parse({
                body: req.body,
                params: req.params,
                query: req.query,
            });
            req.body = parsed.body ?? req.body;
            next();
        } catch (err) {
            if (err instanceof ZodError) {
                const message = err.errors.map((e) => e.message).join(" ");
                return next(AppError.badRequest(message));
            }
            next(err);
        }
    };
}