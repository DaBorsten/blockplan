"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { dark, shadcn } from "@clerk/themes";
import { useTheme } from "next-themes";
import * as React from "react";
import { deDE } from "@clerk/localizations";

type Props = {
  children: React.ReactNode;
};

export default function ClerkThemingProvider({ children }: Props) {
  const { resolvedTheme } = useTheme();
  const baseTheme = resolvedTheme === "dark" ? dark : shadcn;

  return (
    <ClerkProvider appearance={{ baseTheme }} localization={deDE}>
      {children}
    </ClerkProvider>
  );
}
