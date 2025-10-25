import type { NextConfig } from "next";

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
        ws://127.0.0.1:3210 
        ws://192.168.178.45:3210;
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
