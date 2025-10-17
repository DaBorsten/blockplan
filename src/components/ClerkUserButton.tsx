"use client";

import { UserButton } from "@clerk/nextjs";
import { dark, shadcn } from "@clerk/themes";
import { useTheme } from "next-themes";

export function ClerkUserButton() {
  const { resolvedTheme } = useTheme();

  return (
    <UserButton
      appearance={{ theme: resolvedTheme === "dark" ? dark : shadcn }}
    />
  );
}
