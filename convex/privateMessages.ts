import {
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { v } from "convex/values";

const MAX_PRIVATE_MESSAGE_LENGTH = 2000;
const MAX_LAST_MESSAGE_SNIPPET_LENGTH = 160;

type AnyCtx = QueryCtx | MutationCtx;

function normalizePair(userAId: Id<"users">, userBId: Id<"users">) {
  return String(userAId) < String(userBId)
    ? [userAId, userBId]
    : [userBId, userAId];
}

function isParticipant(
  conversation: Doc<"privateConversations">,
  userId: Id<"users">
) {
  return (
    conversation.participantAId === userId || conversation.participantBId === userId
  );
}

function getOtherUserId(
  conversation: Doc<"privateConversations">,
  userId: Id<"users">
) {
  return conversation.participantAId === userId
    ? conversation.participantBId
    : conversation.participantAId;
}

function getLastReadAt(
  conversation: Doc<"privateConversations">,
  userId: Id<"users">
) {
  return conversation.participantAId === userId
    ? conversation.participantALastReadAt || 0
    : conversation.participantBLastReadAt || 0;
}

function toPublicUser(
  user:
    | {
        _id: Id<"users">;
        name: string;
        username?: string;
        imageUrl?: string;
        level?: string;
        style?: string;
        objective?: string;
        geographicZone?: string;
      }
    | null
) {
  if (!user) return null;
  return {
    _id: user._id,
    name: user.name,
    username: user.username,
    imageUrl: user.imageUrl,
    level: user.level,
    style: user.style,
    objective: user.objective,
    geographicZone: user.geographicZone,
  };
}

async function getConversationForParticipant(
  ctx: AnyCtx,
  conversationId: Id<"privateConversations">,
  userId: Id<"users">
) {
  const conversation = await ctx.db.get(conversationId);
  if (!conversation) {
    throw new Error("Conversation introuvable");
  }
  if (!isParticipant(conversation, userId)) {
    throw new Error("Accès refusé à cette conversation");
  }
  return conversation;
}

// Crée une conversation privée entre 2 users (ou retourne l'existante)
export const getOrCreateConversation = mutation({
  args: {
    userId: v.id("users"),
    otherUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    if (args.userId === args.otherUserId) {
      throw new Error("Impossible d'ouvrir une conversation avec soi-même");
    }

    const [participantAId, participantBId] = normalizePair(
      args.userId,
      args.otherUserId
    );

    const [userA, userB] = await Promise.all([
      ctx.db.get(participantAId),
      ctx.db.get(participantBId),
    ]);

    if (!userA || !userB) {
      throw new Error("Utilisateur introuvable");
    }

    const existing = await ctx.db
      .query("privateConversations")
      .withIndex("by_pair", (q) =>
        q.eq("participantAId", participantAId).eq("participantBId", participantBId)
      )
      .first();

    if (existing) {
      return existing._id;
    }

    const now = Date.now();
    return ctx.db.insert("privateConversations", {
      participantAId,
      participantBId,
      createdById: args.userId,
      createdAt: now,
      updatedAt: now,
      participantALastReadAt: now,
      participantBLastReadAt: now,
    });
  },
});

// Liste des conversations privées d'un user
export const getConversations = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const [asParticipantA, asParticipantB] = await Promise.all([
      ctx.db
        .query("privateConversations")
        .withIndex("by_participant_a_updated", (q) =>
          q.eq("participantAId", args.userId)
        )
        .order("desc")
        .collect(),
      ctx.db
        .query("privateConversations")
        .withIndex("by_participant_b_updated", (q) =>
          q.eq("participantBId", args.userId)
        )
        .order("desc")
        .collect(),
    ]);

    const conversations = [...asParticipantA, ...asParticipantB].sort(
      (a, b) => b.updatedAt - a.updatedAt
    );

    return Promise.all(
      conversations.map(async (conversation) => {
        const otherUserId = getOtherUserId(conversation, args.userId);
        const otherUser = await ctx.db.get(otherUserId);
        const lastReadAt = getLastReadAt(conversation, args.userId);

        let lastMessageAt = conversation.lastMessageAt;
        let lastMessageSnippet = conversation.lastMessageSnippet;

        if (!lastMessageAt || !lastMessageSnippet) {
          const lastMessage = await ctx.db
            .query("privateMessages")
            .withIndex("by_conversation_created_at", (q) =>
              q.eq("conversationId", conversation._id)
            )
            .order("desc")
            .first();

          if (lastMessage) {
            lastMessageAt = lastMessage.createdAt;
            lastMessageSnippet = lastMessage.content;
          }
        }

        let unreadCount = 0;
        if (lastMessageAt && lastMessageAt > lastReadAt) {
          const messages = await ctx.db
            .query("privateMessages")
            .withIndex("by_conversation_created_at", (q) =>
              q.eq("conversationId", conversation._id)
            )
            .collect();

          unreadCount = messages.filter(
            (message) =>
              message.senderId !== args.userId && message.createdAt > lastReadAt
          ).length;
        }

        return {
          ...conversation,
          otherUser: toPublicUser(otherUser),
          lastMessageAt,
          lastMessageSnippet,
          unreadCount,
        };
      })
    );
  },
});

