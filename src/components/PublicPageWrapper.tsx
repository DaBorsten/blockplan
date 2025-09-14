"use client";
import React from "react";
import { usePathname } from "next/navigation";
import { Public } from "@/components/Public";
import { PUBLIC_ROUTES } from "@/lib/routes";

export function PublicPageWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (PUBLIC_ROUTES.has(pathname)) {
    return <Public>{children}</Public>;
  }
  return <>{children}</>;
}
