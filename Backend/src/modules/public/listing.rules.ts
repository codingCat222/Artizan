
export const LISTED_WHERE = { status: "Active", verification: "Verified" } as const;

export const isListed = (a: { status: string; verification: string }) =>
    a.status === LISTED_WHERE.status && a.verification === LISTED_WHERE.verification;