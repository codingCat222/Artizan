import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => {
    const m = () => vi.fn();
    const prisma: any = {
        artisan: { findMany: m(), findFirst: m(), count: m(), groupBy: m() },
        category: { findMany: m() },
    };
    return { prisma };
});
vi.mock("../src/config/prisma", () => ({ prisma: db.prisma }));

beforeAll(() => {
    process.env.DATABASE_URL = "sqlserver://localhost:1433;database=test";
    process.env.JWT_ACCESS_SECRET = "a";
    process.env.JWT_REFRESH_SECRET = "b";
});

const row = (over: any = {}) => ({
    id: "c1", name: "Ada Obi", avatarInitials: "AO", category: "Tailoring", businessName: "Ada Stitches",
    businessDescription: "x".repeat(300), area: "Kuto", town: "Abeokuta", association: { name: "Tailors" }, ...over,
});

beforeEach(() => vi.clearAllMocks());

describe("public directory service", () => {
    it("only ever searches active, verified artisans, whatever the filters", async () => {
        const { searchArtisans } = await import("../src/modules/public/public.service");
        db.prisma.artisan.count.mockResolvedValue(0);
        db.prisma.artisan.findMany.mockResolvedValue([]);
        await searchArtisans({ category: "Tailoring", town: "Abeokuta", area: "Kuto", page: 2, pageSize: 12 });
        const where = db.prisma.artisan.count.mock.calls[0][0].where;
        expect(where).toMatchObject({ status: "Active", verification: "Verified", category: "Tailoring", town: "Abeokuta", area: { contains: "Kuto" } });
        expect(db.prisma.artisan.findMany.mock.calls[0][0]).toMatchObject({ skip: 12, take: 12, orderBy: { name: "asc" } });
    });

    it("uses a whitelist of fields, so private data can't be selected", async () => {
        const { searchArtisans, getPublicProfile } = await import("../src/modules/public/public.service");
        db.prisma.artisan.count.mockResolvedValue(1);
        db.prisma.artisan.findMany.mockResolvedValue([row()]);
        await searchArtisans({ page: 1, pageSize: 12 });
        const selected = Object.keys(db.prisma.artisan.findMany.mock.calls[0][0].select);
        for (const secret of ["email", "idNumber", "idType", "dob", "passwordHash", "createdBy", "verifiedBy", "phone", "status"]) {
            expect(selected).not.toContain(secret);
        }
        db.prisma.artisan.findFirst.mockResolvedValue({ ...row(), phone: "0801", whatsapp: null, businessAddress: "1 Road", shopNumber: "B2" });
        await getPublicProfile("c1");
        const profileSelected = Object.keys(db.prisma.artisan.findFirst.mock.calls[0][0].select);
        for (const secret of ["email", "idNumber", "idType", "dob", "passwordHash", "createdBy"]) {
            expect(profileSelected).not.toContain(secret);
        }
    });

    it("shortens descriptions in lists but gives the full text on the profile", async () => {
        const { searchArtisans, getPublicProfile } = await import("../src/modules/public/public.service");
        db.prisma.artisan.count.mockResolvedValue(1);
        db.prisma.artisan.findMany.mockResolvedValue([row()]);
        expect((await searchArtisans({ page: 1, pageSize: 12 })).items[0].description).toHaveLength(160);
        db.prisma.artisan.findFirst.mockResolvedValue({ ...row(), phone: "0801", whatsapp: null, businessAddress: "1 Road", shopNumber: "B2" });
        const p = await getPublicProfile("c1");
        expect(p.description).toHaveLength(300);
        expect(p).toMatchObject({ phone: "0801", whatsapp: "", address: "B2, 1 Road", verified: true });
    });

    it("an unlisted or unknown artisan is a plain 404", async () => {
        const { getPublicProfile } = await import("../src/modules/public/public.service");
        db.prisma.artisan.findFirst.mockResolvedValue(null);
        await expect(getPublicProfile("suspended-one")).rejects.toMatchObject({ statusCode: 404 });
        expect(db.prisma.artisan.findFirst.mock.calls[0][0].where).toMatchObject({ id: "suspended-one", status: "Active", verification: "Verified" });
    });

    it("filters list active categories and only towns that have listed artisans", async () => {
        const { getFilters } = await import("../src/modules/public/public.service");
        db.prisma.category.findMany.mockResolvedValue([{ name: "Plumbing" }, { name: "Tailoring" }]);
        db.prisma.artisan.groupBy.mockResolvedValue([{ town: "Abeokuta" }, { town: "" }, { town: "Ijebu-Ode" }]);
        db.prisma.artisan.count.mockResolvedValue(9);
        const f = await getFilters();
        expect(f).toEqual({ categories: ["Plumbing", "Tailoring"], towns: ["Abeokuta", "Ijebu-Ode"], listedCount: 9 });
        expect(db.prisma.category.findMany.mock.calls[0][0].where).toEqual({ status: "Active" });
        expect(db.prisma.artisan.groupBy.mock.calls[0][0].where).toMatchObject({ status: "Active", verification: "Verified" });
    });
});

describe("public directory over HTTP", () => {
    async function withServer(fn: (base: string) => Promise<void>) {
        const { default: app } = await import("../src/app");
        const server = app.listen(0);
        try {
            await fn(`http://127.0.0.1:${(server.address() as { port: number }).port}/api/public`);
        } finally {
            server.close();
        }
    }

    it("works without logging in and never leaks contact or login details in lists", async () => {
        db.prisma.artisan.count.mockResolvedValue(1);
        db.prisma.artisan.findMany.mockResolvedValue([row({ email: "secret@x.com", phone: "0801" })]);
        await withServer(async (base) => {
            const res = await fetch(`${base}/artisans?category=Tailoring&town=&area=`);
            expect(res.status).toBe(200);
            const text = await res.text();
            expect(text).toContain("Ada Obi");
            expect(text).not.toContain("secret@x.com");
            expect(text).not.toContain("0801");
        });
    });

    it("treats blank form fields as 'no filter' and rejects silly paging", async () => {
        db.prisma.artisan.count.mockResolvedValue(0);
        db.prisma.artisan.findMany.mockResolvedValue([]);
        await withServer(async (base) => {
            expect((await fetch(`${base}/artisans?category=&town=&area=&page=1`)).status).toBe(200);
            const where = db.prisma.artisan.count.mock.calls[0][0].where;
            expect(where).not.toHaveProperty("category");
            expect((await fetch(`${base}/artisans?page=0`)).status).toBe(400);
            expect((await fetch(`${base}/artisans?pageSize=500`)).status).toBe(400);
        });
    });

    it("returns 404 for a profile that isn't listed", async () => {
        db.prisma.artisan.findFirst.mockResolvedValue(null);
        await withServer(async (base) => {
            expect((await fetch(`${base}/artisans/nope`)).status).toBe(404);
        });
    });
});