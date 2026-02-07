import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Obtenir les messages d'une conversation
export const getByConversation = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .order("asc")
      .collect();
  },
});

// Créer un message
export const create = mutation({
  args: {
    conversationId: v.id("conversations"),
    role: v.string(),
    content: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Mettre à jour le timestamp de la conversation
    await ctx.db.patch(args.conversationId, {
      updatedAt: Date.now(),
    });

    // Créer le message
    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      role: args.role,
      content: args.content,
      metadata: args.metadata,
      createdAt: Date.now(),
    });

    // Compter les messages dans la conversation
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();

    // Si c'est le 2ème message (premier message user), mettre à jour le titre
    if (messages.length === 2) {
      const conversation = await ctx.db.get(args.conversationId);
      
      // Extract a meaningful title from the first user message
      const userMessage = messages.find(m => m.role === "user");
      let title = "";
      
      if (conversation?.motoId) {
        const moto = await ctx.db.get(conversation.motoId);
        if (moto) {
          title = `${moto.brand} ${moto.model}`;
        }
      }
      
      // Try to extract mode or topic from user's message
      if (userMessage) {
        const content = userMessage.content.toLowerCase();
        if (content.includes("reglage_direct") || content.includes("réglage direct") || content.includes("aide rapide")) {
          title = title ? `${title} - Réglage rapide` : "Réglage rapide";
        } else if (content.includes("pas_a_pas") || content.includes("pas-à-pas") || content.includes("méthode complète") || content.includes("depuis zéro")) {
          title = title ? `${title} - Méthode complète` : "Méthode complète";
        } else if (content.length > 5 && content.length <= 50) {
          // Use the user's first message as title if it's short enough
          const cleanContent = userMessage.content.replace(/\[.*?\]/g, "").trim();
          if (cleanContent.length > 3 && cleanContent.length <= 50) {
            title = title ? `${title} - ${cleanContent}` : cleanContent;
          }
        }
      }
      
      // Fallback: use moto name + date, or just date
      if (!title) {
        const date = new Date().toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "short",
        });
        title = conversation?.motoId 
          ? `Session ${date}`
          : `Session ${date}`;
      }
      
      await ctx.db.patch(args.conversationId, { title });
    }

    return messageId;
  },
});
