"use client";

import React from "react";
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
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ClassSelectionCombobox } from "./classSelection";

// Icons already imported individually above; route constants added below.
import {
  ROUTE_STUNDENPLAN,
  ROUTE_KLASSEN,
  ROUTE_IMPORTIEREN,
  ROUTE_DEV,
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
    title: "DEV",
    url: ROUTE_DEV,
    icon: Bug,
  },
  {
    title: "Einstellungen",
    url: ROUTE_EINSTELLUNGEN,
    icon: Settings,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
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
                    <SidebarMenuButton asChild isActive={active}>
                        <Link href={item.url}>
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
              <Link href="/datenschutzhinweis">
                <span>Datenschutzhinweis</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            {" "}
            <SidebarMenuButton asChild isActive={pathname === "/impressum"}>
              <Link href="/impressum">
                <span>Impressum</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
