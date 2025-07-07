import { LucideIcon } from "lucide-react";

export type SettingsListEntry = {
  title: string;
  data: {
    icon?: LucideIcon;
    title: string;
    description?: string;
    destination?: string;
  }[];
};
