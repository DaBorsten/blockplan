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
} from "@/components/ui/sidebar";

import { Bug, Calendar, CloudDownload, School, Settings } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ClassSelectionCombobox } from "./classSelection";

const items = [
  {
    title: "Stundenplan",
    url: "/",
    icon: Calendar,
  },
  {
    title: "Klassen",
    url: "/class",
    icon: School,
  },
  {
    title: "Importieren",
    url: "/import",
    icon: CloudDownload,
  },
  {
    title: "DEV",
    url: "/dev",
    icon: Bug,
  },
  {
    title: "Einstellaungen",
    url: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const qs = searchParams?.toString() ?? "";
  const withParams = (url: string) => (qs ? `${url}?${qs}` : url);
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
                  item.url === "/"
                    ? pathname === "/"
                    : pathname === item.url ||
                      pathname.startsWith(item.url + "/");
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={active}>
                      <Link href={withParams(item.url)}>
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
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === "/datenschutzhinweis"}
            >
              <Link href={withParams("/datenschutzhinweis")}>
                <span>Datenschutzhinweis</span>
              </Link>
            </SidebarMenuButton>
            <SidebarMenuButton asChild isActive={pathname === "/impressum"}>
              <Link href={withParams("/impressum")}>
                <span>Impressum</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
