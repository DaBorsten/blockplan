"use client";
import { usePathname } from "next/navigation";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ClerkUserButton } from "@/components/ClerkUserButton";
import ClassRouteSync from "@/components/ClassRouteSync";
import NicknameGuard from "@/components/NicknameGuard";
import { ThemeToaster } from "@/components/ThemeToaster";
import React from "react";
import Public from "@/components/Public";
import { PUBLIC_ROUTES } from "@/lib/routes";
import { NuqsAdapter } from "nuqs/adapters/next/app";

interface Props {
  children: React.ReactNode;
}

export function SignedInWrapper({ children }: Props) {
  const pathname = usePathname();
  const isPublicRoute = [...PUBLIC_ROUTES].some(
    (route) =>
      route === pathname || (route !== "/" && pathname.startsWith(route + "/")),
  );

  // Always sync class parameter on all protected routes

  if (isPublicRoute) {
    return (
      <Public>
        {children}
      </Public>
    );
  }

  return (
    <NuqsAdapter>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="flex flex-col h-screen">
          <ClassRouteSync />
          <NicknameGuard />
          <header
            className="flex shrink-0 items-center justify-between px-4 md:px-6 sticky top-0 z-10 bg-background gap-4 h-16"
            role="banner"
          >
            <SidebarTrigger
              className="cursor-pointer"
              aria-label="Seitenleiste umschalten"
            />
            <div className="flex-1" />
            <ClerkUserButton />
          </header>
          <main className="flex-1 min-h-0">{children}</main>
          <ThemeToaster />
        </SidebarInset>
      </SidebarProvider>
    </NuqsAdapter>
  );
}
