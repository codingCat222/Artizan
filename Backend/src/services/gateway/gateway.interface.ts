export interface InitializeInput {
    email: string;
    /** Amount in naira (the adapter converts to the gateway's unit). */
    amount: number;
    reference: string;
    callbackUrl: string;
    metadata?: Record<string, string>;
}

export type VerifyStatus = "success" | "failed" | "pending";

export interface VerifyResult {
    status: VerifyStatus;
    /** Amount the gateway actually collected, in kobo. Always compared with what we expected. */
    amountKobo: number;
    /** Gateway charges in naira (0 if unknown). */
    fee: number;
    paidAt?: Date;
}

export interface PaymentGateway {
    readonly mode: "paystack" | "mock";
    initialize(input: InitializeInput): Promise<{ authorizationUrl: string }>;
    verify(reference: string): Promise<VerifyResult>;
}