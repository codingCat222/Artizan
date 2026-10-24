import rateLimit from "express-rate-limit";

/** Tighter limiter for auth endpoints (login, forgot-password) to slow brute force. */
export const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many attempts. Please try again in a few minutes." },
});
/** Public directory endpoints need no login, so cap how fast one visitor can pull data (anti-scraping). */
export const publicRateLimit = rateLimit({
    windowMs: 60 * 1000,
    limit: 120,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests. Please slow down and try again shortly." },
});