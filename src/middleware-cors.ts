import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const allowedExact = ["https://bs1-blockplan.de", "http://localhost:3000"];
const vercelPattern = /^https:\/\/([a-z0-9-]+\.)?vercel\.app$/i;

export function corsMiddleware(req: NextRequest) {
  const origin = req.headers.get("origin") || "";

  const isAllowed = allowedExact.includes(origin) || vercelPattern.test(origin);

  // Preflight
  if (req.method === "OPTIONS") {
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

  const res = NextResponse.next();
  if (isAllowed) {
    res.headers.set("Access-Control-Allow-Origin", origin);
    res.headers.set("Vary", "Origin");
    res.headers.set("Access-Control-Allow-Credentials", "true");
  }
  return res;
}
