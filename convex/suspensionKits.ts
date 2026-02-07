import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Obtenir les kits d'une moto
export const getByMoto = query({
  args: { motoId: v.id("motos") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("suspensionKits")
      .withIndex("by_moto", (q) => q.eq("motoId", args.motoId))
      .collect();
  },
});

// Obtenir tous les kits d'un utilisateur
export const getByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const kits = await ctx.db
      .query("suspensionKits")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    // Joindre les infos de moto
    const kitsWithMoto = await Promise.all(
      kits.map(async (kit) => {
        const moto = await ctx.db.get(kit.motoId);
        return { ...kit, moto };
      })
    );
    
    return kitsWithMoto;
  },
});

// Obtenir un kit par ID
export const getById = query({
  args: { kitId: v.id("suspensionKits") },
  handler: async (ctx, args) => {
    const kit = await ctx.db.get(args.kitId);
    if (!kit) return null;
    
    const moto = await ctx.db.get(kit.motoId);
    return { ...kit, moto };
  },
});

// Obtenir le kit par défaut d'une moto
export const getDefaultByMoto = query({
  args: { motoId: v.id("motos") },
  handler: async (ctx, args) => {
    const kit = await ctx.db
      .query("suspensionKits")
      .withIndex("by_moto_default", (q) => q.eq("motoId", args.motoId).eq("isDefault", true))
      .first();
    
    if (!kit) {
      // Si pas de kit par défaut, retourner le premier kit
      return await ctx.db
        .query("suspensionKits")
        .withIndex("by_moto", (q) => q.eq("motoId", args.motoId))
        .first();
    }
    
    return kit;
  },
});

// Créer un kit
export const create = mutation({
  args: {
    motoId: v.id("motos"),
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    sportType: v.optional(v.string()),
    terrainType: v.optional(v.string()),
    country: v.optional(v.string()),
    conditions: v.optional(v.string()),
    isStockSuspension: v.optional(v.boolean()),
    forkBrand: v.optional(v.string()),
    forkModel: v.optional(v.string()),
    shockBrand: v.optional(v.string()),
    shockModel: v.optional(v.string()),
    forkSpringRate: v.optional(v.string()),
    shockSpringRate: v.optional(v.string()),
    forkOilWeight: v.optional(v.string()),
    forkOilLevel: v.optional(v.string()),
    valvingNotes: v.optional(v.string()),
    otherMods: v.optional(v.string()),
    // Plages de clics max (style Clickers MX)
    maxForkCompression: v.optional(v.number()),
    maxForkRebound: v.optional(v.number()),
    maxShockCompressionLow: v.optional(v.number()),
    maxShockCompressionHigh: v.optional(v.number()),
    maxShockRebound: v.optional(v.number()),
    // Réglages de base
    baseForkCompression: v.optional(v.number()),
    baseForkRebound: v.optional(v.number()),
    baseShockCompressionLow: v.optional(v.number()),
    baseShockCompressionHigh: v.optional(v.number()),
    baseShockRebound: v.optional(v.number()),
    baseSag: v.optional(v.number()),
    // Réglages actuels (valeurs courantes modifiables)
    forkCompression: v.optional(v.number()),
    forkRebound: v.optional(v.number()),
    shockCompressionLow: v.optional(v.number()),
    shockCompressionHigh: v.optional(v.number()),
    shockRebound: v.optional(v.number()),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Si c'est le premier kit de cette moto, le mettre par défaut
    const existingKits = await ctx.db
      .query("suspensionKits")
      .withIndex("by_moto", (q) => q.eq("motoId", args.motoId))
      .collect();
    
    const isDefault = existingKits.length === 0 ? true : args.isDefault;
    
    // Si ce kit est par défaut, retirer le défaut des autres
    if (isDefault) {
      for (const kit of existingKits) {
        if (kit.isDefault) {
          await ctx.db.patch(kit._id, { isDefault: false });
        }
      }
    }
    
    // Initialiser les réglages actuels avec les valeurs de base si fournies
    const forkCompression = args.forkCompression ?? args.baseForkCompression ?? 0;
    const forkRebound = args.forkRebound ?? args.baseForkRebound ?? 0;
    const shockCompressionLow = args.shockCompressionLow ?? args.baseShockCompressionLow ?? 0;
    const shockCompressionHigh = args.shockCompressionHigh ?? args.baseShockCompressionHigh ?? 0;
    const shockRebound = args.shockRebound ?? args.baseShockRebound ?? 0;
    
    return await ctx.db.insert("suspensionKits", {
      ...args,
      forkCompression,
      forkRebound,
      shockCompressionLow,
      shockCompressionHigh,
      shockRebound,
      isDefault,
      createdAt: Date.now(),
    });
  },
});

