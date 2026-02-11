"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfigCard } from "@/components/config-card";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import {
  Settings2,
  Filter,
  UserCheck,
  Bookmark,
  Globe,
  SlidersHorizontal,
  Heart,
  Bike,
  UserPlus,
  UserMinus,
  BookmarkCheck,
  MessageCircle,
  Send,
  FileText,
  Loader2,
} from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";
import { BRANDS, getModelsForBrand } from "@/data/moto-models";
import {
  EmptyState,
  EmptyConfigState,
  EmptySavedConfigsState,
  EmptyCommunityState,
} from "@/components/ui/empty-states";
import { BrandLogo } from "@/components/ui/brand-logo";
import { Badge } from "@/components/ui/badge";
import { GEOGRAPHIC_ZONES, getGeographicZoneLabel } from "@/data/geographic-zones";
import {
  usernameHandle,
  usernameInitials,
  usernameProfileHref,
} from "@/lib/user-display";

const SPORT_TYPES = [
  { value: "enduro", label: "Enduro" },
  { value: "motocross", label: "Motocross" },
  { value: "supermoto", label: "Supermoto" },
  { value: "trail", label: "Trail / Balade" },
  { value: "trial", label: "Trial" },
];

const TERRAIN_TYPES = [
  { value: "sable", label: "Sable" },
  { value: "boue", label: "Boue" },
  { value: "dur", label: "Terrain dur" },
  { value: "rocailleux", label: "Rocailleux" },
  { value: "mixte", label: "Mixte" },
];

const LEVELS = [
  { value: "débutant", label: "Débutant" },
  { value: "intermédiaire", label: "Intermédiaire" },
  { value: "expert", label: "Expert" },
];

const STYLES = [
  { value: "neutre", label: "Neutre" },
  { value: "agressif", label: "Agressif" },
  { value: "souple", label: "Souple" },
];

const OBJECTIVES = [
  { value: "confort", label: "Confort" },
  { value: "performance", label: "Performance" },
  { value: "mixte", label: "Mixte" },
];

const getLabel = (
  options: Array<{ value: string; label: string }>,
  value?: string
) => {
  if (!value) return null;
  return options.find((option) => option.value === value)?.label || value;
};

const MISSING_PUBLIC_FUNCTION_ERROR = "Could not find public function";

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error.length > 0) return error;
  return fallback;
}

function isMissingPublicFunctionError(error: unknown) {
  const message = getErrorMessage(error, "");
  return message.includes(MISSING_PUBLIC_FUNCTION_ERROR);
}

function useSafeQuery<TData>(queryRef: unknown, args: unknown) {
  try {
    const data = useQuery(queryRef as never, args as never) as TData | undefined;
    return {
      data,
      error: null as Error | null,
      missingFunction: false,
    };
  } catch (error) {
    const normalizedError =
      error instanceof Error ? error : new Error(String(error));
    return {
      data: undefined,
      error: normalizedError,
      missingFunction: isMissingPublicFunctionError(normalizedError),
    };
  }
}

interface FeedConfig {
  _id: Id<"configs">;
  userId: Id<"users">;
  createdAt: number;
  likes?: number;
  saves?: number;
  shareLink?: string;
  sportType?: string;
  terrainType?: string;
  riderLevel?: string;
  riderStyle?: string;
  riderObjective?: string;
  moto?: {
    _id?: Id<"motos">;
    brand?: string;
    model?: string;
    year?: number;
    isStockSuspension?: boolean;
    forkBrand?: string;
    shockBrand?: string;
    images?: Id<"_storage">[];
  } | null;
  user?: {
    _id: Id<"users"> | string;
    name: string;
    username?: string;
    imageUrl?: string;
    geographicZone?: string;
  } | null;
}

interface SocialPost {
  _id: Id<"socialPosts">;
  userId: Id<"users">;
  content: string;
  likes?: number;
  commentsCount?: number;
  createdAt: number;
  user?: {
    _id: Id<"users">;
    name: string;
    username?: string;
    imageUrl?: string;
    level?: string;
    style?: string;
    objective?: string;
    geographicZone?: string;
  } | null;
}

interface MotoComment {
  _id: Id<"motoComments">;
  content: string;
  createdAt: number;
  user?: {
    _id: Id<"users">;
    name: string;
    username?: string;
    imageUrl?: string;
  } | null;
}

interface SocialPostComment {
  _id: Id<"socialPostComments">;
  content: string;
  createdAt: number;
  user?: {
    _id: Id<"users">;
    name: string;
    username?: string;
    imageUrl?: string;
  } | null;
}

interface MotoFeedCardProps {
  config: FeedConfig;
  imageUrl?: string;
  isOwner: boolean;
  isSaved: boolean;
  isLiked: boolean;
  isFollowingUser: boolean;
  onLike?: () => void;
  onSave?: () => void;
  onUnsave?: () => void;
  onToggleFollow?: () => void;
  currentUserId?: Id<"users">;
  currentUserImageUrl?: string;
  currentUserName?: string;
}

