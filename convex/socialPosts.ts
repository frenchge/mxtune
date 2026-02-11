import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { v } from "convex/values";

const MAX_POST_LENGTH = 1200;
const MAX_COMMENT_LENGTH = 500;

const toPublicUser = (
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
) =>
  user
    ? {
        _id: user._id,
        name: user.name,
        username: user.username,
        imageUrl: user.imageUrl,
        level: user.level,
        style: user.style,
        objective: user.objective,
        geographicZone: user.geographicZone,
      }
    : null;

// Créer un post texte public
export const create = mutation({
  args: {
    userId: v.id("users"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }

    const content = args.content.trim();
    if (!content) {
      throw new Error("Le post ne peut pas être vide");
    }
    if (content.length > MAX_POST_LENGTH) {
      throw new Error(`Post trop long (max ${MAX_POST_LENGTH} caractères)`);
    }

    const now = Date.now();
    return ctx.db.insert("socialPosts", {
      userId: args.userId,
      content,
      likes: 0,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Récupérer les posts publics pour le feed social
export const getPublic = query({
  args: {
    riderLevel: v.optional(v.string()),
    riderStyle: v.optional(v.string()),
    riderObjective: v.optional(v.string()),
    geographicZone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const posts = await ctx.db.query("socialPosts").order("desc").collect();

    const postsWithDetails = await Promise.all(
      posts.map(async (post) => {
        const user = await ctx.db.get(post.userId);
        const comments = await ctx.db
          .query("socialPostComments")
          .withIndex("by_post", (q) => q.eq("postId", post._id))
          .collect();

        return {
          ...post,
          commentsCount: comments.length,
          user: toPublicUser(user),
        };
      })
    );

    let filtered = postsWithDetails;

    if (args.riderLevel) {
      filtered = filtered.filter((post) => post.user?.level === args.riderLevel);
    }
    if (args.riderStyle) {
      filtered = filtered.filter((post) => post.user?.style === args.riderStyle);
    }
    if (args.riderObjective) {
      filtered = filtered.filter(
        (post) => post.user?.objective === args.riderObjective
      );
    }
    if (args.geographicZone) {
      filtered = filtered.filter(
        (post) => post.user?.geographicZone === args.geographicZone
      );
    }

    return filtered.slice(0, 100);
  },
});

// Toggle like / unlike sur un post
export const toggleLike = mutation({
  args: {
    userId: v.id("users"),
    postId: v.id("socialPosts"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("socialPostLikes")
      .withIndex("by_user_post", (q) =>
        q.eq("userId", args.userId).eq("postId", args.postId)
      )
      .first();

    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post introuvable");
    }

    if (existing) {
      await ctx.db.delete(existing._id);
      await ctx.db.patch(args.postId, {
        likes: Math.max((post.likes || 0) - 1, 0),
      });
      return { liked: false };
    }

    await ctx.db.insert("socialPostLikes", {
      postId: args.postId,
      userId: args.userId,
      createdAt: Date.now(),
    });
    await ctx.db.patch(args.postId, {
      likes: (post.likes || 0) + 1,
    });
    return { liked: true };
  },
});

// IDs de posts likés par l'utilisateur courant
export const getLikedIds = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const likes = await ctx.db
      .query("socialPostLikes")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    return likes.map((like) => like.postId);
  },
});

// Commentaires d'un post
export const getCommentsByPost = query({
  args: { postId: v.id("socialPosts") },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) return [];

    const comments = await ctx.db
      .query("socialPostComments")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();

    const sorted = comments.sort((a, b) => a.createdAt - b.createdAt);
    return Promise.all(
      sorted.map(async (comment) => {
        const user = await ctx.db.get(comment.userId);
        return {
          ...comment,
          user: toPublicUser(user),
        };
      })
    );
  },
});

// Ajouter un commentaire sur un post
export const addComment = mutation({
  args: {
    userId: v.id("users"),
    postId: v.id("socialPosts"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }

    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post introuvable");
    }

    const content = args.content.trim();
    if (!content) {
      throw new Error("Le commentaire ne peut pas être vide");
    }
    if (content.length > MAX_COMMENT_LENGTH) {
      throw new Error(
        `Commentaire trop long (max ${MAX_COMMENT_LENGTH} caractères)`
      );
    }

    const now = Date.now();
    return ctx.db.insert("socialPostComments", {
      postId: args.postId,
      userId: args.userId,
      content,
      createdAt: now,
      updatedAt: now,
    });
  },
});
