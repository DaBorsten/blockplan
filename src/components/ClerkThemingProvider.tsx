"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { dark, shadcn } from "@clerk/themes";
import { useTheme } from "next-themes";
import * as React from "react";

type Props = {
  children: React.ReactNode;
};

export default function ClerkThemingProvider({ children }: Props) {
  const { resolvedTheme } = useTheme();
  const baseTheme = resolvedTheme === "dark" ? dark : shadcn;

  return (
    <ClerkProvider appearance={{ baseTheme }}>{children}</ClerkProvider>
  );
}
