// Central route path constants & groups
// Extend here only, consumers import from this module.

export const ROUTE_STUNDENPLAN = "/stundenplan" as const;
export const ROUTE_KLASSEN = "/klassen" as const;
export const ROUTE_KLASSEN_BEITRETEN = "/klassen/beitreten" as const;
export const ROUTE_IMPORTIEREN = "/importieren" as const;
export const ROUTE_DEV = "/dev" as const;
export const ROUTE_EINSTELLUNGEN = "/einstellungen" as const;

// Protected path prefixes (must start with slash). Order not important.
export const PROTECTED_PATH_PREFIXES: readonly string[] = [
  ROUTE_STUNDENPLAN,
  ROUTE_KLASSEN,
  ROUTE_IMPORTIEREN,
  ROUTE_DEV,
  ROUTE_EINSTELLUNGEN,
];

export type ProtectedPathPrefix = (typeof PROTECTED_PATH_PREFIXES)[number];
