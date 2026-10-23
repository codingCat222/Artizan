import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/appError";
import { Actor, recordAudit } from "../audit/audit.service";

export interface CategoryInput {
    name: string;
    description?: string;
}

type Row = { id: string; name: string; description: string | null; status: string };

const toDto = (c: Row, count: number) => ({
    id: c.id,
    name: c.name,
    description: c.description ?? "",
    artisanCount: count,
    status: c.status as "Active" | "Inactive",
});

async function countFor(name: string) {
    return prisma.artisan.count({ where: { category: name } });
}

export async function listCategories() {
    const [rows, counts] = await Promise.all([
        prisma.category.findMany({ orderBy: { name: "asc" } }),
        prisma.artisan.groupBy({ by: ["category"], _count: { _all: true } }),
    ]);
    const byName = new Map<string, number>(counts.map((c: { category: string; _count: { _all: number } }) => [c.category, c._count._all]));
    return rows.map((c) => toDto(c, byName.get(c.name) ?? 0));
}

export async function createCategory(input: CategoryInput, actor: Actor) {
    const name = input.name.trim();
    if (await prisma.category.findFirst({ where: { name } })) {
        throw AppError.conflict("A category with this name already exists.");
    }
    const created = await prisma.category.create({
        data: { name, description: input.description?.trim() || null },
    });
    await recordAudit(actor, "Created category", name);
    return toDto(created, 0);
}

export async function updateCategory(id: string, input: CategoryInput, actor: Actor) {
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) throw AppError.notFound("Category not found.");

    const name = input.name.trim();
    if (await prisma.category.findFirst({ where: { name, id: { not: id } } })) {
        throw AppError.conflict("A category with this name already exists.");
    }

    // Artisans and associations store the category by name, so a rename must update them too.
    const [updated] = await prisma.$transaction([
        prisma.category.update({ where: { id }, data: { name, description: input.description?.trim() || null } }),
        ...(existing.name !== name
            ? [
                prisma.artisan.updateMany({ where: { category: existing.name }, data: { category: name } }),
                prisma.association.updateMany({ where: { category: existing.name }, data: { category: name } }),
            ]
            : []),
    ]);
    await recordAudit(actor, "Updated category", name);
    return toDto(updated, await countFor(name));
}

export async function setCategoryStatus(id: string, status: "Active" | "Inactive", actor: Actor) {
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) throw AppError.notFound("Category not found.");
    const updated = await prisma.category.update({ where: { id }, data: { status } });
    if (existing.status !== status) {
        await recordAudit(actor, status === "Inactive" ? "Deactivated category" : "Reactivated category", existing.name);
    }
    return toDto(updated, await countFor(updated.name));
}