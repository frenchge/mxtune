"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { ChatStepsEnhanced } from "@/components/chat/chat-steps-enhanced";
import { ChatMessage } from "@/components/chat/chat-message";
import { ChatInput } from "@/components/chat/chat-input";
import { Loader2, Sparkles } from "lucide-react";
import { Id } from "../../../../convex/_generated/dataModel";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

interface ConfigData {
  name?: string;
  description?: string;
  forkCompression?: number;
  forkRebound?: number;
  forkPreload?: string;
  shockCompressionLow?: number;
  shockCompressionHigh?: number;
  shockRebound?: number;
  shockPreload?: string;
  staticSag?: number;
  dynamicSag?: number;
  tirePressureFront?: number;
  tirePressureRear?: number;
  sportType?: string;
  terrainType?: string;
  conditions?: string;
}

export default function ChatPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const conversationId = params.conversationId as Id<"conversations">;
  const routeMotoId = searchParams.get("motoId") as Id<"motos"> | null;
  const routeKitId = searchParams.get("kitId") as Id<"suspensionKits"> | null;
  const { user, clerkUser } = useCurrentUser();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMotoId, setSelectedMotoId] = useState<Id<"motos"> | undefined>();
  const [selectedKitId, setSelectedKitId] = useState<Id<"suspensionKits"> | undefined>();
  const [savedConfigId, setSavedConfigId] = useState<string | undefined>();
  const [hasAppliedRouteSelection, setHasAppliedRouteSelection] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const conversation = useQuery(api.conversations.getById, {
    conversationId,
  });

  const messages = useQuery(api.messages.getByConversation, {
    conversationId,
  });

  const motos = useQuery(
    api.motos.getByUser,
    user?._id ? { userId: user._id } : "skip"
  );

  const selectedMoto = motos?.find((m) => m._id === selectedMotoId);
  const selectedKit = selectedMoto?.kits?.find((k) => k._id === selectedKitId);

  const createMessage = useMutation(api.messages.create);
  const updateStep = useMutation(api.conversations.updateStep);
  const createConfig = useMutation(api.configs.create);
  const updateConfigField = useMutation(api.configs.updateField);

  useEffect(() => {
    setHasAppliedRouteSelection(false);
  }, [conversationId, routeMotoId, routeKitId]);

  // Appliquer une sélection depuis l'URL une seule fois (motoId / kitId)
  useEffect(() => {
    if (hasAppliedRouteSelection || !motos) return;

    if (routeMotoId) {
      const routeMoto = motos.find((m) => m._id === routeMotoId);
      if (routeMoto) {
        setSelectedMotoId(routeMoto._id);

        if (routeKitId && routeMoto.kits.some((kit) => kit._id === routeKitId)) {
          setSelectedKitId(routeKitId);
        } else {
          const defaultKit = routeMoto.kits.find((kit) => kit.isDefault) || routeMoto.kits[0];
          setSelectedKitId(defaultKit?._id);
        }
      }
    }

    setHasAppliedRouteSelection(true);
  }, [motos, routeMotoId, routeKitId, hasAppliedRouteSelection]);

  // Sélectionner la première moto par défaut si aucune n'est sélectionnée
  useEffect(() => {
    if (!hasAppliedRouteSelection) return;
    if (motos && motos.length > 0 && !selectedMotoId) {
      setSelectedMotoId(motos[0]._id);
    }
  }, [motos, selectedMotoId, hasAppliedRouteSelection]);

  // Sélectionner le kit par défaut quand la moto active change
  useEffect(() => {
    if (!hasAppliedRouteSelection || !selectedMoto || !selectedMoto.kits || selectedMoto.kits.length === 0) {
      return;
    }

    const selectedKitExists = selectedKitId
      ? selectedMoto.kits.some((kit) => kit._id === selectedKitId)
      : false;

    if (!selectedKitExists) {
      const defaultKit = selectedMoto.kits.find(k => k.isDefault) || selectedMoto.kits[0];
      if (defaultKit) {
        setSelectedKitId(defaultKit._id);
      }
    }
  }, [selectedMoto, selectedKitId, hasAppliedRouteSelection]);

  // Auto-scroll vers le dernier message
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Message de bienvenue initial
  useEffect(() => {
    if (conversation && messages?.length === 0) {
      const welcomeMessage = `Bonjour ! Je suis ton expert en réglage de suspensions moto tout-terrain. Que tu sois sur un terrain de cross défoncé ou dans une spéciale d'enduro technique, mon objectif est de t'aider à trouver le confort, la traction et la sécurité nécessaires pour rouler à ton meilleur niveau.

Pour commencer, j'ai besoin de savoir comment tu souhaites procéder.

[BUTTON:RÉGLAGE DIRECT|Je pilote déjà bien et je veux une aide rapide à partir de symptômes ou d'une pratique précise.:reglage_direct]

[BUTTON:PAS-À-PAS|Je veux régler ma moto correctement depuis zéro avec explications et méthode.:pas_a_pas]`;

      createMessage({
        conversationId,
        role: "assistant",
        content: welcomeMessage,
      });
    }
  }, [conversation, messages, conversationId, createMessage]);

  const handleSendMessage = async (content: string) => {
    if (!user?._id || !conversationId) return;

    setIsLoading(true);

    // Créer le message utilisateur
    await createMessage({
      conversationId,
      role: "user",
      content,
    });

    try {
      // Construire le contexte avec la moto et le kit sélectionnés
      let motoContext = "";
      
      if (selectedMoto) {
        motoContext = `=== MOTO SÉLECTIONNÉE ===
- Marque: ${selectedMoto.brand}
- Modèle: ${selectedMoto.model}
- Année: ${selectedMoto.year}
- Suspensions: ${selectedMoto.isStockSuspension ? "D'ORIGINE (stock)" : "MODIFIÉES (aftermarket)"}`;
        
        if (selectedMoto.forkBrand) {
          motoContext += `
- Fourche: ${selectedMoto.forkBrand} ${selectedMoto.forkModel || ""}`;
        }
        if (selectedMoto.shockBrand) {
          motoContext += `
- Amortisseur: ${selectedMoto.shockBrand} ${selectedMoto.shockModel || ""}`;
        }
        if (selectedMoto.suspensionNotes) {
          motoContext += `
- Notes suspensions: ${selectedMoto.suspensionNotes}`;
        }
      }

      // Ajouter le contexte du kit sélectionné avec toutes les infos de réglages
      if (selectedKit) {
        motoContext += `

=== KIT SÉLECTIONNÉ: "${selectedKit.name}" ===`;
        if (selectedKit.description) motoContext += `\n- Description: ${selectedKit.description}`;
        if (selectedKit.terrainType) motoContext += `\n- Terrain: ${selectedKit.terrainType}`;
        if (selectedKit.sportType) motoContext += `\n- Sport: ${selectedKit.sportType}`;
        if (selectedKit.country) motoContext += `\n- Pays/Région: ${selectedKit.country}`;
        if (selectedKit.conditions) motoContext += `\n- Conditions: ${selectedKit.conditions}`;
        motoContext += `\n- Type suspensions: ${selectedKit.isStockSuspension ? "Origine" : "Modifiées/Aftermarket"}`;
        
        // Infos suspensions du kit
        if (!selectedKit.isStockSuspension) {
          if (selectedKit.forkBrand) motoContext += `\n- Fourche kit: ${selectedKit.forkBrand} ${selectedKit.forkModel || ""}`;
          if (selectedKit.shockBrand) motoContext += `\n- Amortisseur kit: ${selectedKit.shockBrand} ${selectedKit.shockModel || ""}`;
        }
        
        // Spécifications techniques
        if (selectedKit.forkSpringRate) motoContext += `\n- Ressort fourche: ${selectedKit.forkSpringRate}`;
        if (selectedKit.shockSpringRate) motoContext += `\n- Ressort amortisseur: ${selectedKit.shockSpringRate}`;
        if (selectedKit.forkOilWeight) motoContext += `\n- Huile fourche: ${selectedKit.forkOilWeight}`;
        if (selectedKit.forkOilLevel) motoContext += `\n- Niveau huile: ${selectedKit.forkOilLevel}`;
        if (selectedKit.valvingNotes) motoContext += `\n- Notes pistonage: ${selectedKit.valvingNotes}`;
        if (selectedKit.otherMods) motoContext += `\n- Autres mods: ${selectedKit.otherMods}`;
        
        // Plages de clics max
        if (selectedKit.maxForkCompression || selectedKit.maxForkRebound) {
          motoContext += `

=== PLAGES DE RÉGLAGES ===`;
          if (selectedKit.maxForkCompression) motoContext += `\n- Compression fourche: 0-${selectedKit.maxForkCompression} clics`;
          if (selectedKit.maxForkRebound) motoContext += `\n- Détente fourche: 0-${selectedKit.maxForkRebound} clics`;
          if (selectedKit.maxShockCompressionLow) motoContext += `\n- Compression BV amortisseur: 0-${selectedKit.maxShockCompressionLow} clics`;
          if (selectedKit.maxShockCompressionHigh) motoContext += `\n- Compression HV amortisseur: 0-${selectedKit.maxShockCompressionHigh} tours`;
          if (selectedKit.maxShockRebound) motoContext += `\n- Détente amortisseur: 0-${selectedKit.maxShockRebound} clics`;
        }
        
        // Réglages de base (référence usine)
        if (selectedKit.baseForkCompression !== undefined) {
          motoContext += `

=== RÉGLAGES DE BASE (référence) ===`;
          motoContext += `\n- Compression fourche: ${selectedKit.baseForkCompression} clics`;
          if (selectedKit.baseForkRebound !== undefined) motoContext += `\n- Détente fourche: ${selectedKit.baseForkRebound} clics`;
          if (selectedKit.baseShockCompressionLow !== undefined) motoContext += `\n- Compression BV amortisseur: ${selectedKit.baseShockCompressionLow} clics`;
          if (selectedKit.baseShockCompressionHigh !== undefined) motoContext += `\n- Compression HV amortisseur: ${selectedKit.baseShockCompressionHigh} tours`;
          if (selectedKit.baseShockRebound !== undefined) motoContext += `\n- Détente amortisseur: ${selectedKit.baseShockRebound} clics`;
        }
        
        // Réglages actuels du pilote
        if (selectedKit.forkCompression !== undefined || selectedKit.forkRebound !== undefined) {
          motoContext += `

=== RÉGLAGES ACTUELS DU PILOTE ===`;
          if (selectedKit.forkCompression !== undefined) motoContext += `\n- Compression fourche: ${selectedKit.forkCompression} clics`;
          if (selectedKit.forkRebound !== undefined) motoContext += `\n- Détente fourche: ${selectedKit.forkRebound} clics`;
          if (selectedKit.shockCompressionLow !== undefined) motoContext += `\n- Compression BV amortisseur: ${selectedKit.shockCompressionLow} clics`;
          if (selectedKit.shockCompressionHigh !== undefined) motoContext += `\n- Compression HV amortisseur: ${selectedKit.shockCompressionHigh} tours`;
          if (selectedKit.shockRebound !== undefined) motoContext += `\n- Détente amortisseur: ${selectedKit.shockRebound} clics`;
        }
      }

      // Appeler l'API Clarifai
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content }],
          conversationHistory: messages,
          motoContext,
          userProfile: user,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Créer le message de l'assistant
      await createMessage({
        conversationId,
        role: "assistant",
        content: data.response,
        metadata: data.config ? { config: data.config } : undefined,
      });

      // Déterminer l'étape en fonction du contenu de manière progressive
      const lowerContent = content.toLowerCase();
      const lowerResponse = data.response.toLowerCase();
      const currentStep = conversation?.step || "collecte";

      // Logique de progression basée sur l'étape actuelle et le contenu
      let nextStep = currentStep;

      if (currentStep === "collecte") {
        // Si l'utilisateur choisit le mode (rapide/direct ou pas-à-pas)
        if (lowerContent.includes("rapide") || lowerContent.includes("direct") || lowerContent.includes("pas-à-pas") || lowerContent.includes("complet")) {
          await updateStep({
            conversationId,
            step: "collecte",
            configMode: (lowerContent.includes("rapide") || lowerContent.includes("direct")) ? "rapide" : "pas-a-pas",
          });
        }
        
        // Si l'utilisateur répond à la question terrain (pas juste l'IA qui pose la question)
        // et que l'IA propose ensuite des réglages (data.config présent)
        if (data.config) {
          // L'IA a généré une config = on passe à proposition directement
          // (en mode direct, les étapes sont condensées)
          nextStep = "proposition";
        } else if (
          !lowerResponse.includes("type de terrain") && 
          !lowerResponse.includes("quel terrain") &&
          (lowerResponse.includes("vérifions") || lowerResponse.includes("vérification"))
        ) {
          nextStep = "verification";
        }
      } else if (currentStep === "verification") {
        if (data.config) {
          nextStep = "proposition";
        }
      } else if (currentStep === "proposition") {
        // Passer à test seulement si l'IA demande explicitement un retour après essai
        if (lowerResponse.includes("après ton essai") || lowerResponse.includes("dis-moi comment ça se passe")) {
          nextStep = "test";
        }
      }

      // Mettre à jour l'étape si elle a changé
      if (nextStep !== currentStep) {
        await updateStep({ conversationId, step: nextStep });
      }
    } catch (error) {
      console.error("Erreur:", error);
      await createMessage({
        conversationId,
        role: "assistant",
        content:
          "Désolé, j'ai rencontré une erreur. Peux-tu reformuler ta question ?",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleButtonClick = async (action: string, buttonText?: string) => {
    if (!user?._id || !conversationId) return;

    // Mapper les actions vers des messages lisibles
    const actionMessages: Record<string, string> = {
      reglage_direct: "Je choisis le réglage direct. Je pilote déjà bien et je veux une aide rapide.",
      pas_a_pas: "Je choisis le mode pas-à-pas. Je veux régler ma moto correctement depuis zéro avec explications.",
      next_step: "Je continue vers l'étape suivante.",
      confirm: "Je confirme ces informations.",
      rapide: "Je choisis la configuration rapide.",
      "pas-a-pas": "Je choisis le mode pas-à-pas.",
      continuer: "Je continue.",
      oui: "Oui, c'est correct.",
      non: "Non, je souhaite modifier.",
      valider: "Je valide.",
      modifier: "Je souhaite modifier.",
      tester: "Je vais tester ces réglages.",
      sauvegarder: "Je sauvegarde cette configuration.",
    };

    // Use predefined mapping, or button text as fallback, or the action itself
    const userMessage = actionMessages[action.toLowerCase()] || actionMessages[action] || (buttonText ? `Je choisis : ${buttonText}` : action);

    scrollToBottom();
    await handleSendMessage(userMessage);
  };

  const handleSaveConfig = async (config: ConfigData | undefined) => {
    if (!config || !user?._id || !selectedMotoId) return;

    // Utiliser le nom de la config si fourni par l'IA, sinon générer un nom par défaut
    const configName = config.name || `Config ${selectedMoto?.brand || ""} ${selectedMoto?.model || ""} - ${new Date().toLocaleDateString("fr-FR")}`;

    const result = await createConfig({
      motoId: selectedMotoId,
      suspensionKitId: selectedKitId,
      conversationId,
      name: configName,
      description: config.description,
      forkCompression: config.forkCompression,
      forkRebound: config.forkRebound,
      forkPreload: config.forkPreload,
      shockCompressionLow: config.shockCompressionLow,
      shockCompressionHigh: config.shockCompressionHigh,
      shockRebound: config.shockRebound,
      shockPreload: config.shockPreload,
      staticSag: config.staticSag,
      dynamicSag: config.dynamicSag,
      tirePressureFront: config.tirePressureFront,
      tirePressureRear: config.tirePressureRear,
      sportType: config.sportType,
      terrainType: config.terrainType,
      conditions: config.conditions,
      // Infos rider au moment de la création
      riderWeight: user.weight,
      riderLevel: user.level,
      riderStyle: user.style,
      riderObjective: user.objective,
      visibility: "private",
    });
    
    // Stocker l'ID pour les mises à jour avec +/-
    setSavedConfigId(result.configId);
    
    // SYNC FIX: Si selectedKitId était undefined, synchroniser avec le kit résolu par le backend
    if (!selectedKitId && result.effectiveKitId) {
      setSelectedKitId(result.effectiveKitId);
    }
  };

  const handleUpdateConfig = async (configId: string, field: string, value: number) => {
    await updateConfigField({
      configId: configId as Id<"configs">,
      field,
      value,
    });
  };

  return (
    <>
      <SignedOut>
        <div className="flex h-screen items-center justify-center bg-zinc-950">
          <div className="text-center space-y-4">
            <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-xl bg-purple-500">
              <span className="text-2xl font-bold text-white">MX</span>
            </div>
            <h1 className="text-2xl font-bold">
              <span className="text-purple-500">MX</span>
              <span className="text-white">Tune</span>
            </h1>
            <p className="text-zinc-400">Connecte-toi pour configurer ta moto</p>
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
            {/* Header avec étapes amélioré */}
            <div className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm shrink-0 py-4">
              <ChatStepsEnhanced currentStep={conversation?.step || "collecte"} />
            </div>

            <div className="flex flex-1 overflow-hidden">
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto">
                  <div className="max-w-3xl mx-auto px-4 pb-4">
                    {messages?.map((message) => (
                      <ChatMessage
                        key={message._id}
                        message={message}
                        userImage={clerkUser?.imageUrl}
                        onButtonClick={handleButtonClick}
                        onSaveConfig={handleSaveConfig}
                        onUpdateConfig={handleUpdateConfig}
                        savedConfigId={savedConfigId}
                        baseValues={selectedKit ? {
                          forkCompression: selectedKit.baseForkCompression,
                          forkRebound: selectedKit.baseForkRebound,
                          shockCompressionLow: selectedKit.baseShockCompressionLow,
                          shockCompressionHigh: selectedKit.baseShockCompressionHigh,
                          shockRebound: selectedKit.baseShockRebound,
                        } : undefined}
                      />
                    ))}

                    {isLoading && (
                      <div className="flex gap-4 p-6 bg-gradient-to-r from-purple-500/10 to-zinc-900/50 border-l-2 border-purple-500 animate-pulse">
                        <div className="relative h-10 w-10 rounded-full bg-purple-500 flex items-center justify-center">
                          <Loader2 className="h-5 w-5 animate-spin text-white" />
                          <span className="absolute inset-0 rounded-full bg-purple-500 animate-ping opacity-30" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-purple-400" />
                            MXTune analyse ta demande...
                          </p>
                          <p className="text-xs text-zinc-500 mt-1">Préparation des recommandations personnalisées</p>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                </div>

                <div className="shrink-0 max-w-3xl mx-auto w-full px-4 pb-4">
                  <ChatInput
                    onSend={handleSendMessage}
                    isLoading={isLoading}
                    selectedMotoId={selectedMotoId}
                    selectedKitId={selectedKitId}
                    onSelectMoto={(motoId, kitId) => {
                      setSelectedMotoId(motoId);
                      setSelectedKitId(kitId);
                    }}
                    showMotoSelector={true}
                  />
                </div>
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </SignedIn>
    </>
  );
}
