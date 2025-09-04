import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { corsMiddleware } from "./middleware-cors";

const isPublicRoute = createRouteMatcher([
  "/",
  "/impressum",
  "/datenschutzhinweis",
]);

export default clerkMiddleware(async (auth, req) => {
  const cors = corsMiddleware(req);
  if (cors) return cors;

  const isPublic = isPublicRoute(req);
  if (!isPublic) {
    await auth.protect();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
