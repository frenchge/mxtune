import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Sauvegarder une config
export const save = mutation({
  args: {
    userId: v.id("users"),
    configId: v.id("configs"),
  },
  handler: async (ctx, args) => {
    // Vérifier si déjà sauvegardée
    const existing = await ctx.db
      .query("savedConfigs")
      .withIndex("by_user_config", (q) => 
        q.eq("userId", args.userId).eq("configId", args.configId)
      )
      .first();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("savedConfigs", {
      userId: args.userId,
      configId: args.configId,
      createdAt: Date.now(),
    });
  },
});

// Retirer une config sauvegardée
export const unsave = mutation({
  args: {
    userId: v.id("users"),
    configId: v.id("configs"),
  },
  handler: async (ctx, args) => {
    const saved = await ctx.db
      .query("savedConfigs")
      .withIndex("by_user_config", (q) => 
        q.eq("userId", args.userId).eq("configId", args.configId)
      )
      .first();

    if (saved) {
      await ctx.db.delete(saved._id);
    }
  },
});

// Obtenir les configs sauvegardées d'un utilisateur
export const getByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const savedConfigs = await ctx.db
      .query("savedConfigs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    // Récupérer les détails de chaque config
    const configsWithDetails = await Promise.all(
      savedConfigs.map(async (saved) => {
        const config = await ctx.db.get(saved.configId);
        if (!config) return null;

        const moto = await ctx.db.get(config.motoId);
        const user = await ctx.db.get(config.userId);

        return {
          ...config,
          savedAt: saved.createdAt,
          moto,
          user: user ? {
            _id: user._id,
            name: user.name,
            username: user.username,
            imageUrl: user.imageUrl,
          } : null,
        };
      })
    );

    // Filtrer les nulls (configs supprimées)
    return configsWithDetails.filter(Boolean);
  },
});

// Vérifier si une config est sauvegardée par l'utilisateur
export const isSaved = query({
  args: {
    userId: v.id("users"),
    configId: v.id("configs"),
  },
  handler: async (ctx, args) => {
    const saved = await ctx.db
      .query("savedConfigs")
      .withIndex("by_user_config", (q) => 
        q.eq("userId", args.userId).eq("configId", args.configId)
      )
      .first();

    return !!saved;
  },
});

// Obtenir les IDs des configs sauvegardées par l'utilisateur
export const getSavedIds = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const savedConfigs = await ctx.db
      .query("savedConfigs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    return savedConfigs.map((s) => s.configId);
  },
});
