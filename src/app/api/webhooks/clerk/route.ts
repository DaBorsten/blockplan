import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { Webhook } from "svix";
import { fetchMutation } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";

// This route handles Clerk webhooks (user.deleted etc.)
// Required env vars:
// - CLERK_WEBHOOK_SECRET : the signing secret from Clerk dashboard for this endpoint
// - CONVEX_URL or NEXT_PUBLIC_CONVEX_URL : base URL of Convex deployment
// - CONVEX_ADMIN_KEY : Convex admin key to call server-side mutation without user auth

function getEnv(name: string): string | undefined {
  return process.env[name];
}
function requireEnv(name: string): string {
  const v = getEnv(name);
  if (!v) throw new Error(`Missing env var ${name}`);
  return v;
}

export async function POST(request: Request) {
  const body = await request.text(); // raw body for signature verification
  const hdrs = await headers();
  const svixId = hdrs.get("svix-id");
  const svixTimestamp = hdrs.get("svix-timestamp");
  const svixSignature = hdrs.get("svix-signature");
  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing Svix headers", { status: 400 });
  }

  let evt: WebhookEvent;
  try {
  const wh = new Webhook(requireEnv("CLERK_WEBHOOK_SECRET"));
    const payload = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    });
    evt = payload as WebhookEvent;
  } catch (err) {
    console.error("Webhook signature verification failed", err);
    return new Response("Invalid signature", { status: 400 });
  }

  console.log(evt);

  if (evt.type === "user.deleted") {
    // The deleted user id
    const clerkUserId = evt.data.id;
    try {
      // Map Clerk user id to tokenIdentifier used in Convex (pattern: `${issuer}|${userId}`)
      // In your auth.config.ts provider you used domain from CLERK_JWT_ISSUER_DOMAIN and applicationID "convex".
      // Clerk tokenIdentifier usually is `${issuer}|${userId}`. We reconstruct it by reading the issuer domain.
      const issuerDomain = requireEnv("CLERK_JWT_ISSUER_DOMAIN");
      const tokenIdentifier = `${issuerDomain}|${clerkUserId}`;

      const adminKey = getEnv("CONVEX_ADMIN_KEY");
      if (!adminKey) {
        console.warn(
          "[clerk webhook] CONVEX_ADMIN_KEY missing - skipping cascade delete for tokenIdentifier",
          tokenIdentifier,
        );
      } else {
        const result = await fetchMutation(
          api.users.deleteUserByTokenIdentifier,
            { tokenIdentifier, secret: adminKey },
        );
        console.log("User deletion cascade result", result);
      }
    } catch (error) {
      console.error("Failed to cascade delete user", error);
      return new Response("Error handling user.deleted", { status: 500 });
    }
  }

  return new Response("ok", { status: 200 });
}
