import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/impressum",
  "/datenschutzhinweis",
]);

export default clerkMiddleware(async (auth, req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    const origin = req.headers.get("origin") || "";
    const allowedExact = ["https://bs1-blockplan.de", "http://localhost:3000"];
    const vercelPattern = /^https:\/\/([a-z0-9-]+\.)?vercel\.app$/i;

    const isAllowed =
      allowedExact.includes(origin) || vercelPattern.test(origin);

    if (!isAllowed) {
      return new Response(null, { status: 403 });
    }

    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        Vary: "Origin",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  const isPublic = isPublicRoute(req);
  if (!isPublic) {
    await auth.protect();
  }

  // You can add CORS headers to normal responses if needed:
  const res = NextResponse.next();
  const origin = req.headers.get("origin") || "";
  const allowedExact = ["https://bs1-blockplan.de", "http://localhost:3000"];
  const vercelPattern = /^https:\/\/([a-z0-9-]+\.)?vercel\.app$/i;

  if (allowedExact.includes(origin) || vercelPattern.test(origin)) {
    res.headers.set("Access-Control-Allow-Origin", origin);
    res.headers.set("Vary", "Origin");
    res.headers.set("Access-Control-Allow-Credentials", "true");
  }
  return res;
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
