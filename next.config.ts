import getLocalIP from "@/utils/getLocalIP";
import type { NextConfig } from "next";

const isDevelopment = process.env.NEXT_PUBLIC_IS_DEVELOPMENT === "true";
let localIP = "localhost";
if (isDevelopment) {
  try {
    const ip = getLocalIP();
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (
      ip &&
      typeof ip === "string" &&
      (ip === "localhost" || ipv4Regex.test(ip))
    ) {
      localIP = ip;
    }
  } catch (error) {
    console.error("Failed to get local IP, falling back to localhost:", error);
  }
}

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
        ${isDevelopment ? `ws://127.0.0.1:3210 ws://${localIP}:3210` : ""};
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
};

export default nextConfig;
