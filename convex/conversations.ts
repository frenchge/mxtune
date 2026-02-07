import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Obtenir les conversations d'un utilisateur (only those with user interaction)
export const getByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
    
    // Filter: only return conversations where the user has sent at least 1 message
    // (the welcome message from the assistant doesn't count)
    const withUserMessages = await Promise.all(
      conversations.map(async (conv) => {
        const messages = await ctx.db
          .query("messages")
          .withIndex("by_conversation", (q) => q.eq("conversationId", conv._id))
          .collect();
        const hasUserMessage = messages.some((m) => m.role === "user");
        return hasUserMessage ? conv : null;
      })
    );
    
    return withUserMessages.filter((conv): conv is NonNullable<typeof conv> => conv !== null);
  },
});

// Get the most recent conversation for redirect (reuse ones without user messages)
export const getLatestOrEmpty = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
    
    if (conversations.length === 0) return null;
    
    // Find the most recent conversation where user hasn't sent a message yet
    // (only has the welcome message) - reuse it
    for (const conv of conversations) {
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_conversation", (q) => q.eq("conversationId", conv._id))
        .collect();
      const hasUserMessage = messages.some((m) => m.role === "user");
      if (!hasUserMessage) {
        // This conversation only has the welcome message, reuse it
        return { conversationId: conv._id, isNew: false };
      }
    }
    
    // All conversations have user messages, return the most recent one
    return { conversationId: conversations[0]._id, isNew: false };
  },
});

// Obtenir une conversation par ID
export const getById = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.conversationId);
  },
});

// Créer une conversation
export const create = mutation({
  args: {
    userId: v.id("users"),
    motoId: v.optional(v.id("motos")),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("conversations", {
      userId: args.userId,
      motoId: args.motoId,
      title: args.title,
      step: "collecte",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Mettre à jour l'étape de la conversation
export const updateStep = mutation({
  args: {
    conversationId: v.id("conversations"),
    step: v.string(),
    configMode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.conversationId, {
      step: args.step,
      configMode: args.configMode,
      updatedAt: Date.now(),
    });
  },
});

// Mettre à jour le titre
export const updateTitle = mutation({
  args: {
    conversationId: v.id("conversations"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.conversationId, {
      title: args.title,
      updatedAt: Date.now(),
    });
  },
});

// Supprimer une conversation
export const remove = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    // Supprimer tous les messages associés
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    await ctx.db.delete(args.conversationId);
  },
});

// Nettoyer les conversations sans interaction utilisateur
// (only have the welcome message or no messages at all)
export const cleanupEmpty = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    let deleted = 0;
    for (const conv of conversations) {
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_conversation", (q) => q.eq("conversationId", conv._id))
        .collect();
      
      const hasUserMessage = messages.some((m) => m.role === "user");
      
      if (!hasUserMessage) {
        // Delete all messages (welcome message) first
        for (const message of messages) {
          await ctx.db.delete(message._id);
        }
        // Delete the conversation
        await ctx.db.delete(conv._id);
        deleted++;
      }
    }
    
    return { deleted };
  },
});
