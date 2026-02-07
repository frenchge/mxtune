import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const submit = mutation({
  args: {
    userId: v.id("users"),
    configId: v.id("configs"),
    satisfaction: v.number(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.satisfaction < 1 || args.satisfaction > 10) {
      throw new Error("La satisfaction doit etre comprise entre 1 et 10");
    }

    const config = await ctx.db.get(args.configId);
    if (!config) {
      throw new Error("Config introuvable");
    }

    // Empêcher le feedback sur une config non publique qui n'appartient pas au user.
    if (config.userId !== args.userId && config.visibility !== "public" && !config.isPublic) {
      throw new Error("Config non accessible pour feedback");
    }

    const existing = await ctx.db
      .query("configFeedbacks")
      .withIndex("by_user_config", (q) => q.eq("userId", args.userId).eq("configId", args.configId))
      .first();

    if (existing) {
      throw new Error("Vous avez déjà laissé un avis sur cette config");
    }

    const now = Date.now();

    return await ctx.db.insert("configFeedbacks", {
      configId: args.configId,
      userId: args.userId,
      createdAt: now,
      satisfaction: args.satisfaction,
      note: args.note?.trim() || undefined,
      updatedAt: now,
    });
  },
});

export const getToTestByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const ownConfigs = await ctx.db
      .query("configs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    const savedConfigs = await ctx.db
      .query("savedConfigs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    const candidates = new Map<string, {
      configId: Id<"configs">;
      source: "ia" | "communaute";
      addedAt: number;
    }>();

    for (const config of ownConfigs) {
      if (!config.conversationId) continue;
      candidates.set(String(config._id), {
        configId: config._id,
        source: "ia",
        addedAt: config.createdAt,
      });
    }

    for (const saved of savedConfigs) {
      const config = await ctx.db.get(saved.configId);
      if (!config) continue;
      if (config.userId === args.userId) continue;
      if (!candidates.has(String(saved.configId))) {
        candidates.set(String(saved.configId), {
          configId: saved.configId,
          source: "communaute",
          addedAt: saved.createdAt,
        });
      }
    }

    const items = await Promise.all(
      Array.from(candidates.values()).map(async (candidate) => {
        const config = await ctx.db.get(candidate.configId);
        if (!config) return null;

        const alreadyTested = await ctx.db
          .query("configFeedbacks")
          .withIndex("by_user_config", (q) => q.eq("userId", args.userId).eq("configId", candidate.configId))
          .first();

        if (alreadyTested) return null;

        const moto = await ctx.db.get(config.motoId);
        const owner = await ctx.db.get(config.userId);

        return {
          ...config,
          moto,
          source: candidate.source,
          addedAt: candidate.addedAt,
          user: owner
            ? {
                _id: owner._id,
                name: owner.name,
                username: owner.username,
                imageUrl: owner.imageUrl,
              }
            : null,
        };
      })
    );

    const validItems = items.filter(
      (item): item is NonNullable<typeof item> => item !== null
    );
    return validItems.sort((a, b) => b.addedAt - a.addedAt).slice(0, 100);
  },
});

export const getByConfigPublic = query({
  args: { configId: v.id("configs") },
  handler: async (ctx, args) => {
    const config = await ctx.db.get(args.configId);
    if (!config) return [];

    if (config.visibility !== "public" && !config.isPublic) {
      return [];
    }

    const feedbacks = await ctx.db
      .query("configFeedbacks")
      .withIndex("by_config", (q) => q.eq("configId", args.configId))
      .order("desc")
      .collect();

    return await Promise.all(
      feedbacks.map(async (feedback) => {
        const user = await ctx.db.get(feedback.userId);
        return {
          ...feedback,
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
