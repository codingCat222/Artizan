import { beforeAll, describe, expect, it } from "vitest";

// Required env vars must exist before the app modules are imported.
beforeAll(() => {
    process.env.DATABASE_URL = "sqlserver://localhost:1433;database=test";
    process.env.JWT_ACCESS_SECRET = "test-access-secret";
    process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
    process.env.RESEND_API_KEY = "re_your_api_key_here";
});

describe("password helpers", () => {
    it("hashes and verifies", async () => {
        const { hashPassword, comparePassword } = await import("../src/utils/password");
        const hash = await hashPassword("Secret123");
        expect(hash).not.toBe("Secret123");
        expect(await comparePassword("Secret123", hash)).toBe(true);
        expect(await comparePassword("Wrong123", hash)).toBe(false);
    });

    it("enforces the password policy", async () => {
        const { passwordProblem } = await import("../src/utils/password");
        expect(passwordProblem("short1")).toMatch(/8 characters/);
        expect(passwordProblem("onlyletters")).toMatch(/letters and numbers/);
        expect(passwordProblem("12345678")).toMatch(/letters and numbers/);
        expect(passwordProblem("Valid1234")).toBeNull();
    });
});

describe("tokens", () => {
    it("signs and verifies an access token", async () => {
        const { signAccessToken, verifyAccessToken } = await import("../src/utils/token");
        const token = signAccessToken({ sub: "u1", role: "ADMIN", userType: "STAFF", associationId: null });
        const payload = verifyAccessToken(token);
        expect(payload.sub).toBe("u1");
        expect(payload.role).toBe("ADMIN");
    });

    it("rejects a tampered access token", async () => {
        const { signAccessToken, verifyAccessToken } = await import("../src/utils/token");
        const token = signAccessToken({ sub: "u1", role: "ADMIN", userType: "STAFF" });
        expect(() => verifyAccessToken(token.slice(0, -2) + "xx")).toThrow();
    });

    it("does not accept a refresh token as an access token", async () => {
        const { signRefreshToken, verifyAccessToken } = await import("../src/utils/token");
        const refresh = signRefreshToken({ sub: "u1", userType: "STAFF", jti: "abc" });
        expect(() => verifyAccessToken(refresh)).toThrow();
    });

    it("generates opaque tokens whose hash is stable and not the token itself", async () => {
        const { generateOpaqueToken, hashOpaqueToken } = await import("../src/utils/token");
        const { token, hash } = generateOpaqueToken();
        expect(token).toHaveLength(64);
        expect(hash).not.toBe(token);
        expect(hashOpaqueToken(token)).toBe(hash);
    });
});

describe("duration parsing", () => {
    it("parses units", async () => {
        const { parseDurationMs } = await import("../src/utils/duration");
        expect(parseDurationMs("30m")).toBe(30 * 60_000);
        expect(parseDurationMs("12h")).toBe(12 * 3_600_000);
        expect(parseDurationMs("7d")).toBe(7 * 86_400_000);
        expect(() => parseDurationMs("soon")).toThrow();
    });
});

describe("request schemas", () => {
    it("requires identifier and password on login", async () => {
        const { loginSchema } = await import("../src/modules/auth/auth.schema");
        expect(loginSchema.safeParse({ body: { identifier: "a@b.com", password: "x" } }).success).toBe(true);
        expect(loginSchema.safeParse({ body: { identifier: "", password: "x" } }).success).toBe(false);
        expect(loginSchema.safeParse({ body: { identifier: "a@b.com", password: "" } }).success).toBe(false);
    });

    it("applies the password policy on reset/activate", async () => {
        const { resetPasswordSchema, activateAccountSchema } = await import("../src/modules/auth/auth.schema");
        expect(resetPasswordSchema.safeParse({ body: { token: "t", password: "weak" } }).success).toBe(false);
        expect(resetPasswordSchema.safeParse({ body: { token: "t", password: "Strong123" } }).success).toBe(true);
        expect(activateAccountSchema.safeParse({ body: { token: "t", password: "Strong123" } }).success).toBe(true);
    });

    it("rejects reusing the current password", async () => {
        const { changePasswordSchema } = await import("../src/modules/auth/auth.schema");
        const same = changePasswordSchema.safeParse({ body: { currentPassword: "Same1234", newPassword: "Same1234" } });
        expect(same.success).toBe(false);
        const ok = changePasswordSchema.safeParse({ body: { currentPassword: "Old12345", newPassword: "New12345" } });
        expect(ok.success).toBe(true);
    });
});

describe("middleware", () => {
    const run = (mw: any, req: any) => {
        let err: any;
        mw(req, {}, (e?: any) => (err = e));
        return err;
    };

    it("authenticate rejects missing and bad tokens, accepts good ones", async () => {
        const { authenticate } = await import("../src/middleware/authenticate");
        const { signAccessToken } = await import("../src/utils/token");

        expect(run(authenticate, { headers: {} }).statusCode).toBe(401);
        expect(run(authenticate, { headers: { authorization: "Bearer nonsense" } }).statusCode).toBe(401);

        const req: any = {
            headers: { authorization: `Bearer ${signAccessToken({ sub: "u1", role: "ADMIN", userType: "STAFF" })}` },
        };
        expect(run(authenticate, req)).toBeUndefined();
        expect(req.user.sub).toBe("u1");
    });

    it("authorize enforces roles", async () => {
        const { authorize } = await import("../src/middleware/authorize");
        expect(run(authorize("SUPER_ADMIN"), { user: { role: "ADMIN" } }).statusCode).toBe(403);
        expect(run(authorize("SUPER_ADMIN", "ADMIN"), { user: { role: "ADMIN" } })).toBeUndefined();
        expect(run(authorize("ADMIN"), {}).statusCode).toBe(401);
    });
});

describe("email templates", () => {
    it("escapes user-supplied names", async () => {
        const { activationEmail } = await import("../src/services/email/templates/activation");
        const { html } = activationEmail({ name: "<script>alert(1)</script>", activationUrl: "http://x/activate?token=t" });
        expect(html).not.toContain("<script>");
        expect(html).toContain("&lt;script&gt;");
    });
});