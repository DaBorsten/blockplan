import { getAuth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

/**
 * Returns authenticated user id or null (no throw).
 */
export function getAuthUserId(req: NextRequest): string | null {
  const { userId } = getAuth(req);
  return userId ?? null;
}

/**
 * Ensures a user is authenticated. If not, throws an Error with name 'Unauthenticated'.
 * Route handlers should catch and map to 401.
 */
export function requireAuthUserId(req: NextRequest): string {
  const id = getAuthUserId(req);
  if (!id) {
    const err: Error & { status?: number } = new Error("Unauthenticated");
    err.status = 401;
    err.name = 'Unauthenticated';
    throw err;
  }
  return id;
}
