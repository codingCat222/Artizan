import { prisma } from "../../config/prisma";
import { env } from "../../config/env";
import { AppError } from "../../utils/appError";
import { comparePassword, hashPassword } from "../../utils/password";
import {
    AccessTokenPayload,
    addHours,
    generateOpaqueToken,
    hashOpaqueToken,
    signAccessToken,
    signRefreshToken,
    verifyRefreshToken,
} from "../../utils/token";
import { sendEmail } from "../../services/email/email.service";
import { activationEmail } from "../../services/email/templates/activation";
import { resetPasswordEmail } from "../../services/email/templates/resetPassword";
import { Role } from "../../config/constants";

const initialsOf = (name: string) =>
    name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

interface SessionResult {
    accessToken: string;
    refreshToken: string;
    user: {
        role: Role;
        name: string;
        email: string;
        initials: string;
        artisanId?: string;
        association?: string;
        mustChangePassword?: boolean;
    };
    redirect: string;
}

// Pre-computed bcrypt hash used to burn the same CPU time when an account does
// not exist, so response time doesn't reveal which emails are registered.
const DUMMY_HASH = "$2a$12$8Lk0f1k/Yzrb2Xv760imgOZyDbXmxx9VKiWsnjLiLNeqpJLXQ6UPy";

const homeFor = (role: Role): string =>
({
    ARTISAN: "/artisan",
    ADMIN: "/admin",
    ASSOCIATION_HEAD: "/association",
    SUPER_ADMIN: "/super-admin",
}[role]);

async function issueTokens(params: {
    userId: string;
    userType: "STAFF" | "ARTISAN";
    role: Role;
    associationId?: string | null;
    userAgent?: string;
    ipAddress?: string;
}) {
    const { userId, userType, role, associationId, userAgent, ipAddress } = params;

    const accessPayload: AccessTokenPayload = { sub: userId, role, userType, associationId };
    const accessToken = signAccessToken(accessPayload);

    const jti = generateOpaqueToken().token;
    const refreshToken = signRefreshToken({ sub: userId, userType, jti });

    const expiresAt = new Date(Date.now() + env.jwt.refreshExpiresInMs);
    await prisma.refreshToken.create({
        data: {
            tokenHash: hashOpaqueToken(jti),
            userType,
            staffId: userType === "STAFF" ? userId : undefined,
            artisanId: userType === "ARTISAN" ? userId : undefined,
            expiresAt,
            userAgent,
            ipAddress,
        },
    });

    return { accessToken, refreshToken };
}

export async function login(
    identifier: string,
    password: string,
    meta: { userAgent?: string; ipAddress?: string }
): Promise<SessionResult> {
    const id = identifier.trim().toLowerCase();
    const invalidCreds = () => AppError.unauthorized("Invalid email/username or password.");

    const staff = await prisma.staffUser.findUnique({
        where: { email: id },
        include: { association: true },
    });

    if (staff) {
        const valid = await comparePassword(password, staff.passwordHash);
        if (!valid) throw invalidCreds();
        if (staff.status === "Disabled") {
            throw AppError.forbidden("This account has been disabled. Contact the super administrator.");
        }

        const { accessToken, refreshToken } = await issueTokens({
            userId: staff.id,
            userType: "STAFF",
            role: staff.role as Role,
            associationId: staff.associationId,
            ...meta,
        });

        return {
            accessToken,
            refreshToken,
            user: {
                role: staff.role as Role,
                name: staff.name,
                email: staff.email,
                initials: initialsOf(staff.name),
                association: staff.association?.name,
            },
            redirect: homeFor(staff.role as Role),
        };
    }

    const artisan = await prisma.artisan.findFirst({
        where: { OR: [{ email: id }, { id: identifier }] },
        include: { association: true },
    });

    if (artisan) {
        if (artisan.status === "Pending") {
            throw AppError.forbidden(
                "This account has not been activated yet. Please use the activation link sent to your email."
            );
        }
        if (!artisan.passwordHash) throw invalidCreds();

        const valid = await comparePassword(password, artisan.passwordHash);
        if (!valid) throw invalidCreds();
        if (artisan.status === "Suspended") {
            throw AppError.forbidden("This account has been suspended. Please contact your association.");
        }

        const { accessToken, refreshToken } = await issueTokens({
            userId: artisan.id,
            userType: "ARTISAN",
            role: "ARTISAN",
            associationId: artisan.associationId,
            ...meta,
        });

        return {
            accessToken,
            refreshToken,
            user: {
                role: "ARTISAN",
                name: artisan.name,
                email: artisan.email,
                initials: artisan.avatarInitials,
                artisanId: artisan.id,
                association: artisan.association?.name,
                mustChangePassword: artisan.mustChangePassword,
            },
            redirect: artisan.mustChangePassword ? "/change-password" : "/artisan",
        };
    }

    await comparePassword(password, DUMMY_HASH);
    throw invalidCreds();
}

