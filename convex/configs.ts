import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Générer un lien de partage unique
function generateShareLink() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Obtenir les configs d'un kit de suspension (avec auto-repair des orphelines)
export const getByKit = query({
  args: {
    kitId: v.id("suspensionKits"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    // Récupérer les configs directement liées au kit
    const configs = await ctx.db
      .query("configs")
      .withIndex("by_kit", (q) => q.eq("suspensionKitId", args.kitId))
      .order("desc")
      .collect();
    
    // Récupérer le kit pour connaître la motoId associée
    const kit = await ctx.db.get(args.kitId);
    if (!kit) return configs;
    
    // Récupérer aussi les configs de cette moto qui n'ont pas de kit associé
    // (pour rétrocompatibilité avec les anciennes configs - temporaire)
    const motoConfigs = await ctx.db
      .query("configs")
      .withIndex("by_moto", (q) => q.eq("motoId", kit.motoId))
      .collect();
    
    // Filtrer pour ne garder que celles sans suspensionKitId
    const orphanConfigs = motoConfigs.filter(c => !c.suspensionKitId);
    
    // Combiner et dédupliquer, en évitant les doublons
    const existingIds = new Set(configs.map(c => c._id));
    const allConfigs = [
      ...configs,
      ...orphanConfigs.filter(c => !existingIds.has(c._id))
    ];

    const filteredByOwner = args.userId
      ? allConfigs.filter((config) => config.userId === args.userId)
      : allConfigs;
    
    // Trier par date (plus récent en premier)
    return filteredByOwner.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// Réparer les configs orphelines d'un kit (assigne le kit aux configs de la moto sans kit)
export const repairOrphanConfigsForKit = mutation({
  args: { kitId: v.id("suspensionKits") },
  handler: async (ctx, args) => {
    const kit = await ctx.db.get(args.kitId);
    if (!kit) return { repaired: 0 };
    
    // Récupérer les configs de cette moto sans suspensionKitId
    const motoConfigs = await ctx.db
      .query("configs")
      .withIndex("by_moto", (q) => q.eq("motoId", kit.motoId))
      .collect();
    
    const orphanConfigs = motoConfigs.filter(c => !c.suspensionKitId);
    
    // Assigner ce kit aux configs orphelines (seulement si c'est le kit par défaut)
    let repaired = 0;
    if (kit.isDefault) {
      for (const config of orphanConfigs) {
        await ctx.db.patch(config._id, { suspensionKitId: args.kitId });
        repaired++;
      }
    }
    
    return { repaired };
  },
});

// Obtenir les configs d'un utilisateur
export const getByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const configs = await ctx.db
      .query("configs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
    
    // Joindre les infos de moto
    const configsWithMoto = await Promise.all(
      configs.map(async (config) => {
        const moto = await ctx.db.get(config.motoId);
        return { ...config, moto };
      })
    );
    
    return configsWithMoto;
  },
});

// Obtenir les configs publiques avec filtres
export const getPublic = query({
  args: {
    brand: v.optional(v.string()),
    model: v.optional(v.string()),
    sportType: v.optional(v.string()),
    terrainType: v.optional(v.string()),
    riderLevel: v.optional(v.string()),
    riderStyle: v.optional(v.string()),
    riderObjective: v.optional(v.string()),
    geographicZone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const configs = await ctx.db
      .query("configs")
      .withIndex("by_visibility", (q) => q.eq("visibility", "public"))
      .order("desc")
      .collect();
    
    // Fallback pour les anciennes configs avec isPublic
    const legacyPublic = await ctx.db
      .query("configs")
      .withIndex("by_public", (q) => q.eq("isPublic", true))
      .order("desc")
      .collect();
    
    // Combiner et dédupliquer
    const allConfigs = [...configs, ...legacyPublic.filter(c => !configs.find(x => x._id === c._id))];
    
    // Joindre les infos de moto, user et compteur de sauvegardes
    const configsWithDetails = await Promise.all(
      allConfigs.map(async (config) => {
        const moto = await ctx.db.get(config.motoId);
        const user = await ctx.db.get(config.userId);
        
        // Compter les sauvegardes via l'index by_config
        const savedEntries = await ctx.db
          .query("savedConfigs")
          .withIndex("by_config", (q) => q.eq("configId", config._id))
          .collect();
        
        return { 
          ...config, 
          moto, 
          saves: savedEntries.length,
          user: user ? { 
            _id: user._id,
            name: user.name, 
            username: user.username,
            imageUrl: user.imageUrl,
            geographicZone: user.geographicZone,
          } : null 
        };
      })
    );
    
    // Appliquer les filtres
    let filtered = configsWithDetails;
    
    if (args.brand) {
      filtered = filtered.filter(c => c.moto?.brand === args.brand);
    }
    if (args.model) {
      filtered = filtered.filter(c => c.moto?.model === args.model);
    }
    if (args.sportType) {
      filtered = filtered.filter(c => c.sportType === args.sportType);
    }
    if (args.terrainType) {
      filtered = filtered.filter(c => c.terrainType === args.terrainType);
    }
    if (args.riderLevel) {
      filtered = filtered.filter(c => c.riderLevel === args.riderLevel);
    }
    if (args.riderStyle) {
      filtered = filtered.filter(c => c.riderStyle === args.riderStyle);
    }
    if (args.riderObjective) {
      filtered = filtered.filter(c => c.riderObjective === args.riderObjective);
    }
    if (args.geographicZone) {
      filtered = filtered.filter(c => c.user?.geographicZone === args.geographicZone);
    }
    
    return filtered.slice(0, 50);
  },
});

// Obtenir une config par lien de partage
export const getByShareLink = query({
  args: { shareLink: v.string() },
  handler: async (ctx, args) => {
    const config = await ctx.db
      .query("configs")
      .withIndex("by_share_link", (q) => q.eq("shareLink", args.shareLink))
      .first();
    
    if (!config) return null;
    
    const moto = await ctx.db.get(config.motoId);
    const user = await ctx.db.get(config.userId);
    
    // Compter les sauvegardes
    const savedEntries = await ctx.db
      .query("savedConfigs")
      .withIndex("by_config", (q) => q.eq("configId", config._id))
      .collect();
    
    return { 
      ...config, 
      moto, 
      saves: savedEntries.length,
      user: user ? { 
        _id: user._id,
        name: user.name, 
        username: user.username,
        imageUrl: user.imageUrl,
        geographicZone: user.geographicZone,
      } : null 
    };
  },
});

// Obtenir une config par ID
export const getById = query({
  args: { configId: v.id("configs") },
  handler: async (ctx, args) => {
    const config = await ctx.db.get(args.configId);
    if (!config) return null;
    
    const moto = await ctx.db.get(config.motoId);
    const user = await ctx.db.get(config.userId);
    
    return { 
      ...config, 
      moto, 
      user: user ? { 
        _id: user._id,
        name: user.name, 
        username: user.username,
        imageUrl: user.imageUrl,
        geographicZone: user.geographicZone,
      } : null 
    };
  },
});

// Créer une config
export const create = mutation({
  args: {
    userId: v.optional(v.id("users")),
    motoId: v.id("motos"),
    suspensionKitId: v.optional(v.id("suspensionKits")),
    conversationId: v.optional(v.id("conversations")),
    name: v.string(),
    description: v.optional(v.string()),
    // Infos pilote
    riderWeight: v.optional(v.number()),
    riderLevel: v.optional(v.string()),
    riderStyle: v.optional(v.string()),
    riderObjective: v.optional(v.string()),
    // Réglages
    forkCompression: v.optional(v.number()),
    forkRebound: v.optional(v.number()),
    forkPreload: v.optional(v.string()),
    shockCompressionLow: v.optional(v.number()),
    shockCompressionHigh: v.optional(v.number()),
    shockRebound: v.optional(v.number()),
    shockPreload: v.optional(v.string()),
    staticSag: v.optional(v.number()),
    dynamicSag: v.optional(v.number()),
    tirePressureFront: v.optional(v.number()),
    tirePressureRear: v.optional(v.number()),
    sportType: v.optional(v.string()),
    terrainType: v.optional(v.string()),
    terrain: v.optional(v.string()),
    conditions: v.optional(v.string()),
    visibility: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    let user = null;

    if (identity) {
      user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .first();
    } else if (args.userId) {
      user = await ctx.db.get(args.userId);
      if (user && args.conversationId) {
        const conversation = await ctx.db.get(args.conversationId);
        if (!conversation || conversation.userId !== user._id) {
          throw new Error("Conversation invalide pour cet utilisateur");
        }
      }
    }

    if (!user) throw new Error("Non authentifié");

    const visibility = args.visibility || "private";
    const shareLink = (visibility === "link" || visibility === "public") ? generateShareLink() : undefined;
    
    // SOLUTION: Si pas de kitId fourni, résoudre automatiquement le kit par défaut de la moto
    let effectiveKitId = args.suspensionKitId;
    
    if (!effectiveKitId) {
      // Chercher le kit par défaut de cette moto (index dédié)
      const defaultKit = await ctx.db
        .query("suspensionKits")
        .withIndex("by_moto_default", (q) =>
          q.eq("motoId", args.motoId).eq("isDefault", true)
        )
        .first();

      if (defaultKit) {
        effectiveKitId = defaultKit._id;
      } else {
        // Si pas de kit par défaut, prendre le premier kit disponible
        const firstKit = await ctx.db
          .query("suspensionKits")
          .withIndex("by_moto", (q) => q.eq("motoId", args.motoId))
          .first();

        if (firstKit) {
          effectiveKitId = firstKit._id;
        } else {
          // Si aucun kit, créer un kit standard
          effectiveKitId = await ctx.db.insert("suspensionKits", {
            motoId: args.motoId,
            userId: user._id,
            name: "Kit Standard",
            isDefault: true,
            createdAt: Date.now(),
          });
        }
      }
    }
    
    const configId = await ctx.db.insert("configs", {
      ...args,
      userId: user._id,
      suspensionKitId: effectiveKitId,
      visibility,
      shareLink,
      isPublic: visibility === "public" || args.isPublic || false,
      likes: 0,
      createdAt: Date.now(),
    });
    
    // Retourner configId ET effectiveKitId pour synchroniser le frontend
    return { configId, effectiveKitId };
  },
});

// Mettre à jour une config
export const update = mutation({
  args: {
    configId: v.id("configs"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    forkCompression: v.optional(v.number()),
    forkRebound: v.optional(v.number()),
    forkPreload: v.optional(v.string()),
    shockCompressionLow: v.optional(v.number()),
    shockCompressionHigh: v.optional(v.number()),
    shockRebound: v.optional(v.number()),
    shockPreload: v.optional(v.string()),
    staticSag: v.optional(v.number()),
    dynamicSag: v.optional(v.number()),
    tirePressureFront: v.optional(v.number()),
    tirePressureRear: v.optional(v.number()),
    sportType: v.optional(v.string()),
    terrainType: v.optional(v.string()),
    terrain: v.optional(v.string()),
    conditions: v.optional(v.string()),
    visibility: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { configId, visibility, ...updates } = args;
    
    const patchData: Record<string, unknown> = { ...updates };
    
    if (visibility) {
      patchData.visibility = visibility;
      patchData.isPublic = visibility === "public";
      
      // Générer un lien de partage si nécessaire (pour link OU public)
      if (visibility === "link" || visibility === "public") {
        const existing = await ctx.db.get(configId);
        if (!existing?.shareLink) {
          patchData.shareLink = generateShareLink();
        }
      }
    }
    
    await ctx.db.patch(configId, patchData);
    return configId;
  },
});

// Mettre à jour un seul champ de config (pour les ajustements +/-)
export const updateField = mutation({
  args: {
    configId: v.id("configs"),
    field: v.string(),
    value: v.number(),
  },
  handler: async (ctx, args) => {
    const { configId, field, value } = args;
    
    // Valider que le champ est autorisé
    const allowedFields = [
      "forkCompression", "forkRebound",
      "shockCompressionLow", "shockCompressionHigh", "shockRebound",
      "staticSag", "dynamicSag",
      "tirePressureFront", "tirePressureRear"
    ];
    
    if (!allowedFields.includes(field)) {
      throw new Error(`Champ non autorisé: ${field}`);
    }
    
    await ctx.db.patch(configId, { [field]: value });
    return configId;
  },
});

// Liker une config
export const like = mutation({
  args: { configId: v.id("configs") },
  handler: async (ctx, args) => {
    const config = await ctx.db.get(args.configId);
    if (!config) throw new Error("Config non trouvée");

    await ctx.db.patch(args.configId, {
      likes: (config.likes || 0) + 1,
    });
  },
});

// Supprimer une config
export const remove = mutation({
  args: { configId: v.id("configs") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.configId);
  },
});

// Migrer les configs sans suspensionKitId vers le kit par défaut de leur moto
export const migrateConfigsToDefaultKit = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Récupérer toutes les configs de l'utilisateur sans suspensionKitId
    const configs = await ctx.db
      .query("configs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    const configsWithoutKit = configs.filter(c => !c.suspensionKitId);
    
    let migratedCount = 0;
    
    for (const config of configsWithoutKit) {
      // Récupérer les kits de la moto associée
      const motoKits = await ctx.db
        .query("suspensionKits")
        .withIndex("by_moto", (q) => q.eq("motoId", config.motoId))
        .collect();
      
      if (motoKits.length > 0) {
        // Trouver le kit par défaut ou prendre le premier
        const defaultKit = motoKits.find(k => k.isDefault) || motoKits[0];
        
        // Mettre à jour la config avec le kit par défaut
        await ctx.db.patch(config._id, {
          suspensionKitId: defaultKit._id,
        });
        
        migratedCount++;
      }
    }
    
    return { migratedCount, totalWithoutKit: configsWithoutKit.length };
  },
});

