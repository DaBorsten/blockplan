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
        alt: "Stundenplan mit Notizen | Blockplan",
      },
    ],
  },
  alternates: { canonical: "/" },
};

export const dynamic = "force-dynamic";

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
