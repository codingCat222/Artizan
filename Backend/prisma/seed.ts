import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_CATEGORIES = [
    { name: "Tailoring", description: "Garment making and alterations" },
    { name: "Electrical", description: "Wiring, installation, repairs" },
    { name: "Plumbing", description: "Pipe fitting and water systems" },
    { name: "Carpentry", description: "Furniture and woodwork" },
    { name: "Mechanics", description: "Auto repair and servicing" },
    { name: "Painting", description: "Building and decorative painting" },
    { name: "Welding", description: "Metal fabrication and welding" },
];

async function seedSuperAdmin() {
    const email = process.env.SEED_SUPERADMIN_EMAIL ?? "superadmin@findartisansnigeria.com";
    const password = process.env.SEED_SUPERADMIN_PASSWORD ?? "ChangeMe123";

    const existing = await prisma.staffUser.findUnique({ where: { email } });
    if (existing) {
        console.log(`Super admin already exists: ${email}`);
        return;
    }

    await prisma.staffUser.create({
        data: {
            name: "Super Admin",
            email,
            passwordHash: await bcrypt.hash(password, 12),
            role: "SUPER_ADMIN",
            status: "Active",
        },
    });
    console.log(`Seeded super admin: ${email} / ${password}`);
}

/** Only fills in categories when the table is empty, so edits made in the app are never overwritten. */
async function seedCategories() {
    if ((await prisma.category.count()) > 0) {
        console.log("Categories already exist, skipping.");
        return;
    }
    await prisma.category.createMany({ data: DEFAULT_CATEGORIES });
    console.log(`Seeded ${DEFAULT_CATEGORIES.length} categories.`);
}

async function main() {
    await seedSuperAdmin();
    await seedCategories();
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });