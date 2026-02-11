"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { UserButton } from "@clerk/nextjs";
import {
  User,
  Users,
  Bike,
  MessageSquare,
  Plus,
  Trash2,
  MoreHorizontal,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Id } from "../../../convex/_generated/dataModel";
import { BrandLogo } from "@/components/ui/brand-logo";
import { usernameHandle } from "@/lib/user-display";

interface SidebarShortcut {
  label: string;
  href: string;
  pathname: string;
  tab?: string;
  feedTab?: string;
}

const PROFILE_SHORTCUTS: SidebarShortcut[] = [
  {
    label: "Mon Profil",
    href: "/profil?tab=profile",
    pathname: "/profil",
    tab: "profile",
  },
  {
    label: "Configs",
    href: "/profil?tab=configs",
    pathname: "/profil",
    tab: "configs",
  },
  {
    label: "Sauvegardées",
    href: "/profil?tab=saved",
    pathname: "/profil",
    tab: "saved",
  },
  {
    label: "Motos",
    href: "/profil?tab=motos",
    pathname: "/profil",
    tab: "motos",
  },
];

const COMMUNITY_SHORTCUTS: SidebarShortcut[] = [
  {
    label: "Feed motos",
    href: "/configs?tab=feed&feedTab=motos",
    pathname: "/configs",
    tab: "feed",
    feedTab: "motos",
  },
  {
    label: "Feed posts",
    href: "/configs?tab=feed&feedTab=posts",
    pathname: "/configs",
    tab: "feed",
    feedTab: "posts",
  },
  {
    label: "Configs",
    href: "/configs?tab=configs",
    pathname: "/configs",
    tab: "configs",
  },
  {
    label: "Suivi",
    href: "/configs?tab=suivi",
    pathname: "/configs",
    tab: "suivi",
  },
  {
    label: "Sauvegardées",
    href: "/configs?tab=sauvegardees",
    pathname: "/configs",
    tab: "sauvegardees",
  },
  {
    label: "Mes configs",
    href: "/configs?tab=mes-configs",
    pathname: "/configs",
    tab: "mes-configs",
  },
];

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useCurrentUser();
  const [isUserButtonMounted, setIsUserButtonMounted] = React.useState(false);
  const [openNavSections, setOpenNavSections] = React.useState<
    Record<string, boolean>
  >({
    "/profil": pathname === "/profil" || pathname.startsWith("/profil/"),
    "/motos": pathname === "/motos" || pathname.startsWith("/motos/"),
    "/configs": pathname === "/configs" || pathname.startsWith("/configs/"),
  });

  const conversations = useQuery(
    api.conversations.getByUser,
    user?._id ? { userId: user._id } : "skip"
  );
  const motos = useQuery(api.motos.getByUser, user?._id ? { userId: user._id } : "skip");
  const recentMotos = React.useMemo(() => {
    if (motos === undefined) return undefined;
    return [...motos]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5);
  }, [motos]);

  const createConversation = useMutation(api.conversations.create);
  const deleteConversation = useMutation(api.conversations.remove);

  const isProfileActive = pathname === "/profil" || pathname.startsWith("/profil/");
  const isMotosActive = pathname === "/motos" || pathname.startsWith("/motos/");
  const isMessagesActive = pathname === "/messages" || pathname.startsWith("/messages/");
  const isCommunityActive = pathname === "/configs" || pathname.startsWith("/configs/");

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

  React.useEffect(() => {
    setIsUserButtonMounted(true);
  }, []);

  React.useEffect(() => {
    setOpenNavSections((current) => ({
      ...current,
      "/profil":
        current["/profil"] || pathname === "/profil" || pathname.startsWith("/profil/"),
      "/motos":
        current["/motos"] || pathname === "/motos" || pathname.startsWith("/motos/"),
      "/configs":
        current["/configs"] || pathname === "/configs" || pathname.startsWith("/configs/"),
    }));
  }, [pathname]);

  const isShortcutActive = React.useCallback(
    (shortcut: SidebarShortcut) => {
      if (pathname !== shortcut.pathname) return false;

      if (shortcut.tab && searchParams.get("tab") !== shortcut.tab) return false;
      if (
        shortcut.feedTab &&
        searchParams.get("feedTab") !== shortcut.feedTab
      ) {
        return false;
      }

      return true;
    },
    [pathname, searchParams]
  );

  return (
    <Sidebar className="border-r border-zinc-800 bg-zinc-900">
      <SidebarHeader className="p-5">
        <div className="flex items-center justify-center">
          <Image
            src="/logo.png"
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
              <SidebarMenuItem>
                <Collapsible
                  open={openNavSections["/profil"]}
                  onOpenChange={(open) =>
                    setOpenNavSections((current) => ({
                      ...current,
                      "/profil": open,
                    }))
                  }
                >
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      isActive={isProfileActive}
                      className={
                        isProfileActive
                          ? "bg-purple-500/15 text-purple-300 hover:bg-purple-500/20 border-l-2 border-purple-500 rounded-l-none font-semibold"
                          : "hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                      }
                    >
                      <User
                        className={`h-4 w-4 ${isProfileActive ? "text-purple-400" : ""}`}
                      />
                      <span>Profil</span>
                      <ChevronDown
                        className={`ml-auto h-3.5 w-3.5 transition-transform ${
                          openNavSections["/profil"] ? "rotate-180" : "rotate-0"
                        }`}
                      />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="overflow-hidden">
                    <div className="ml-5 mt-1 space-y-1 border-l border-zinc-800 pl-2">
                      {PROFILE_SHORTCUTS.map((shortcut) => {
                        const shortcutActive = isShortcutActive(shortcut);
                        return (
                          <Link
                            key={shortcut.href}
                            href={shortcut.href}
                            prefetch={true}
                            className={`flex items-center rounded-md px-2 py-1.5 text-xs transition-colors ${
                              shortcutActive
                                ? "bg-violet-500/10 text-violet-300"
                                : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                            }`}
                          >
                            {shortcut.label}
                          </Link>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <Collapsible
                  open={openNavSections["/motos"]}
                  onOpenChange={(open) =>
                    setOpenNavSections((current) => ({
                      ...current,
                      "/motos": open,
                    }))
                  }
                >
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      isActive={isMotosActive}
                      className={
                        isMotosActive
                          ? "bg-purple-500/15 text-purple-300 hover:bg-purple-500/20 border-l-2 border-purple-500 rounded-l-none font-semibold"
                          : "hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                      }
                    >
                      <Bike
                        className={`h-4 w-4 ${isMotosActive ? "text-purple-400" : ""}`}
                      />
                      <span>Mes motos</span>
                      <ChevronDown
                        className={`ml-auto h-3.5 w-3.5 transition-transform ${
                          openNavSections["/motos"] ? "rotate-180" : "rotate-0"
                        }`}
                      />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="overflow-hidden">
                    <div className="ml-5 mt-1 space-y-1 border-l border-zinc-800 pl-2">
                      {recentMotos === undefined && (
                        <p className="px-2 py-1.5 text-xs text-zinc-500">
                          Chargement des motos...
                        </p>
                      )}

                      {recentMotos && recentMotos.length === 0 && (
                        <p className="px-2 py-1.5 text-xs text-zinc-500">
                          Aucune moto dans le garage.
                        </p>
                      )}

                      {recentMotos?.map((moto) => (
                        <Link
                          key={moto._id}
                          href={`/motos/${moto._id}`}
                          prefetch={true}
                          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
                        >
                          <BrandLogo
                            brand={moto.brand}
                            size="sm"
                            className="h-5 w-5 shrink-0 border border-zinc-700/70"
                          />
                          <div className="min-w-0">
                            <p className="truncate font-medium">
                              {moto.brand} {moto.model}
                            </p>
                            <p className="text-[10px] text-zinc-500">{moto.year}</p>
                          </div>
                        </Link>
                      ))}

                      <Link
                        href="/motos"
                        prefetch={true}
                        className="flex items-center rounded-md px-2 py-1.5 text-xs font-medium text-violet-300 transition-colors hover:bg-violet-500/10"
                      >
                        Voir plus
                      </Link>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <Collapsible
                  open={openNavSections["/configs"]}
                  onOpenChange={(open) =>
                    setOpenNavSections((current) => ({
                      ...current,
                      "/configs": open,
                    }))
                  }
                >
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      isActive={isCommunityActive}
                      className={
                        isCommunityActive
                          ? "bg-purple-500/15 text-purple-300 hover:bg-purple-500/20 border-l-2 border-purple-500 rounded-l-none font-semibold"
                          : "hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                      }
                    >
                      <Users
                        className={`h-4 w-4 ${isCommunityActive ? "text-purple-400" : ""}`}
                      />
                      <span>Communauté</span>
                      <ChevronDown
                        className={`ml-auto h-3.5 w-3.5 transition-transform ${
                          openNavSections["/configs"] ? "rotate-180" : "rotate-0"
                        }`}
                      />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="overflow-hidden">
                    <div className="ml-5 mt-1 space-y-1 border-l border-zinc-800 pl-2">
                      {COMMUNITY_SHORTCUTS.map((shortcut) => {
                        const shortcutActive = isShortcutActive(shortcut);
                        return (
                          <Link
                            key={shortcut.href}
                            href={shortcut.href}
                            prefetch={true}
                            className={`flex items-center rounded-md px-2 py-1.5 text-xs transition-colors ${
                              shortcutActive
                                ? "bg-violet-500/10 text-violet-300"
                                : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                            }`}
                          >
                            {shortcut.label}
                          </Link>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isMessagesActive}
                  className={
                    isMessagesActive
                      ? "bg-purple-500/15 text-purple-300 hover:bg-purple-500/20 border-l-2 border-purple-500 rounded-l-none font-semibold"
                      : "hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                  }
                >
                  <Link href="/messages" prefetch={true}>
                    <MessageSquare
                      className={`h-4 w-4 ${isMessagesActive ? "text-purple-400" : ""}`}
                    />
                    <span>Messages</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="bg-zinc-800 my-2" />

        <SidebarGroup className="flex-1 flex flex-col min-h-0">
          <div className="px-2 pb-2 shrink-0">
            <Button
              onClick={handleNewConversation}
              className="w-full bg-purple-500 hover:bg-purple-600 gap-2 font-bold italic"
            >
              <Plus className="h-4 w-4" />
              Nouvelle session
            </Button>
          </div>
          <SidebarGroupLabel className="px-2 shrink-0">
            <span className="text-zinc-500 text-xs uppercase tracking-wider">
              Conversations
            </span>
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
          {isUserButtonMounted ? (
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8",
                },
              }}
            />
          ) : (
            <div className="h-8 w-8 rounded-full border border-zinc-700 bg-zinc-800" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {usernameHandle(user?.username)}
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
