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

import { Bug, Calendar, CloudDownload, Inbox, Settings } from "lucide-react";
import { usePathname } from "next/navigation";
import { ModeToggle } from "./theme-toggle";

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
        <div className="flex justify-between space-x-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-md flex items-center justify-center">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <h1 className=" font-bold text-slate-800 dark:text-white">
              Blockplan
            </h1>
          </div>
          <ModeToggle />
        </div>
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
