"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { ProfileContent } from "@/app/user/[username]/page";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { ProfileSidebar } from "@/components/sidebar/profile-sidebar";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { User, Save, Loader2 } from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";

export default function ProfilPage() {
  const { user, clerkUser } = useCurrentUser();
  const updateProfile = useMutation(api.users.updateProfile);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [weight, setWeight] = useState(75);
  const [level, setLevel] = useState("");
  const [style, setStyle] = useState("");
  const [objective, setObjective] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Sync state with user data
  useEffect(() => {
    if (user) {
      setWeight(user.weight || 75);
      setLevel(user.level || "");
      setStyle(user.style || "");
      setObjective(user.objective || "");
    }
  }, [user]);

  // Queries for profile page
  const configs = useQuery(
    api.users.getPublicConfigs,
    user?._id ? { userId: user._id } : "skip"
  );
  // Get ALL motos for own profile (not just public)
  const allMotos = useQuery(
    api.motos.getByUser,
    user?._id ? { userId: user._id } : "skip"
  );
  const followStats = useQuery(
    api.follows.getStats,
    user?._id ? { userId: user._id } : "skip"
  );

  const updateMoto = useMutation(api.motos.update);

  const handleToggleMotoVisibility = async (motoId: string, currentVisibility: boolean | undefined) => {
    await updateMoto({ 
      motoId: motoId as Id<"motos">, 
      isPublic: !currentVisibility 
    });
  };

  const handleSave = async () => {
    if (!clerkUser?.id) return;

    setIsSaving(true);
    try {
      await updateProfile({
        clerkId: clerkUser.id,
        weight: weight || undefined,
        level: level || undefined,
        style: style || undefined,
        objective: objective || undefined,
      });
      setIsEditModalOpen(false);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const levels = [
    { value: "débutant", label: "Débutant", color: "bg-emerald-400" },
    { value: "intermédiaire", label: "Intermédiaire", color: "bg-amber-400" },
    { value: "expert", label: "Expert", color: "bg-rose-400" },
  ];

  const styles = [
    { value: "neutre", label: "Neutre" },
    { value: "agressif", label: "Agressif" },
    { value: "souple", label: "Souple" },
  ];

  const objectives = [
    { value: "confort", label: "Confort" },
    { value: "performance", label: "Performance" },
    { value: "mixte", label: "Mixte" },
  ];

  if (!user) {
    return (
      <SignedOut>
        <div className="flex h-screen items-center justify-center bg-zinc-950">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-white">Connecte-toi pour accéder à ton profil</h1>
            <SignInButton mode="modal">
              <Button className="bg-purple-500 hover:bg-purple-600 font-bold italic">
                Se connecter
              </Button>
            </SignInButton>
          </div>
        </div>
      </SignedOut>
    );
  }

  // Format user data for ProfileContent
  const profileUser = {
    _id: user._id,
    name: user.name || "",
    username: user.username,
    imageUrl: user.imageUrl,
    weight: user.weight,
    level: user.level,
    style: user.style,
    objective: user.objective,
  };

  return (
    <>
      <SignedOut>
        <div className="flex h-screen items-center justify-center bg-zinc-950">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-white">Connecte-toi pour accéder à ton profil</h1>
            <SignInButton mode="modal">
              <Button className="bg-purple-500 hover:bg-purple-600 font-bold italic">
                Se connecter
              </Button>
            </SignInButton>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="flex flex-col h-screen bg-zinc-950">
            <div className="flex flex-1 overflow-hidden">
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
              <ProfileSidebar />
            </div>
          </SidebarInset>
        </SidebarProvider>

        {/* Edit Profile Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <User className="h-5 w-5 text-purple-500" />
                Modifier mon profil
              </DialogTitle>
              <DialogDescription>
                Ces informations permettent à l&apos;IA de te proposer des configs adaptées
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 mt-4">
              {/* Poids */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-zinc-400">
                    Poids équipé (kg)
                  </label>
                  <span className="text-lg font-bold text-purple-400">{weight} kg</span>
                </div>
                <Slider
                  value={[weight]}
                  onValueChange={(values) => setWeight(values[0])}
                  min={40}
                  max={150}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-zinc-500">
                  <span>40 kg</span>
                  <span>150 kg</span>
                </div>
              </div>

              {/* Niveau */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">
                  Niveau
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {levels.map((l) => (
                    <button
                      key={l.value}
                      onClick={() => setLevel(l.value)}
                      className={`p-3 rounded-lg border transition-colors ${
                        level === l.value
                          ? `${l.color} border-transparent text-white`
                          : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Style */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">
                  Style de pilotage
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {styles.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setStyle(s.value)}
                      className={`p-3 rounded-lg border transition-colors ${
                        style === s.value
                          ? "bg-purple-500 border-transparent text-white"
                          : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Objectif */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">
                  Objectif
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {objectives.map((o) => (
                    <button
                      key={o.value}
                      onClick={() => setObjective(o.value)}
                      className={`p-3 rounded-lg border transition-colors ${
                        objective === o.value
                          ? "bg-purple-500 border-transparent text-white"
                          : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full bg-purple-500 hover:bg-purple-600 font-bold italic"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Sauvegarder
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </SignedIn>
    </>
  );
}
