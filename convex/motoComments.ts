import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { v } from "convex/values";

const MAX_COMMENT_LENGTH = 500;

async function isMotoVisibleInCommunityFeed(
  ctx: QueryCtx | MutationCtx,
  motoId: Id<"motos">
) {
  const configs = await ctx.db
    .query("configs")
    .withIndex("by_moto", (q) => q.eq("motoId", motoId))
    .collect();

  return configs.some(
    (config) => config.visibility === "public" || config.isPublic
  );
}

// Récupérer les commentaires d'une moto visible dans le feed
export const getByMotoPublic = query({
  args: { motoId: v.id("motos") },
  handler: async (ctx, args) => {
    const isVisible = await isMotoVisibleInCommunityFeed(ctx, args.motoId);
    if (!isVisible) return [];

    const comments = await ctx.db
      .query("motoComments")
      .withIndex("by_moto", (q) => q.eq("motoId", args.motoId))
      .collect();

    const sorted = comments.sort((a, b) => a.createdAt - b.createdAt);

    return Promise.all(
      sorted.map(async (comment) => {
        const user = await ctx.db.get(comment.userId);
        return {
          ...comment,
          user: user
            ? {
                _id: user._id,
                name: user.name,
                username: user.username,
                imageUrl: user.imageUrl,
              }
            : null,
        };
      })
    );
  },
});

// Ajouter un commentaire sur une moto du feed
export const create = mutation({
  args: {
    userId: v.id("users"),
    motoId: v.id("motos"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }

    const moto = await ctx.db.get(args.motoId);
    if (!moto) {
      throw new Error("Moto non trouvée");
    }

    const isVisible = await isMotoVisibleInCommunityFeed(ctx, args.motoId);
    if (!isVisible) {
      throw new Error("Cette moto n'est pas visible dans le feed communauté");
    }

    const content = args.content.trim();
    if (!content) {
      throw new Error("Le commentaire ne peut pas être vide");
    }
    if (content.length > MAX_COMMENT_LENGTH) {
      throw new Error(`Commentaire trop long (max ${MAX_COMMENT_LENGTH} caractères)`);
    }

    const now = Date.now();
    return ctx.db.insert("motoComments", {
      motoId: args.motoId,
      userId: args.userId,
      content,
      createdAt: now,
      updatedAt: now,
    });
  },
});
