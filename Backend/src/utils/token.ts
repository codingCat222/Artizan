import crypto from "crypto";
import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env";
import { Role } from "../config/constants";

export interface AccessTokenPayload {
    sub: string; // user id (staff id or artisan id)
    role: Role;
    userType: "STAFF" | "ARTISAN";
    associationId?: string | null;
}

export function signAccessToken(payload: AccessTokenPayload): string {
    return jwt.sign(payload, env.jwt.accessSecret, {
        expiresIn: env.jwt.accessExpiresIn,
    } as SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
    return jwt.verify(token, env.jwt.accessSecret) as AccessTokenPayload;
}

export interface RefreshTokenPayload {
    sub: string;
    userType: "STAFF" | "ARTISAN";
    jti: string; // unique id, stored (hashed) in DB so it can be revoked
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
    return jwt.sign(payload, env.jwt.refreshSecret, {
        expiresIn: env.jwt.refreshExpiresIn,
    } as SignOptions);
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
    return jwt.verify(token, env.jwt.refreshSecret) as RefreshTokenPayload;
}

/** Random opaque token for activation / password-reset links (not a JWT). */
export function generateOpaqueToken(): { token: string; hash: string } {
    const token = crypto.randomBytes(32).toString("hex");
    const hash = hashOpaqueToken(token);
    return { token, hash };
}

export function hashOpaqueToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
}

export function addHours(date: Date, hours: number): Date {
    return new Date(date.getTime() + hours * 60 * 60 * 1000);
}