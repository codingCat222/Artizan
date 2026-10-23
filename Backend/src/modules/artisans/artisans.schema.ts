import { z } from "zod";
import { paginationFields } from "../../utils/pagination";

const emptyQuery = z.object({}).optional();
const idParams = z.object({ id: z.string().min(1) });

const phone = z
    .string()
    .trim()
    .transform((p) => p.replace(/[\s-]/g, ""))
    .refine((p) => /^(0|\+234)\d{10}$/.test(p), "Enter a valid Nigerian phone number (e.g. 08012345678).");

const optionalPhone = z
    .string()
    .trim()
    .transform((p) => p.replace(/[\s-]/g, ""))
    .refine((p) => p === "" || /^(0|\+234)\d{10}$/.test(p), "Enter a valid WhatsApp number.")
    .optional();

const ID_TYPES = ["National ID (NIN)", "Voter's card", "Driver's licence", "International passport"] as const;

const artisanBody = z.object({
    name: z.string().trim().min(2, "Full name is required.").max(120),
    dob: z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date of birth.")]).optional(),
    phone,
    whatsapp: optionalPhone,
    email: z.string().trim().email("Enter a valid email address."),
    businessName: z.string().trim().min(1, "Business name is required.").max(150),
    shopNumber: z.string().trim().max(40).optional(),
    businessAddress: z.string().trim().min(1, "Business address is required.").max(300),
    businessDescription: z.string().trim().max(1000).optional(),
    town: z.string().trim().min(1, "Town / city is required.").max(100),
    area: z.string().trim().min(1, "Specific location is required.").max(150),
    category: z.string().trim().min(1, "Category is required."),
    associationId: z.string().min(1).optional(),
    idType: z.union([z.literal(""), z.enum(ID_TYPES)]).optional(),
    idNumber: z.string().trim().max(60).optional(),
});

const requireIdNumber = (b: { idType?: string; idNumber?: string }) => !b.idType || !!b.idNumber?.trim();

export const createArtisanSchema = z.object({
    body: artisanBody.refine(requireIdNumber, { message: "Enter the ID number for the selected ID type.", path: ["idNumber"] }),
    params: emptyQuery,
    query: emptyQuery,
});

// On edit a blank ID number means "keep the one on file", so it isn't required.
export const updateArtisanSchema = z.object({ body: artisanBody, params: idParams, query: emptyQuery });

export const artisanIdSchema = z.object({ body: z.any().optional(), params: idParams, query: emptyQuery });

export const artisanStatusSchema = z.object({
    body: z.object({ status: z.enum(["Suspended", "Active"]) }),
    params: idParams,
    query: emptyQuery,
});

export const artisanVerificationSchema = z.object({
    body: z.object({ verification: z.enum(["Verified", "Unverified"]) }),
    params: idParams,
    query: emptyQuery,
});

export const listArtisansQuery = z.object({
    q: z.string().max(200).optional(),
    category: z.string().max(80).optional(),
    associationId: z.string().max(60).optional(),
    status: z.enum(["Active", "Overdue", "Pending", "Suspended"]).optional(),
    ...paginationFields,
});

export const listArtisansSchema = z.object({ query: listArtisansQuery, body: z.any().optional(), params: emptyQuery });