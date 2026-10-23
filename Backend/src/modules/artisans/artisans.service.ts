import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/appError";
import { pageArgs } from "../../utils/pagination";
import { Requester } from "../../utils/requester";
import { recordAudit } from "../audit/audit.service";
import { createActivationToken } from "../auth/auth.service";

export interface ArtisanInput {
    name: string;
    dob?: string;
    phone: string;
    whatsapp?: string;
    email: string;
    businessName: string;
    shopNumber?: string;
    businessAddress: string;
    businessDescription?: string;
    town: string;
    area: string;
    category: string;
    associationId?: string;
    idType?: string;
    idNumber?: string;
}

const initialsOf = (name: string) =>
    name
        .split(/\s+/)
        .filter(Boolean)
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

/** Short, human-friendly reference shown in the UI. The full id stays internal. */
export const refOf = (id: string) => `AON-${id.slice(-6).toUpperCase()}`;

/** ID numbers are private; staff see only the last 3 characters. */
export const maskId = (v?: string | null) => (v ? `${"•".repeat(Math.max(v.length - 3, 0))}${v.slice(-3)}` : "");

const include = {
    association: { select: { id: true, name: true } },
} as const;

type ArtisanRow = {
    id: string;
    name: string;
    email: string;
    category: string;
    associationId: string;
    association: { id: string; name: string };
    town: string;
    area: string;
    phone: string;
    status: string;
    verification: string;
    businessName: string;
    businessDescription: string | null;
    whatsapp: string | null;
    businessAddress: string | null;
    shopNumber: string | null;
    dob: Date | null;
    idType: string | null;
    idNumber: string | null;
    avatarInitials: string;
    photo: string | null;
    mustChangePassword: boolean;
    createdBy: string;
    verifiedBy: string | null;
    createdAt: Date;
};

export const toDto = (a: ArtisanRow) => ({
    id: a.id,
    ref: refOf(a.id),
    name: a.name,
    email: a.email,
    category: a.category,
    associationId: a.associationId,
    association: a.association.name,
    town: a.town,
    area: a.area,
    phone: a.phone,
    status: a.status as "Active" | "Overdue" | "Pending" | "Suspended",
    verification: a.verification as "Verified" | "Unverified",
    businessName: a.businessName,
    businessDescription: a.businessDescription ?? "",
    whatsapp: a.whatsapp ?? "",
    businessAddress: a.businessAddress ?? "",
    shopNumber: a.shopNumber ?? "",
    dob: a.dob ? a.dob.toISOString().slice(0, 10) : "",
    idType: a.idType ?? "",
    idNumberMasked: maskId(a.idNumber),
    avatarInitials: a.avatarInitials,
    mustChangePassword: a.mustChangePassword,
    createdBy: a.createdBy,
    verifiedBy: a.verifiedBy ?? "",
    createdAt: a.createdAt.toISOString(),
});

/** An association head can only ever touch artisans of their own association. */
function scopeWhere(requester: Requester) {
    return requester.role === "ASSOCIATION_HEAD" ? { associationId: requester.associationId! } : {};
}

async function loadScoped(requester: Requester, id: string) {
    const found = await prisma.artisan.findFirst({ where: { id, ...scopeWhere(requester) }, include });
    // 404 rather than 403 so heads can't probe for the existence of other associations' artisans.
    if (!found) throw AppError.notFound("Artisan not found.");
    return found;
}

async function assertEmailFree(email: string, excludeArtisanId?: string) {
    const [artisan, staff] = await Promise.all([
        prisma.artisan.findFirst({ where: { email, ...(excludeArtisanId ? { id: { not: excludeArtisanId } } : {}) } }),
        prisma.staffUser.findUnique({ where: { email } }),
    ]);
    if (artisan || staff) throw AppError.conflict("That email is already in use.");
}

export interface ListFilters {
    q?: string;
    category?: string;
    associationId?: string;
    status?: string;
    page: number;
    pageSize: number;
}

