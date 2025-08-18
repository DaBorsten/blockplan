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
import { usePathname } from "next/navigation";
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
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/settings"}>
              <a href="/settings">
                <Settings />
                <span>Einstellungen</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