function MotoFeedCard({
  config,
  imageUrl,
  isOwner,
  isSaved,
  isLiked,
  isFollowingUser,
  onLike,
  onSave,
  onUnsave,
  onToggleFollow,
  currentUserId,
  currentUserImageUrl,
  currentUserName,
}: MotoFeedCardProps) {
  const motoName = `${config.moto?.brand || "Moto"} ${config.moto?.model || ""}`.trim();
  const suspensionLabel = `${config.moto?.forkBrand || "?"} / ${config.moto?.shockBrand || "?"}`;
  const profileLabel = usernameHandle(config.user?.username);
  const profileHref = usernameProfileHref(config.user?.username) || undefined;
  const configHref = config.shareLink ? `/config/${config.shareLink}` : undefined;

  const terrainLabel = getLabel(TERRAIN_TYPES, config.terrainType);
  const sportLabel = getLabel(SPORT_TYPES, config.sportType);
  const levelLabel = getLabel(LEVELS, config.riderLevel);
  const zoneLabel = getGeographicZoneLabel(config.user?.geographicZone);
  const motoId = config.moto?._id;

  const {
    data: comments,
    missingFunction: isMotoCommentsFeatureUnavailable,
  } = useSafeQuery<MotoComment[]>(
    api.motoComments.getByMotoPublic,
    motoId ? { motoId } : "skip"
  );
  const createMotoComment = useMutation(api.motoComments.create);
  const [commentDraft, setCommentDraft] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  const displayedComments = comments ? comments.slice(-4) : [];
  const commentsCount = comments?.length ?? 0;

  const handleSubmitComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentUserId || !motoId) return;
    if (isMotoCommentsFeatureUnavailable) {
      setCommentError(
        "Commentaires indisponibles pour le moment. Synchronise Convex puis recharge."
      );
      return;
    }

    const content = commentDraft.trim();
    if (!content) return;

    setIsSubmittingComment(true);
    setCommentError(null);
    try {
      await createMotoComment({
        userId: currentUserId,
        motoId,
        content,
      });
      setCommentDraft("");
    } catch (error) {
      const message = isMissingPublicFunctionError(error)
        ? "Commentaires indisponibles pour le moment. Synchronise Convex puis recharge."
        : getErrorMessage(error, "Impossible d'ajouter le commentaire.");
      setCommentError(message);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return (
    <article className="group rounded-2xl border border-zinc-800/90 bg-zinc-900/70 p-3.5">
      <div className="flex items-start gap-2.5">
        {config.user?.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={config.user.imageUrl}
            alt={profileLabel}
            className="h-10 w-10 rounded-full border border-zinc-700 object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-xs font-semibold uppercase text-zinc-300">
            {usernameInitials(config.user?.username)}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {profileHref ? (
              <Link
                href={profileHref}
                className="text-sm font-semibold text-white hover:text-violet-300"
              >
                {profileLabel}
              </Link>
            ) : (
              <span className="text-sm font-semibold text-white">{profileLabel}</span>
            )}
            <span className="text-xs text-zinc-500">
              {new Date(config.createdAt).toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "2-digit",
                year: "2-digit",
              })}
            </span>
            {zoneLabel && (
              <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-300">
                {zoneLabel}
              </span>
            )}
          </div>

          <div className="mt-1 flex items-center gap-2">
            <BrandLogo
              brand={config.moto?.brand || ""}
              size="sm"
              className="h-6 w-6 shrink-0 border border-zinc-700/70"
            />
            <h3 className="truncate text-sm font-semibold text-zinc-100">{motoName}</h3>
            <span className="text-xs text-zinc-500">{config.moto?.year || "-"}</span>
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge className="h-5 bg-zinc-800 text-[10px] text-zinc-300 hover:bg-zinc-800">
              {config.moto?.isStockSuspension === false ? "Préparée" : "Stock"}
            </Badge>
            {sportLabel && (
              <Badge variant="outline" className="h-5 border-zinc-700 text-[10px] text-zinc-300">
                {sportLabel}
              </Badge>
            )}
            {terrainLabel && (
              <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-300">
                {terrainLabel}
              </span>
            )}
            {levelLabel && (
              <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-300">
                {levelLabel}
              </span>
            )}
            {config.riderStyle && (
              <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-300">
                {getLabel(STYLES, config.riderStyle)}
              </span>
            )}
            {config.riderObjective && (
              <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-300">
                {getLabel(OBJECTIVES, config.riderObjective)}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-zinc-400">{suspensionLabel}</p>
        </div>

        {onToggleFollow && !isOwner && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onToggleFollow}
            className="h-7 rounded-full border border-zinc-700 bg-zinc-900 px-2.5 text-[11px] text-zinc-200 hover:border-zinc-600 hover:bg-zinc-800"
          >
            {isFollowingUser ? <UserMinus className="mr-1 h-3 w-3" /> : <UserPlus className="mr-1 h-3 w-3" />}
            {isFollowingUser ? "suivi" : "suivre"}
          </Button>
        )}
      </div>

      <div className="relative mt-3 overflow-hidden rounded-xl border border-zinc-800/90 bg-zinc-900">
        {configHref ? (
          <Link href={configHref} className="block">
            <div className="aspect-[16/10]">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt={motoName}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-zinc-500">
                  <Bike className="h-6 w-6" />
                  <span className="text-xs">Aucune photo</span>
                </div>
              )}
            </div>
          </Link>
        ) : (
          <div className="aspect-[16/10]">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt={motoName} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-zinc-500">
                <Bike className="h-6 w-6" />
                <span className="text-xs">Aucune photo</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="relative mt-3 flex items-center gap-1.5">
        <div className="flex items-center gap-1.5">
          {onLike && (
            <button
              type="button"
              onClick={onLike}
              className="inline-flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-900/70 px-2 py-1 text-[11px] text-zinc-300 hover:border-zinc-600 hover:text-white"
            >
              <Heart className={`h-3.5 w-3.5 ${isLiked ? "fill-rose-400 text-rose-400" : ""}`} />
              {config.likes || 0}
            </button>
          )}

          {!isOwner && (onSave || onUnsave) && (
            <button
              type="button"
              onClick={isSaved ? onUnsave : onSave}
              className="inline-flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-900/70 px-2 py-1 text-[11px] text-zinc-300 hover:border-zinc-600 hover:text-white"
            >
              {isSaved ? <BookmarkCheck className="h-3.5 w-3.5 text-emerald-400" /> : <Bookmark className="h-3.5 w-3.5" />}
              {isSaved ? "sauvegardée" : "sauvegarder"}
            </button>
          )}

          <span className="inline-flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-900/70 px-2 py-1 text-[11px] text-zinc-300">
            <MessageCircle className="h-3.5 w-3.5" />
            {commentsCount}
          </span>
        </div>
      </div>

      <div className="relative mt-2 rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-2.5">
        {isMotoCommentsFeatureUnavailable && (
          <p className="mb-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-300">
            Les commentaires sont temporairement indisponibles sur ce backend.
          </p>
        )}
        <div className="space-y-2">
          {displayedComments.length > 0 ? (
            displayedComments.map((comment) => {
              const commentAuthor = usernameHandle(comment.user?.username);

              return (
                <div key={comment._id} className="flex items-start gap-2">
                  {comment.user?.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={comment.user.imageUrl}
                      alt={commentAuthor}
                      className="h-7 w-7 rounded-full border border-zinc-700 object-cover"
                    />
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-[10px] font-semibold uppercase text-zinc-300">
                      {usernameInitials(comment.user?.username)}
                    </div>
                  )}

                  <div className="min-w-0 rounded-md bg-zinc-900/80 px-2.5 py-1.5">
                    <p className="text-[10px] text-zinc-500">
                      {commentAuthor} •{" "}
                      {new Date(comment.createdAt).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "2-digit",
                      })}
                    </p>
                    <p className="break-words text-xs text-zinc-200">
                      {comment.content}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-xs text-zinc-500">Aucun commentaire pour le moment.</p>
          )}
        </div>

        <form className="mt-2 flex items-start gap-2" onSubmit={handleSubmitComment}>
          {currentUserImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentUserImageUrl}
              alt="Votre profil"
              className="h-7 w-7 rounded-full border border-zinc-700 object-cover"
            />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-[10px] font-semibold uppercase text-zinc-300">
              {(currentUserName || "M").slice(0, 2)}
            </div>
          )}

          <div className="flex flex-1 items-center gap-1.5">
            <input
              type="text"
              value={commentDraft}
              onChange={(event) => setCommentDraft(event.target.value)}
              placeholder="Ajouter un commentaire..."
              className="h-8 flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-2 text-xs text-white placeholder:text-zinc-500 outline-none transition-colors focus:border-violet-500"
              maxLength={500}
              disabled={
                !currentUserId ||
                !motoId ||
                isSubmittingComment ||
                isMotoCommentsFeatureUnavailable
              }
            />
            <Button
              type="submit"
              size="icon"
              disabled={
                !currentUserId ||
                !motoId ||
                isSubmittingComment ||
                isMotoCommentsFeatureUnavailable ||
                commentDraft.trim().length === 0
              }
              className="h-8 w-8 bg-violet-600 hover:bg-violet-500"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </form>

        {commentError && (
          <p className="mt-1 text-[11px] text-red-400">{commentError}</p>
        )}
      </div>
    </article>
  );
}

