"use client";

import { useState } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useSidebarState } from "@/hooks/use-sidebar-state";
import { useQuery, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../../convex/_generated/api";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Gauge,
  BookOpen,
  HelpCircle,
  Route,
  Plus,
  Pencil,
  Save,
  Loader2,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";
import { Id } from "../../../convex/_generated/dataModel";

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

interface ProfileSidebarProps {
  conversationId?: Id<"conversations">;
  onSendMessage?: (message: string) => Promise<void>;
}

export function ProfileSidebar({ onSendMessage }: ProfileSidebarProps) {
  const { user } = useCurrentUser();
  const router = useRouter();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editWeight, setEditWeight] = useState<string>("");
  const [editLevel, setEditLevel] = useState<string>("");
  const [editStyle, setEditStyle] = useState<string>("");
  const [editObjective, setEditObjective] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [loadingHelp, setLoadingHelp] = useState<string | null>(null);

  const motos = useQuery(
    api.motos.getByUser,
    user?._id ? { userId: user._id } : "skip"
  );

  const createConversation = useMutation(api.conversations.create);
  const updateProfile = useMutation(api.users.updateProfile);

  const handleNewSession = async () => {
    if (!user?._id) return;
    const newConversationId = await createConversation({
      userId: user._id,
      title: "Nouvelle session",
    });
    router.push(`/chat/${newConversationId}`);
  };

  const handleOpenEditDialog = () => {
    setEditWeight(user?.weight?.toString() || "");
    setEditLevel(user?.level || "");
    setEditStyle(user?.style || "");
    setEditObjective(user?.objective || "");
    setIsEditDialogOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!user?.clerkId) return;
    setIsSaving(true);
    try {
      await updateProfile({
        clerkId: user.clerkId,
        weight: editWeight ? parseInt(editWeight) : undefined,
        level: editLevel || undefined,
        style: editStyle || undefined,
        objective: editObjective || undefined,
      });
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Fonction pour envoyer une requête d'aide pédagogique
  const handleHelpRequest = async (helpType: string) => {
    if (!onSendMessage) {
      // Si pas de onSendMessage, créer une nouvelle conversation avec la question
      if (!user?._id) return;
      setLoadingHelp(helpType);
      try {
        const newConversationId = await createConversation({
          userId: user._id,
          title: helpType === "sag" ? "Procédure SAG" : 
                 helpType === "lexique" ? "Lexique technique" : 
                 "Aide guidonnage",
        });
        router.push(`/chat/${newConversationId}?help=${helpType}`);
      } finally {
        setLoadingHelp(null);
      }
      return;
    }

    setLoadingHelp(helpType);
    
    const helpMessages: Record<string, string> = {
      sag: "Peux-tu m'expliquer la procédure complète pour régler mon SAG arrière ? Je veux comprendre comment mesurer et ajuster correctement.",
      lexique: "Peux-tu m'expliquer le lexique technique des suspensions moto ? Compression BV/HV, détente, SAG, précharge, etc.",
      guidonnage: "Ma moto guidonne, qu'est-ce que ça signifie et comment régler ce problème avec les suspensions ?",
    };

    try {
      await onSendMessage(helpMessages[helpType]);
    } finally {
      setLoadingHelp(null);
    }
  };

  const currentMoto = motos?.[0];
  const { isRightSidebarCollapsed: isCollapsed, toggleRightSidebar } = useSidebarState();

  const getLevelColor = (level?: string) => {
    switch (level) {
      case "débutant":
        return "bg-emerald-400";
      case "intermédiaire":
        return "bg-amber-400";
      case "expert":
        return "bg-rose-400";
      default:
        return "bg-zinc-500";
    }
  };

  const getStyleLabel = (style?: string) => {
    switch (style) {
      case "neutre":
        return "NEUTRE";
      case "agressif":
        return "AGRESSIF";
      case "souple":
        return "SOUPLE";
      default:
        return "—";
    }
  };

  const getObjectiveLabel = (objective?: string) => {
    switch (objective) {
      case "confort":
        return "CONFORT";
      case "performance":
        return "PERFORMANCE";
      case "mixte":
        return "MIXTE";
      default:
        return "—";
    }
  };

  return (
    <div className="relative h-full shrink-0">
      {/* Collapse toggle button - visually docked to sidebar without affecting main layout width */}
      <button
        onClick={toggleRightSidebar}
        className="absolute left-0 top-4 z-20 flex h-10 w-5 -translate-x-full items-center justify-center rounded-l-md border-y border-l border-zinc-700 bg-zinc-800 transition-colors hover:bg-zinc-700"
        title={isCollapsed ? "Ouvrir le panneau" : "Fermer le panneau"}
      >
        {isCollapsed ? (
          <ChevronLeft className="h-3 w-3 text-zinc-400" />
        ) : (
          <ChevronRight className="h-3 w-3 text-zinc-400" />
        )}
      </button>
      
      {/* Sidebar content */}
      <div className={`border-l border-zinc-800 bg-zinc-900 flex flex-col h-full transition-all duration-300 ease-in-out overflow-hidden ${isCollapsed ? 'w-0 border-l-0' : 'w-80'}`}>
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4 min-w-[304px]">
            {/* Bouton Nouvelle Session */}
            <Button
              onClick={handleNewSession}
              className="w-full bg-purple-500 hover:bg-purple-600 gap-2 font-bold italic"
            >
              <Plus className="h-4 w-4" />
              NOUVELLE SESSION
            </Button>

          <Separator className="bg-zinc-800" />

          {/* Résumé Profil */}
          <div>
            <h3 className="text-xs font-semibold text-purple-500 uppercase tracking-wider mb-3">
              Résumé Profil
            </h3>
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
              <div className="flex items-center gap-4">
                <div
                  className={`flex items-center justify-center h-16 w-16 rounded-full ${getLevelColor(user?.level)} text-white font-bold text-2xl`}
                >
                  {user?.weight || "?"}
                </div>
                <div>
                  <p className="font-semibold text-white capitalize">
                    {user?.level || "Non défini"}
                  </p>
                  <p className="text-xs text-zinc-400">KG ÉQUIPÉ</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4">
                <div className="bg-zinc-900 rounded-lg p-3 text-center">
                  <p className="text-xs text-zinc-500 uppercase">Style</p>
                  <p className="text-sm font-semibold text-purple-400">
                    {getStyleLabel(user?.style)}
                  </p>
                </div>
                <div className="bg-zinc-900 rounded-lg p-3 text-center">
                  <p className="text-xs text-zinc-500 uppercase">Objectif</p>
                  <p className="text-sm font-semibold text-purple-400">
                    {getObjectiveLabel(user?.objective)}
                  </p>
                </div>
              </div>

              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenEditDialog}
                    className="w-full mt-4 border-purple-500/50 text-purple-400 hover:text-purple-300 hover:border-purple-400 gap-2"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Modifier mon profil
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-white">Modifier mon profil rider</DialogTitle>
                    <DialogDescription className="text-zinc-400 normal-case not-italic font-normal">
                      Ces informations sont utilisées par l&apos;IA pour te proposer des réglages adaptés.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-5 pt-4">
                    {/* Poids - Slider */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-zinc-300 normal-case not-italic font-medium">
                          Poids équipé
                        </Label>
                        <span className="text-lg font-bold text-purple-400">
                          {editWeight || 70} kg
                        </span>
                      </div>
                      <Slider
                        value={[parseInt(editWeight) || 70]}
                        onValueChange={(value) => setEditWeight(value[0].toString())}
                        min={40}
                        max={150}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-[10px] text-zinc-500">
                        <span>40 kg</span>
                        <span>150 kg</span>
                      </div>
                    </div>

                    {/* Niveau - Boutons */}
                    <div className="space-y-2">
                      <Label className="text-zinc-300 normal-case not-italic font-medium">
                        Niveau
                      </Label>
                      <div className="grid grid-cols-3 gap-2">
                        {LEVELS.map((level) => (
                          <button
                            key={level.value}
                            type="button"
                            onClick={() => setEditLevel(level.value)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                              editLevel === level.value
                                ? "bg-emerald-500 text-white"
                                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                            }`}
                          >
                            {level.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Style - Boutons */}
                    <div className="space-y-2">
                      <Label className="text-zinc-300 normal-case not-italic font-medium">
                        Style de pilotage
                      </Label>
                      <div className="grid grid-cols-3 gap-2">
                        {STYLES.map((style) => (
                          <button
                            key={style.value}
                            type="button"
                            onClick={() => setEditStyle(style.value)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                              editStyle === style.value
                                ? "bg-amber-500 text-white"
                                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                            }`}
                          >
                            {style.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Objectif - Boutons */}
                    <div className="space-y-2">
                      <Label className="text-zinc-300 normal-case not-italic font-medium">
                        Objectif
                      </Label>
                      <div className="grid grid-cols-3 gap-2">
                        {OBJECTIVES.map((objective) => (
                          <button
                            key={objective.value}
                            type="button"
                            onClick={() => setEditObjective(objective.value)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                              editObjective === objective.value
                                ? "bg-blue-500 text-white"
                                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                            }`}
                          >
                            {objective.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Bouton Sauvegarder */}
                    <Button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="w-full bg-purple-500 hover:bg-purple-600 gap-2 mt-2"
                    >
                      <Save className="h-4 w-4" />
                      {isSaving ? "Enregistrement..." : "Enregistrer"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Moto actuelle */}
          {currentMoto && (
            <div>
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                Moto Sélectionnée
              </h3>
              <div 
                className="flex items-center gap-3 px-3 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700 cursor-pointer hover:border-purple-500/50 hover:bg-zinc-800 transition-colors"
                onClick={() => router.push(`/motos/${currentMoto._id}`)}
              >
                <BrandLogo brand={currentMoto.brand} size="md" />
                <div className="flex-1">
                  <span className="text-sm font-medium block">
                    {currentMoto.brand} {currentMoto.model}
                  </span>
                  <span className="text-xs text-zinc-500">{currentMoto.year}</span>
                </div>
                <span className="text-zinc-500 text-xs">→</span>
              </div>
            </div>
          )}

          <Separator className="bg-zinc-800" />

          {/* Aide Terrain */}
          <div>
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
              Aide Terrain
            </h3>
            <div className="space-y-2">
              <Button
                variant="ghost"
                onClick={() => handleHelpRequest("sag")}
                disabled={loadingHelp !== null}
                className="w-full justify-between h-auto py-3 px-4 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700"
              >
                <span className="flex items-center gap-2">
                  {loadingHelp === "sag" ? (
                    <Loader2 className="h-4 w-4 text-purple-400 animate-spin" />
                  ) : (
                    <Gauge className="h-4 w-4 text-zinc-400" />
                  )}
                  <span>Procédure SAG</span>
                </span>
                <BookOpen className="h-4 w-4 text-zinc-500" />
              </Button>

              <Button
                variant="ghost"
                onClick={() => handleHelpRequest("lexique")}
                disabled={loadingHelp !== null}
                className="w-full justify-between h-auto py-3 px-4 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700"
              >
                <span className="flex items-center gap-2">
                  {loadingHelp === "lexique" ? (
                    <Loader2 className="h-4 w-4 text-purple-400 animate-spin" />
                  ) : (
                    <BookOpen className="h-4 w-4 text-zinc-400" />
                  )}
                  <span>Lexique technique</span>
                </span>
                <BookOpen className="h-4 w-4 text-zinc-500" />
              </Button>

              <Button
                variant="ghost"
                onClick={() => handleHelpRequest("guidonnage")}
                disabled={loadingHelp !== null}
                className="w-full justify-between h-auto py-3 px-4 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700"
              >
                <span className="flex items-center gap-2">
                  {loadingHelp === "guidonnage" ? (
                    <Loader2 className="h-4 w-4 text-purple-400 animate-spin" />
                  ) : (
                    <HelpCircle className="h-4 w-4 text-zinc-400" />
                  )}
                  <span>Guidonnage ?</span>
                </span>
                <Route className="h-4 w-4 text-zinc-500" />
              </Button>
            </div>
          </div>


        </div>
      </ScrollArea>
      </div>
    </div>
  );
}
