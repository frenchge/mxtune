"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { ProfileContent } from "@/app/user/[username]/page";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { Id } from "../../../convex/_generated/dataModel";

export default function ProfilPage() {
  const { user } = useCurrentUser();

  const configs = useQuery(
    api.users.getPublicConfigs,
    user?._id ? { userId: user._id } : "skip"
  );
  const allMotos = useQuery(
    api.motos.getByUser,
    user?._id ? { userId: user._id } : "skip"
  );
  const followStats = useQuery(
    api.follows.getStats,
    user?._id ? { userId: user._id } : "skip"
  );

  const updateMoto = useMutation(api.motos.update);

  const handleToggleMotoVisibility = async (
    motoId: string,
    currentVisibility: boolean | undefined
  ) => {
    await updateMoto({
      motoId: motoId as Id<"motos">,
      isPublic: !currentVisibility,
    });
  };

  const profileUser = user
    ? {
        _id: user._id,
        name: user.name || "",
        username: user.username,
        imageUrl: user.imageUrl,
        weight: user.weight,
        level: user.level,
        style: user.style,
        objective: user.objective,
      }
    : null;

  return (
    <>
      <SignedOut>
        <div className="flex h-screen items-center justify-center bg-zinc-950">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-white">
              Connecte-toi pour accéder à ton profil
            </h1>
            <SignInButton mode="modal">
              <Button className="bg-purple-500 hover:bg-purple-600 font-bold italic">
                Se connecter
              </Button>
            </SignInButton>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        {!profileUser ? (
          <div className="flex h-screen items-center justify-center bg-zinc-950">
            <div className="animate-pulse text-zinc-500">Chargement...</div>
          </div>
        ) : (
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="flex flex-col h-screen bg-zinc-950">
              <div className="flex-1 overflow-auto">
                <ProfileContent
                  user={profileUser}
                  configs={configs}
                  publicMotos={allMotos}
                  followStats={followStats}
                  isFollowingMe={false}
                  amIFollowing={false}
                  isOwnProfile={true}
                  onToggleMotoVisibility={handleToggleMotoVisibility}
                  showHeader={false}
                />
              </div>
            </SidebarInset>
          </SidebarProvider>
        )}
      </SignedIn>
    </>
  );
}
