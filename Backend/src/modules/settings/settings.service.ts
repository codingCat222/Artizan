import { prisma } from "../../config/prisma";
import { Actor, recordAudit } from "../audit/audit.service";

export interface SettingsDto {
    fee: number;
    dueDay: number;
    graceDays: number;
    reminderDays: string;
    adminsCanCreateStaff: boolean;
    revenueBasis: "gross" | "net";
    gateway: string;
    emailProvider: string;
    supportEmail: string;
}

const ID = "singleton";

const toDto = (s: {
    fee: number;
    dueDay: number;
    graceDays: number;
    reminderDays: string;
    adminsCanCreateStaff: boolean;
    revenueBasis: string;
    gateway: string;
    emailProvider: string;
    supportEmail: string;
}): SettingsDto => ({
    fee: s.fee,
    dueDay: s.dueDay,
    graceDays: s.graceDays,
    reminderDays: s.reminderDays,
    adminsCanCreateStaff: s.adminsCanCreateStaff,
    revenueBasis: s.revenueBasis === "net" ? "net" : "gross",
    gateway: s.gateway,
    emailProvider: s.emailProvider,
    supportEmail: s.supportEmail,
});

/** Returns the platform settings, creating the row with defaults on first use. */
export async function getSettings(): Promise<SettingsDto> {
    const row = await prisma.platformSettings.upsert({ where: { id: ID }, update: {}, create: { id: ID } });
    return toDto(row);
}

export async function updateSettings(input: SettingsDto, actor: Actor): Promise<SettingsDto> {
    const old = await getSettings();
    const row = await prisma.platformSettings.update({
        where: { id: ID },
        data: { ...input, updatedBy: actor.id },
    });
    const next = toDto(row);

    if (old.fee !== next.fee) await recordAudit(actor, "Updated facilitation fee", `₦${old.fee} → ₦${next.fee}`);
    if (old.dueDay !== next.dueDay || old.graceDays !== next.graceDays || old.reminderDays !== next.reminderDays)
        await recordAudit(actor, "Updated billing schedule", `due day ${next.dueDay}, grace ${next.graceDays}d, reminders ${next.reminderDays}`);
    if (old.adminsCanCreateStaff !== next.adminsCanCreateStaff)
        await recordAudit(
            actor,
            "Changed administrator permissions",
            next.adminsCanCreateStaff ? "Admins may create staff" : "Admins may not create staff",
        );
    if (old.revenueBasis !== next.revenueBasis)
        await recordAudit(actor, "Changed revenue reporting basis", `${old.revenueBasis} → ${next.revenueBasis}`);
    if (old.gateway !== next.gateway || old.emailProvider !== next.emailProvider)
        await recordAudit(actor, "Updated integrations", `gateway: ${next.gateway}, email: ${next.emailProvider}`);
    if (old.supportEmail !== next.supportEmail) await recordAudit(actor, "Updated support email", next.supportEmail);

    return next;
}