import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * initUser mutation
 * - Liest die aktuelle Identity (Clerk via JWT -> tokenIdentifier)
 * - Legt bei erstem Aufruf einen User an (nickname + tokenIdentifier)
 * - Aktualisiert optional den Nickname, falls bereits vorhanden und neuer Nickname übergeben wurde
 *
 * Sicherheitsaspekt: Kein Fremd-User kann erzeugt werden, da die Clerk Identity aus dem Request kommt.
 */
export const initUser = mutation({
  args: { nickname: v.string() },
  handler: async (ctx, { nickname }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("UNAUTHORIZED");

    const tokenIdentifier = identity.tokenIdentifier;
    if (!tokenIdentifier) throw new Error("MISSING_TOKEN_IDENTIFIER");

    // Versuchen bestehenden User zu finden
    const existing = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenIdentifier))
      .unique();

    if (!existing) {
      const id = await ctx.db.insert("users", {
        nickname,
        tokenIdentifier,
      });
      return { id, nickname, tokenIdentifier, created: true };
    }

    // Falls Nickname anders -> updaten
    if (existing.nickname !== nickname) {
      await ctx.db.patch(existing._id, { nickname });
    }

    return {
      id: existing._id,
      nickname,
      tokenIdentifier,
      created: false,
    };
  },
});
