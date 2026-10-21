import { Request, Response, NextFunction } from "express";
import { env } from "../../config/env";
import { COOKIE_NAMES } from "../../config/constants";
import { AppError } from "../../utils/appError";
import * as authService from "./auth.service";

const REFRESH_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.isProduction ? ("none" as const) : ("lax" as const),
    path: "/api/auth",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

function setRefreshCookie(res: Response, token: string) {
    res.cookie(COOKIE_NAMES.refreshToken, token, REFRESH_COOKIE_OPTIONS);
}

function clearRefreshCookie(res: Response) {
    res.clearCookie(COOKIE_NAMES.refreshToken, { ...REFRESH_COOKIE_OPTIONS, maxAge: undefined });
}

export async function login(req: Request, res: Response, next: NextFunction) {
    try {
        const { identifier, password } = req.body;
        const result = await authService.login(identifier, password, {
            userAgent: req.headers["user-agent"],
            ipAddress: req.ip,
        });

        setRefreshCookie(res, result.refreshToken);
        res.json({ accessToken: result.accessToken, user: result.user, redirect: result.redirect });
    } catch (err) {
        next(err);
    }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
    try {
        const token = req.cookies?.[COOKIE_NAMES.refreshToken];
        if (!token) throw AppError.unauthorized("No active session.");

        const result = await authService.refreshSession(token);
        setRefreshCookie(res, result.refreshToken);
        res.json({ accessToken: result.accessToken });
    } catch (err) {
        clearRefreshCookie(res);
        next(err);
    }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
    try {
        const token = req.cookies?.[COOKIE_NAMES.refreshToken];
        await authService.logout(token);
        clearRefreshCookie(res);
        res.status(204).send();
    } catch (err) {
        next(err);
    }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
        await authService.forgotPassword(req.body.email);
        // Always the same response, whether or not the email exists.
        res.json({
            message: "If an account exists for that email, a password reset link has been sent.",
        });
    } catch (err) {
        next(err);
    }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
        const { token, password } = req.body;
        await authService.resetPassword(token, password);
        res.json({ message: "Password reset successfully. You can now log in." });
    } catch (err) {
        next(err);
    }
}

export async function activateAccount(req: Request, res: Response, next: NextFunction) {
    try {
        const { token, password } = req.body;
        await authService.activateAccount(token, password);
        res.json({ message: "Account activated successfully. You can now log in." });
    } catch (err) {
        next(err);
    }
}

export async function changePassword(req: Request, res: Response, next: NextFunction) {
    try {
        if (!req.user) throw AppError.unauthorized();
        const { currentPassword, newPassword } = req.body;
        await authService.changePassword(req.user.sub, req.user.userType, currentPassword, newPassword);
        res.json({ message: "Password changed successfully." });
    } catch (err) {
        next(err);
    }
}

export async function me(req: Request, res: Response, next: NextFunction) {
    try {
        if (!req.user) throw AppError.unauthorized();
        const user = await authService.getMe(req.user.sub, req.user.userType);
        res.json({ user });
    } catch (err) {
        next(err);
    }
}