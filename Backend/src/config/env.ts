import "dotenv/config";
import { parseDurationMs } from "../utils/duration";

function required(name: string, fallback?: string): string {
    const value = process.env[name] ?? fallback;
    if (value === undefined || value === "") {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

export const env = {
    nodeEnv: process.env.NODE_ENV ?? "development",
    isProduction: process.env.NODE_ENV === "production",
    port: Number(process.env.PORT ?? 4000),
    clientUrl: required("CLIENT_URL", "http://localhost:5173"),

    databaseUrl: required("DATABASE_URL"),

    jwt: {
        accessSecret: required("JWT_ACCESS_SECRET"),
        refreshSecret: required("JWT_REFRESH_SECRET"),
        accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",
        refreshExpiresInMs: parseDurationMs(process.env.JWT_REFRESH_EXPIRES_IN ?? "7d"),
    },

    resend: {
        // Treat the placeholder from .env.example as "not configured" so emails
        // are logged to the console in development instead of failing to send.
        apiKey: /^re_your_api_key/.test(process.env.RESEND_API_KEY ?? "") ? "" : process.env.RESEND_API_KEY ?? "",
        emailFrom: process.env.EMAIL_FROM ?? "FindArtisansNigeria <no-reply@findartisansnigeria.com>",
    },

    tokens: {
        activationExpiresInHours: Number(process.env.ACTIVATION_TOKEN_EXPIRES_IN_HOURS ?? 48),
        resetExpiresInHours: Number(process.env.RESET_TOKEN_EXPIRES_IN_HOURS ?? 1),
    },
};