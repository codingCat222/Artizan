import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
}

/**
 * Mirrors the frontend's passwordProblem() check (src/lib/format.ts) so
 * client and server validation never disagree.
 */
export function passwordProblem(password: string): string | null {
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return "Use both letters and numbers.";
    return null;
}