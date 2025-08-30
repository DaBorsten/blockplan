import type { Metadata } from "next";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToaster } from "@/components/ThemeToaster";
import { SignedInWrapper } from "@/components/SignedInWrapper";
import { PublicPageWrapper } from "@/components/PublicPageWrapper";
import ClerkThemingProvider from "@/components/ClerkThemingProvider";
// Removed NuqsAdapter & ParamPolicySync after migrating to Zustand state

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Blockplan",
  description: "Blockplan mit Notizen für Timesheet",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ClerkThemingProvider>
            <SignedOut>
                <PublicPageWrapper>
                  {children}
                  <ThemeToaster />
                </PublicPageWrapper>
              </SignedOut>
            <SignedIn>
              <SignedInWrapper>
                {children}
                <ThemeToaster />
              </SignedInWrapper>
            </SignedIn>
          </ClerkThemingProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
