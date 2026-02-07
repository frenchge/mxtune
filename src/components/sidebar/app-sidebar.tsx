"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuAction,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { UserButton } from "@clerk/nextjs";
import {
  User,
  Users,
  Bike,
  MessageSquare,
  Plus,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Id } from "../../../convex/_generated/dataModel";

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useCurrentUser();
  const motos = useQuery(
    api.motos.getByUser,
    user?._id ? { userId: user._id } : "skip"
  );

  const conversations = useQuery(
    api.conversations.getByUser,
    user?._id ? { userId: user._id } : "skip"
  );

  const createConversation = useMutation(api.conversations.create);
  const deleteConversation = useMutation(api.conversations.remove);

  React.useEffect(() => {
    if (!user || motos === undefined) return;

    const profileComplete =
      typeof user.weight === "number" &&
      Boolean(user.level) &&
      Boolean(user.style) &&
      Boolean(user.objective);
    const hasMoto = motos.length > 0;

    const onProfilPage = pathname === "/profil" || pathname.startsWith("/profil/");
    const onMotosPage = pathname === "/motos" || pathname.startsWith("/motos/");
    const onChatPage = pathname === "/chat" || pathname.startsWith("/chat/");
    const onCommunityPage =
      pathname === "/configs" ||
      pathname.startsWith("/configs/") ||
      pathname === "/motos-communaute" ||
      pathname.startsWith("/motos-communaute/") ||
      pathname.startsWith("/config/") ||
      pathname.startsWith("/user/");

    if (onCommunityPage) {
      return;
    }

    if (onChatPage) {
      return;
    }

    if (!profileComplete && !onProfilPage && !onMotosPage) {
      router.replace("/profil");
      return;
    }

    if (profileComplete && !hasMoto && !onMotosPage) {
      router.replace("/motos");
    }
  }, [user, motos, pathname, router]);

  const handleNewConversation = async () => {
    if (!user?._id) return;

    const conversationId = await createConversation({
      userId: user._id,
      title: "Nouvelle session",
    });

    router.push(`/chat/${conversationId}`);
  };

  const handleDeleteConversation = async (
    conversationId: Id<"conversations">
  ) => {
    await deleteConversation({ conversationId });
    if (pathname.includes(conversationId)) {
      router.push("/");
    }
  };

  // Format conversation title for display
  const formatConversationTitle = (conv: { title: string; createdAt: number }) => {
    // If title is still default "Nouvelle session", show a date-based name
    if (conv.title === "Nouvelle session") {
      const date = new Date(conv.createdAt);
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      const isYesterday = new Date(now.getTime() - 86400000).toDateString() === date.toDateString();
      
      if (isToday) {
        return `Session ${date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
      }
      if (isYesterday) {
        return `Hier, ${date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
      }
      return `Session ${date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}, ${date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
    }
    return conv.title;
  };

  const navItems = [
    { title: "Profil", icon: User, href: "/profil" },
    { title: "Mes Motos", icon: Bike, href: "/motos" },
    { title: "Communauté", icon: Users, href: "/configs" },
  ];

  return (
    <Sidebar className="border-r border-zinc-800 bg-zinc-900">
      <SidebarHeader className="p-5">
        <div className="flex items-center justify-center">
          <Image
            src="/MXTune.png"
            alt="MXTune Logo"
            width={100}
            height={100}
            className="rounded-lg"
            priority
          />
        </div>
      </SidebarHeader>

      <Separator className="bg-zinc-800" />

      <SidebarContent className="flex flex-col">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    className={isActive 
                      ? "bg-purple-500/15 text-purple-300 hover:bg-purple-500/20 border-l-2 border-purple-500 rounded-l-none font-semibold" 
                      : "hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                    }
                  >
                    <Link href={item.href} prefetch={true}>
                      <item.icon className={`h-4 w-4 ${isActive ? "text-purple-400" : ""}`} />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="bg-zinc-800 my-2" />

        <SidebarGroup className="flex-1 flex flex-col min-h-0">
          <SidebarGroupLabel className="flex items-center justify-between px-2 shrink-0">
            <span className="text-zinc-500 text-xs uppercase tracking-wider">
              Conversations
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:bg-zinc-800"
              onClick={handleNewConversation}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </SidebarGroupLabel>
          <SidebarGroupContent className="flex-1 min-h-0">
            <ScrollArea className="h-full">
              <SidebarMenu>
                {conversations?.map((conversation) => {
                  if (!conversation) return null;
                  const isConvActive = pathname === `/chat/${conversation._id}`;
                  return (
                  <SidebarMenuItem key={conversation._id}>
                    <SidebarMenuButton
                      asChild
                      isActive={isConvActive}
                      className={isConvActive 
                        ? "bg-purple-500/10 text-purple-300 hover:bg-purple-500/15 pr-8" 
                        : "hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 pr-8"
                      }
                    >
                      <Link href={`/chat/${conversation._id}`} prefetch={true}>
                        <span className="truncate">{formatConversationTitle(conversation)}</span>
                      </Link>
                    </SidebarMenuButton>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <SidebarMenuAction 
                          className="hover:bg-zinc-700"
                          onClick={(e) => e.preventDefault()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </SidebarMenuAction>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        side="right"
                        align="start"
                        className="bg-zinc-900 border-zinc-800"
                      >
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteConversation(conversation._id);
                          }}
                          className="text-red-400 focus:text-red-400 focus:bg-zinc-800 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </SidebarMenuItem>
                  );
                })}

                {(!conversations || conversations.length === 0) && (
                  <div className="px-4 py-8 text-center">
                    <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center mx-auto mb-3">
                      <MessageSquare className="h-6 w-6 text-purple-400 opacity-70" />
                    </div>
                    <p className="text-sm text-zinc-400 font-medium">Aucune conversation</p>
                    <p className="text-xs text-zinc-600 mt-1 mb-4">
                      Lance ta première session IA pour configurer tes suspensions
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNewConversation}
                      className="gap-2 border-purple-500/30 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Nouvelle session
                    </Button>
                  </div>
                )}
              </SidebarMenu>
            </ScrollArea>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-zinc-800">
        <div className="flex items-center gap-3">
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-8 w-8",
              },
            }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.name || "Utilisateur"}
            </p>
            <p className="text-xs text-zinc-500 truncate">
              {user?.level || "Configurer le profil"}
            </p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
