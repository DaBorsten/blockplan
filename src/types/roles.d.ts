export const USER_ROLES = ["owner", "admin", "member"] as const;
export type UserRole = (typeof USER_ROLES)[number];
