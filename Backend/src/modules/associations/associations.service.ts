import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/appError";
import { Actor, recordAudit } from "../audit/audit.service";

export interface AssociationInput {
    name: string;
    code?: string;
    category: string;
    description?: string;
    contactEmail?: string;
    contactPhone?: string;
}

type Row = {
    id: string;
    name: string;
    code: string;
    category: string;
    status: string;
    description: string | null;
    contactEmail: string;
    contactPhone: string | null;
    _count: { artisans: number };
    staff: { name: string }[];
};

const include = {
    _count: { select: { artisans: true } },
    staff: { where: { role: "ASSOCIATION_HEAD" }, select: { name: true }, take: 1 },
} as const;

const toDto = (a: Row) => ({
    id: a.id,
    name: a.name,
    code: a.code,
    category: a.category,
    head: a.staff[0]?.name ?? "",
    members: a._count.artisans,
    status: a.status as "Active" | "Inactive",
    contactEmail: a.contactEmail,
    contactPhone: a.contactPhone ?? undefined,
    description: a.description ?? undefined,
});

/** "Tailors Association" -> "AAON-TA", made unique with a numeric suffix if needed. */
export async function generateCode(name: string): Promise<string> {
    const initials =
        name
            .split(/\s+/)
            .map((w) => w[0])
            .join("")
            .replace(/[^A-Za-z]/g, "")
            .toUpperCase()
            .slice(0, 4) || "ASSN";
    let code = `AAON-${initials}`;
    let n = 1;
    while (await prisma.association.findUnique({ where: { code } })) code = `AAON-${initials}${++n}`;
    return code;
}

export async function listAssociations() {
    const rows = await prisma.association.findMany({ orderBy: { name: "asc" }, include });
    return rows.map(toDto);
}

async function assertUnique(name: string, code: string | undefined, excludeId?: string) {
    const clash = await prisma.association.findFirst({
        where: {
            ...(excludeId ? { id: { not: excludeId } } : {}),
            OR: [{ name }, ...(code ? [{ code }] : [])],
        },
    });
    if (clash) throw AppError.conflict("An association with this name or code already exists.");
}

export async function createAssociation(input: AssociationInput, actor: Actor) {
    const name = input.name.trim();
    const code = input.code?.trim().toUpperCase() || undefined;
    await assertUnique(name, code);
    const created = await prisma.association.create({
        data: {
            name,
            code: code ?? (await generateCode(name)),
            category: input.category,
            description: input.description?.trim() || null,
            contactEmail: input.contactEmail?.trim() ?? "",
            contactPhone: input.contactPhone?.trim() || null,
        },
        include,
    });
    await recordAudit(actor, "Created association", name);
    return toDto(created);
}

export async function updateAssociation(id: string, input: AssociationInput, actor: Actor) {
    const existing = await prisma.association.findUnique({ where: { id } });
    if (!existing) throw AppError.notFound("Association not found.");
    const name = input.name.trim();
    const code = input.code?.trim().toUpperCase() || existing.code;
    await assertUnique(name, code, id);
    const updated = await prisma.association.update({
        where: { id },
        data: {
            name,
            code,
            category: input.category,
            description: input.description?.trim() || null,
            contactEmail: input.contactEmail?.trim() ?? "",
            contactPhone: input.contactPhone?.trim() || null,
        },
        include,
    });
    await recordAudit(actor, "Updated association", name);
    return toDto(updated);
}

export async function setAssociationStatus(id: string, status: "Active" | "Inactive", actor: Actor) {
    const existing = await prisma.association.findUnique({ where: { id } });
    if (!existing) throw AppError.notFound("Association not found.");
    const updated = await prisma.association.update({ where: { id }, data: { status }, include });
    if (existing.status !== status) {
        await recordAudit(actor, status === "Inactive" ? "Deactivated association" : "Reactivated association", existing.name);
    }
    return toDto(updated);
}