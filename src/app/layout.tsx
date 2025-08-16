import type { Metadata } from "next";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
} from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToaster } from "@/components/ThemeToaster";
import { ClerkUserButton } from "@/components/ClerkUserButton";

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
    <ClerkProvider>
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
            <SignedOut>
              <header className="flex flex-1 justify-end items-center p-4 gap-4 h-16">
                <SignInButton />
                <SignUpButton />
              </header>
            </SignedOut>
            <SignedIn>
              <SidebarProvider>
                <AppSidebar />
                <SidebarInset className="flex flex-col h-screen">
                  <header className="flex shrink-0 items-center justify-between px-4 md:px-6 sticky top-0 z-10 bg-background gap-4 h-16">
                    <SidebarTrigger className="cursor-pointer" />
                    <div className="flex-1" />
                    <ClerkUserButton />
                  </header>
                  <div className="flex-1 min-h-0 overflow-hidden">
                    {children}
                  </div>
                  <ThemeToaster />
                </SidebarInset>
              </SidebarProvider>
            </SignedIn>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