interface PostFeedCardProps {
  post: SocialPost;
  isLiked: boolean;
  onLike?: () => void;
  currentUserId?: Id<"users">;
  currentUserImageUrl?: string;
  currentUserName?: string;
}

function PostFeedCard({
  post,
  isLiked,
  onLike,
  currentUserId,
  currentUserImageUrl,
  currentUserName,
}: PostFeedCardProps) {
  const postAuthor = usernameHandle(post.user?.username);
  const postDisplayName = usernameHandle(post.user?.username);
  const postAuthorHref = usernameProfileHref(post.user?.username) || undefined;

  const {
    data: comments,
    missingFunction: isPostCommentsFeatureUnavailable,
  } = useSafeQuery<SocialPostComment[]>(api.socialPosts.getCommentsByPost, {
    postId: post._id,
  });
  const addComment = useMutation(api.socialPosts.addComment);

  const [commentDraft, setCommentDraft] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  const displayedComments = comments ? comments.slice(-4) : [];
  const commentsCount = comments?.length ?? post.commentsCount ?? 0;

  const handleSubmitComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentUserId) return;
    if (isPostCommentsFeatureUnavailable) {
      setCommentError(
        "Commentaires indisponibles pour le moment. Synchronise Convex puis recharge."
      );
      return;
    }

    const content = commentDraft.trim();
    if (!content) return;

    setIsSubmittingComment(true);
    setCommentError(null);
    try {
      await addComment({
        userId: currentUserId,
        postId: post._id,
        content,
      });
      setCommentDraft("");
    } catch (error) {
      const message = isMissingPublicFunctionError(error)
        ? "Commentaires indisponibles pour le moment. Synchronise Convex puis recharge."
        : getErrorMessage(error, "Impossible d'ajouter le commentaire.");
      setCommentError(message);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-zinc-800/90 bg-zinc-900/75 p-4 transition-colors hover:border-zinc-700">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.12),transparent_52%)]" />

      <div className="relative flex items-start gap-3">
        {post.user?.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.user.imageUrl}
            alt={postAuthor}
            className="h-10 w-10 rounded-full border border-zinc-700 object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-xs font-semibold uppercase text-zinc-300">
            {usernameInitials(post.user?.username)}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {postAuthorHref ? (
              <Link
                href={postAuthorHref}
                className="text-sm font-semibold text-white hover:text-violet-300"
              >
                {postDisplayName}
              </Link>
            ) : (
              <span className="text-sm font-semibold text-white">{postDisplayName}</span>
            )}
            {post.user?.geographicZone && (
              <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-300">
                {getGeographicZoneLabel(post.user.geographicZone)}
              </span>
            )}
            <span className="text-xs text-zinc-500">
              {new Date(post.createdAt).toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "2-digit",
                year: "2-digit",
              })}
            </span>
          </div>

          <p className="mt-2 whitespace-pre-wrap break-words text-[15px] leading-6 text-zinc-100">
            {post.content}
          </p>
        </div>
      </div>

      <div className="relative mt-3 flex items-center gap-2 border-t border-zinc-800/90 pt-3">
        <button
          type="button"
          onClick={onLike}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ${
            isLiked
              ? "border-rose-500/40 bg-rose-500/15 text-rose-300 hover:bg-rose-500/20"
              : "border-zinc-700 bg-zinc-900/70 text-zinc-300 hover:border-zinc-600 hover:text-white"
          }`}
          disabled={!onLike}
        >
          <Heart className={`h-3.5 w-3.5 ${isLiked ? "fill-rose-400 text-rose-400" : ""}`} />
          {post.likes || 0}
        </button>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-900/70 px-3 py-1.5 text-xs text-zinc-300">
          <MessageCircle className="h-3.5 w-3.5" />
          {commentsCount}
        </span>
      </div>

      <div className="relative mt-3 rounded-xl border border-zinc-800/90 bg-zinc-950/40 p-3">
        {isPostCommentsFeatureUnavailable && (
          <p className="mb-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-300">
            Les commentaires sont temporairement indisponibles sur ce backend.
          </p>
        )}
        <div className="space-y-2.5">
          {displayedComments.length > 0 ? (
            displayedComments.map((comment) => {
              const commentAuthor = usernameHandle(comment.user?.username);
              return (
                <div key={comment._id} className="flex items-start gap-2.5">
                  {comment.user?.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={comment.user.imageUrl}
                      alt={commentAuthor}
                      className="h-8 w-8 rounded-full border border-zinc-700 object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-[10px] font-semibold uppercase text-zinc-300">
                      {usernameInitials(comment.user?.username)}
                    </div>
                  )}

                  <div className="min-w-0 rounded-xl bg-zinc-900/85 px-3 py-2">
                    <p className="text-[11px] font-medium text-zinc-400">
                      {commentAuthor}
                    </p>
                    <p className="break-words text-sm text-zinc-200">
                      {comment.content}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-zinc-500">Aucun commentaire pour le moment.</p>
          )}
        </div>

        <form className="mt-3 flex items-center gap-2.5" onSubmit={handleSubmitComment}>
          {currentUserImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentUserImageUrl}
              alt="Votre profil"
              className="h-8 w-8 rounded-full border border-zinc-700 object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-[10px] font-semibold uppercase text-zinc-300">
              {(currentUserName || "M").slice(0, 2)}
            </div>
          )}

          <div className="flex flex-1 items-center gap-2">
            <input
              type="text"
              value={commentDraft}
              onChange={(event) => setCommentDraft(event.target.value)}
              placeholder="Répondre à ce post..."
              className="h-10 flex-1 rounded-full border border-zinc-700 bg-zinc-900 px-3 text-sm text-white placeholder:text-zinc-500 outline-none transition-colors focus:border-violet-500"
              maxLength={500}
              disabled={
                !currentUserId ||
                isSubmittingComment ||
                isPostCommentsFeatureUnavailable
              }
            />
            <Button
              type="submit"
              size="icon"
              disabled={
                !currentUserId ||
                isSubmittingComment ||
                isPostCommentsFeatureUnavailable ||
                commentDraft.trim().length === 0
              }
              className="h-10 w-10 rounded-full bg-violet-600 hover:bg-violet-500"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
        {commentError && (
          <p className="mt-2 text-xs text-red-400">{commentError}</p>
        )}
      </div>
    </article>
  );
}

export default function ConfigsPage() {
  const { user } = useCurrentUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("feed");
  const [feedSocialTab, setFeedSocialTab] = useState("motos");
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [newPostContent, setNewPostContent] = useState("");
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [createPostError, setCreatePostError] = useState<string | null>(null);
  const requestedTab = searchParams.get("tab");
  const requestedFeedTab = searchParams.get("feedTab");
  const requestedConversationId = searchParams.get("conversationId");

  // Filtres
  const [brandFilter, setBrandFilter] = useState<string>("");
  const [modelFilter, setModelFilter] = useState<string>("");
  const [sportFilter, setSportFilter] = useState<string>("");
  const [terrainFilter, setTerrainFilter] = useState<string>("");
  const [levelFilter, setLevelFilter] = useState<string>("");
  const [styleFilter, setStyleFilter] = useState<string>("");
  const [objectiveFilter, setObjectiveFilter] = useState<string>("");
  const [geographicZoneFilter, setGeographicZoneFilter] = useState<string>("");

  const configs = useQuery(
    api.configs.getByUser,
    user?._id ? { userId: user._id } : "skip"
  );

  const publicConfigs = useQuery(api.configs.getPublic, {
    brand: brandFilter || undefined,
    model: modelFilter || undefined,
    sportType: sportFilter || undefined,
    terrainType: terrainFilter || undefined,
    riderLevel: levelFilter || undefined,
    riderStyle: styleFilter || undefined,
    riderObjective: objectiveFilter || undefined,
    geographicZone: geographicZoneFilter || undefined,
  });
  const {
    data: socialPosts,
    missingFunction: isSocialPostsFeatureUnavailable,
  } = useSafeQuery<SocialPost[]>(api.socialPosts.getPublic, {
    riderLevel: levelFilter || undefined,
    riderStyle: styleFilter || undefined,
    riderObjective: objectiveFilter || undefined,
    geographicZone: geographicZoneFilter || undefined,
  });

  const savedConfigs = useQuery(
    api.savedConfigs.getByUser,
    user?._id ? { userId: user._id } : "skip"
  );

  const savedConfigIds = useQuery(
    api.savedConfigs.getSavedIds,
    user?._id ? { userId: user._id } : "skip"
  );

  const likedConfigIds = useQuery(
    api.configLikes.getLikedIds,
    user?._id ? { userId: user._id } : "skip"
  );
  const {
    data: likedPostIds,
    missingFunction: isSocialPostLikesFeatureUnavailable,
  } = useSafeQuery<Id<"socialPosts">[]>(
    api.socialPosts.getLikedIds,
    user?._id ? { userId: user._id } : "skip"
  );

  const followingConfigs = useQuery(
    api.configs.getFromFollowing,
    user?._id ? { userId: user._id } : "skip"
  );

  const followingIds = useQuery(
    api.follows.getFollowingIds,
    user?._id ? { userId: user._id } : "skip"
  );

  const deleteConfig = useMutation(api.configs.remove);
  const updateConfig = useMutation(api.configs.update);
  const updateConfigField = useMutation(api.configs.updateField);
  const toggleLikeConfig = useMutation(api.configLikes.toggleLike);
  const createSocialPost = useMutation(api.socialPosts.create);
  const toggleSocialPostLike = useMutation(api.socialPosts.toggleLike);
  const saveConfig = useMutation(api.savedConfigs.save);
  const unsaveConfig = useMutation(api.savedConfigs.unsave);
  const toggleFollowUser = useMutation(api.follows.toggleFollow);

  const handleDelete = async (configId: Id<"configs">) => {
    await deleteConfig({ configId });
  };

  const handleVisibilityChange = async (
    configId: Id<"configs">,
    visibility: string
  ) => {
    await updateConfig({ configId, visibility });
  };

  const handleUpdateField = async (
    configId: Id<"configs">,
    field: string,
    value: number
  ) => {
    await updateConfigField({ configId, field, value });
  };

  const handleSaveConfig = async (configId: Id<"configs">) => {
    if (!user?._id) return;
    await saveConfig({ userId: user._id, configId });
  };

  const handleUnsaveConfig = async (configId: Id<"configs">) => {
    if (!user?._id) return;
    await unsaveConfig({ userId: user._id, configId });
  };

  const isConfigSaved = (configId: Id<"configs">) => {
    return savedConfigIds?.includes(configId) || false;
  };

  const isConfigLiked = (configId: Id<"configs">) => {
    return likedConfigIds?.includes(configId) || false;
  };

  const handleToggleLike = async (configId: Id<"configs">) => {
    if (!user?._id) return;
    await toggleLikeConfig({ userId: user._id, configId });
  };

  const isPostLiked = (postId: Id<"socialPosts">) => {
    return likedPostIds?.includes(postId) || false;
  };

  const handleTogglePostLike = async (postId: Id<"socialPosts">) => {
    if (!user?._id) return;
    if (isSocialPostsFeatureUnavailable || isSocialPostLikesFeatureUnavailable) {
      setCreatePostError(
        "Fonction sociale indisponible pour le moment. Synchronise Convex puis recharge."
      );
      return;
    }

    try {
      await toggleSocialPostLike({ userId: user._id, postId });
    } catch (error) {
      const message = isMissingPublicFunctionError(error)
        ? "Fonction sociale indisponible pour le moment. Synchronise Convex puis recharge."
        : getErrorMessage(error, "Impossible de liker ce post.");
      setCreatePostError(message);
    }
  };

  const handleCreatePost = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user?._id) return;
    if (isSocialPostsFeatureUnavailable || isSocialPostLikesFeatureUnavailable) {
      setCreatePostError(
        "Fonction sociale indisponible pour le moment. Synchronise Convex puis recharge."
      );
      return;
    }

    const content = newPostContent.trim();
    if (!content) return;

    setIsCreatingPost(true);
    setCreatePostError(null);
    try {
      await createSocialPost({
        userId: user._id,
        content,
      });
      setNewPostContent("");
    } catch (error) {
      const message = isMissingPublicFunctionError(error)
        ? "Fonction sociale indisponible pour le moment. Synchronise Convex puis recharge."
        : getErrorMessage(error, "Impossible de publier le post.");
      setCreatePostError(message);
    } finally {
      setIsCreatingPost(false);
    }
  };

  const handleToggleFollow = async (followingId: Id<"users">) => {
    if (!user?._id) return;
    await toggleFollowUser({ followerId: user._id, followingId });
  };

  const isUserFollowed = (userId: Id<"users">) => {
    return followingIds?.includes(userId) || false;
  };

  const copyShareLink = (shareLink: string) => {
    const fullUrl = `${window.location.origin}/config/${shareLink}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(shareLink);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const availableModels = brandFilter ? getModelsForBrand(brandFilter) : [];

  const clearFilters = () => {
    setBrandFilter("");
    setModelFilter("");
    setSportFilter("");
    setTerrainFilter("");
    setLevelFilter("");
    setStyleFilter("");
    setObjectiveFilter("");
    setGeographicZoneFilter("");
  };

  const hasFilters =
    !!brandFilter ||
    !!modelFilter ||
    !!sportFilter ||
    !!terrainFilter ||
    !!levelFilter ||
    !!styleFilter ||
    !!objectiveFilter ||
    !!geographicZoneFilter;
  const hasMotoScopedFilters =
    !!brandFilter || !!modelFilter || !!sportFilter || !!terrainFilter;
  const isSocialFeedUnavailable =
    isSocialPostsFeatureUnavailable || isSocialPostLikesFeatureUnavailable;

  useEffect(() => {
    if (requestedTab === "messages" || requestedConversationId) {
      const query = requestedConversationId
        ? `?conversationId=${requestedConversationId}`
        : "";
      router.replace(`/messages${query}`);
      return;
    }

    const allowedTabs = new Set([
      "feed",
      "configs",
      "suivi",
      "sauvegardees",
      "mes-configs",
    ]);
    if (requestedTab && allowedTabs.has(requestedTab)) {
      setActiveTab(requestedTab);
    }

    if (requestedFeedTab === "motos" || requestedFeedTab === "posts") {
      setActiveTab("feed");
      setFeedSocialTab(requestedFeedTab);
    }
  }, [requestedTab, requestedFeedTab, requestedConversationId, router]);

  type FilterableConfig = {
    moto?: {
      brand?: string;
      model?: string;
    } | null;
    motoBrand?: string;
    motoModel?: string;
    sportType?: string;
    terrainType?: string;
    riderLevel?: string;
    riderStyle?: string;
    riderObjective?: string;
    user?: {
      geographicZone?: string;
    } | null;
  };

  const filterConfigs = <T extends FilterableConfig>(configList: T[] | undefined): T[] => {
    if (!configList) return [];

    return configList.filter((config) => {
      const motoBrand = config.moto?.brand || config.motoBrand;
      const motoModel = config.moto?.model || config.motoModel;

      if (brandFilter && motoBrand !== brandFilter) return false;
      if (modelFilter && motoModel !== modelFilter) return false;
      if (sportFilter && config.sportType !== sportFilter) return false;
      if (terrainFilter && config.terrainType !== terrainFilter) return false;
      if (levelFilter && config.riderLevel !== levelFilter) return false;
      if (styleFilter && config.riderStyle !== styleFilter) return false;
      if (objectiveFilter && config.riderObjective !== objectiveFilter) return false;
      if (
        geographicZoneFilter &&
        config.user?.geographicZone &&
        config.user.geographicZone !== geographicZoneFilter
      ) {
        return false;
      }
      if (geographicZoneFilter && config.user && !config.user.geographicZone) {
        return false;
      }

      return true;
    });
  };

  const filteredConfigs = filterConfigs(configs);
  const savedConfigsWithoutNulls = savedConfigs?.filter(
    (config): config is NonNullable<NonNullable<typeof savedConfigs>[number]> =>
      config !== null
  );
  const filteredSavedConfigs = filterConfigs(savedConfigsWithoutNulls);
  const filteredFollowingConfigs = filterConfigs(followingConfigs);

  const allFeedConfigs = useMemo(
    () => [
      ...(publicConfigs || []),
      ...filteredSavedConfigs,
      ...filteredFollowingConfigs,
      ...filteredConfigs,
    ],
    [
      publicConfigs,
      filteredSavedConfigs,
      filteredFollowingConfigs,
      filteredConfigs,
    ]
  );

  const allMotoImageIds = useMemo(() => {
    const ids = new Set<string>();

    allFeedConfigs.forEach((config) => {
      (config.moto?.images || []).forEach((imageId) => {
        ids.add(String(imageId));
      });
    });

    return Array.from(ids) as Id<"_storage">[];
  }, [allFeedConfigs]);

  const motoImageEntries = useQuery(
    api.files.getUrls,
    allMotoImageIds.length > 0 ? { storageIds: allMotoImageIds } : "skip"
  );

  const motoImageMap = useMemo(() => {
    const map = new Map<string, string>();
    (motoImageEntries || []).forEach((entry) => {
      if (entry.url) {
        map.set(String(entry.id), entry.url);
      }
    });
    return map;
  }, [motoImageEntries]);

  const getMotoImageUrl = (config: FeedConfig) => {
    const firstImageId = config.moto?.images?.[0];
    if (!firstImageId) return undefined;
    return motoImageMap.get(String(firstImageId));
  };

  const selectClassName =
    "h-10 rounded-lg border border-zinc-700 bg-zinc-800 px-3 text-sm text-zinc-100 outline-none transition-colors hover:border-zinc-600 focus:border-violet-500";

  return (
    <>
      <SignedOut>
        <div className="flex h-screen items-center justify-center bg-zinc-950">
          <div className="space-y-4 text-center">
            <h1 className="text-2xl font-bold text-white">
              CONNECTE-TOI POUR VOIR LES CONFIGS
            </h1>
            <SignInButton mode="modal">
              <Button className="bg-purple-500 font-bold italic hover:bg-purple-600">
                Se connecter
              </Button>
            </SignInButton>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="flex h-screen flex-col bg-zinc-950">
            <div className="flex flex-1 overflow-hidden">
              <div className="flex-1 overflow-auto p-8">
                <div className="mx-auto max-w-6xl space-y-6">
                  <div>
                    <h1 className="text-2xl font-bold text-white">COMMUNAUTÉ</h1>
                    <p className="mt-1 text-zinc-400">
                      Découvre les motos et configs partagées par la communauté
                    </p>
                  </div>

                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="h-auto bg-zinc-900 border border-zinc-800 p-1">
                      <TabsTrigger
                        value="feed"
                        className="gap-2 data-[state=active]:bg-violet-600 data-[state=active]:text-white"
                      >
                        <Globe className="h-4 w-4" />
                        FEED
                      </TabsTrigger>
                      <TabsTrigger
                        value="configs"
                        className="gap-2 data-[state=active]:bg-violet-600 data-[state=active]:text-white"
                      >
                        <SlidersHorizontal className="h-4 w-4" />
                        CONFIGS
                      </TabsTrigger>
                      <TabsTrigger
                        value="suivi"
                        className="gap-2 data-[state=active]:bg-violet-600 data-[state=active]:text-white"
                      >
                        <UserCheck className="h-4 w-4" />
                        SUIVI
                      </TabsTrigger>
                      <TabsTrigger
                        value="sauvegardees"
                        className="gap-2 data-[state=active]:bg-violet-600 data-[state=active]:text-white"
                      >
                        <Bookmark className="h-4 w-4" />
                        SAUVEGARDÉES
                      </TabsTrigger>
                      <TabsTrigger
                        value="mes-configs"
                        className="gap-2 data-[state=active]:bg-violet-600 data-[state=active]:text-white"
                      >
                        <Settings2 className="h-4 w-4" />
                        MES CONFIGS
                      </TabsTrigger>
                    </TabsList>

                    <div className="mt-4 rounded-xl border border-zinc-800 bg-gradient-to-r from-zinc-900/80 to-zinc-900/40 p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Filter className="h-4 w-4 text-zinc-500" />

                        <select
                          value={brandFilter}
                          onChange={(e) => {
                            setBrandFilter(e.target.value);
                            setModelFilter("");
                          }}
                          className={selectClassName}
                        >
                          <option value="">Toutes marques</option>
                          {BRANDS.map((brand) => (
                            <option key={brand} value={brand}>
                              {brand}
                            </option>
                          ))}
                        </select>

                        <select
                          value={modelFilter}
                          onChange={(e) => setModelFilter(e.target.value)}
                          disabled={!brandFilter}
                          className={`${selectClassName} disabled:cursor-not-allowed disabled:opacity-40`}
                        >
                          <option value="">Tous modèles</option>
                          {availableModels.map((model) => (
                            <option key={model} value={model}>
                              {model}
                            </option>
                          ))}
                        </select>

                        <select
                          value={sportFilter}
                          onChange={(e) => setSportFilter(e.target.value)}
                          className={selectClassName}
                        >
                          <option value="">Tous sports</option>
                          {SPORT_TYPES.map((sport) => (
                            <option key={sport.value} value={sport.value}>
                              {sport.label}
                            </option>
                          ))}
                        </select>

                        <select
                          value={terrainFilter}
                          onChange={(e) => setTerrainFilter(e.target.value)}
                          className={selectClassName}
                        >
                          <option value="">Tous terrains</option>
                          {TERRAIN_TYPES.map((terrain) => (
                            <option key={terrain.value} value={terrain.value}>
                              {terrain.label}
                            </option>
                          ))}
                        </select>

                        <select
                          value={levelFilter}
                          onChange={(e) => setLevelFilter(e.target.value)}
                          className={selectClassName}
                        >
                          <option value="">Tous niveaux</option>
                          {LEVELS.map((level) => (
                            <option key={level.value} value={level.value}>
                              {level.label}
                            </option>
                          ))}
                        </select>

                        <select
                          value={styleFilter}
                          onChange={(e) => setStyleFilter(e.target.value)}
                          className={selectClassName}
                        >
                          <option value="">Tous styles</option>
                          {STYLES.map((style) => (
                            <option key={style.value} value={style.value}>
                              {style.label}
                            </option>
                          ))}
                        </select>

                        <select
                          value={objectiveFilter}
                          onChange={(e) => setObjectiveFilter(e.target.value)}
                          className={selectClassName}
                        >
                          <option value="">Tous objectifs</option>
                          {OBJECTIVES.map((objective) => (
                            <option key={objective.value} value={objective.value}>
                              {objective.label}
                            </option>
                          ))}
                        </select>

                        <select
                          value={geographicZoneFilter}
                          onChange={(event) => setGeographicZoneFilter(event.target.value)}
                          className={selectClassName}
                        >
                          <option value="">Toutes zones</option>
                          {GEOGRAPHIC_ZONES.map((zone) => (
                            <option key={zone.value} value={zone.value}>
                              {zone.label}
                            </option>
                          ))}
                        </select>

                        {hasFilters && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearFilters}
                            className="h-10 px-3 text-zinc-400 hover:text-white"
                          >
                            Effacer
                          </Button>
                        )}
                      </div>
                    </div>

                    <TabsContent value="mes-configs" className="mt-4 space-y-4">
                      {filteredConfigs?.map((config) => (
                        <ConfigCard
                          key={config._id}
                          config={config}
                          isOwner={true}
                          showUser={false}
                          showVisibilityControls={true}
                          showDeleteButton={true}
                          showLikeButton={false}
                          showSaveButton={false}
                          showAdjustButtons={true}
                          onDelete={() => handleDelete(config._id)}
                          onVisibilityChange={(v) => handleVisibilityChange(config._id, v)}
                          onCopyLink={copyShareLink}
                          copiedLink={copiedLink}
                          onUpdateField={(field, value) =>
                            handleUpdateField(config._id, field, value)
                          }
                        />
                      ))}

                      {(!filteredConfigs || filteredConfigs.length === 0) && (
                        <EmptyConfigState
                          onStartChat={() => router.push("/chat/new")}
                          onBrowseCommunity={() => setActiveTab("feed")}
                        />
                      )}
                    </TabsContent>

                    <TabsContent value="sauvegardees" className="mt-4">
                      {filteredSavedConfigs && filteredSavedConfigs.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                          {filteredSavedConfigs.map((config) => (
                            <MotoFeedCard
                              key={config._id}
                              config={config as FeedConfig}
                              imageUrl={getMotoImageUrl(config as FeedConfig)}
                              isOwner={config.userId === user?._id}
                              isSaved={true}
                              isLiked={isConfigLiked(config._id)}
                              isFollowingUser={
                                config.user?._id
                                  ? isUserFollowed(config.user._id as Id<"users">)
                                  : false
                              }
                              onLike={() => handleToggleLike(config._id)}
                              onUnsave={() => handleUnsaveConfig(config._id)}
                              onToggleFollow={
                                config.user?._id && config.userId !== user?._id
                                  ? () =>
                                      handleToggleFollow(
                                        config.user!._id as Id<"users">
                                      )
                                  : undefined
                              }
                              currentUserId={user?._id}
                              currentUserImageUrl={user?.imageUrl}
                              currentUserName={user?.username}
                            />
                          ))}
                        </div>
                      ) : (
                        <EmptySavedConfigsState
                          onBrowseCommunity={() => setActiveTab("feed")}
                        />
                      )}
                    </TabsContent>

                    <TabsContent value="feed" className="mt-4 space-y-4">
                      <Tabs
                        value={feedSocialTab}
                        onValueChange={setFeedSocialTab}
                        className="w-full"
                      >
                        <TabsList className="h-auto bg-zinc-900 border border-zinc-800 p-1">
                          <TabsTrigger
                            value="motos"
                            className="gap-2 data-[state=active]:bg-violet-600 data-[state=active]:text-white"
                          >
                            <Bike className="h-4 w-4" />
                            MOTOS
                          </TabsTrigger>
                          <TabsTrigger
                            value="posts"
                            className="gap-2 data-[state=active]:bg-violet-600 data-[state=active]:text-white"
                          >
                            <FileText className="h-4 w-4" />
                            POSTS
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="motos" className="mt-4">
                          {publicConfigs && publicConfigs.length > 0 ? (
                            <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-4">
                              {publicConfigs.map((config) => (
                                <MotoFeedCard
                                  key={config._id}
                                  config={config as FeedConfig}
                                  imageUrl={getMotoImageUrl(config as FeedConfig)}
                                  isOwner={config.userId === user?._id}
                                  isSaved={isConfigSaved(config._id)}
                                  isLiked={isConfigLiked(config._id)}
                                  isFollowingUser={
                                    config.user?._id
                                      ? isUserFollowed(config.user._id as Id<"users">)
                                      : false
                                  }
                                  onLike={() => handleToggleLike(config._id)}
                                  onSave={
                                    config.userId !== user?._id
                                      ? () => handleSaveConfig(config._id)
                                      : undefined
                                  }
                                  onUnsave={
                                    config.userId !== user?._id
                                      ? () => handleUnsaveConfig(config._id)
                                      : undefined
                                  }
                                  onToggleFollow={
                                    config.user?._id && config.userId !== user?._id
                                      ? () =>
                                          handleToggleFollow(
                                            config.user!._id as Id<"users">
                                          )
                                      : undefined
                                  }
                                  currentUserId={user?._id}
                                  currentUserImageUrl={user?.imageUrl}
                                  currentUserName={user?.username}
                                />
                              ))}
                            </div>
                          ) : (
                            <EmptyCommunityState />
                          )}
                        </TabsContent>

                        <TabsContent value="posts" className="mt-4">
                          <div className="w-full space-y-4">
                            {isSocialFeedUnavailable && (
                              <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
                                Le feed social n&apos;est pas disponible sur ce backend.
                                Lance `npm run convex:sync`, puis recharge la page.
                              </div>
                            )}
                            {hasMotoScopedFilters && (
                              <div className="rounded-md border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-zinc-400">
                                Les filtres marque/modèle/sport/terrain s&apos;appliquent
                                aux motos. Les posts texte utilisent surtout les filtres
                                profil (niveau/style/objectif/zone).
                              </div>
                            )}
                            <form
                              onSubmit={handleCreatePost}
                              className="rounded-2xl border border-zinc-800/90 bg-gradient-to-br from-zinc-900/90 to-zinc-900/60 p-4"
                            >
                              <div className="flex items-start gap-2.5">
                                {user?.imageUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={user.imageUrl}
                                    alt={usernameHandle(user?.username, "moi")}
                                    className="h-10 w-10 rounded-full border border-zinc-700 object-cover"
                                  />
                                ) : (
                                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-xs font-semibold uppercase text-zinc-300">
                                    {usernameInitials(user?.username, "M")}
                                  </div>
                                )}

                                <div className="min-w-0 flex-1 space-y-2">
                                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                                    Nouveau post
                                  </p>
                                  <textarea
                                    value={newPostContent}
                                    onChange={(event) =>
                                      setNewPostContent(event.target.value)
                                    }
                                    placeholder="Partager une astuce, un retour de sortie, ou une question..."
                                    className="min-h-[110px] w-full resize-y rounded-xl border border-zinc-700 bg-zinc-900/90 px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none transition-colors focus:border-violet-500"
                                    maxLength={1200}
                                    disabled={isSocialFeedUnavailable}
                                  />
                                  <div className="flex items-center justify-between">
                                    <p className="text-xs text-zinc-500">
                                      {newPostContent.length}/1200
                                    </p>
                                    <Button
                                      type="submit"
                                      disabled={
                                        isSocialFeedUnavailable ||
                                        isCreatingPost ||
                                        newPostContent.trim().length === 0
                                      }
                                      className="h-9 rounded-full bg-violet-600 px-4 text-xs font-medium hover:bg-violet-500"
                                    >
                                      {isCreatingPost ? (
                                        <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                                      ) : (
                                        <Send className="mr-1 h-3.5 w-3.5" />
                                      )}
                                      Publier
                                    </Button>
                                  </div>
                                  {createPostError && (
                                    <p className="text-xs text-red-400">{createPostError}</p>
                                  )}
                                </div>
                              </div>
                            </form>

                            {!isSocialFeedUnavailable &&
                            socialPosts &&
                            socialPosts.length > 0 ? (
                              <div className="space-y-4">
                                {socialPosts.map((post) => (
                                  <PostFeedCard
                                    key={post._id}
                                    post={post}
                                    isLiked={isPostLiked(post._id)}
                                    onLike={() => handleTogglePostLike(post._id)}
                                    currentUserId={user?._id}
                                    currentUserImageUrl={user?.imageUrl}
                                    currentUserName={user?.username}
                                  />
                                ))}
                              </div>
                            ) : !isSocialFeedUnavailable ? (
                              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-8 text-center">
                                <FileText className="mx-auto h-8 w-8 text-zinc-600" />
                                <p className="mt-2 text-sm text-zinc-400">
                                  Aucun post pour le moment.
                                </p>
                                <p className="text-xs text-zinc-500">
                                  Sois le premier à lancer la discussion.
                                </p>
                              </div>
                            ) : null}
                          </div>
                        </TabsContent>
                      </Tabs>
                    </TabsContent>

                    <TabsContent value="configs" className="mt-4 space-y-4">
                      {publicConfigs?.map((config) => (
                        <ConfigCard
                          key={config._id}
                          config={config}
                          currentUserId={user?._id}
                          isOwner={config.userId === user?._id}
                          isSaved={isConfigSaved(config._id)}
                          isLiked={isConfigLiked(config._id)}
                          isFollowingUser={
                            config.user?._id
                              ? isUserFollowed(config.user._id as Id<"users">)
                              : false
                          }
                          onLike={() => handleToggleLike(config._id)}
                          onSave={
                            config.userId !== user?._id
                              ? () => handleSaveConfig(config._id)
                              : undefined
                          }
                          onUnsave={
                            config.userId !== user?._id
                              ? () => handleUnsaveConfig(config._id)
                              : undefined
                          }
                          onDelete={
                            config.userId === user?._id
                              ? () => handleDelete(config._id)
                              : undefined
                          }
                          onVisibilityChange={
                            config.userId === user?._id
                              ? (v) => handleVisibilityChange(config._id, v)
                              : undefined
                          }
                          onCopyLink={copyShareLink}
                          copiedLink={copiedLink}
                          onToggleFollow={
                            config.user?._id && config.userId !== user?._id
                              ? () =>
                                  handleToggleFollow(
                                    config.user!._id as Id<"users">
                                  )
                              : undefined
                          }
                        />
                      ))}

                      {(!publicConfigs || publicConfigs.length === 0) && (
                        <EmptyCommunityState />
                      )}
                    </TabsContent>

                    <TabsContent value="suivi" className="mt-4">
                      {filteredFollowingConfigs && filteredFollowingConfigs.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                          {filteredFollowingConfigs.map((config) => (
                            <MotoFeedCard
                              key={config._id}
                              config={config as FeedConfig}
                              imageUrl={getMotoImageUrl(config as FeedConfig)}
                              isOwner={config.userId === user?._id}
                              isSaved={isConfigSaved(config._id)}
                              isLiked={isConfigLiked(config._id)}
                              isFollowingUser={
                                config.user?._id
                                  ? isUserFollowed(config.user._id as Id<"users">)
                                  : false
                              }
                              onLike={() => handleToggleLike(config._id)}
                              onSave={() => handleSaveConfig(config._id)}
                              onUnsave={() => handleUnsaveConfig(config._id)}
                              onToggleFollow={
                                config.user?._id
                                  ? () =>
                                      handleToggleFollow(
                                        config.user!._id as Id<"users">
                                      )
                                  : undefined
                              }
                              currentUserId={user?._id}
                              currentUserImageUrl={user?.imageUrl}
                              currentUserName={user?.username}
                            />
                          ))}
                        </div>
                      ) : (
                        <EmptyState
                          variant="community"
                          icon={<UserCheck className="h-8 w-8" />}
                          title={
                            hasFilters
                              ? "Aucune moto trouvée"
                              : "Tu ne suis personne pour l'instant"
                          }
                          description={
                            hasFilters
                              ? "Essaie de modifier tes filtres pour élargir la recherche."
                              : "Suis des riders dans l'onglet Feed pour voir leurs nouvelles motos et configs ici."
                          }
                          actionLabel={!hasFilters ? "Explorer la communauté" : undefined}
                          actionIcon={!hasFilters ? <Globe className="h-4 w-4" /> : undefined}
                          onAction={!hasFilters ? () => setActiveTab("feed") : undefined}
                        />
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </SignedIn>
    </>
  );
}
