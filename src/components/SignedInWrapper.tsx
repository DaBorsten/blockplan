"use client";
import { usePathname } from "next/navigation";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ClerkUserButton } from "@/components/ClerkUserButton";
import { ReactNode } from "react";
import { Public } from "@/components/Public";
import { PUBLIC_ROUTES } from "@/lib/routes";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { StoresValidityGuard } from "@/components/StoresValidityGuard";

interface Props {
  children: ReactNode;
}

export function SignedInWrapper({ children }: Props) {
  const pathname = usePathname();
  const isPublicRoute = [...PUBLIC_ROUTES].some(
    (route) =>
      route === pathname || (route !== "/" && pathname.startsWith(route + "/")),
  );

  // Always sync class parameter on all protected routes

  if (isPublicRoute) {
    return <Public>{children}</Public>;
  }

  return (
    <>
      {/* Skip link for keyboard and screen reader users */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Zum Inhalt springen
      </a>
      <NuqsAdapter>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="flex flex-col h-dvh">
            <StoresValidityGuard>
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
              <main id="main" className="flex-1 min-h-0">
                {children}
              </main>
            </StoresValidityGuard>
          </SidebarInset>
        </SidebarProvider>
      </NuqsAdapter>
    </>
  );
}
