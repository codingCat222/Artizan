import crypto from "crypto";
import { env } from "../../config/env";
import { prisma } from "../../config/prisma";
import { StaffRole } from "../../config/constants";
import { sendEmail } from "../../services/email/email.service";
import { staffInviteEmail } from "../../services/email/templates/staffInvite";
import { AppError } from "../../utils/appError";
import { hashPassword } from "../../utils/password";
import { addHours, generateOpaqueToken } from "../../utils/token";
import { Actor, recordAudit } from "../audit/audit.service";
import { getSettings } from "../settings/settings.service";

/** How long a new staff member has to set their password from the invitation link. */
export const INVITE_VALID_HOURS = 72;

export interface Requester extends Actor {
    id: string;
    role: StaffRole;
}

/**
 * Who may disable/enable/delete whom:
 *  - Super admin: any administrator or association head
 *  - Admin: association heads only
 *  - Nobody can manage the super admin (or themselves, checked separately).
 */
export function canManageTarget(requester: StaffRole, target: StaffRole): boolean {
    if (target === "SUPER_ADMIN") return false;
    if (requester === "SUPER_ADMIN") return true;
    if (requester === "ADMIN") return target === "ASSOCIATION_HEAD";
    return false;
}

/**
 * Who may create which account:
 *  - Super admin: administrators and association heads
 *  - Admin: association heads, and other administrators only if the platform setting allows it
 */
export function canCreateRole(requester: StaffRole, target: StaffRole, adminsCanCreateStaff: boolean): boolean {
    if (target === "SUPER_ADMIN") return false;
    if (requester === "SUPER_ADMIN") return true;
    if (requester === "ADMIN") return target === "ASSOCIATION_HEAD" || adminsCanCreateStaff;
    return false;
}

const ROLE_LABELS: Record<StaffRole, string> = {
    SUPER_ADMIN: "Super Administrator",
    ADMIN: "Administrator",
    ASSOCIATION_HEAD: "Association Head",
};

type StaffRow = {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    associationId: string | null;
    createdAt: Date;
    association?: { name: string } | null;
};

const toDto = (u: StaffRow) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role as StaffRole,
    status: u.status as "Active" | "Disabled",
    associationId: u.associationId,
    association: u.association?.name ?? null,
    createdAt: u.createdAt.toISOString(),
});

export async function listStaff() {
    const rows = await prisma.staffUser.findMany({
        orderBy: { createdAt: "asc" },
        include: { association: { select: { name: true } } },
    });
    return rows.map(toDto);
}

export async function createStaff(
    requester: Requester,
    input: { name: string; email: string; role: "ADMIN" | "ASSOCIATION_HEAD"; associationId?: string },
) {
    const settings = await getSettings();
    if (!canCreateRole(requester.role, input.role, settings.adminsCanCreateStaff)) {
        throw AppError.forbidden(
            input.role === "ADMIN"
                ? "Only the super administrator can create administrator accounts."
                : "You do not have permission to create this account.",
        );
    }

    const email = input.email.trim().toLowerCase();
    const [staffDup, artisanDup] = await Promise.all([
        prisma.staffUser.findUnique({ where: { email } }),
        prisma.artisan.findUnique({ where: { email } }),
    ]);
    if (staffDup || artisanDup) throw AppError.conflict("This email is already in use.");

    let association: { id: string; name: string } | null = null;
    if (input.role === "ASSOCIATION_HEAD") {
        if (!input.associationId) throw AppError.badRequest("Choose the association this head will manage.");
        const found = await prisma.association.findUnique({ where: { id: input.associationId } });
        if (!found || found.status !== "Active") throw AppError.badRequest("Choose an active association.");
        const existingHead = await prisma.staffUser.findFirst({
            where: { role: "ASSOCIATION_HEAD", associationId: found.id },
        });
        if (existingHead) {
            throw AppError.conflict(`${found.name} already has a head (${existingHead.name}). Remove or reassign them first.`);
        }
        association = { id: found.id, name: found.name };
    }

    // The account starts with a random password nobody knows; the invitation link
    // (a one-time password-reset token) is how the person sets their own.
    const { token, hash } = generateOpaqueToken();
    const unusableHash = await hashPassword(crypto.randomBytes(24).toString("hex"));

    const user = await prisma.$transaction(async (tx) => {
        const created = await tx.staffUser.create({
            data: {
                name: input.name.trim(),
                email,
                passwordHash: unusableHash,
                role: input.role,
                status: "Active",
                associationId: association?.id ?? null,
            },
            include: { association: { select: { name: true } } },
        });
        await tx.passwordResetToken.create({
            data: {
                tokenHash: hash,
                userType: "STAFF",
                staffId: created.id,
                expiresAt: addHours(new Date(), INVITE_VALID_HOURS),
            },
        });
        return created;
    });

    const { subject, html } = staffInviteEmail({
        name: user.name,
        roleLabel: ROLE_LABELS[input.role],
        association: association?.name,
        inviteUrl: `${env.clientUrl}/reset-password?token=${token}`,
        validHours: INVITE_VALID_HOURS,
    });

    try {
        await sendEmail({ to: email, subject, html });
    } catch {
        // No point keeping an account nobody was told about; roll it back so the admin can retry.
        await prisma.$transaction([
            prisma.passwordResetToken.deleteMany({ where: { staffId: user.id } }),
            prisma.staffUser.delete({ where: { id: user.id } }),
        ]);
        throw new AppError("We couldn't send the invitation email, so the account was not created. Please try again.", 502);
    }

    await recordAudit(
        requester,
        input.role === "ADMIN" ? "Created administrator account" : "Created association head account",
        email,
    );
    return toDto(user);
}

async function loadManageableTarget(requester: Requester, id: string) {
    const target = await prisma.staffUser.findUnique({
        where: { id },
        include: { association: { select: { name: true } } },
    });
    if (!target) throw AppError.notFound("Staff account not found.");
    if (target.id === requester.id) throw AppError.forbidden("You can't change your own account here.");
    if (!canManageTarget(requester.role, target.role as StaffRole)) {
        throw AppError.forbidden("You do not have permission to manage this account.");
    }
    return target;
}

export async function setStaffStatus(requester: Requester, id: string, status: "Active" | "Disabled") {
    const target = await loadManageableTarget(requester, id);
    if (target.status === status) return toDto(target);

    const updated = await prisma.staffUser.update({
        where: { id },
        data: { status },
        include: { association: { select: { name: true } } },
    });

    if (status === "Disabled") {
        // Kill every active session so the person can't silently keep refreshing.
        await prisma.refreshToken.updateMany({ where: { staffId: id, revokedAt: null }, data: { revokedAt: new Date() } });
    }
    await recordAudit(requester, status === "Disabled" ? "Disabled staff account" : "Enabled staff account", target.email);
    return toDto(updated);
}

export async function deleteStaff(requester: Requester, id: string) {
    const target = await loadManageableTarget(requester, id);
    await prisma.$transaction([
        prisma.refreshToken.deleteMany({ where: { staffId: id } }),
        prisma.passwordResetToken.deleteMany({ where: { staffId: id } }),
        prisma.staffUser.delete({ where: { id } }),
    ]);
    await recordAudit(requester, "Deleted staff account", target.email);
}