export async function refreshSession(refreshTokenRaw: string): Promise<{ accessToken: string; refreshToken: string }> {
    let payload;
    try {
        payload = verifyRefreshToken(refreshTokenRaw);
    } catch {
        throw AppError.unauthorized("Session expired. Please log in again.");
    }

    const tokenHash = hashOpaqueToken(payload.jti);
    const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
        throw AppError.unauthorized("Session expired. Please log in again.");
    }

    // Rotate: revoke the old token, issue a new pair.
    await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });

    let role: Role;
    let associationId: string | null | undefined;

    if (payload.userType === "STAFF") {
        const staff = await prisma.staffUser.findUnique({ where: { id: payload.sub } });
        if (!staff || staff.status === "Disabled") throw AppError.unauthorized("Account no longer active.");
        role = staff.role as Role;
        associationId = staff.associationId;
    } else {
        const artisan = await prisma.artisan.findUnique({ where: { id: payload.sub } });
        if (!artisan || artisan.status === "Suspended") throw AppError.unauthorized("Account no longer active.");
        role = "ARTISAN";
        associationId = artisan.associationId;
    }

    return issueTokens({ userId: payload.sub, userType: payload.userType, role, associationId });
}

export async function logout(refreshTokenRaw: string | undefined): Promise<void> {
    if (!refreshTokenRaw) return;
    try {
        const payload = verifyRefreshToken(refreshTokenRaw);
        const tokenHash = hashOpaqueToken(payload.jti);
        await prisma.refreshToken.updateMany({
            where: { tokenHash, revokedAt: null },
            data: { revokedAt: new Date() },
        });
    } catch {
        // Already invalid/expired — nothing to revoke.
    }
}

export async function forgotPassword(email: string): Promise<void> {
    const id = email.trim().toLowerCase();

    const staff = await prisma.staffUser.findUnique({ where: { email: id } });
    const artisan = staff ? null : await prisma.artisan.findUnique({ where: { email: id } });

    // Always behave the same way whether or not the account exists, to avoid
    // leaking which emails are registered.
    if (!staff && !artisan) return;

    const { token, hash } = generateOpaqueToken();
    const expiresAt = addHours(new Date(), env.tokens.resetExpiresInHours);

    await prisma.passwordResetToken.create({
        data: {
            tokenHash: hash,
            userType: staff ? "STAFF" : "ARTISAN",
            staffId: staff?.id,
            artisanId: artisan?.id,
            expiresAt,
        },
    });

    const name = (staff ?? artisan)!.name;
    const resetUrl = `${env.clientUrl}/reset-password?token=${token}`;
    const { subject, html } = resetPasswordEmail({ name, resetUrl });
    await sendEmail({ to: id, subject, html });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = hashOpaqueToken(token);
    const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
        throw AppError.badRequest("This reset link is invalid or has expired.");
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.$transaction(async (tx) => {
        if (record.userType === "STAFF" && record.staffId) {
            await tx.staffUser.update({ where: { id: record.staffId }, data: { passwordHash } });
        } else if (record.userType === "ARTISAN" && record.artisanId) {
            await tx.artisan.update({
                where: { id: record.artisanId },
                data: { passwordHash, mustChangePassword: false },
            });
        }
        await tx.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
        // Revoke all existing sessions for this user as a security measure.
        if (record.userType === "STAFF" && record.staffId) {
            await tx.refreshToken.updateMany({
                where: { staffId: record.staffId, revokedAt: null },
                data: { revokedAt: new Date() },
            });
        } else if (record.artisanId) {
            await tx.refreshToken.updateMany({
                where: { artisanId: record.artisanId, revokedAt: null },
                data: { revokedAt: new Date() },
            });
        }
    });
}

