import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Like une config
export const like = mutation({
  args: { configId: v.id("configs") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non authentifié");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("Utilisateur non trouvé");

    // Vérifier si déjà liké
    const existingLike = await ctx.db
      .query("configLikes")
      .withIndex("by_user_config", (q) =>
        q.eq("userId", user._id).eq("configId", args.configId)
      )
      .first();

    if (existingLike) {
      throw new Error("Config déjà likée");
    }

    // Ajouter le like
    await ctx.db.insert("configLikes", {
      userId: user._id,
      configId: args.configId,
      createdAt: Date.now(),
    });

    // Incrémenter le compteur de likes sur la config
    const config = await ctx.db.get(args.configId);
    if (config) {
      await ctx.db.patch(args.configId, {
        likes: (config.likes || 0) + 1,
      });
    }

    return { success: true };
  },
});

// Retirer le like d'une config
export const unlike = mutation({
  args: { configId: v.id("configs") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non authentifié");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("Utilisateur non trouvé");

    // Trouver le like existant
    const existingLike = await ctx.db
      .query("configLikes")
      .withIndex("by_user_config", (q) =>
        q.eq("userId", user._id).eq("configId", args.configId)
      )
      .first();

    if (!existingLike) {
      throw new Error("Config non likée");
    }

    // Supprimer le like
    await ctx.db.delete(existingLike._id);

    // Décrémenter le compteur de likes sur la config
    const config = await ctx.db.get(args.configId);
    if (config && (config.likes || 0) > 0) {
      await ctx.db.patch(args.configId, {
        likes: (config.likes || 0) - 1,
      });
    }

    return { success: true };
  },
});

// Toggle like/unlike
export const toggleLike = mutation({
  args: { 
    userId: v.id("users"),
    configId: v.id("configs") 
  },
  handler: async (ctx, args) => {
    // Vérifier si déjà liké
    const existingLike = await ctx.db
      .query("configLikes")
      .withIndex("by_user_config", (q) =>
        q.eq("userId", args.userId).eq("configId", args.configId)
      )
      .first();

    const config = await ctx.db.get(args.configId);
    if (!config) throw new Error("Config non trouvée");

    if (existingLike) {
      // Unlike
      await ctx.db.delete(existingLike._id);
      await ctx.db.patch(args.configId, {
        likes: Math.max((config.likes || 0) - 1, 0),
      });
      return { liked: false };
    } else {
      // Like
      await ctx.db.insert("configLikes", {
        userId: args.userId,
        configId: args.configId,
        createdAt: Date.now(),
      });
      await ctx.db.patch(args.configId, {
        likes: (config.likes || 0) + 1,
      });
      return { liked: true };
    }
  },
});

// Récupérer les IDs des configs likées par l'utilisateur
export const getLikedIds = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const likes = await ctx.db
      .query("configLikes")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    return likes.map((l) => l.configId);
  },
});

// Vérifier si une config est likée
export const isLiked = query({
  args: { configId: v.id("configs") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) return false;

    const existingLike = await ctx.db
      .query("configLikes")
      .withIndex("by_user_config", (q) =>
        q.eq("userId", user._id).eq("configId", args.configId)
      )
      .first();

    return !!existingLike;
  },
});
