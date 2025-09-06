import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { corsMiddleware } from "./middleware-cors";

const isProtectedRoute = createRouteMatcher([
  "/dev(.*)",
  "/einstellungen(.*)",
  "/importieren(.*)",
  "/klassen(.*)",
  "/stundenplan(.*)",
  "/willkommen(.*)",
  "/api/(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const cors = corsMiddleware(req);
  if (cors) return cors;

  if (isProtectedRoute(req)) {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.redirect(new URL("/api/auth/sign-in", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api|trpc)(.*)"],
};
