import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    const email = process.env.SEED_SUPERADMIN_EMAIL ?? "superadmin@findartisansnigeria.com";
    const password = process.env.SEED_SUPERADMIN_PASSWORD ?? "ChangeMe123";

    const existing = await prisma.staffUser.findUnique({ where: { email } });
    if (existing) {
        console.log(`Super admin already exists: ${email}`);
        return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.staffUser.create({
        data: {
            name: "Super Admin",
            email,
            passwordHash,
            role: "SUPER_ADMIN",
            status: "Active",
        },
    });

    console.log(`Seeded super admin: ${email} / ${password}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });