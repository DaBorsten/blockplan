import getLocalIP from "@/utils/getLocalIP";
import type { NextConfig } from "next";

const isDevelopment = process.env.NEXT_PUBLIC_IS_DEVELOPMENT === "true";
const LOCALHOST = "localhost";
const IPV4_REGEX = /^(\d{1,3}\.){3}\d{1,3}$/;

function resolveLocalIp(): string {
  if (!isDevelopment) return LOCALHOST;

  try {
    const ip = getLocalIP();
    if (typeof ip !== "string") return LOCALHOST;
    return ip === LOCALHOST || IPV4_REGEX.test(ip) ? ip : LOCALHOST;
  } catch {
    return LOCALHOST;
  }
}

const localIP = resolveLocalIp();

function resolveConvexConnectSources(): string {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) return "";

  try {
    const parsed = new URL(convexUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return "";

    const httpOrigin = `${parsed.protocol}//${parsed.host}`;
    const wsProtocol = parsed.protocol === "https:" ? "wss:" : "ws:";
    const wsOrigin = `${wsProtocol}//${parsed.host}`;

    return `${httpOrigin} ${wsOrigin}`;
  } catch {
    return "";
  }
}

const convexConnectSources = isDevelopment ? resolveConvexConnectSources() : "";

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' 
        https://accounts.google.com 
        https://apis.google.com 
        https://clerk.bs1-blockplan.de 
        https://*.clerk.accounts.dev 
        https://vercel.live 
        https://*.vercel.app 
        https://challenges.cloudflare.com;
      connect-src 'self' 
        https://accounts.google.com 
        https://apis.google.com 
        https://clerk.bs1-blockplan.de 
        https://*.clerk.accounts.dev 
        https://vercel.live 
        https://*.vercel.app 
        wss://*.convex.cloud
        ${convexConnectSources};
      frame-src 'self' 
        https://accounts.google.com 
        https://clerk.bs1-blockplan.de 
        https://*.clerk.accounts.dev 
        https://vercel.live 
        https://*.vercel.app 
        https://challenges.cloudflare.com;
      child-src 'self' https://challenges.cloudflare.com;
      img-src 'self' data: https: https://img.clerk.com;
      style-src 'self' 'unsafe-inline';
      font-src 'self' data: https://challenges.cloudflare.com;
      worker-src 'self' blob: https://challenges.cloudflare.com;
      form-action 'self';
      base-uri 'self';
    `
      .replace(/\s{2,}/g, " ")
      .trim(),
  },
];

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  reactCompiler: true,
  experimental: {
    proxyPrefetch: "flexible",
    browserDebugInfoInTerminal: true,
    optimizeCss: true,
    optimizePackageImports: [
      "lucide-react",
      "react-icons",
      "@radix-ui/react-accordion",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-popover",
      "@radix-ui/react-scroll-area",
      "@radix-ui/react-select",
      "@radix-ui/react-tabs",
    ],
  },
  ...(isDevelopment && {
    allowedDevOrigins: [localIP],
  }),
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  async rewrites() {
    if (!isDevelopment) return [];

    return [
      {
        source: "/convex/:path*",
        destination: "http://127.0.0.1:3210/:path*",
      },
    ];
  },
};

export default nextConfig;
