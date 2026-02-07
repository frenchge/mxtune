import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Utilisateurs
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    username: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    weight: v.optional(v.number()),
    level: v.optional(v.string()), // "débutant", "intermédiaire", "expert"
    style: v.optional(v.string()), // "neutre", "agressif", "souple"
    objective: v.optional(v.string()), // "confort", "performance", "mixte"
    createdAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_username", ["username"]),

  // Motos
  motos: defineTable({
    userId: v.id("users"),
    brand: v.string(), // KTM, Husqvarna, GasGas, etc.
    model: v.string(), // 300 EXC, 450 SX-F, etc.
    year: v.number(),
    // Suspensions d'origine par défaut
    isStockSuspension: v.optional(v.boolean()), // true = origine, false = modifié
    forkBrand: v.optional(v.string()), // WP, KYB, Showa, etc.
    forkModel: v.optional(v.string()),
    shockBrand: v.optional(v.string()),
    shockModel: v.optional(v.string()),
    // Détails modifications si aftermarket
    suspensionNotes: v.optional(v.string()), // Notes sur les modifs (ressorts, pistons, etc.)
    // Photos de la moto
    images: v.optional(v.array(v.id("_storage"))), // IDs des fichiers stockés
    isPublic: v.optional(v.boolean()), // Visibility on profile
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_public", ["userId", "isPublic"]),

  // Kits de suspension (plusieurs par moto)
  suspensionKits: defineTable({
    motoId: v.id("motos"),
    userId: v.id("users"),
    name: v.string(), // "Kit Sable GP", "Kit Boue France", "Kit Dur Espagne", etc.
    description: v.optional(v.string()),
    // Type de kit
    sportType: v.optional(v.string()), // enduro, motocross, supermoto
    terrainType: v.optional(v.string()), // sable, boue, dur, rocailleux, mixte
    country: v.optional(v.string()), // France, Espagne, etc.
    conditions: v.optional(v.string()), // sec, humide, etc.
    // Suspensions du kit (peuvent différer de la moto de base)
    isStockSuspension: v.optional(v.boolean()),
    forkBrand: v.optional(v.string()),
    forkModel: v.optional(v.string()),
    shockBrand: v.optional(v.string()),
    shockModel: v.optional(v.string()),
    // Modifications spécifiques au kit
    forkSpringRate: v.optional(v.string()), // "4.8 N/mm"
    shockSpringRate: v.optional(v.string()), // "52 N/mm"
    forkOilWeight: v.optional(v.string()), // "5W"
    forkOilLevel: v.optional(v.string()), // "130mm"
    valvingNotes: v.optional(v.string()), // Notes sur le pistonage
    otherMods: v.optional(v.string()), // Autres modifications
    // Plages de clics MAX (pour calcul pourcentage style Clickers MX)
    maxForkCompression: v.optional(v.number()), // Nombre total de clics compression fourche
    maxForkRebound: v.optional(v.number()), // Nombre total de clics détente fourche
    maxShockCompressionLow: v.optional(v.number()), // Nombre total de clics BV amortisseur
    maxShockCompressionHigh: v.optional(v.number()), // Nombre total de clics HV amortisseur
    maxShockRebound: v.optional(v.number()), // Nombre total de clics détente amortisseur
    // Réglages de base du kit (baseline/reference)
    baseForkCompression: v.optional(v.number()),
    baseForkRebound: v.optional(v.number()),
    baseShockCompressionLow: v.optional(v.number()),
    baseShockCompressionHigh: v.optional(v.number()),
    baseShockRebound: v.optional(v.number()),
    baseSag: v.optional(v.number()),
    // Réglages actuels du kit (valeurs courantes modifiables)
    forkCompression: v.optional(v.number()),
    forkRebound: v.optional(v.number()),
    shockCompressionLow: v.optional(v.number()),
    shockCompressionHigh: v.optional(v.number()),
    shockRebound: v.optional(v.number()),
    // Métadonnées
    isDefault: v.optional(v.boolean()), // Kit par défaut pour cette moto
    createdAt: v.number(),
  })
    .index("by_moto", ["motoId"])
    .index("by_user", ["userId"])
    .index("by_moto_default", ["motoId", "isDefault"]),

  // Configurations
  configs: defineTable({
    userId: v.id("users"),
    motoId: v.id("motos"),
    suspensionKitId: v.optional(v.id("suspensionKits")), // Kit associated with this config
    conversationId: v.optional(v.id("conversations")),
    name: v.string(),
    description: v.optional(v.string()),
    // Infos pilote au moment de la config
    riderWeight: v.optional(v.number()),
    riderLevel: v.optional(v.string()),
    riderStyle: v.optional(v.string()),
    riderObjective: v.optional(v.string()),
    // Réglages fourche
    forkCompression: v.optional(v.number()), // clics
    forkRebound: v.optional(v.number()), // clics
    forkPreload: v.optional(v.string()),
    // Réglages amortisseur
    shockCompressionLow: v.optional(v.number()), // tours (BV - basse vitesse)
    shockCompressionHigh: v.optional(v.number()), // tours (HV - haute vitesse)
    shockRebound: v.optional(v.number()), // clics
    shockPreload: v.optional(v.string()),
    // SAG
    staticSag: v.optional(v.number()), // mm
    dynamicSag: v.optional(v.number()), // mm
    // Pression pneus
    tirePressureFront: v.optional(v.number()), // bar
    tirePressureRear: v.optional(v.number()), // bar
    // Classification
    sportType: v.optional(v.string()), // enduro, motocross, supermoto, trail, trial
    terrainType: v.optional(v.string()), // sable, boue, dur, mixte, rocailleux
    // Partage
    visibility: v.string(), // "private", "public", "link"
    shareLink: v.optional(v.string()),
    // Métadonnées legacy
    terrain: v.optional(v.string()),
    conditions: v.optional(v.string()),
    isPublic: v.boolean(),
    likes: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_moto", ["motoId"])
    .index("by_kit", ["suspensionKitId"])
    .index("by_public", ["isPublic"])
    .index("by_visibility", ["visibility"])
    .index("by_sport_type", ["sportType"])
    .index("by_share_link", ["shareLink"]),

  // Conversations
  conversations: defineTable({
    userId: v.id("users"),
    motoId: v.optional(v.id("motos")),
    title: v.string(),
    step: v.string(), // "collecte", "verification", "proposition", "test"
    configMode: v.optional(v.string()), // "rapide" ou "pas-a-pas"
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_active", ["userId", "isActive"]),

  // Messages
  messages: defineTable({
    conversationId: v.id("conversations"),
    role: v.string(), // "user" ou "assistant"
    content: v.string(),
    metadata: v.optional(v.any()), // données structurées (config suggérée, etc.)
    createdAt: v.number(),
  }).index("by_conversation", ["conversationId"]),

  // Configs sauvegardées (par d'autres users)
  savedConfigs: defineTable({
    userId: v.id("users"), // L'user qui sauvegarde
    configId: v.id("configs"), // La config sauvegardée
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_config", ["configId"])
    .index("by_user_config", ["userId", "configId"]),

  // Likes sur les configs
  configLikes: defineTable({
    userId: v.id("users"), // L'user qui like
    configId: v.id("configs"), // La config likée
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_config", ["configId"])
    .index("by_user_config", ["userId", "configId"]),

  // Feedback de test des configs
  configFeedbacks: defineTable({
    configId: v.id("configs"),
    userId: v.id("users"), // utilisateur qui a teste la config
    satisfaction: v.number(), // 1-10
    note: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_config", ["configId"])
    .index("by_user", ["userId"])
    .index("by_user_config", ["userId", "configId"]),

  // Système de followers
  follows: defineTable({
    followerId: v.id("users"), // L'user qui suit
    followingId: v.id("users"), // L'user suivi
    createdAt: v.number(),
  })
    .index("by_follower", ["followerId"])
    .index("by_following", ["followingId"])
    .index("by_follower_following", ["followerId", "followingId"]),
});