/** Called when staff/admin creates a new artisan — sends the one-time activation link. */
export async function createActivationToken(artisanId: string): Promise<void> {
    const artisan = await prisma.artisan.findUnique({ where: { id: artisanId } });
    if (!artisan) throw AppError.notFound("Artisan not found.");

    const { token, hash } = generateOpaqueToken();
    const expiresAt = addHours(new Date(), env.tokens.activationExpiresInHours);

    await prisma.activationToken.create({
        data: { tokenHash: hash, artisanId, expiresAt },
    });

    const activationUrl = `${env.clientUrl}/activate?token=${token}`;
    const { subject, html } = activationEmail({ name: artisan.name, activationUrl });
    await sendEmail({ to: artisan.email, subject, html });
}

export async function activateAccount(token: string, password: string): Promise<void> {
    const tokenHash = hashOpaqueToken(token);
    const record = await prisma.activationToken.findUnique({ where: { tokenHash } });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
        throw AppError.badRequest("This activation link is invalid or has already been used.");
    }

    const artisan = await prisma.artisan.findUnique({ where: { id: record.artisanId } });
    if (!artisan || artisan.status !== "Pending") {
        throw AppError.badRequest("This activation link is invalid or has already been used.");
    }

    const passwordHash = await hashPassword(password);

    await prisma.$transaction(async (tx) => {
        await tx.artisan.update({
            where: { id: artisan.id },
            data: { passwordHash, status: "Active", mustChangePassword: false },
        });
        await tx.activationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
    });
}

export async function changePassword(
    userId: string,
    userType: "STAFF" | "ARTISAN",
    currentPassword: string,
    newPassword: string
): Promise<void> {
    const passwordHash = await hashPassword(newPassword);

    if (userType === "STAFF") {
        const staff = await prisma.staffUser.findUnique({ where: { id: userId } });
        if (!staff) throw AppError.notFound("User not found.");
        const valid = await comparePassword(currentPassword, staff.passwordHash);
        if (!valid) throw AppError.badRequest("Current password is incorrect.");
        await prisma.staffUser.update({ where: { id: userId }, data: { passwordHash } });
    } else {
        const artisan = await prisma.artisan.findUnique({ where: { id: userId } });
        if (!artisan || !artisan.passwordHash) throw AppError.notFound("User not found.");
        const valid = await comparePassword(currentPassword, artisan.passwordHash);
        if (!valid) throw AppError.badRequest("Current password is incorrect.");
        await prisma.artisan.update({
            where: { id: userId },
            data: { passwordHash, mustChangePassword: false },
        });
    }
}

export async function getMe(userId: string, userType: "STAFF" | "ARTISAN") {
    if (userType === "STAFF") {
        const staff = await prisma.staffUser.findUnique({ where: { id: userId }, include: { association: true } });
        if (!staff) throw AppError.notFound("User not found.");
        return {
            role: staff.role as Role,
            name: staff.name,
            email: staff.email,
            initials: initialsOf(staff.name),
            association: staff.association?.name,
        };
    }

    const artisan = await prisma.artisan.findUnique({ where: { id: userId }, include: { association: true } });
    if (!artisan) throw AppError.notFound("User not found.");
    return {
        role: "ARTISAN" as Role,
        name: artisan.name,
        email: artisan.email,
        initials: artisan.avatarInitials,
        artisanId: artisan.id,
        association: artisan.association?.name,
        mustChangePassword: artisan.mustChangePassword,
    };
}