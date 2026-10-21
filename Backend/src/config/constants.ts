export const ROLES = ["ARTISAN", "ADMIN", "ASSOCIATION_HEAD", "SUPER_ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const STAFF_ROLES = ["ADMIN", "ASSOCIATION_HEAD", "SUPER_ADMIN"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export const COOKIE_NAMES = {
    refreshToken: "aan_refresh_token",
} as const;

export const ARTISAN_STATUS = ["Active", "Overdue", "Pending", "Suspended"] as const;
export type ArtisanStatus = (typeof ARTISAN_STATUS)[number];

export const STAFF_STATUS = ["Active", "Disabled"] as const;
export type StaffStatus = (typeof STAFF_STATUS)[number];