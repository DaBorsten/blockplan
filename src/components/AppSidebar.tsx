"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

import { Calendar, CloudDownload, School, Settings } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ClassSelectionCombobox } from "./ClassSelectionCombobox";
import { SiGithub } from "react-icons/si";

// Icons already imported individually above; route constants added below.
import {
  ROUTE_STUNDENPLAN,
  ROUTE_KLASSEN,
  ROUTE_IMPORTIEREN,
  ROUTE_EINSTELLUNGEN,
} from "@/constants/routes";
const items = [
  {
    title: "Stundenplan",
    url: ROUTE_STUNDENPLAN,
    icon: Calendar,
  },
  {
    title: "Klassen",
    url: ROUTE_KLASSEN,
    icon: School,
  },
  {
    title: "Importieren",
    url: ROUTE_IMPORTIEREN,
    icon: CloudDownload,
  },
  {
    title: "Einstellungen",
    url: ROUTE_EINSTELLUNGEN,
    icon: Settings,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar>
      <SidebarHeader>
        <ClassSelectionCombobox />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Blockplan</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active =
                  pathname === item.url || pathname.startsWith(item.url + "/");
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={active} size="lg">
                      <Link
                        href={item.url}
                        onClick={() => setOpenMobile(false)}
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          {process.env.NEXT_PUBLIC_GITHUB_REPO && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild size="lg">
                <Link
                  href={process.env.NEXT_PUBLIC_GITHUB_REPO}
                  onClick={() => setOpenMobile(false)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub Repository (öffnet in neuem Tab)"
                >
                  <SiGithub className="h-5 w-5" />
                  <span>GitHub</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === "/datenschutzhinweis"}
              size="lg"
            >
              <Link
                href="/datenschutzhinweis"
                onClick={() => setOpenMobile(false)}
              >
                <span>Datenschutzhinweis</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            {" "}
            <SidebarMenuButton
              asChild
              isActive={pathname === "/impressum"}
              size="lg"
            >
              <Link href="/impressum" onClick={() => setOpenMobile(false)}>
                <span>Impressum</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