// Mettre à jour un kit
export const update = mutation({
  args: {
    kitId: v.id("suspensionKits"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    sportType: v.optional(v.string()),
    terrainType: v.optional(v.string()),
    country: v.optional(v.string()),
    conditions: v.optional(v.string()),
    isStockSuspension: v.optional(v.boolean()),
    forkBrand: v.optional(v.string()),
    forkModel: v.optional(v.string()),
    shockBrand: v.optional(v.string()),
    shockModel: v.optional(v.string()),
    forkSpringRate: v.optional(v.string()),
    shockSpringRate: v.optional(v.string()),
    forkOilWeight: v.optional(v.string()),
    forkOilLevel: v.optional(v.string()),
    valvingNotes: v.optional(v.string()),
    otherMods: v.optional(v.string()),
    // Plages de clics max (style Clickers MX)
    maxForkCompression: v.optional(v.number()),
    maxForkRebound: v.optional(v.number()),
    maxShockCompressionLow: v.optional(v.number()),
    maxShockCompressionHigh: v.optional(v.number()),
    maxShockRebound: v.optional(v.number()),
    // Réglages de base
    baseForkCompression: v.optional(v.number()),
    baseForkRebound: v.optional(v.number()),
    baseShockCompressionLow: v.optional(v.number()),
    baseShockCompressionHigh: v.optional(v.number()),
    baseShockRebound: v.optional(v.number()),
    baseSag: v.optional(v.number()),
    // Réglages actuels (valeurs courantes modifiables)
    forkCompression: v.optional(v.number()),
    forkRebound: v.optional(v.number()),
    shockCompressionLow: v.optional(v.number()),
    shockCompressionHigh: v.optional(v.number()),
    shockRebound: v.optional(v.number()),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { kitId, isDefault, ...updates } = args;
    
    // Si on met ce kit par défaut, retirer le défaut des autres
    if (isDefault) {
      const kit = await ctx.db.get(kitId);
      if (kit) {
        const otherKits = await ctx.db
          .query("suspensionKits")
          .withIndex("by_moto", (q) => q.eq("motoId", kit.motoId))
          .collect();
        
        for (const otherKit of otherKits) {
          if (otherKit._id !== kitId && otherKit.isDefault) {
            await ctx.db.patch(otherKit._id, { isDefault: false });
          }
        }
      }
    }
    
    await ctx.db.patch(kitId, { ...updates, isDefault });
    return kitId;
  },
});

// Définir comme kit par défaut
export const setDefault = mutation({
  args: { kitId: v.id("suspensionKits") },
  handler: async (ctx, args) => {
    const kit = await ctx.db.get(args.kitId);
    if (!kit) throw new Error("Kit non trouvé");
    
    // Retirer le défaut des autres kits de cette moto
    const otherKits = await ctx.db
      .query("suspensionKits")
      .withIndex("by_moto", (q) => q.eq("motoId", kit.motoId))
      .collect();
    
    for (const otherKit of otherKits) {
      if (otherKit.isDefault) {
        await ctx.db.patch(otherKit._id, { isDefault: false });
      }
    }
    
    await ctx.db.patch(args.kitId, { isDefault: true });
    return args.kitId;
  },
});

// S'assurer qu'une seule config est par défaut pour une moto
export const ensureSingleDefaultForMoto = mutation({
  args: { motoId: v.id("motos") },
  handler: async (ctx, args) => {
    const kits = await ctx.db
      .query("suspensionKits")
      .withIndex("by_moto", (q) => q.eq("motoId", args.motoId))
      .collect();

    if (kits.length === 0) {
      return { fixed: false, defaultKitId: null };
    }

    const defaultKits = kits.filter((k) => k.isDefault);

    // Choisir un kit par défaut déterministe si aucun
    if (defaultKits.length === 0) {
      const sorted = [...kits].sort((a, b) => b.createdAt - a.createdAt);
      const keep = sorted[0];
      await ctx.db.patch(keep._id, { isDefault: true });
      return { fixed: true, defaultKitId: keep._id };
    }

    // Garder le plus récent et désactiver les autres
    const keep = [...defaultKits].sort((a, b) => b.createdAt - a.createdAt)[0];
    for (const kit of defaultKits) {
      if (kit._id !== keep._id) {
        await ctx.db.patch(kit._id, { isDefault: false });
      }
    }

    return { fixed: defaultKits.length > 1, defaultKitId: keep._id };
  },
});

// S'assurer que TOUTES les motos ont un kit par défaut
export const ensureAllMotosHaveDefault = mutation({
  args: {},
  handler: async (ctx) => {
    const allKits = await ctx.db.query("suspensionKits").collect();
    const motoIds = [...new Set(allKits.map((k) => k.motoId))];
    let fixedCount = 0;

    for (const motoId of motoIds) {
      const kits = allKits.filter((k) => k.motoId === motoId);
      const defaults = kits.filter((k) => k.isDefault);

      if (defaults.length === 0 && kits.length > 0) {
        // Set the first kit (by creation time) as default
        const sorted = [...kits].sort((a, b) => a.createdAt - b.createdAt);
        await ctx.db.patch(sorted[0]._id, { isDefault: true });
        fixedCount++;
      }
    }

    return { fixedCount, totalMotos: motoIds.length };
  },
});

// Supprimer un kit
export const remove = mutation({
  args: { kitId: v.id("suspensionKits") },
  handler: async (ctx, args) => {
    const kit = await ctx.db.get(args.kitId);
    if (!kit) return;
    
    await ctx.db.delete(args.kitId);
    
    // Si c'était le kit par défaut, mettre le premier restant par défaut
    if (kit.isDefault) {
      const remainingKits = await ctx.db
        .query("suspensionKits")
        .withIndex("by_moto", (q) => q.eq("motoId", kit.motoId))
        .first();
      
      if (remainingKits) {
        await ctx.db.patch(remainingKits._id, { isDefault: true });
      }
    }
  },
});

// Dupliquer un kit
export const duplicate = mutation({
  args: { kitId: v.id("suspensionKits") },
  handler: async (ctx, args) => {
    const kit = await ctx.db.get(args.kitId);
    if (!kit) throw new Error("Kit non trouvé");
    
    // Créer une copie sans _id et _creationTime
    const { _id, _creationTime, isDefault, name, ...kitData } = kit;
    
    return await ctx.db.insert("suspensionKits", {
      ...kitData,
      name: `${name} (copie)`,
      isDefault: false,
      createdAt: Date.now(),
    });
  },
});
