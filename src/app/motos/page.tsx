"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { ProfileSidebar } from "@/components/sidebar/profile-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SignInButton, useAuth } from "@clerk/nextjs";
import {
  Bike, Plus, Trash2, Loader2, Eye,
  Wrench, Package, Star, Check,
  Sliders, ChevronRight, ChevronLeft,
  Copy, Edit3, MoreHorizontal, Clock, Settings2,
  Info, ListChecks, ArrowLeft
} from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";
import { BRANDS, getModelsForBrand, getYearsForBrand, getStockSuspension } from "@/data/moto-models";
import { getForkBrands, getShockBrands } from "@/data/suspension-brands";
import { BrandLogo } from "@/components/ui/brand-logo";
import { ClickersPanel } from "@/components/clickers";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Modal tabs type
type ModalTab = "general" | "kits" | "configs" | "clickers";

// Navigation history item
interface NavHistoryItem {
  tab: ModalTab;
  kitId?: Id<"suspensionKits">;
  label: string;
}

const TERRAIN_TYPES = [
  { value: "sable", label: "Sable" },
  { value: "boue", label: "Boue" },
  { value: "dur", label: "Terrain dur" },
  { value: "rocailleux", label: "Rocailleux" },
  { value: "mixte", label: "Mixte" },
];

const SPORT_TYPES = [
  { value: "enduro", label: "Enduro" },
  { value: "motocross", label: "Motocross" },
  { value: "supermoto", label: "Supermoto" },
  { value: "trail", label: "Trail" },
];