export async function listArtisans(requester: Requester, f: ListFilters) {
    const q = f.q?.trim();
    const refSearch = q && /^aon-/i.test(q) ? q.replace(/^aon-/i, "").toLowerCase() : null;
    const where = {
        ...scopeWhere(requester),
        // Heads are already limited to one association; ignore any other association filter from them.
        ...(requester.role !== "ASSOCIATION_HEAD" && f.associationId ? { associationId: f.associationId } : {}),
        ...(f.category ? { category: f.category } : {}),
        ...(f.status ? { status: f.status } : {}),
        ...(q
            ? {
                OR: [
                    { name: { contains: q } },
                    { businessName: { contains: q } },
                    { email: { contains: q } },
                    ...(refSearch ? [{ id: { endsWith: refSearch } }] : []),
                ],
            }
            : {}),
    };
    const [total, rows] = await Promise.all([
        prisma.artisan.count({ where }),
        prisma.artisan.findMany({ where, include, orderBy: { createdAt: "desc" }, ...pageArgs(f.page, f.pageSize) }),
    ]);
    return { total, page: f.page, pageSize: f.pageSize, items: rows.map(toDto) };
}

export async function getArtisan(requester: Requester, id: string) {
    const a = await loadScoped(requester, id);
    const [documents, payments] = await Promise.all([
        prisma.artisanDocument.findMany({ where: { artisanId: id }, orderBy: { uploaded: "desc" } }),
        prisma.payment.findMany({ where: { artisanId: id }, orderBy: { createdAt: "desc" }, take: 24 }),
    ]);
    return {
        ...toDto(a),
        documents: documents.map((d) => ({
            id: d.id,
            name: d.name,
            type: d.type,
            review: d.review,
            uploaded: d.uploaded.toISOString(),
        })),
        payments: payments.map((p) => ({
            id: p.id,
            period: p.period,
            amount: p.amount,
            status: p.status,
            reference: p.reference,
            date: (p.paidAt ?? p.createdAt).toISOString(),
        })),
    };
}

async function resolveAssociation(requester: Requester, requested?: string) {
    const associationId = requester.role === "ASSOCIATION_HEAD" ? requester.associationId! : requested;
    if (!associationId) throw AppError.badRequest("Choose the association this artisan belongs to.");
    const association = await prisma.association.findUnique({ where: { id: associationId } });
    return association;
}

export async function createArtisan(requester: Requester, input: ArtisanInput) {
    const association = await resolveAssociation(requester, input.associationId);
    if (!association || association.status !== "Active") throw AppError.badRequest("Choose an active association.");

    const category = await prisma.category.findUnique({ where: { name: input.category } });
    if (!category || category.status !== "Active") throw AppError.badRequest("Choose an active category.");

    const email = input.email.trim().toLowerCase();
    await assertEmailFree(email);

    const created = await prisma.artisan.create({
        data: {
            name: input.name.trim(),
            email,
            category: category.name,
            associationId: association.id,
            town: input.town.trim(),
            area: input.area.trim(),
            phone: input.phone,
            status: "Pending", // until the artisan activates their own account
            verification: "Verified", // staff-created profiles are approved by default (BR-007)
            businessName: input.businessName.trim(),
            businessDescription: input.businessDescription?.trim() || null,
            whatsapp: input.whatsapp || null,
            businessAddress: input.businessAddress.trim(),
            shopNumber: input.shopNumber?.trim() || null,
            dob: input.dob ? new Date(input.dob) : null,
            idType: input.idType || null,
            idNumber: input.idType ? input.idNumber?.trim() || null : null,
            avatarInitials: initialsOf(input.name),
            mustChangePassword: true,
            createdBy: requester.name,
            verifiedBy: requester.name,
        },
        include,
    });

    try {
        await createActivationToken(created.id);
    } catch {
        // Don't leave an artisan nobody was able to tell about; roll back so staff can retry.
        await prisma.$transaction([
            prisma.activationToken.deleteMany({ where: { artisanId: created.id } }),
            prisma.artisan.delete({ where: { id: created.id } }),
        ]);
        throw new AppError("We couldn't send the activation email, so the artisan was not registered. Please try again.", 502);
    }

    await recordAudit(requester, "Registered artisan", `${created.name} (${association.name})`);
    return toDto(created);
}

