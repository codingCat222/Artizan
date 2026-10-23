import { env } from "../../config/env";
import { AppError } from "../../utils/appError";
import { PaymentGateway } from "./gateway.interface";
import { mockGateway } from "./mock.adapter";
import { paystackGateway } from "./paystack.adapter";

/** Paystack when a secret key is configured; the test gateway in development; nothing in production. */
export function getGateway(): PaymentGateway {
    if (env.paystack.secretKey) return paystackGateway;
    if (!env.isProduction) return mockGateway;
    throw new AppError("Online payments are not available right now.", 503);
}

export const gatewayMode = (): "paystack" | "mock" | "none" =>
    env.paystack.secretKey ? "paystack" : env.isProduction ? "none" : "mock";

export { mockGateway };