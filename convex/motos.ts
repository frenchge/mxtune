import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Obtenir les motos d'un utilisateur
export const getByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const motos = await ctx.db
      .query("motos")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    // Joindre les kits pour chaque moto
    const motosWithKits = await Promise.all(
      motos.map(async (moto) => {
        const kits = await ctx.db
          .query("suspensionKits")
          .withIndex("by_moto", (q) => q.eq("motoId", moto._id))
          .collect();
        return { ...moto, kits };
      })
    );
    
    return motosWithKits;
  },
});

// Obtenir les dernières motos d'un utilisateur (version légère pour sidebar)
export const getRecentByUser = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const requestedLimit = Math.floor(args.limit ?? 5);
    const safeLimit = Math.min(Math.max(requestedLimit, 1), 10);

    const motos = await ctx.db
      .query("motos")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(safeLimit);

    return motos.map((moto) => ({
      _id: moto._id,
      brand: moto.brand,
      model: moto.model,
      year: moto.year,
      createdAt: moto.createdAt,
    }));
  },
});

// Obtenir les motos publiques d'un utilisateur
export const getPublicByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("motos")
      .withIndex("by_user_public", (q) => q.eq("userId", args.userId).eq("isPublic", true))
      .collect();
  },
});

// Obtenir une moto par ID avec ses kits
export const getById = query({
  args: { motoId: v.id("motos") },
  handler: async (ctx, args) => {
    const moto = await ctx.db.get(args.motoId);
    if (!moto) return null;
    
    const kits = await ctx.db
      .query("suspensionKits")
      .withIndex("by_moto", (q) => q.eq("motoId", moto._id))
      .collect();
    
    return { ...moto, kits };
  },
});

// Créer une moto
export const create = mutation({
  args: {
    userId: v.id("users"),
    brand: v.string(),
    model: v.string(),
    year: v.number(),
    isStockSuspension: v.optional(v.boolean()),
    forkBrand: v.optional(v.string()),
    forkModel: v.optional(v.string()),
    shockBrand: v.optional(v.string()),
    shockModel: v.optional(v.string()),
    suspensionNotes: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    // Plages de clics max (from stock suspension data)
    maxForkCompression: v.optional(v.number()),
    maxForkRebound: v.optional(v.number()),
    maxShockCompressionLow: v.optional(v.number()),
    maxShockCompressionHigh: v.optional(v.number()),
    maxShockRebound: v.optional(v.number()),
    // Réglages de base (from stock suspension data)
    baseForkCompression: v.optional(v.number()),
    baseForkRebound: v.optional(v.number()),
    baseShockCompressionLow: v.optional(v.number()),
    baseShockCompressionHigh: v.optional(v.number()),
    baseShockRebound: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const motoId = await ctx.db.insert("motos", {
      userId: args.userId,
      brand: args.brand,
      model: args.model,
      year: args.year,
      isStockSuspension: args.isStockSuspension ?? true,
      forkBrand: args.forkBrand,
      forkModel: args.forkModel,
      shockBrand: args.shockBrand,
      shockModel: args.shockModel,
      suspensionNotes: args.suspensionNotes,
      isPublic: args.isPublic ?? false,
      createdAt: Date.now(),
    });
    
    // Créer automatiquement un kit "Standard" pour cette moto avec les valeurs de base
    await ctx.db.insert("suspensionKits", {
      motoId,
      userId: args.userId,
      name: args.isStockSuspension ? "Kit d'origine" : "Kit Standard",
      description: args.isStockSuspension ? "Configuration d'usine" : "Configuration personnalisée",
      isStockSuspension: args.isStockSuspension ?? true,
      forkBrand: args.forkBrand,
      forkModel: args.forkModel,
      shockBrand: args.shockBrand,
      shockModel: args.shockModel,
      // Plages de clics max
      maxForkCompression: args.maxForkCompression,
      maxForkRebound: args.maxForkRebound,
      maxShockCompressionLow: args.maxShockCompressionLow,
      maxShockCompressionHigh: args.maxShockCompressionHigh,
      maxShockRebound: args.maxShockRebound,
      // Réglages de base = réglages actuels au départ
      baseForkCompression: args.baseForkCompression,
      baseForkRebound: args.baseForkRebound,
      baseShockCompressionLow: args.baseShockCompressionLow,
      baseShockCompressionHigh: args.baseShockCompressionHigh,
      baseShockRebound: args.baseShockRebound,
      // Réglages actuels = mêmes que base au départ
      forkCompression: args.baseForkCompression,
      forkRebound: args.baseForkRebound,
      shockCompressionLow: args.baseShockCompressionLow,
      shockCompressionHigh: args.baseShockCompressionHigh,
      shockRebound: args.baseShockRebound,
      isDefault: true,
      createdAt: Date.now(),
    });
    
    return motoId;
  },
});

// Mettre à jour une moto
export const update = mutation({
  args: {
    motoId: v.id("motos"),
    brand: v.optional(v.string()),
    model: v.optional(v.string()),
    year: v.optional(v.number()),
    isStockSuspension: v.optional(v.boolean()),
    forkBrand: v.optional(v.string()),
    forkModel: v.optional(v.string()),
    shockBrand: v.optional(v.string()),
    shockModel: v.optional(v.string()),
    suspensionNotes: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { motoId, ...updates } = args;
    await ctx.db.patch(motoId, updates);
    return motoId;
  },
});

// Supprimer une moto et ses kits
export const remove = mutation({
  args: { motoId: v.id("motos") },
  handler: async (ctx, args) => {
    // Supprimer tous les kits associés
    const kits = await ctx.db
      .query("suspensionKits")
      .withIndex("by_moto", (q) => q.eq("motoId", args.motoId))
      .collect();
    
    for (const kit of kits) {
      await ctx.db.delete(kit._id);
    }
    
    await ctx.db.delete(args.motoId);
  },
});
