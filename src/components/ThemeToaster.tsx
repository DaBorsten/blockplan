"use client";
import { useTheme } from "next-themes";
import { Toaster } from "sonner";
export function ThemeToaster() {
  const { theme } = useTheme();
  return (
    <Toaster
      position="top-center"
      richColors
      closeButton
      theme={
        theme === "light" || theme === "dark" || theme === "system"
          ? theme
          : "system"
      }
    />
  );
}
