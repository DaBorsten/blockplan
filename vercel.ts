import type { VercelConfig } from "@vercel/config/v1";

export const config: VercelConfig = {
  bunVersion: "1.x",
  buildCommand: 'bunx convex deploy --cmd "bun run build"',
  installCommand: "bun install --only=production",
};