export async function updateArtisan(requester: Requester, id: string, input: ArtisanInput) {
    const existing = await loadScoped(requester, id);

    const email = input.email.trim().toLowerCase();
    if (email !== existing.email) await assertEmailFree(email, id);

    // Categories: inactive ones can't be newly chosen, but an artisan may keep the one they have.
    if (input.category !== existing.category) {
        const category = await prisma.category.findUnique({ where: { name: input.category } });
        if (!category || category.status !== "Active") throw AppError.badRequest("Choose an active category.");
    }

    // Heads can never move an artisan out of their association.
    const targetAssociationId =
        requester.role === "ASSOCIATION_HEAD" ? existing.associationId : input.associationId ?? existing.associationId;
    const moved = targetAssociationId !== existing.associationId;
    if (moved) {
        const assoc = await prisma.association.findUnique({ where: { id: targetAssociationId } });
        if (!assoc || assoc.status !== "Active") throw AppError.badRequest("Choose an active association.");
    }

    const clearId = input.idType === "";
    const updated = await prisma.artisan.update({
        where: { id },
        data: {
            name: input.name.trim(),
            email,
            category: input.category,
            associationId: targetAssociationId,
            town: input.town.trim(),
            area: input.area.trim(),
            phone: input.phone,
            businessName: input.businessName.trim(),
            businessDescription: input.businessDescription?.trim() || null,
            whatsapp: input.whatsapp || null,
            businessAddress: input.businessAddress.trim(),
            shopNumber: input.shopNumber?.trim() || null,
            dob: input.dob ? new Date(input.dob) : null,
            avatarInitials: initialsOf(input.name),
            ...(clearId
                ? { idType: null, idNumber: null }
                : {
                    ...(input.idType ? { idType: input.idType } : {}),
                    // A blank ID number means "keep the one on file" (the real value is never sent to the browser).
                    ...(input.idNumber?.trim() ? { idNumber: input.idNumber.trim() } : {}),
                }),
        },
        include,
    });
    await recordAudit(requester, moved ? "Updated artisan (association changed)" : "Updated artisan", updated.name);
    return toDto(updated);
}

export async function setArtisanStatus(requester: Requester, id: string, status: "Suspended" | "Active") {
    const existing = await loadScoped(requester, id);

    if (status === "Suspended") {
        if (existing.status === "Suspended") return toDto(existing);
        const updated = await prisma.artisan.update({ where: { id }, data: { status: "Suspended" }, include });
        // Block them immediately: sessions can no longer be refreshed.
        await prisma.refreshToken.updateMany({ where: { artisanId: id, revokedAt: null }, data: { revokedAt: new Date() } });
        await recordAudit(requester, "Suspended artisan", updated.name);
        return toDto(updated);
    }

    if (existing.status !== "Suspended") return toDto(existing);
    // Someone who never activated goes back to waiting for activation, not straight to Active.
    const next = existing.passwordHash ? "Active" : "Pending";
    const updated = await prisma.artisan.update({ where: { id }, data: { status: next }, include });
    await recordAudit(requester, "Reactivated artisan", updated.name);
    return toDto(updated);
}

export async function setVerification(requester: Requester, id: string, verification: "Verified" | "Unverified") {
    const existing = await loadScoped(requester, id);
    const updated = await prisma.artisan.update({
        where: { id },
        data: { verification, verifiedBy: verification === "Verified" ? requester.name : null },
        include,
    });
    if (existing.verification !== verification) {
        await recordAudit(requester, verification === "Verified" ? "Verified artisan" : "Removed verification", updated.name);
    }
    return toDto(updated);
}

export async function requirePasswordReset(requester: Requester, id: string) {
    const existing = await loadScoped(requester, id);
    if (existing.status === "Pending") {
        throw AppError.badRequest("This artisan hasn't activated their account yet.");
    }
    const updated = await prisma.artisan.update({ where: { id }, data: { mustChangePassword: true }, include });
    await prisma.refreshToken.updateMany({ where: { artisanId: id, revokedAt: null }, data: { revokedAt: new Date() } });
    await recordAudit(requester, "Required password reset", updated.name);
    return toDto(updated);
}

export async function resendActivation(requester: Requester, id: string) {
    const existing = await loadScoped(requester, id);
    if (existing.status !== "Pending") throw AppError.badRequest("This artisan has already activated their account.");
    try {
        await createActivationToken(id);
    } catch {
        throw new AppError("We couldn't send the activation email. Please try again.", 502);
    }
    await recordAudit(requester, "Resent activation email", existing.name);
}