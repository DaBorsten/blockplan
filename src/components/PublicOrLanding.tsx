"use client";

import { usePathname } from "next/navigation";
import LandingPage from "@/components/LandingPage";
import * as React from "react";

const PUBLIC_PATHS = new Set([
  "/impressum",
  "/datenschutzhinweis",
  "/dev",
]);

type Props = { children: React.ReactNode };

export default function PublicOrLanding({ children }: Props) {
  const pathname = usePathname();
  if (pathname && PUBLIC_PATHS.has(pathname)) {
    return <>{children}</>; // show page content itself
  }
  return <LandingPage />;
}