// Obtenir les configs des utilisateurs suivis
export const getFromFollowing = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Récupérer les utilisateurs suivis
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", args.userId))
      .collect();
    
    const followingIds = follows.map((f) => f.followingId);
    
    if (followingIds.length === 0) return [];
    
    // Récupérer toutes les configs publiques
    const allPublicConfigs = await ctx.db
      .query("configs")
      .withIndex("by_visibility", (q) => q.eq("visibility", "public"))
      .order("desc")
      .collect();
    
    // Filtrer pour ne garder que celles des utilisateurs suivis
    const followedConfigs = allPublicConfigs.filter(c => followingIds.includes(c.userId));
    
    // Joindre les infos de moto, user et compteur de sauvegardes
    const configsWithDetails = await Promise.all(
      followedConfigs.map(async (config) => {
        const moto = await ctx.db.get(config.motoId);
        const user = await ctx.db.get(config.userId);
        
        const savedEntries = await ctx.db
          .query("savedConfigs")
          .withIndex("by_config", (q) => q.eq("configId", config._id))
          .collect();
        
        return { 
          ...config, 
          moto, 
          saves: savedEntries.length,
          user: user ? { 
            _id: user._id,
            name: user.name, 
            username: user.username,
            imageUrl: user.imageUrl,
            geographicZone: user.geographicZone,
          } : null 
        };
      })
    );
    
    return configsWithDetails.slice(0, 50);
  },
});
