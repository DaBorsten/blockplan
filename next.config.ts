import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com https://clerk.bs1-blockplan.de https://*.clerk.accounts.dev https://vercel.live https://*.vercel.app;
      connect-src 'self' https://accounts.google.com https://apis.google.com https://clerk.bs1-blockplan.de https://*.clerk.accounts.dev https://vercel.live https://*.vercel.app;
      frame-src 'self' https://accounts.google.com https://clerk.bs1-blockplan.de https://*.clerk.accounts.dev https://vercel.live https://*.vercel.app;
      img-src 'self' data: https:;
      style-src 'self' 'unsafe-inline';
      font-src 'self' data:;
      worker-src 'self' blob:;
    `
      .replace(/\s{2,}/g, " ")
      .trim(),
  },
];

const nextConfig: NextConfig = {
  experimental: {
    reactCompiler: true,
    middlewarePrefetch: "flexible",
  },
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
