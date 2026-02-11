"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { useCurrentUser } from "@/hooks/use-current-user";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { Loader2, MessageSquare, Send } from "lucide-react";
import { usernameHandle, usernameInitials } from "@/lib/user-display";

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
      missingFunction: false,
    };
  } catch (error) {
    return {
      data: undefined,
      missingFunction: isMissingPublicFunctionError(error),
    };
  }
}

interface PrivateConversation {
  _id: Id<"privateConversations">;
  participantAId: Id<"users">;
  participantBId: Id<"users">;
  updatedAt: number;
  lastMessageAt?: number;
  lastMessageSnippet?: string;
  unreadCount?: number;
  otherUser?: {
    _id: Id<"users">;
    name: string;
    username?: string;
    imageUrl?: string;
    level?: string;
  } | null;
}

interface PrivateConversationMessage {
  _id: Id<"privateMessages">;
  senderId: Id<"users">;
  content: string;
  createdAt: number;
  sender?: {
    _id: Id<"users">;
    name: string;
    username?: string;
    imageUrl?: string;
  } | null;
}

export default function MessagesPage() {
  const { user } = useCurrentUser();
  const searchParams = useSearchParams();
  const requestedConversationId = searchParams.get("conversationId");

  const [selectedPrivateConversationId, setSelectedPrivateConversationId] =
    useState<Id<"privateConversations"> | null>(null);
  const [privateMessageDraft, setPrivateMessageDraft] = useState("");
  const [isSendingPrivateMessage, setIsSendingPrivateMessage] = useState(false);
  const [privateMessageError, setPrivateMessageError] = useState<string | null>(
    null
  );
  const privateMessagesEndRef = useRef<HTMLDivElement>(null);

  const {
    data: privateConversations,
    missingFunction: isPrivateConversationsFeatureUnavailable,
  } = useSafeQuery<PrivateConversation[]>(
    api.privateMessages.getConversations,
    user?._id ? { userId: user._id } : "skip"
  );

  const {
    data: privateConversationMessages,
    missingFunction: isPrivateConversationMessagesFeatureUnavailable,
  } = useSafeQuery<PrivateConversationMessage[]>(
    api.privateMessages.getMessages,
    user?._id && selectedPrivateConversationId
      ? { userId: user._id, conversationId: selectedPrivateConversationId }
      : "skip"
  );

  const sendPrivateMessage = useMutation(api.privateMessages.sendMessage);
  const markPrivateConversationRead = useMutation(api.privateMessages.markAsRead);

  const isPrivateMessagingUnavailable =
    isPrivateConversationsFeatureUnavailable ||
    isPrivateConversationMessagesFeatureUnavailable;

  const selectedPrivateConversation =
    privateConversations?.find(
      (conversation) => conversation._id === selectedPrivateConversationId
    ) || null;

  useEffect(() => {
    if (!requestedConversationId) return;
    setSelectedPrivateConversationId(
      requestedConversationId as Id<"privateConversations">
    );
  }, [requestedConversationId]);

  useEffect(() => {
    if (!privateConversations) return;

    if (privateConversations.length === 0) {
      setSelectedPrivateConversationId(null);
      return;
    }

    if (!selectedPrivateConversationId) {
      setSelectedPrivateConversationId(privateConversations[0]._id);
      return;
    }

    const exists = privateConversations.some(
      (conversation) => conversation._id === selectedPrivateConversationId
    );

    if (!exists) {
      setSelectedPrivateConversationId(privateConversations[0]._id);
    }
  }, [privateConversations, selectedPrivateConversationId]);

  useEffect(() => {
    if (!user?._id || !selectedPrivateConversationId || isPrivateMessagingUnavailable) {
      return;
    }

    markPrivateConversationRead({
      userId: user._id,
      conversationId: selectedPrivateConversationId,
    }).catch(() => undefined);
  }, [
    user?._id,
    selectedPrivateConversationId,
    isPrivateMessagingUnavailable,
    markPrivateConversationRead,
  ]);

  useEffect(() => {
    if (!privateConversationMessages || privateConversationMessages.length === 0) {
      return;
    }
    privateMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [privateConversationMessages, selectedPrivateConversationId]);

  const handleSendPrivateMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user?._id || !selectedPrivateConversationId) return;
    if (isPrivateMessagingUnavailable) {
      setPrivateMessageError(
        "Messagerie indisponible pour le moment. Synchronise Convex puis recharge."
      );
      return;
    }

    const content = privateMessageDraft.trim();
    if (!content) return;

    setIsSendingPrivateMessage(true);
    setPrivateMessageError(null);
    try {
      await sendPrivateMessage({
        conversationId: selectedPrivateConversationId,
        senderId: user._id,
        content,
      });
      setPrivateMessageDraft("");
    } catch (error) {
      const message = isMissingPublicFunctionError(error)
        ? "Messagerie indisponible pour le moment. Synchronise Convex puis recharge."
        : getErrorMessage(error, "Impossible d'envoyer le message.");
      setPrivateMessageError(message);
    } finally {
      setIsSendingPrivateMessage(false);
    }
  };

  return (
    <>
      <SignedOut>
        <div className="flex h-screen items-center justify-center bg-zinc-950">
          <div className="space-y-4 text-center">
            <h1 className="text-2xl font-bold text-white">MESSAGES PRIVES</h1>
            <p className="text-zinc-400">Connecte-toi pour acceder a tes conversations.</p>
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
          <SidebarInset className="flex h-dvh flex-col overflow-hidden bg-zinc-950">
            <div className="flex flex-1 min-h-0 overflow-hidden p-4 md:p-6 lg:p-8">
              <div className="mx-auto flex h-full min-h-0 w-full max-w-6xl flex-col gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-white">MESSAGES</h1>
                    <p className="mt-1 text-zinc-400">
                      Discute en prive avec les riders de la communaute.
                    </p>
                  </div>

                  {isPrivateMessagingUnavailable && (
                    <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
                      La messagerie privee n&apos;est pas disponible sur ce backend.
                      Lance `npm run convex:sync`, puis recharge la page.
                    </div>
                  )}

                  {!isPrivateMessagingUnavailable &&
                  privateConversations === undefined ? (
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 text-center text-sm text-zinc-500">
                      Chargement des conversations...
                    </div>
                  ) : null}

                  {!isPrivateMessagingUnavailable &&
                  privateConversations &&
                  privateConversations.length === 0 ? (
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 text-center">
                      <MessageSquare className="mx-auto h-8 w-8 text-zinc-600" />
                      <p className="mt-2 text-sm text-zinc-300">
                        Aucune conversation privee.
                      </p>
                      <p className="text-xs text-zinc-500">
                        Depuis le profil d&apos;un rider, clique sur
                        &nbsp;&quot;Envoyer un message&quot; pour demarrer.
                      </p>
                    </div>
                  ) : null}

                  {!isPrivateMessagingUnavailable &&
                  privateConversations &&
                  privateConversations.length > 0 ? (
                    <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
                      <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60">
                        <div className="border-b border-zinc-800 px-3 py-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                            Conversations
                          </p>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
                          {privateConversations.map((conversation) => {
                            const isActive =
                              conversation._id === selectedPrivateConversationId;
                            const otherUserLabel = usernameHandle(
                              conversation.otherUser?.username,
                              "utilisateur"
                            );
                            const lastActivity =
                              conversation.lastMessageAt || conversation.updatedAt;

                            return (
                              <button
                                key={conversation._id}
                                type="button"
                                onClick={() => {
                                  setSelectedPrivateConversationId(conversation._id);
                                  setPrivateMessageError(null);
                                }}
                                className={`mb-1.5 flex w-full items-start gap-2 rounded-xl border px-2.5 py-2 text-left transition-colors ${
                                  isActive
                                    ? "border-violet-500/60 bg-violet-500/10"
                                    : "border-zinc-800 bg-zinc-900/70 hover:border-zinc-700"
                                }`}
                              >
                                {conversation.otherUser?.imageUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={conversation.otherUser.imageUrl}
                                    alt={otherUserLabel}
                                    className="mt-0.5 h-9 w-9 rounded-full border border-zinc-700 object-cover"
                                  />
                                ) : (
                                  <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-[10px] font-semibold uppercase text-zinc-300">
                                    {usernameInitials(
                                      conversation.otherUser?.username,
                                      "U"
                                    )}
                                  </div>
                                )}

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-start justify-between gap-2">
                                    <p className="truncate text-sm font-medium text-white">
                                      {otherUserLabel}
                                    </p>
                                    <span className="shrink-0 text-[10px] text-zinc-500">
                                      {new Date(lastActivity).toLocaleTimeString(
                                        "fr-FR",
                                        {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        }
                                      )}
                                    </span>
                                  </div>
                                  <p className="line-clamp-1 text-xs text-zinc-400">
                                    {conversation.lastMessageSnippet ||
                                      "Aucun message pour le moment"}
                                  </p>
                                </div>

                                {(conversation.unreadCount || 0) > 0 && (
                                  <span className="mt-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-violet-500 px-1.5 text-[10px] font-semibold text-white">
                                    {conversation.unreadCount}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60">
                        {selectedPrivateConversation ? (
                          <>
                            <div className="flex items-center gap-3 border-b border-zinc-800 px-4 py-3">
                              {selectedPrivateConversation.otherUser?.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={selectedPrivateConversation.otherUser.imageUrl}
                                    alt={usernameHandle(
                                      selectedPrivateConversation.otherUser?.username,
                                      "utilisateur"
                                    )}
                                    className="h-10 w-10 rounded-full border border-zinc-700 object-cover"
                                  />
                                ) : (
                                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-xs font-semibold uppercase text-zinc-300">
                                  {usernameInitials(
                                    selectedPrivateConversation.otherUser?.username,
                                    "U"
                                  )}
                                  </div>
                                )}

                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-white">
                                  {usernameHandle(
                                    selectedPrivateConversation.otherUser?.username,
                                    "utilisateur"
                                  )}
                                </p>
                                <p className="text-xs text-zinc-500">
                                  Conversation privee
                                </p>
                              </div>
                            </div>

                            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
                              {privateConversationMessages &&
                              privateConversationMessages.length > 0 ? (
                                privateConversationMessages.map((message) => {
                                  const isCurrentUser = message.senderId === user?._id;
                                  const messageAuthor = usernameHandle(
                                    message.sender?.username,
                                    "rider"
                                  );

                                  return (
                                    <div
                                      key={message._id}
                                      className={`flex items-end gap-2 ${
                                        isCurrentUser
                                          ? "justify-end"
                                          : "justify-start"
                                      }`}
                                    >
                                      {!isCurrentUser &&
                                        (message.sender?.imageUrl ? (
                                          // eslint-disable-next-line @next/next/no-img-element
                                          <img
                                            src={message.sender.imageUrl}
                                            alt={messageAuthor}
                                            className="h-7 w-7 rounded-full border border-zinc-700 object-cover"
                                          />
                                        ) : (
                                          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-[10px] font-semibold uppercase text-zinc-300">
                                            {usernameInitials(
                                              message.sender?.username,
                                              "R"
                                            )}
                                          </div>
                                        ))}

                                      <div
                                        className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                                          isCurrentUser
                                            ? "bg-violet-600 text-white"
                                            : "border border-zinc-700 bg-zinc-800 text-zinc-100"
                                        }`}
                                      >
                                        <p className="whitespace-pre-wrap break-words text-sm">
                                          {message.content}
                                        </p>
                                        <p
                                          className={`mt-1 text-[10px] ${
                                            isCurrentUser
                                              ? "text-violet-100/90"
                                              : "text-zinc-500"
                                          }`}
                                        >
                                          {new Date(message.createdAt).toLocaleTimeString(
                                            "fr-FR",
                                            {
                                              hour: "2-digit",
                                              minute: "2-digit",
                                            }
                                          )}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <p className="text-sm text-zinc-500">
                                  Aucun message pour le moment.
                                </p>
                              )}
                              <div ref={privateMessagesEndRef} />
                            </div>

                            <div className="border-t border-zinc-800 p-3">
                              <form
                                onSubmit={handleSendPrivateMessage}
                                className="flex items-end gap-2"
                              >
                                <textarea
                                  value={privateMessageDraft}
                                  onChange={(event) =>
                                    setPrivateMessageDraft(event.target.value)
                                  }
                                  placeholder="Ecrire un message prive..."
                                  className="min-h-[44px] max-h-40 flex-1 resize-y rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-500 outline-none transition-colors focus:border-violet-500"
                                  maxLength={2000}
                                  disabled={
                                    isSendingPrivateMessage ||
                                    !selectedPrivateConversationId
                                  }
                                />
                                <Button
                                  type="submit"
                                  className="h-11 bg-violet-600 px-3 text-xs hover:bg-violet-500"
                                  disabled={
                                    isSendingPrivateMessage ||
                                    !selectedPrivateConversationId ||
                                    privateMessageDraft.trim().length === 0
                                  }
                                >
                                  {isSendingPrivateMessage ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Send className="h-4 w-4" />
                                  )}
                                </Button>
                              </form>
                              {privateMessageError && (
                                <p className="mt-1 text-xs text-red-400">
                                  {privateMessageError}
                                </p>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-1 items-center justify-center px-4 text-sm text-zinc-500">
                            Selectionne une conversation a gauche.
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </SignedIn>
    </>
  );
}