// Messages d'une conversation privée
export const getMessages = query({
  args: {
    userId: v.id("users"),
    conversationId: v.id("privateConversations"),
  },
  handler: async (ctx, args) => {
    const conversation = await getConversationForParticipant(
      ctx,
      args.conversationId,
      args.userId
    );

    const [participantA, participantB] = await Promise.all([
      ctx.db.get(conversation.participantAId),
      ctx.db.get(conversation.participantBId),
    ]);

    const messages = await ctx.db
      .query("privateMessages")
      .withIndex("by_conversation_created_at", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();

    return messages.map((message) => ({
      ...message,
      sender: toPublicUser(
        message.senderId === conversation.participantAId
          ? participantA
          : participantB
      ),
    }));
  },
});

// Envoi d'un message privé
export const sendMessage = mutation({
  args: {
    conversationId: v.id("privateConversations"),
    senderId: v.id("users"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const conversation = await getConversationForParticipant(
      ctx,
      args.conversationId,
      args.senderId
    );

    const content = args.content.trim();
    if (!content) {
      throw new Error("Le message ne peut pas être vide");
    }
    if (content.length > MAX_PRIVATE_MESSAGE_LENGTH) {
      throw new Error(
        `Message trop long (max ${MAX_PRIVATE_MESSAGE_LENGTH} caractères)`
      );
    }

    const now = Date.now();
    const messageId = await ctx.db.insert("privateMessages", {
      conversationId: args.conversationId,
      senderId: args.senderId,
      content,
      createdAt: now,
    });

    const basePatch = {
      updatedAt: now,
      lastMessageAt: now,
      lastMessageSenderId: args.senderId,
      lastMessageSnippet: content.slice(0, MAX_LAST_MESSAGE_SNIPPET_LENGTH),
    };

    if (conversation.participantAId === args.senderId) {
      await ctx.db.patch(args.conversationId, {
        ...basePatch,
        participantALastReadAt: now,
      });
    } else {
      await ctx.db.patch(args.conversationId, {
        ...basePatch,
        participantBLastReadAt: now,
      });
    }

    return messageId;
  },
});

// Marquer une conversation comme lue
export const markAsRead = mutation({
  args: {
    userId: v.id("users"),
    conversationId: v.id("privateConversations"),
  },
  handler: async (ctx, args) => {
    const conversation = await getConversationForParticipant(
      ctx,
      args.conversationId,
      args.userId
    );
    const now = Date.now();

    if (conversation.participantAId === args.userId) {
      await ctx.db.patch(args.conversationId, {
        participantALastReadAt: now,
      });
    } else {
      await ctx.db.patch(args.conversationId, {
        participantBLastReadAt: now,
      });
    }

    return { success: true };
  },
});
