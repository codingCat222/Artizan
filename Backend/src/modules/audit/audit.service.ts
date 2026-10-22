import { prisma } from "../../config/prisma";
import { pageArgs } from "../../utils/pagination";

export interface Actor {
    id: string | null;
    name: string;
}

/** Looks up the display name of the signed-in staff member for audit entries. */
export async function getActor(userId: string): Promise<Actor> {
    const staff = await prisma.staffUser.findUnique({ where: { id: userId }, select: { name: true } });
    return { id: userId, name: staff?.name ?? "Staff" };
}

/**
 * Writes an audit entry. Never throws: failing to log must not undo or block the
 * action that was just completed, but the failure is reported on the server console.
 */
export async function recordAudit(actor: Actor, action: string, target: string): Promise<void> {
    try {
        await prisma.auditLog.create({
            data: { actorId: actor.id, actorName: actor.name, action, target: target.slice(0, 500) },
        });
    } catch (err) {
        console.error("[audit] Failed to record entry:", action, target, err);
    }
}

export async function listAudit(params: { q?: string; page: number; pageSize: number }) {
    const q = params.q?.trim();
    const where = q
        ? { OR: [{ actorName: { contains: q } }, { action: { contains: q } }, { target: { contains: q } }] }
        : {};
    const [total, rows] = await Promise.all([
        prisma.auditLog.count({ where }),
        prisma.auditLog.findMany({
            where,
            orderBy: { createdAt: "desc" },
            ...pageArgs(params.page, params.pageSize),
        }),
    ]);
    return {
        total,
        page: params.page,
        pageSize: params.pageSize,
        items: rows.map((r) => ({
            id: r.id,
            actor: r.actorName,
            action: r.action,
            target: r.target,
            timestamp: r.createdAt.toISOString(),
        })),
    };
}