import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToaster } from "@/components/ThemeToaster";
import { AppShell } from "@/components/AppShell";
import { ClerkThemingProvider } from "@/components/ClerkThemingProvider";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { TooltipProvider } from "@/components/ui/tooltip";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: true
});

export const metadata: Metadata = {
  metadataBase: new URL("https://bs1-blockplan.de"),
  title: "Stundenplan mit Notizen | Blockplan",
  description:
    "Organisiere Unterricht, erfasse Notizen pro Stunde und arbeite in Klassen zusammen.",
  openGraph: {
    title: "Stundenplan mit Notizen | Blockplan",
    description:
      "Organisiere Unterricht, erfasse Notizen pro Stunde und arbeite in Klassen zusammen.",
    url: "/",
    type: "website",
    siteName: "Blockplan",
    locale: "de_DE",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "Stundenplan mit Notizen | Blockplan"
      }
    ]
  },
  alternates: { canonical: "/" },
  icons: {
    icon: [{ url: "/favicon.ico", sizes: "48x48" }],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ]
  },
  appleWebApp: {
    title: "Blockplan",
    statusBarStyle: "black-translucent",
    capable: true,
    startupImage: {
      url: "/apple-touch-icon.png",
      media:
        "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)"
    }
  }
};

export default function RootLayout({
  children
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
          <TooltipProvider>
            <ClerkThemingProvider>
              <ConvexClientProvider>
                <AppShell>
                  <ThemeToaster />
                  {children}
                </AppShell>
              </ConvexClientProvider>
            </ClerkThemingProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
