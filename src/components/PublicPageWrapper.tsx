"use client";
import React from "react";
import { usePathname } from "next/navigation";
import { Public } from "@/components/Public";
import { PUBLIC_ROUTES } from "@/lib/routes";

export function PublicPageWrapper({ children, className }: { children: React.ReactNode; className?: string }) {
  const pathname = usePathname();
  if (PUBLIC_ROUTES.has(pathname)) {
    return <Public className={className}>{children}</Public>;
  }
  return <div className={className}>{children}</div>;
}