// Component to fetch and display configs for a kit
function KitConfigsList({
  kitId,
  selectedConfigId,
  onSelectConfig,
  onSetActiveConfig,
}: {
  kitId: Id<"suspensionKits">;
  selectedConfigId: Id<"configs"> | null;
  onSelectConfig: (configId: Id<"configs">) => void;
  onSetActiveConfig: (configId: Id<"configs">) => void;
}) {
  const configs = useQuery(api.configs.getByKit, { kitId });

  if (!configs) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (configs.length === 0) {
    return (
      <div className="text-center py-8 px-4">
        <Sliders className="h-10 w-10 mx-auto mb-3 text-zinc-700" />
        <p className="text-zinc-400 text-sm mb-1">Aucun réglage sauvegardé</p>
        <p className="text-zinc-500 text-xs">Utilisez le panneau de clics pour créer un réglage</p>
      </div>
    );
  }

  // Sort by date (newest first)
  const sortedConfigs = [...configs].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="space-y-2">
      {sortedConfigs.map((config) => (
        <div
          key={config._id}
          onClick={() => onSelectConfig(config._id)}
          className={`p-3 rounded-lg border cursor-pointer transition-all ${
            selectedConfigId === config._id
              ? "bg-purple-500/10 border-purple-500/30"
              : "bg-zinc-800/30 border-zinc-800 hover:border-zinc-700"
          }`}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-medium text-white truncate text-sm">{config.name}</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => { e.stopPropagation(); onSetActiveConfig(config._id); }}
              className="h-6 px-2 text-[10px] text-zinc-400 hover:text-purple-400 shrink-0"
            >
              <Sliders className="h-3 w-3 mr-1" /> Appliquer
            </Button>
          </div>

          {/* Config summary */}
          <div className="flex flex-wrap gap-1.5 text-[10px] mb-2">
            {config.riderWeight && (
              <span className="px-1.5 py-0.5 bg-zinc-700/50 rounded text-zinc-300">
                {config.riderWeight}kg
              </span>
            )}
            {config.terrainType && (
              <span className="px-1.5 py-0.5 bg-zinc-700/50 rounded text-zinc-300">
                {TERRAIN_TYPES.find(t => t.value === config.terrainType)?.label}
              </span>
            )}
          </div>

          {/* Settings preview */}
          <div className="grid grid-cols-5 gap-1 text-[10px]">
            <div className="text-center">
              <span className="text-zinc-500 block">F.C</span>
              <span className="text-zinc-300">{config.forkCompression ?? "-"}</span>
            </div>
            <div className="text-center">
              <span className="text-zinc-500 block">F.D</span>
              <span className="text-zinc-300">{config.forkRebound ?? "-"}</span>
            </div>
            <div className="text-center">
              <span className="text-zinc-500 block">BV</span>
              <span className="text-zinc-300">{config.shockCompressionLow ?? "-"}</span>
            </div>
            <div className="text-center">
              <span className="text-zinc-500 block">HV</span>
              <span className="text-zinc-300">{config.shockCompressionHigh ?? "-"}</span>
            </div>
            <div className="text-center">
              <span className="text-zinc-500 block">S.D</span>
              <span className="text-zinc-300">{config.shockRebound ?? "-"}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MotosPage() {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { user } = useCurrentUser();

  const motos = useQuery(
    api.motos.getByUser,
    user?._id ? { userId: user._id } : "skip"
  );

  const createMoto = useMutation(api.motos.create);
  const deleteMoto = useMutation(api.motos.remove);
  const createKit = useMutation(api.suspensionKits.create);
  const deleteKit = useMutation(api.suspensionKits.remove);
  const setDefaultKit = useMutation(api.suspensionKits.setDefault);
  const updateKit = useMutation(api.suspensionKits.update);
  const duplicateKit = useMutation(api.suspensionKits.duplicate);

  // Modal state
  const [selectedMotoId, setSelectedMotoId] = useState<Id<"motos"> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ModalTab>("general");
  const [navHistory, setNavHistory] = useState<NavHistoryItem[]>([]);
  
  // Sub-selections within modal
  const [selectedKitId, setSelectedKitId] = useState<Id<"suspensionKits"> | null>(null);
  const [selectedConfigId, setSelectedConfigId] = useState<Id<"configs"> | null>(null);

  // Dialog states
  const [isAddMotoDialogOpen, setIsAddMotoDialogOpen] = useState(false);
  const [isKitDialogOpen, setIsKitDialogOpen] = useState(false);
  const [renameKitId, setRenameKitId] = useState<Id<"suspensionKits"> | null>(null);
  const [renameKitName, setRenameKitName] = useState("");

  // Loading states
  const [isLoading, setIsLoading] = useState(false);

  // New moto form
  const [newMoto, setNewMoto] = useState({
    brand: "",
    model: "",
    year: 2024,
    isStockSuspension: true,
    customForkBrand: "",
    customForkModel: "",
    customShockBrand: "",
    customShockModel: "",
    suspensionNotes: "",
  });

  // New kit form
  const [newKit, setNewKit] = useState({
    name: "",
    description: "",
    terrainType: "",
    sportType: "",
    country: "",
    isStockSuspension: true,
    forkBrand: "",
    forkModel: "",
    shockBrand: "",
    shockModel: "",
    forkSpringRate: "",
    shockSpringRate: "",
  });

  // Get selected moto & kit data
  const selectedMoto = motos?.find(m => m._id === selectedMotoId);
  const selectedKit = selectedMoto?.kits?.find(k => k._id === selectedKitId);
  const activeKit = selectedMoto?.kits?.find(k => k.isDefault) || selectedMoto?.kits?.[0];
  const stockSuspension = selectedMoto?.brand ? getStockSuspension(selectedMoto.brand) : null;

  const availableModels = newMoto.brand ? getModelsForBrand(newMoto.brand) : [];
  const availableYears = newMoto.brand ? getYearsForBrand(newMoto.brand) : [];

  // Reset model and year when brand changes
  useEffect(() => {
    if (newMoto.brand) {
      const years = getYearsForBrand(newMoto.brand);
      setNewMoto(prev => ({ ...prev, model: "", year: years[0] || 2024 }));
    }
  }, [newMoto.brand]);

  // Reset state when modal opens
  useEffect(() => {
    if (isModalOpen && selectedMoto) {
      setActiveTab("general");
      setNavHistory([]);
      const defaultKit = selectedMoto.kits?.find(k => k.isDefault) || selectedMoto.kits?.[0];
      setSelectedKitId(defaultKit?._id || null);
      setSelectedConfigId(null);
    }
  }, [isModalOpen, selectedMoto]);

  // Navigation functions
  const navigateTo = (tab: ModalTab, label: string, kitId?: Id<"suspensionKits">) => {
    setNavHistory(prev => [...prev, { tab: activeTab, kitId: selectedKitId || undefined, label: getTabLabel(activeTab) }]);
    setActiveTab(tab);
    if (kitId) setSelectedKitId(kitId);
  };

  const goBack = () => {
    if (navHistory.length === 0) return;
    const prev = navHistory[navHistory.length - 1];
    setNavHistory(navHistory.slice(0, -1));
    setActiveTab(prev.tab);
    if (prev.kitId) setSelectedKitId(prev.kitId);
  };

  const getTabLabel = (tab: ModalTab) => {
    switch (tab) {
      case "general": return "Général";
      case "kits": return "Kits";
      case "configs": return "Configs";
      case "clickers": return "Réglages";
      default: return "";
    }
  };

  // Open moto modal
  const handleOpenMotoModal = (motoId: Id<"motos">) => {
    setSelectedMotoId(motoId);
    setIsModalOpen(true);
  };

  // Handlers
  const handleCreateMoto = async () => {
    if (!user?._id || !newMoto.brand || !newMoto.model) return;

    setIsLoading(true);
    try {
      const stockSusp = getStockSuspension(newMoto.brand);
      const forkBrand = newMoto.isStockSuspension ? stockSusp?.forkBrand : newMoto.customForkBrand;
      const forkModel = newMoto.isStockSuspension ? stockSusp?.forkModel : newMoto.customForkModel;
      const shockBrand = newMoto.isStockSuspension ? stockSusp?.shockBrand : newMoto.customShockBrand;
      const shockModel = newMoto.isStockSuspension ? stockSusp?.shockModel : newMoto.customShockModel;

      const clickRanges = stockSusp ? {
        maxForkCompression: stockSusp.maxForkCompression,
        maxForkRebound: stockSusp.maxForkRebound,
        maxShockCompressionLow: stockSusp.maxShockCompressionLow,
        maxShockCompressionHigh: stockSusp.maxShockCompressionHigh,
        maxShockRebound: stockSusp.maxShockRebound,
        baseForkCompression: stockSusp.baseForkCompression,
        baseForkRebound: stockSusp.baseForkRebound,
        baseShockCompressionLow: stockSusp.baseShockCompressionLow,
        baseShockCompressionHigh: stockSusp.baseShockCompressionHigh,
        baseShockRebound: stockSusp.baseShockRebound,
      } : {};

      const motoId = await createMoto({
        userId: user._id,
        brand: newMoto.brand,
        model: newMoto.model,
        year: newMoto.year,
        isStockSuspension: newMoto.isStockSuspension,
        forkBrand,
        forkModel,
        shockBrand,
        shockModel,
        suspensionNotes: newMoto.suspensionNotes || undefined,
        ...clickRanges,
      });
      setIsAddMotoDialogOpen(false);
      setSelectedMotoId(motoId);
      setIsModalOpen(true);
      setNewMoto({ brand: "", model: "", year: 2024, isStockSuspension: true, customForkBrand: "", customForkModel: "", customShockBrand: "", customShockModel: "", suspensionNotes: "" });
    } catch (error) {
      console.error("Erreur lors de la création:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMoto = async (motoId: Id<"motos">) => {
    if (!confirm("Supprimer cette moto et tous ses kits ?")) return;
    try {
      await deleteMoto({ motoId });
      setIsModalOpen(false);
      setSelectedMotoId(null);
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
    }
  };

  const handleOpenKitDialog = () => {
    if (!selectedMoto) return;
    const stockSusp = getStockSuspension(selectedMoto.brand);
    setNewKit({
      name: "",
      description: "",
      terrainType: "",
      sportType: "",
      country: "",
      isStockSuspension: true,
      forkBrand: stockSusp?.forkBrand || "",
      forkModel: stockSusp?.forkModel || "",
      shockBrand: stockSusp?.shockBrand || "",
      shockModel: stockSusp?.shockModel || "",
      forkSpringRate: "",
      shockSpringRate: "",
    });
    setIsKitDialogOpen(true);
  };

  const handleSaveKit = async () => {
    if (!selectedMoto || !user?._id || !newKit.name) return;
    setIsLoading(true);
    try {
      await createKit({
        userId: user._id,
        motoId: selectedMoto._id,
        name: newKit.name,
        description: newKit.description || undefined,
        terrainType: newKit.terrainType || undefined,
        sportType: newKit.sportType || undefined,
        country: newKit.country || undefined,
        isStockSuspension: newKit.isStockSuspension,
        forkBrand: newKit.forkBrand || undefined,
        forkModel: newKit.forkModel || undefined,
        shockBrand: newKit.shockBrand || undefined,
        shockModel: newKit.shockModel || undefined,
        forkSpringRate: newKit.forkSpringRate || undefined,
        shockSpringRate: newKit.shockSpringRate || undefined,
      });
      setIsKitDialogOpen(false);
    } catch (error) {
      console.error("Erreur lors de la création du kit:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteKit = async (kitId: Id<"suspensionKits">) => {
    if (!confirm("Supprimer ce kit et tous ses réglages ?")) return;
    await deleteKit({ kitId });
    if (selectedKitId === kitId) {
      setSelectedKitId(null);
    }
  };

  const handleSetDefaultKit = async (kitId: Id<"suspensionKits">) => {
    await setDefaultKit({ kitId });
  };

  const handleRenameKit = async () => {
    if (!renameKitId || !renameKitName.trim()) return;
    await updateKit({ kitId: renameKitId, name: renameKitName.trim() });
    setRenameKitId(null);
    setRenameKitName("");
  };

  const handleDuplicateKit = async (kitId: Id<"suspensionKits">) => {
    await duplicateKit({ kitId });
  };

  const openRenameDialog = (kitId: Id<"suspensionKits">, currentName: string) => {
    setRenameKitId(kitId);
    setRenameKitName(currentName);
  };

  const handleSetActiveConfig = async (configId: Id<"configs">) => {
    // TODO: Implement set active config mutation
    console.log("Set active config:", configId);
  };

  // Auth loading state
  if (!authLoaded) {
    return (
      <SidebarProvider>
        <div className="h-screen flex w-full bg-zinc-950 overflow-hidden">
          <AppSidebar />
          <SidebarInset className="flex-1 !flex-row overflow-hidden">
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            </div>
            <ProfileSidebar />
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  // Not signed in
  if (!isSignedIn) {
    return (
      <SidebarProvider>
        <div className="h-screen flex w-full bg-zinc-950 overflow-hidden">
          <AppSidebar />
          <SidebarInset className="flex-1 !flex-row overflow-hidden">
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Bike className="h-16 w-16 mx-auto mb-4 text-purple-500" />
                <h2 className="text-xl font-semibold text-white mb-4">Connexion requise</h2>
                <SignInButton>
                  <Button className="bg-purple-600 hover:bg-purple-500">Se connecter</Button>
                </SignInButton>
              </div>
            </div>
            <ProfileSidebar />
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  // Sort kits: active first
  const sortedKits = selectedMoto?.kits
    ? [...selectedMoto.kits].sort((a, b) => {
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
        return 0;
      })
    : [];

  // Modal tabs config
  const modalTabs: { id: ModalTab; label: string; icon: React.ReactNode }[] = [
    { id: "general", label: "Général", icon: <Info className="h-4 w-4" /> },
    { id: "kits", label: "Kits", icon: <Package className="h-4 w-4" /> },
    { id: "configs", label: "Configs", icon: <ListChecks className="h-4 w-4" /> },
    { id: "clickers", label: "Réglages", icon: <Sliders className="h-4 w-4" /> },
  ];

  return (
    <SidebarProvider>
      <div className="h-screen flex w-full bg-zinc-950 overflow-hidden">
        <AppSidebar />
        <SidebarInset className="flex-1 !flex-row overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top Bar */}
            <div className="p-4 border-b border-zinc-800 shrink-0">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <Bike className="h-5 w-5 text-purple-400" />
                  Mes Motos
                </h1>
                <Button size="sm" onClick={() => setIsAddMotoDialogOpen(true)} className="bg-purple-600 hover:bg-purple-500">
                  <Plus className="h-4 w-4 mr-1" /> Ajouter
                </Button>
              </div>
            </div>

            {/* Moto Cards Grid */}
            <ScrollArea className="flex-1">
              <div className="p-4">
                {motos === undefined ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                  </div>
                ) : motos.length === 0 ? (
                  <div className="text-center py-16">
                    <Bike className="h-16 w-16 mx-auto mb-4 text-zinc-700" />
                    <h3 className="text-lg font-semibold text-zinc-400 mb-2">Aucune moto</h3>
                    <p className="text-zinc-500 mb-4">Ajoutez votre première moto pour commencer</p>
                    <Button onClick={() => setIsAddMotoDialogOpen(true)} className="bg-purple-600 hover:bg-purple-500">
                      <Plus className="h-4 w-4 mr-2" /> Ajouter une moto
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {motos.map((moto) => {
                      const motoActiveKit = moto.kits?.find(k => k.isDefault) || moto.kits?.[0];
                      return (
                        <div
                          key={moto._id}
                          onClick={() => handleOpenMotoModal(moto._id)}
                          className="group p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-purple-500/50 hover:bg-zinc-900 transition-all cursor-pointer"
                        >
                          {/* Header */}
                          <div className="flex items-start gap-3 mb-3">
                            <BrandLogo brand={moto.brand} size="lg" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-white truncate">
                                  {moto.brand} {moto.model}
                                </h3>
                                {moto.isPublic && <Eye className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
                              </div>
                              <p className="text-sm text-zinc-500">{moto.year}</p>
                            </div>
                          </div>

                          {/* Active kit info */}
                          {motoActiveKit && (
                            <div className="p-2.5 bg-zinc-800/50 rounded-lg mb-3">
                              <div className="flex items-center gap-2 mb-2">
                                <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                                <span className="text-xs text-zinc-300 font-medium">{motoActiveKit.name}</span>
                              </div>
                              <div className="grid grid-cols-5 gap-1 text-center text-[10px]">
                                <div>
                                  <span className="text-zinc-500 block">F.C</span>
                                  <span className="text-zinc-300">{motoActiveKit.forkCompression ?? motoActiveKit.baseForkCompression ?? "-"}</span>
                                </div>
                                <div>
                                  <span className="text-zinc-500 block">F.D</span>
                                  <span className="text-zinc-300">{motoActiveKit.forkRebound ?? motoActiveKit.baseForkRebound ?? "-"}</span>
                                </div>
                                <div>
                                  <span className="text-zinc-500 block">BV</span>
                                  <span className="text-zinc-300">{motoActiveKit.shockCompressionLow ?? motoActiveKit.baseShockCompressionLow ?? "-"}</span>
                                </div>
                                <div>
                                  <span className="text-zinc-500 block">HV</span>
                                  <span className="text-zinc-300">{motoActiveKit.shockCompressionHigh ?? motoActiveKit.baseShockCompressionHigh ?? "-"}</span>
                                </div>
                                <div>
                                  <span className="text-zinc-500 block">S.D</span>
                                  <span className="text-zinc-300">{motoActiveKit.shockRebound ?? motoActiveKit.baseShockRebound ?? "-"}</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Footer */}
                          <div className="flex items-center justify-between text-xs text-zinc-500">
                            <span>{moto.kits?.length || 0} kit{(moto.kits?.length || 0) > 1 ? "s" : ""}</span>
                            <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-purple-400 transition-colors" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
          <ProfileSidebar />
        </SidebarInset>
      </div>

      {/* Moto Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 !w-[95vw] !max-w-[1200px] h-[90vh] p-0 flex flex-col overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>{selectedMoto?.brand} {selectedMoto?.model}</DialogTitle>
            <DialogDescription>Détails de la moto</DialogDescription>
          </DialogHeader>

          {selectedMoto && (
            <div className="flex flex-col h-full">
              {/* Modal Header */}
              <div className="p-4 border-b border-zinc-800 shrink-0">
                <div className="flex items-center gap-4">
                  {navHistory.length > 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={goBack}
                      className="h-8 w-8 p-0 text-zinc-400 hover:text-white"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  )}
                  <BrandLogo brand={selectedMoto.brand} size="lg" />
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-white">
                      {selectedMoto.brand} {selectedMoto.model}
                    </h2>
                    <p className="text-sm text-zinc-500">{selectedMoto.year}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-zinc-400">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
                      <DropdownMenuItem className="text-zinc-300 text-xs">
                        <Edit3 className="h-3 w-3 mr-2" /> Modifier
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-zinc-800" />
                      <DropdownMenuItem
                        onClick={() => handleDeleteMoto(selectedMoto._id)}
                        className="text-red-400 text-xs"
                      >
                        <Trash2 className="h-3 w-3 mr-2" /> Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Breadcrumb */}
                {navHistory.length > 0 && (
                  <div className="flex items-center gap-1 mt-3 text-xs text-zinc-500">
                    <span className="hover:text-zinc-300 cursor-pointer" onClick={() => { setNavHistory([]); setActiveTab("general"); }}>
                      Général
                    </span>
                    {navHistory.map((item, idx) => (
                      <span key={idx} className="flex items-center gap-1">
                        <ChevronRight className="h-3 w-3" />
                        <span className="hover:text-zinc-300 cursor-pointer" onClick={() => {
                          setNavHistory(navHistory.slice(0, idx));
                          setActiveTab(item.tab);
                        }}>
                          {item.label}
                        </span>
                      </span>
                    ))}
                    <ChevronRight className="h-3 w-3" />
                    <span className="text-zinc-300">{getTabLabel(activeTab)}</span>
                  </div>
                )}
              </div>

              {/* Modal Body */}
              <div className="flex flex-1 overflow-hidden">
                {/* Sidebar Tabs */}
                <div className="w-48 border-r border-zinc-800 shrink-0 bg-zinc-900/30">
                  <div className="p-2 space-y-1">
                    {modalTabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id); setNavHistory([]); }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                          activeTab === tab.id
                            ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                            : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                        }`}
                      >
                        {tab.icon}
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="p-6">
                      {/* General Tab */}
                      {activeTab === "general" && (
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-lg font-semibold text-white mb-4">Vue d&apos;ensemble</h3>
                            
                            {/* Current Config Card */}
                            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 mb-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <Sliders className="h-4 w-4 text-purple-400" />
                                  <span className="font-medium text-white">Configuration actuelle</span>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => navigateTo("configs", "Configs")}
                                  className="text-xs text-zinc-400 hover:text-purple-400"
                                >
                                  Détails <ChevronRight className="h-3 w-3 ml-1" />
                                </Button>
                              </div>
                              {activeKit ? (
                                <div className="p-3 bg-zinc-800/50 rounded-lg">
                                  <div className="flex items-center gap-2 mb-3">
                                    <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                                    <span className="text-sm text-zinc-300 font-medium">{activeKit.name}</span>
                                  </div>
                                  <div className="grid grid-cols-5 gap-2 text-center">
                                    <div>
                                      <span className="text-zinc-500 block text-[10px]">F.C</span>
                                      <span className="text-white font-medium text-sm">{activeKit.forkCompression ?? activeKit.baseForkCompression ?? "-"}</span>
                                    </div>
                                    <div>
                                      <span className="text-zinc-500 block text-[10px]">F.D</span>
                                      <span className="text-white font-medium text-sm">{activeKit.forkRebound ?? activeKit.baseForkRebound ?? "-"}</span>
                                    </div>
                                    <div>
                                      <span className="text-zinc-500 block text-[10px]">BV</span>
                                      <span className="text-white font-medium text-sm">{activeKit.shockCompressionLow ?? activeKit.baseShockCompressionLow ?? "-"}</span>
                                    </div>
                                    <div>
                                      <span className="text-zinc-500 block text-[10px]">HV</span>
                                      <span className="text-white font-medium text-sm">{activeKit.shockCompressionHigh ?? activeKit.baseShockCompressionHigh ?? "-"}</span>
                                    </div>
                                    <div>
                                      <span className="text-zinc-500 block text-[10px]">S.D</span>
                                      <span className="text-white font-medium text-sm">{activeKit.shockRebound ?? activeKit.baseShockRebound ?? "-"}</span>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-zinc-500 text-sm">Aucun kit actif</p>
                              )}
                            </div>

                            {/* Current Kit Card */}
                            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 mb-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <Package className="h-4 w-4 text-emerald-400" />
                                  <span className="font-medium text-white">Kit actuel</span>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => navigateTo("kits", "Kits")}
                                  className="text-xs text-zinc-400 hover:text-purple-400"
                                >
                                  Détails <ChevronRight className="h-3 w-3 ml-1" />
                                </Button>
                              </div>
                              {activeKit ? (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                                    <span className="text-zinc-300">{activeKit.name}</span>
                                  </div>
                                  <div className="flex flex-wrap gap-2 text-xs">
                                    {activeKit.terrainType && (
                                      <Badge variant="outline" className="bg-zinc-800 border-zinc-700 text-zinc-300">
                                        {TERRAIN_TYPES.find(t => t.value === activeKit.terrainType)?.label}
                                      </Badge>
                                    )}
                                    {activeKit.sportType && (
                                      <Badge variant="outline" className="bg-zinc-800 border-zinc-700 text-zinc-300">
                                        {SPORT_TYPES.find(t => t.value === activeKit.sportType)?.label}
                                      </Badge>
                                    )}
                                    <Badge variant="outline" className="bg-zinc-800 border-zinc-700 text-zinc-300">
                                      {activeKit.forkBrand || stockSuspension?.forkBrand || "WP"}
                                    </Badge>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-zinc-500 text-sm">Aucun kit configuré</p>
                              )}
                            </div>

                            {/* Quick Actions */}
                            <div className="grid grid-cols-2 gap-3">
                              <Button
                                onClick={() => navigateTo("clickers", "Réglages")}
                                className="h-auto py-4 bg-purple-600 hover:bg-purple-500"
                              >
                                <div className="flex flex-col items-center gap-2">
                                  <Sliders className="h-5 w-5" />
                                  <span>Ajuster les clics</span>
                                </div>
                              </Button>
                              <Button
                                onClick={handleOpenKitDialog}
                                variant="outline"
                                className="h-auto py-4 border-zinc-700 hover:bg-zinc-800"
                              >
                                <div className="flex flex-col items-center gap-2">
                                  <Plus className="h-5 w-5" />
                                  <span>Nouveau kit</span>
                                </div>
                              </Button>
                            </div>
                          </div>

                          {/* Suspension Info */}
                          <div>
                            <h3 className="text-lg font-semibold text-white mb-4">Suspensions</h3>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
                                <h4 className="text-sm font-medium text-zinc-400 mb-2">Fourche</h4>
                                <p className="text-white">{selectedMoto.forkBrand || stockSuspension?.forkBrand || "Non spécifié"}</p>
                                {selectedMoto.forkModel && <p className="text-sm text-zinc-500">{selectedMoto.forkModel}</p>}
                              </div>
                              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
                                <h4 className="text-sm font-medium text-zinc-400 mb-2">Amortisseur</h4>
                                <p className="text-white">{selectedMoto.shockBrand || stockSuspension?.shockBrand || "Non spécifié"}</p>
                                {selectedMoto.shockModel && <p className="text-sm text-zinc-500">{selectedMoto.shockModel}</p>}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Kits Tab */}
                      {activeTab === "kits" && (
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white">Kits de suspension</h3>
                            <Button size="sm" onClick={handleOpenKitDialog} className="bg-purple-600 hover:bg-purple-500">
                              <Plus className="h-4 w-4 mr-1" /> Nouveau
                            </Button>
                          </div>

                          {sortedKits.length === 0 ? (
                            <div className="text-center py-16 border border-dashed border-zinc-800 rounded-lg">
                              <Package className="h-12 w-12 mx-auto mb-3 text-zinc-700" />
                              <p className="text-zinc-400 mb-1">Aucun kit configuré</p>
                              <p className="text-zinc-500 text-sm mb-4">Créez votre premier kit de suspension</p>
                              <Button size="sm" onClick={handleOpenKitDialog} className="bg-purple-600 hover:bg-purple-500">
                                <Plus className="h-4 w-4 mr-1" /> Créer un kit
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {sortedKits.map((kit) => (
                                <div
                                  key={kit._id}
                                  className={`p-4 rounded-lg border transition-all ${
                                    kit.isDefault
                                      ? "bg-emerald-500/5 border-emerald-500/30"
                                      : "bg-zinc-800/20 border-zinc-800 hover:border-zinc-700"
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        {kit.isDefault && <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />}
                                        <span className="font-medium text-white">{kit.name}</span>
                                        {kit.isDefault ? (
                                          <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
                                            Actif
                                          </Badge>
                                        ) : (
                                          <Badge variant="outline" className="bg-zinc-800 text-zinc-400 border-zinc-700 text-[10px]">
                                            Inactif
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="flex flex-wrap gap-2 text-xs">
                                        {kit.terrainType && (
                                          <span className="text-zinc-500">
                                            {TERRAIN_TYPES.find(t => t.value === kit.terrainType)?.label}
                                          </span>
                                        )}
                                        {kit.forkBrand && (
                                          <span className="text-zinc-500">{kit.forkBrand}</span>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1">
                                      {!kit.isDefault && (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => handleSetDefaultKit(kit._id)}
                                          className="h-7 px-2 text-xs text-zinc-400 hover:text-emerald-400"
                                        >
                                          <Check className="h-3 w-3 mr-1" /> Activer
                                        </Button>
                                      )}
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                          setSelectedKitId(kit._id);
                                          navigateTo("clickers", "Réglages", kit._id);
                                        }}
                                        className="h-7 px-2 text-xs text-zinc-400 hover:text-purple-400"
                                      >
                                        <Sliders className="h-3 w-3 mr-1" /> Régler
                                      </Button>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-zinc-400">
                                            <MoreHorizontal className="h-3.5 w-3.5" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
                                          <DropdownMenuItem
                                            onClick={() => openRenameDialog(kit._id, kit.name)}
                                            className="text-zinc-300 text-xs"
                                          >
                                            <Edit3 className="h-3 w-3 mr-2" /> Renommer
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            onClick={() => handleDuplicateKit(kit._id)}
                                            className="text-zinc-300 text-xs"
                                          >
                                            <Copy className="h-3 w-3 mr-2" /> Dupliquer
                                          </DropdownMenuItem>
                                          <DropdownMenuSeparator className="bg-zinc-800" />
                                          <DropdownMenuItem
                                            onClick={() => handleDeleteKit(kit._id)}
                                            className="text-red-400 text-xs"
                                          >
                                            <Trash2 className="h-3 w-3 mr-2" /> Supprimer
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  </div>

                                  {/* Current settings preview */}
                                  <div className="mt-3 pt-3 border-t border-zinc-800/50">
                                    <div className="grid grid-cols-5 gap-2 text-center text-xs">
                                      <div>
                                        <span className="text-zinc-500 block text-[10px]">F.C</span>
                                        <span className="text-white">{kit.forkCompression ?? kit.baseForkCompression ?? "-"}</span>
                                      </div>
                                      <div>
                                        <span className="text-zinc-500 block text-[10px]">F.D</span>
                                        <span className="text-white">{kit.forkRebound ?? kit.baseForkRebound ?? "-"}</span>
                                      </div>
                                      <div>
                                        <span className="text-zinc-500 block text-[10px]">BV</span>
                                        <span className="text-white">{kit.shockCompressionLow ?? kit.baseShockCompressionLow ?? "-"}</span>
                                      </div>
                                      <div>
                                        <span className="text-zinc-500 block text-[10px]">HV</span>
                                        <span className="text-white">{kit.shockCompressionHigh ?? kit.baseShockCompressionHigh ?? "-"}</span>
                                      </div>
                                      <div>
                                        <span className="text-zinc-500 block text-[10px]">S.D</span>
                                        <span className="text-white">{kit.shockRebound ?? kit.baseShockRebound ?? "-"}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Configs Tab */}
                      {activeTab === "configs" && (
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white">Réglages sauvegardés</h3>
                          </div>

                          {/* Kit selector */}
                          {sortedKits.length > 0 && (
                            <div className="mb-4">
                              <Label className="text-zinc-400 text-sm mb-2 block">Sélectionner un kit</Label>
                              <div className="flex flex-wrap gap-2">
                                {sortedKits.map((kit) => (
                                  <button
                                    key={kit._id}
                                    onClick={() => setSelectedKitId(kit._id)}
                                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                                      selectedKitId === kit._id
                                        ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                                        : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600"
                                    }`}
                                  >
                                    {kit.isDefault && <Star className="h-3 w-3 inline mr-1 text-amber-400 fill-amber-400" />}
                                    {kit.name}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {selectedKitId ? (
                            <KitConfigsList
                              kitId={selectedKitId}
                              selectedConfigId={selectedConfigId}
                              onSelectConfig={setSelectedConfigId}
                              onSetActiveConfig={handleSetActiveConfig}
                            />
                          ) : (
                            <div className="text-center py-16 border border-dashed border-zinc-800 rounded-lg">
                              <ListChecks className="h-12 w-12 mx-auto mb-3 text-zinc-700" />
                              <p className="text-zinc-400">Sélectionnez un kit pour voir ses réglages</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Clickers Tab */}
                      {activeTab === "clickers" && (
                        <div>
                          {/* Kit selector for clickers */}
                          {sortedKits.length > 0 && (
                            <div className="mb-4">
                              <Label className="text-zinc-400 text-sm mb-2 block">Kit à régler</Label>
                              <div className="flex flex-wrap gap-2">
                                {sortedKits.map((kit) => (
                                  <button
                                    key={kit._id}
                                    onClick={() => setSelectedKitId(kit._id)}
                                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                                      selectedKitId === kit._id
                                        ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                                        : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600"
                                    }`}
                                  >
                                    {kit.isDefault && <Star className="h-3 w-3 inline mr-1 text-amber-400 fill-amber-400" />}
                                    {kit.name}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {(() => {
                            const kitToShow = sortedKits.find(k => k._id === selectedKitId);
                            if (!kitToShow) {
                              return (
                                <div className="text-center py-16 border border-dashed border-zinc-800 rounded-lg">
                                  <Sliders className="h-12 w-12 mx-auto mb-3 text-zinc-700" />
                                  <p className="text-zinc-400">Sélectionnez un kit pour ajuster les clics</p>
                                </div>
                              );
                            }

                            return (
                              <ClickersPanel
                                motoId={selectedMoto._id}
                                kitId={kitToShow._id}
                                initialSettings={{
                                  forkCompression: kitToShow.forkCompression ?? kitToShow.baseForkCompression ?? 10,
                                  forkRebound: kitToShow.forkRebound ?? kitToShow.baseForkRebound ?? 10,
                                  shockCompressionLow: kitToShow.shockCompressionLow ?? kitToShow.baseShockCompressionLow ?? 10,
                                  shockCompressionHigh: kitToShow.shockCompressionHigh ?? kitToShow.baseShockCompressionHigh ?? 10,
                                  shockRebound: kitToShow.shockRebound ?? kitToShow.baseShockRebound ?? 10,
                                }}
                                ranges={{
                                  maxForkCompression: kitToShow.maxForkCompression ?? 25,
                                  maxForkRebound: kitToShow.maxForkRebound ?? 25,
                                  maxShockCompressionLow: kitToShow.maxShockCompressionLow ?? 25,
                                  maxShockCompressionHigh: kitToShow.maxShockCompressionHigh ?? 25,
                                  maxShockRebound: kitToShow.maxShockRebound ?? 25,
                                }}
                                forkBrand={kitToShow.forkBrand || stockSuspension?.forkBrand}
                                shockBrand={kitToShow.shockBrand || stockSuspension?.shockBrand}
                                kitName={kitToShow.name}
                                isDefault={kitToShow.isDefault}
                                motoBrand={selectedMoto.brand}
                                motoModel={selectedMoto.model}
                                initialKitInfo={{
                                  name: kitToShow.name,
                                  description: kitToShow.description,
                                  terrainType: kitToShow.terrainType,
                                  sportType: kitToShow.sportType,
                                  country: kitToShow.country,
                                  isStockSuspension: kitToShow.isStockSuspension,
                                  forkBrand: kitToShow.forkBrand,
                                  forkModel: kitToShow.forkModel,
                                  shockBrand: kitToShow.shockBrand,
                                  shockModel: kitToShow.shockModel,
                                  forkSpringRate: kitToShow.forkSpringRate,
                                  shockSpringRate: kitToShow.shockSpringRate,
                                  forkOilWeight: kitToShow.forkOilWeight,
                                  forkOilLevel: kitToShow.forkOilLevel,
                                  valvingNotes: kitToShow.valvingNotes,
                                  otherMods: kitToShow.otherMods,
                                }}
                              />
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Moto Dialog */}
      <Dialog open={isAddMotoDialogOpen} onOpenChange={setIsAddMotoDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg max-h-[85vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="text-white">Ajouter une moto</DialogTitle>
            <DialogDescription>Ajoutez une nouvelle moto à votre garage</DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-4 pb-4">
              <div className="space-y-2">
                <Label className="text-zinc-400">Marque *</Label>
                <select value={newMoto.brand} onChange={(e) => setNewMoto(prev => ({ ...prev, brand: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white">
                  <option value="">Sélectionner</option>
                  {BRANDS.map(brand => <option key={brand} value={brand}>{brand}</option>)}
                </select>
              </div>
              {newMoto.brand && (
                <>
                  <div className="space-y-2">
                    <Label className="text-zinc-400">Modèle *</Label>
                    <select value={newMoto.model} onChange={(e) => setNewMoto(prev => ({ ...prev, model: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white">
                      <option value="">Sélectionner</option>
                      {availableModels.map(model => <option key={model} value={model}>{model}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-400">Année *</Label>
                    <select value={newMoto.year} onChange={(e) => setNewMoto(prev => ({ ...prev, year: parseInt(e.target.value) }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white">
                      {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
                    </select>
                  </div>

                  <Separator className="bg-zinc-800" />
                  <div className="space-y-3">
                    <Label className="text-zinc-300 font-medium">Suspension</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button type="button" onClick={() => setNewMoto(prev => ({ ...prev, isStockSuspension: true }))} className={`p-3 rounded-lg border-2 transition-all ${newMoto.isStockSuspension ? "border-purple-500 bg-purple-500/10" : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"}`}>
                        <Package className={`h-5 w-5 mx-auto mb-1.5 ${newMoto.isStockSuspension ? "text-purple-400" : "text-zinc-400"}`} />
                        <span className={`text-sm font-medium ${newMoto.isStockSuspension ? "text-white" : "text-zinc-400"}`}>Stock</span>
                      </button>
                      <button type="button" onClick={() => setNewMoto(prev => ({ ...prev, isStockSuspension: false }))} className={`p-3 rounded-lg border-2 transition-all ${!newMoto.isStockSuspension ? "border-purple-500 bg-purple-500/10" : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"}`}>
                        <Wrench className={`h-5 w-5 mx-auto mb-1.5 ${!newMoto.isStockSuspension ? "text-purple-400" : "text-zinc-400"}`} />
                        <span className={`text-sm font-medium ${!newMoto.isStockSuspension ? "text-white" : "text-zinc-400"}`}>Modifié</span>
                      </button>
                    </div>

                    {newMoto.isStockSuspension && (() => {
                      const stockSusp = getStockSuspension(newMoto.brand);
                      return stockSusp ? (
                        <div className="p-3 bg-zinc-800/50 rounded-lg">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div><span className="text-zinc-500">Fourche:</span><span className="text-zinc-300 ml-1">{stockSusp.forkBrand}</span></div>
                            <div><span className="text-zinc-500">Amortisseur:</span><span className="text-zinc-300 ml-1">{stockSusp.shockBrand}</span></div>
                          </div>
                        </div>
                      ) : null;
                    })()}

                    {!newMoto.isStockSuspension && (
                      <div className="space-y-3 p-3 bg-zinc-800/50 rounded-lg">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-zinc-400 text-xs">Fourche</Label>
                            <Input value={newMoto.customForkBrand} onChange={(e) => setNewMoto(prev => ({ ...prev, customForkBrand: e.target.value }))} placeholder="Marque" className="bg-zinc-800 border-zinc-700 h-9 text-sm" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-zinc-400 text-xs">Amortisseur</Label>
                            <Input value={newMoto.customShockBrand} onChange={(e) => setNewMoto(prev => ({ ...prev, customShockBrand: e.target.value }))} placeholder="Marque" className="bg-zinc-800 border-zinc-700 h-9 text-sm" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
          <div className="shrink-0 pt-4 border-t border-zinc-800">
            <Button onClick={handleCreateMoto} disabled={!newMoto.brand || !newMoto.model || isLoading} className="w-full bg-purple-600 hover:bg-purple-500">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />} Ajouter
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Kit Dialog */}
      <Dialog open={isKitDialogOpen} onOpenChange={setIsKitDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg max-h-[85vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="text-white">Nouveau kit</DialogTitle>
            <DialogDescription>Créer un nouveau kit de suspension</DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-4 pb-4">
              <div className="space-y-2">
                <Label className="text-zinc-400">Nom *</Label>
                <Input value={newKit.name} onChange={(e) => setNewKit(prev => ({ ...prev, name: e.target.value }))} placeholder="Ex: Setup Sable" className="bg-zinc-800 border-zinc-700" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-400">Sport</Label>
                  <select value={newKit.sportType} onChange={(e) => setNewKit(prev => ({ ...prev, sportType: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white">
                    <option value="">Sélectionner</option>
                    {SPORT_TYPES.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">Terrain</Label>
                  <select value={newKit.terrainType} onChange={(e) => setNewKit(prev => ({ ...prev, terrainType: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white">
                    <option value="">Sélectionner</option>
                    {TERRAIN_TYPES.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                  </select>
                </div>
              </div>
              <Separator className="bg-zinc-800" />
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="aftermarket" checked={!newKit.isStockSuspension} onChange={(e) => {
                    if (e.target.checked) {
                      setNewKit(prev => ({ ...prev, isStockSuspension: false, forkBrand: "", forkModel: "", shockBrand: "", shockModel: "" }));
                    } else {
                      const stockSusp = selectedMoto ? getStockSuspension(selectedMoto.brand) : null;
                      setNewKit(prev => ({ ...prev, isStockSuspension: true, forkBrand: stockSusp?.forkBrand || "", forkModel: stockSusp?.forkModel || "", shockBrand: stockSusp?.shockBrand || "", shockModel: stockSusp?.shockModel || "" }));
                    }
                  }} className="w-4 h-4 rounded border-zinc-600 bg-zinc-800" />
                  <Label htmlFor="aftermarket" className="text-zinc-300">Suspensions aftermarket</Label>
                </div>

                {!newKit.isStockSuspension && (
                  <div className="grid grid-cols-2 gap-4 p-3 bg-zinc-800/50 rounded-lg">
                    <div className="space-y-2">
                      <Label className="text-zinc-400 text-xs">Fourche</Label>
                      <select value={newKit.forkBrand} onChange={(e) => setNewKit(prev => ({ ...prev, forkBrand: e.target.value, forkModel: "" }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm">
                        <option value="">Marque</option>
                        {getForkBrands().map(brand => <option key={brand} value={brand}>{brand}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-zinc-400 text-xs">Amortisseur</Label>
                      <select value={newKit.shockBrand} onChange={(e) => setNewKit(prev => ({ ...prev, shockBrand: e.target.value, shockModel: "" }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm">
                        <option value="">Marque</option>
                        {getShockBrands().map(brand => <option key={brand} value={brand}>{brand}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </div>
              <Separator className="bg-zinc-800" />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-400 text-xs">Ressort fourche</Label>
                  <Input value={newKit.forkSpringRate} onChange={(e) => setNewKit(prev => ({ ...prev, forkSpringRate: e.target.value }))} placeholder="0.44 kg/mm" className="bg-zinc-800 border-zinc-700 h-9 text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400 text-xs">Ressort amortisseur</Label>
                  <Input value={newKit.shockSpringRate} onChange={(e) => setNewKit(prev => ({ ...prev, shockSpringRate: e.target.value }))} placeholder="48 N/mm" className="bg-zinc-800 border-zinc-700 h-9 text-sm" />
                </div>
              </div>
            </div>
          </ScrollArea>
          <div className="shrink-0 pt-4 border-t border-zinc-800">
            <Button onClick={handleSaveKit} disabled={!newKit.name || isLoading} className="w-full bg-purple-600 hover:bg-purple-500">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />} Créer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rename Kit Dialog */}
      <Dialog open={!!renameKitId} onOpenChange={() => { setRenameKitId(null); setRenameKitName(""); }}>
        <DialogContent className="bg-zinc-900 border-zinc-800 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Renommer le kit</DialogTitle>
            <DialogDescription className="text-zinc-500">
              Entrez le nouveau nom pour ce kit de suspension.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={renameKitName}
              onChange={(e) => setRenameKitName(e.target.value)}
              placeholder="Nom du kit"
              className="bg-zinc-800 border-zinc-700"
              onKeyDown={(e) => { if (e.key === "Enter") handleRenameKit(); }}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setRenameKitId(null); setRenameKitName(""); }} className="border-zinc-700">
              Annuler
            </Button>
            <Button onClick={handleRenameKit} disabled={!renameKitName.trim()} className="bg-purple-600 hover:bg-purple-500">
              Renommer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
