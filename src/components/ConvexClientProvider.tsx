"use client";

import { ReactNode } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth } from "@clerk/nextjs";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const isDevelopment = process.env.NEXT_PUBLIC_IS_DEVELOPMENT === "true";

if (!convexUrl) {
  throw new Error("Missing NEXT_PUBLIC_CONVEX_URL in your .env file");
}

function resolveConvexClientUrl(url: string): string {
  if (!isDevelopment) return url;
  if (typeof window === "undefined") return url;

  try {
    const parsed = new URL(url);
    const isLoopbackHost =
      parsed.hostname === "127.0.0.1" ||
      parsed.hostname === "localhost" ||
      parsed.hostname === "[::1]";

    if (!isLoopbackHost) return url;

    return `${window.location.origin}/convex`;
  } catch {
    return url;
  }
}

const convex = new ConvexReactClient(resolveConvexClientUrl(convexUrl));

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}
