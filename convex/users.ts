import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Obtenir l'utilisateur par Clerk ID
export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
  },
});

// Créer ou mettre à jour un utilisateur
export const upsertUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    username: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existingUser) {
      await ctx.db.patch(existingUser._id, {
        email: args.email,
        name: args.name,
        username: args.username,
        imageUrl: args.imageUrl,
      });
      return existingUser._id;
    }

    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      username: args.username,
      imageUrl: args.imageUrl,
      createdAt: Date.now(),
    });
  },
});

// Mettre à jour le profil utilisateur
export const updateProfile = mutation({
  args: {
    clerkId: v.string(),
    weight: v.optional(v.number()),
    level: v.optional(v.string()),
    style: v.optional(v.string()),
    objective: v.optional(v.string()),
    geographicZone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) throw new Error("Utilisateur non trouvé");

    await ctx.db.patch(user._id, {
      weight: args.weight,
      level: args.level,
      style: args.style,
      objective: args.objective,
      geographicZone: args.geographicZone,
    });

    return user._id;
  },
});

// Obtenir un utilisateur par son username
export const getByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();

    if (!user) return null;

    return {
      _id: user._id,
      name: user.name,
      username: user.username,
      imageUrl: user.imageUrl,
      weight: user.weight,
      level: user.level,
      style: user.style,
      objective: user.objective,
      geographicZone: user.geographicZone,
      createdAt: user.createdAt,
    };
  },
});

// Obtenir les configs publiques d'un utilisateur
export const getPublicConfigs = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const configs = await ctx.db
      .query("configs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    // Filtrer pour ne garder que les configs publiques
    const publicConfigs = configs.filter(
      (c) => c.visibility === "public" || c.isPublic
    );

    // Joindre les infos de moto
    const configsWithMoto = await Promise.all(
      publicConfigs.map(async (config) => {
        const moto = await ctx.db.get(config.motoId);
        return { ...config, moto };
      })
    );

    return configsWithMoto;
  },
});
