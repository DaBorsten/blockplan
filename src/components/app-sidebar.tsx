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

import {
  Bug,
  Calendar,
  CloudDownload,
  Inbox,
  School,
  Settings,
} from "lucide-react";
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
    title: "Verwalten",
    url: "/manage",
    icon: Inbox,
  },
  {
    title: "Importieren",
    url: "/import",
    icon: CloudDownload,
  },
  {
    title: "Klasse",
    url: "/class",
    icon: School,
  },
  {
    title: "DEV",
    url: "/dev",
    icon: Bug,
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
                const active = item.url === "/"
                  ? pathname === "/"
                  : pathname === item.url || pathname.startsWith(item.url + "/");
                return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={active}>
                    <Link href={withParams(item.url)}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );})}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/settings"}>
              <Link href={withParams("/settings") }>
                <Settings />
                <span>Einstellungen</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
