"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
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
  Sliders, ChevronRight,
  Copy, Edit3, MoreHorizontal,
  Info, ListChecks, ArrowLeft, Sparkles, Search, ImagePlus
} from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";
import { BRANDS, getModelsForBrand, getYearsForBrand, getStockSuspension } from "@/data/moto-models";
import { getForkBrands, getShockBrands } from "@/data/suspension-brands";
import { BrandLogo } from "@/components/ui/brand-logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Modal tabs type
type ModalTab = "moto" | "kits" | "configs";

type ConfigSortOrder = "recent" | "oldest";

interface KitDraft {
  name: string;
  description: string;
  sportType: string;
  terrainType: string;
  isStockSuspension: boolean;
  forkBrand: string;
  forkModel: string;
  shockBrand: string;
  shockModel: string;
  forkSpringRate: string;
  shockSpringRate: string;
  forkOilWeight: string;
  forkOilLevel: string;
  valvingNotes: string;
  otherMods: string;
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

const createKitDraft = (kit: {
  name: string;
  description?: string;
  sportType?: string;
  terrainType?: string;
  isStockSuspension?: boolean;
  forkBrand?: string;
  forkModel?: string;
  shockBrand?: string;
  shockModel?: string;
  forkSpringRate?: string;
  shockSpringRate?: string;
  forkOilWeight?: string;
  forkOilLevel?: string;
  valvingNotes?: string;
  otherMods?: string;
}): KitDraft => ({
  name: kit.name,
  description: kit.description || "",
  sportType: kit.sportType || "",
  terrainType: kit.terrainType || "",
  isStockSuspension: kit.isStockSuspension ?? true,
  forkBrand: kit.forkBrand || "",
  forkModel: kit.forkModel || "",
  shockBrand: kit.shockBrand || "",
  shockModel: kit.shockModel || "",
  forkSpringRate: kit.forkSpringRate || "",
  shockSpringRate: kit.shockSpringRate || "",
  forkOilWeight: kit.forkOilWeight || "",
  forkOilLevel: kit.forkOilLevel || "",
  valvingNotes: kit.valvingNotes || "",
  otherMods: kit.otherMods || "",
});

// Component to fetch and display configs for a kit
function KitConfigsList({
  kitId,
  selectedConfigId,
  onSelectConfig,
  onSetActiveConfig,
  sortOrder,
}: {
  kitId: Id<"suspensionKits">;
  selectedConfigId: Id<"configs"> | null;
  onSelectConfig: (configId: Id<"configs">) => void;
  onSetActiveConfig: (configId: Id<"configs">) => void;
  sortOrder: ConfigSortOrder;
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
        <p className="text-zinc-500 text-xs">Crée une config depuis le chat IA, puis reviens ici.</p>
      </div>
    );
  }

  const sortedConfigs = [...configs].sort((a, b) =>
    sortOrder === "oldest" ? a.createdAt - b.createdAt : b.createdAt - a.createdAt
  );

  return (
    <div className="space-y-3">
      {sortedConfigs.map((config) => (
        <div
          key={config._id}
          onClick={() => onSelectConfig(config._id)}
          className={`rounded-xl border p-4 cursor-pointer transition-all ${
            selectedConfigId === config._id
              ? "border-purple-500/40 bg-purple-500/10"
              : "border-zinc-800 bg-black/50 hover:border-zinc-700"
          }`}
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                <h4 className="font-semibold text-white truncate">{config.name}</h4>
                {selectedConfigId === config._id && (
                  <Badge className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
                    Config active
                  </Badge>
                )}
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                {new Date(config.createdAt).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "2-digit",
                })}
              </p>
            </div>

            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onSetActiveConfig(config._id);
              }}
              className="h-7 px-2 text-xs text-zinc-300 hover:text-purple-300 shrink-0"
            >
              <Sliders className="h-3 w-3 mr-1" />
              Appliquer
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 text-xs mb-3">
            {config.riderWeight && (
              <Badge variant="outline" className="border-zinc-700 text-zinc-300">
                {config.riderWeight} kg
              </Badge>
            )}
            {config.terrainType && (
              <Badge variant="outline" className="border-zinc-700 text-zinc-300">
                {TERRAIN_TYPES.find((terrain) => terrain.value === config.terrainType)?.label}
              </Badge>
            )}
            {config.sportType && (
              <Badge variant="outline" className="border-zinc-700 text-zinc-300">
                {SPORT_TYPES.find((sport) => sport.value === config.sportType)?.label}
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 text-xs">
            <div className="rounded-md border border-zinc-800 bg-zinc-900/60 p-2 text-center">
              <p className="text-zinc-500">F.C</p>
              <p className="text-white font-semibold">{config.forkCompression ?? "-"}</p>
            </div>
            <div className="rounded-md border border-zinc-800 bg-zinc-900/60 p-2 text-center">
              <p className="text-zinc-500">F.D</p>
              <p className="text-white font-semibold">{config.forkRebound ?? "-"}</p>
            </div>
            <div className="rounded-md border border-zinc-800 bg-zinc-900/60 p-2 text-center">
              <p className="text-zinc-500">BV</p>
              <p className="text-white font-semibold">{config.shockCompressionLow ?? "-"}</p>
            </div>
            <div className="rounded-md border border-zinc-800 bg-zinc-900/60 p-2 text-center">
              <p className="text-zinc-500">HV</p>
              <p className="text-white font-semibold">{config.shockCompressionHigh ?? "-"}</p>
            </div>
            <div className="rounded-md border border-zinc-800 bg-zinc-900/60 p-2 text-center">
              <p className="text-zinc-500">S.D</p>
              <p className="text-white font-semibold">{config.shockRebound ?? "-"}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MotosPage() {
  const router = useRouter();
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
  const createConversation = useMutation(api.conversations.create);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const addImageToMoto = useMutation(api.files.addImageToMoto);
  const removeImageFromMoto = useMutation(api.files.removeImageFromMoto);

  // Modal state
  const [selectedMotoId, setSelectedMotoId] = useState<Id<"motos"> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ModalTab>("moto");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [configSortOrder, setConfigSortOrder] = useState<ConfigSortOrder>("recent");
  const motoImageInputRef = useRef<HTMLInputElement>(null);
  
  // Sub-selections within modal
  const [selectedKitId, setSelectedKitId] = useState<Id<"suspensionKits"> | null>(null);
  const [selectedConfigId, setSelectedConfigId] = useState<Id<"configs"> | null>(null);
  const [kitDrafts, setKitDrafts] = useState<Record<string, KitDraft>>({});
  const [savingKitId, setSavingKitId] = useState<Id<"suspensionKits"> | null>(null);

  // Dialog states
  const [isAddMotoDialogOpen, setIsAddMotoDialogOpen] = useState(false);
  const [isKitDialogOpen, setIsKitDialogOpen] = useState(false);
  const [isConfigChoiceDialogOpen, setIsConfigChoiceDialogOpen] = useState(false);
  const [renameKitId, setRenameKitId] = useState<Id<"suspensionKits"> | null>(null);
  const [renameKitName, setRenameKitName] = useState("");
  const [isLaunchingAssistedConfig, setIsLaunchingAssistedConfig] = useState(false);

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingMotoImage, setIsUploadingMotoImage] = useState(false);
  const [removingMotoImageId, setRemovingMotoImageId] = useState<Id<"_storage"> | null>(null);

  // Garage filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrandFilter, setSelectedBrandFilter] = useState("all");
  const [selectedSuspensionFilter, setSelectedSuspensionFilter] = useState<"all" | "stock" | "aftermarket">("all");

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
  const activeKit = selectedMoto?.kits?.find(k => k.isDefault) || selectedMoto?.kits?.[0];
  const stockSuspension = selectedMoto?.brand ? getStockSuspension(selectedMoto.brand) : null;
  const allMotoImageIds = useMemo(
    () =>
      motos
        ? Array.from(
            new Set(
              motos.flatMap((moto) => (moto.images || []) as Id<"_storage">[])
            )
          )
        : [],
    [motos]
  );
  const allMotoImageEntries = useQuery(
    api.files.getUrls,
    allMotoImageIds.length > 0 ? { storageIds: allMotoImageIds } : "skip"
  );
  const motoImageUrlMap = useMemo(() => {
    const map = new Map<Id<"_storage">, string>();
    (allMotoImageEntries || []).forEach((entry) => {
      if (entry.url) {
        map.set(entry.id, entry.url);
      }
    });
    return map;
  }, [allMotoImageEntries]);
  const selectedMotoImages = selectedMoto?.images || [];
  const selectedMotoImageEntries = useQuery(
    api.files.getUrls,
    selectedMotoImages.length > 0 ? { storageIds: selectedMotoImages } : "skip"
  );
  const selectedMotoImageItems =
    selectedMotoImageEntries
      ?.filter((entry): entry is { id: Id<"_storage">; url: string } => !!entry.url)
      .map((entry) => ({ id: entry.id, url: entry.url })) || [];
  const selectedMotoImageUrls = selectedMotoImageItems.map((entry) => entry.url);

  const garageBrands = useMemo(
    () =>
      motos
        ? Array.from(new Set(motos.map((moto) => moto.brand))).sort((a, b) =>
            a.localeCompare(b, "fr")
          )
        : [],
    [motos]
  );
  const filteredMotos = useMemo(() => {
    if (!motos) return [];

    const normalizedSearch = searchQuery.trim().toLowerCase();
    return motos.filter((moto) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        `${moto.brand} ${moto.model} ${moto.year}`.toLowerCase().includes(normalizedSearch);

      const matchesBrand =
        selectedBrandFilter === "all" || moto.brand === selectedBrandFilter;

      const matchesSuspension =
        selectedSuspensionFilter === "all" ||
        (selectedSuspensionFilter === "stock"
          ? moto.isStockSuspension
          : !moto.isStockSuspension);

      return matchesSearch && matchesBrand && matchesSuspension;
    });
  }, [motos, searchQuery, selectedBrandFilter, selectedSuspensionFilter]);

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
      setActiveTab("moto");
      setSelectedImageIndex(0);
      setConfigSortOrder("recent");
      const defaultKit = selectedMoto.kits?.find(k => k.isDefault) || selectedMoto.kits?.[0];
      setSelectedKitId(defaultKit?._id || null);
      setSelectedConfigId(null);
      setKitDrafts(
        Object.fromEntries(
          selectedMoto.kits.map((kit) => [kit._id, createKitDraft(kit)])
        )
      );
    }
  }, [isModalOpen, selectedMoto]);

  useEffect(() => {
    if (!isModalOpen) {
      setIsConfigChoiceDialogOpen(false);
    }
  }, [isModalOpen]);

  useEffect(() => {
    if (selectedMotoImageUrls.length === 0 && selectedImageIndex !== 0) {
      setSelectedImageIndex(0);
      return;
    }
    if (selectedImageIndex >= selectedMotoImageUrls.length && selectedMotoImageUrls.length > 0) {
      setSelectedImageIndex(selectedMotoImageUrls.length - 1);
    }
  }, [selectedMotoImageUrls.length, selectedImageIndex]);

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

  const handleLaunchAssistedConfig = async () => {
    if (!user?._id || !selectedMoto) return;

    setIsLaunchingAssistedConfig(true);
    try {
      const conversationId = await createConversation({
        userId: user._id,
        motoId: selectedMoto._id,
        title: "Nouvelle session",
      });

      const queryParams = new URLSearchParams({ motoId: selectedMoto._id });
      if (selectedKitId) {
        queryParams.set("kitId", selectedKitId);
      }

      setIsConfigChoiceDialogOpen(false);
      setIsModalOpen(false);
      router.push(`/chat/${conversationId}?${queryParams.toString()}`);
    } catch (error) {
      console.error("Erreur lors du lancement de la config assistée:", error);
    } finally {
      setIsLaunchingAssistedConfig(false);
    }
  };

  const handleLaunchManualConfig = () => {
    if (!selectedMoto) return;

    const queryParams = new URLSearchParams();
    if (selectedKitId) {
      queryParams.set("kitId", selectedKitId);
    }

    setIsConfigChoiceDialogOpen(false);
    setIsModalOpen(false);
    router.push(
      `/motos/${selectedMoto._id}/configs/new${
        queryParams.toString() ? `?${queryParams.toString()}` : ""
      }`
    );
  };

  const handleUploadMotoImage = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !selectedMoto) return;

    if (!file.type.startsWith("image/")) {
      alert("Veuillez sélectionner une image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("L'image ne doit pas dépasser 5 MB.");
      return;
    }

    setIsUploadingMotoImage(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      const payload = await uploadResponse.json();
      const storageId = payload.storageId as Id<"_storage"> | undefined;
      if (!storageId) {
        throw new Error("Réponse upload invalide");
      }

      await addImageToMoto({ motoId: selectedMoto._id, storageId });
      if (selectedMotoImageUrls.length === 0) {
        setSelectedImageIndex(0);
      }
    } catch (error) {
      console.error("Erreur lors de l'upload de la photo:", error);
      alert("Impossible d'ajouter cette photo pour le moment.");
    } finally {
      setIsUploadingMotoImage(false);
      if (motoImageInputRef.current) {
        motoImageInputRef.current.value = "";
      }
    }
  };

  const handleRemoveMotoImage = async (storageId: Id<"_storage">) => {
    if (!selectedMoto) return;

    setRemovingMotoImageId(storageId);
    try {
      await removeImageFromMoto({ motoId: selectedMoto._id, storageId });
    } catch (error) {
      console.error("Erreur lors de la suppression de la photo:", error);
    } finally {
      setRemovingMotoImageId(null);
    }
  };

  const handleKitDraftChange = (
    kitId: Id<"suspensionKits">,
    updates: Partial<KitDraft>
  ) => {
    const sourceKit = selectedMoto?.kits?.find((kit) => kit._id === kitId);
    if (!sourceKit) return;

    setKitDrafts((prev) => ({
      ...prev,
      [kitId]: {
        ...(prev[kitId] || createKitDraft(sourceKit)),
        ...updates,
      },
    }));
  };

  const handleSaveInlineKit = async (kitId: Id<"suspensionKits">) => {
    const sourceKit = selectedMoto?.kits?.find((kit) => kit._id === kitId);
    const draft = kitDrafts[kitId];
    if (!sourceKit || !draft?.name.trim()) return;

    setSavingKitId(kitId);
    try {
      await updateKit({
        kitId,
        name: draft.name.trim(),
        description: draft.description || undefined,
        sportType: draft.sportType || undefined,
        terrainType: draft.terrainType || undefined,
        isStockSuspension: draft.isStockSuspension,
        forkBrand: draft.forkBrand || undefined,
        forkModel: draft.forkModel || undefined,
        shockBrand: draft.shockBrand || undefined,
        shockModel: draft.shockModel || undefined,
        forkSpringRate: draft.forkSpringRate || undefined,
        shockSpringRate: draft.shockSpringRate || undefined,
        forkOilWeight: draft.forkOilWeight || undefined,
        forkOilLevel: draft.forkOilLevel || undefined,
        valvingNotes: draft.valvingNotes || undefined,
        otherMods: draft.otherMods || undefined,
      });
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du kit:", error);
    } finally {
      setSavingKitId(null);
    }
  };

  // Auth loading state
  if (!authLoaded) {
    return (
      <SidebarProvider>
        <div className="h-screen flex w-full bg-zinc-950 overflow-hidden">
          <AppSidebar />
          <SidebarInset className="flex-1 overflow-hidden">
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            </div>
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
          <SidebarInset className="flex-1 overflow-hidden">
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Bike className="h-16 w-16 mx-auto mb-4 text-purple-500" />
                <h2 className="text-xl font-semibold text-white mb-4">Connexion requise</h2>
                <SignInButton>
                  <Button className="bg-purple-600 hover:bg-purple-500">Se connecter</Button>
                </SignInButton>
              </div>
            </div>
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
    { id: "moto", label: "Moto", icon: <Bike className="h-4 w-4" /> },
    { id: "kits", label: "Kits suspensions", icon: <Package className="h-4 w-4" /> },
    { id: "configs", label: "Configs", icon: <ListChecks className="h-4 w-4" /> },
  ];

  return (
    <SidebarProvider>
      <div className="h-screen flex w-full bg-zinc-950 overflow-hidden">
        <AppSidebar />
        <SidebarInset className="flex-1 overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top Bar */}
            <div className="p-4 md:p-5 border-b border-zinc-800 shrink-0 bg-zinc-950/95 backdrop-blur">
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white">GARAGE</h1>
                    <p className="text-sm text-zinc-500">Gère tes motos et leurs configurations</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setIsAddMotoDialogOpen(true)}
                    className="bg-purple-600 hover:bg-purple-500"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une moto
                  </Button>
                </div>

                <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
                  <div className="relative">
                    <Search className="h-4 w-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Rechercher une moto..."
                      className="pl-9 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 h-10"
                    />
                  </div>

                  <select
                    value={selectedBrandFilter}
                    onChange={(e) => setSelectedBrandFilter(e.target.value)}
                    className="h-10 rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-sm text-white"
                  >
                    <option value="all">Toutes marques</option>
                    {garageBrands.map((brand) => (
                      <option key={brand} value={brand}>
                        {brand}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedSuspensionFilter}
                    onChange={(e) =>
                      setSelectedSuspensionFilter(
                        e.target.value as "all" | "stock" | "aftermarket"
                      )
                    }
                    className="h-10 rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-sm text-white"
                  >
                    <option value="all">Toutes suspensions</option>
                    <option value="stock">Stock</option>
                    <option value="aftermarket">Aftermarket</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Moto Cards Grid */}
            <ScrollArea className="flex-1">
              <div className="p-4 md:p-5">
                {motos === undefined ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                  </div>
                ) : motos.length === 0 ? (
                  <div className="text-center py-16">
                    <Bike className="h-16 w-16 mx-auto mb-4 text-zinc-700" />
                    <h3 className="text-lg font-semibold text-zinc-400 mb-2">Aucune moto</h3>
                    <p className="text-zinc-500 mb-4">Ajoute ta première moto pour commencer</p>
                    <Button
                      onClick={() => setIsAddMotoDialogOpen(true)}
                      className="bg-purple-600 hover:bg-purple-500"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter une moto
                    </Button>
                  </div>
                ) : filteredMotos.length === 0 ? (
                  <div className="text-center py-16">
                    <Search className="h-12 w-12 mx-auto mb-3 text-zinc-700" />
                    <h3 className="text-lg font-semibold text-zinc-400 mb-2">Aucun résultat</h3>
                    <p className="text-zinc-500 mb-4">Ajuste les filtres pour retrouver tes motos</p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedBrandFilter("all");
                        setSelectedSuspensionFilter("all");
                      }}
                      className="border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
                    >
                      Réinitialiser les filtres
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredMotos.map((moto) => {
                      const motoActiveKit = moto.kits?.find((kit) => kit.isDefault) || moto.kits?.[0];
                      const stockData = getStockSuspension(moto.brand);
                      const suspensionLabel = moto.isStockSuspension ? "Stock" : "Aftermarket";
                      const suspensionDetails = `${moto.forkBrand || stockData?.forkBrand || "?"} / ${
                        moto.shockBrand || stockData?.shockBrand || "?"
                      }`;
                      const activeKitTerrain = motoActiveKit?.terrainType
                        ? TERRAIN_TYPES.find((terrain) => terrain.value === motoActiveKit.terrainType)?.label ||
                          motoActiveKit.terrainType
                        : "";
                      const activeKitSport = motoActiveKit?.sportType
                        ? SPORT_TYPES.find((sport) => sport.value === motoActiveKit.sportType)?.label ||
                          motoActiveKit.sportType
                        : "";
                      const activeKitDetails = [activeKitSport, activeKitTerrain]
                        .filter(Boolean)
                        .join(" • ");
                      const coverImageId = (moto.images || [])[0] as Id<"_storage"> | undefined;
                      const coverImageUrl = coverImageId
                        ? motoImageUrlMap.get(coverImageId)
                        : undefined;

                      return (
                        <div
                          key={moto._id}
                          onClick={() => handleOpenMotoModal(moto._id)}
                          className="group rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 p-4 cursor-pointer transition-all hover:border-purple-500/50 hover:shadow-[0_0_0_1px_rgba(168,85,247,0.25)]"
                        >
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-start gap-3 min-w-0">
                              <BrandLogo brand={moto.brand} size="lg" />
                              <div className="min-w-0">
                                <p className="font-semibold text-white truncate">
                                  {moto.brand} {moto.model}
                                </p>
                                <p className="text-sm text-zinc-500">{moto.year}</p>
                              </div>
                            </div>

                            <div className="h-14 w-20 rounded-lg border border-zinc-700/80 bg-zinc-900 overflow-hidden shrink-0">
                              {coverImageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={coverImageUrl}
                                  alt={`${moto.brand} ${moto.model}`}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center text-zinc-600">
                                  <Bike className="h-5 w-5" />
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mb-3">
                            <Badge className="bg-zinc-800 border border-zinc-700 text-zinc-200">
                              {suspensionLabel}
                            </Badge>
                            <span className="text-xs text-zinc-400 truncate">{suspensionDetails}</span>
                            {moto.isPublic && <Eye className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
                          </div>

                          {motoActiveKit && (
                            <div className="rounded-xl border border-zinc-700/80 bg-zinc-900/90 p-3 mb-4">
                              <div className="flex items-center gap-2 mb-1">
                                <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                                <span className="text-sm text-zinc-200 truncate">
                                  Kit actif: {motoActiveKit.name}
                                </span>
                              </div>
                              {activeKitDetails && (
                                <p className="text-xs text-zinc-500 pl-5">{activeKitDetails}</p>
                              )}
                            </div>
                          )}

                          <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
                            <span>
                              {moto.kits?.length || 0} kit{(moto.kits?.length || 0) > 1 ? "s" : ""} configuré
                              {(moto.kits?.length || 0) > 1 ? "s" : ""}
                            </span>
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
        </SidebarInset>
      </div>

      {/* Moto Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 !w-[95vw] !max-w-[1200px] h-[88vh] p-0 flex flex-col overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>
              {selectedMoto?.brand} {selectedMoto?.model}
            </DialogTitle>
            <DialogDescription>Détails de la moto</DialogDescription>
          </DialogHeader>

          {selectedMoto && (
            <div className="flex h-full flex-col">
              <div className="shrink-0 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setIsModalOpen(false)}
                      className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>

                    <BrandLogo brand={selectedMoto.brand} size="md" />

                    <div className="min-w-0">
                      <h2 className="text-2xl font-bold text-white truncate">
                        {selectedMoto.brand} {selectedMoto.model} {selectedMoto.year}
                      </h2>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                        <Badge
                          variant="outline"
                          className="border-zinc-700 bg-zinc-900 text-zinc-300"
                        >
                          {selectedMoto.isStockSuspension ? "Stock / OEM" : "Aftermarket"}
                        </Badge>
                        <span>
                          {(selectedMoto.forkBrand || stockSuspension?.forkBrand || "Fourche ?")} ·{" "}
                          {(selectedMoto.shockBrand || stockSuspension?.shockBrand || "Amortisseur ?")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="h-16 w-24 rounded-lg border border-zinc-700 bg-zinc-900 overflow-hidden">
                      {selectedMotoImageUrls.length > 0 ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={selectedMotoImageUrls[selectedImageIndex] || selectedMotoImageUrls[0]}
                          alt={`${selectedMoto.brand} ${selectedMoto.model}`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-zinc-900/80">
                          <BrandLogo brand={selectedMoto.brand} size="md" />
                        </div>
                      )}
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
                        <DropdownMenuItem className="text-zinc-300 text-xs">
                          <Edit3 className="h-3 w-3 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-zinc-800" />
                        <DropdownMenuItem
                          onClick={() => handleDeleteMoto(selectedMoto._id)}
                          className="text-red-400 text-xs"
                        >
                          <Trash2 className="h-3 w-3 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="mt-3 grid gap-2 md:grid-cols-3">
                  {modalTabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`h-11 rounded-xl border text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                        activeTab === tab.id
                          ? "bg-gradient-to-r from-zinc-800 to-zinc-900 border-zinc-700 text-white"
                          : "bg-black border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                      }`}
                    >
                      {tab.icon}
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto min-h-0">
                <div className="p-4">
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 md:p-4">
                    {activeTab === "moto" && (
                      <div className="grid gap-4 lg:grid-cols-[1.1fr_2fr]">
                        <div className="space-y-3">
                          <div className="aspect-[4/3] rounded-xl border border-zinc-800 bg-zinc-900/70 overflow-hidden">
                            {selectedMotoImageUrls.length > 0 ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={selectedMotoImageUrls[selectedImageIndex] || selectedMotoImageUrls[0]}
                                alt={`${selectedMoto.brand} ${selectedMoto.model}`}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex flex-col items-center justify-center gap-2 text-zinc-500">
                                <Bike className="h-12 w-12 text-zinc-700" />
                                <span className="text-sm">Ajoute une photo de ta moto</span>
                              </div>
                            )}
                          </div>

                          <input
                            ref={motoImageInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleUploadMotoImage}
                            className="hidden"
                          />
                          <div className="flex items-center justify-between gap-2">
                            <Button
                              type="button"
                              onClick={() => motoImageInputRef.current?.click()}
                              disabled={isUploadingMotoImage}
                              className="bg-purple-600 hover:bg-purple-500 h-8 px-3 text-xs"
                            >
                              {isUploadingMotoImage ? (
                                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                              ) : (
                                <ImagePlus className="h-3.5 w-3.5 mr-1.5" />
                              )}
                              Ajouter des photos
                            </Button>
                            <span className="text-xs text-zinc-500">
                              {selectedMotoImageItems.length} photo
                              {selectedMotoImageItems.length > 1 ? "s" : ""}
                            </span>
                          </div>

                          {selectedMotoImageItems.length > 0 && (
                            <div className="grid grid-cols-4 gap-2">
                              {selectedMotoImageItems.map((image, index) => (
                                <div
                                  key={image.id}
                                  className={`relative rounded-lg border overflow-hidden ${
                                    selectedImageIndex === index
                                      ? "border-purple-500"
                                      : "border-zinc-800 hover:border-zinc-700"
                                  }`}
                                >
                                  <button
                                    type="button"
                                    onClick={() => setSelectedImageIndex(index)}
                                    className="block aspect-video w-full"
                                  >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={image.url}
                                      alt={`Photo ${index + 1}`}
                                      className="h-full w-full object-cover"
                                    />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      handleRemoveMotoImage(image.id);
                                    }}
                                    disabled={removingMotoImageId === image.id}
                                    className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 border border-zinc-700 flex items-center justify-center text-zinc-300 hover:text-red-400 disabled:opacity-50"
                                  >
                                    {removingMotoImageId === image.id ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-3 w-3" />
                                    )}
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="space-y-4">
                          <div className="rounded-xl border border-zinc-800 bg-black/60 p-4">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-3">
                              <Info className="h-4 w-4 text-zinc-300" />
                              Infos
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-zinc-500">Marque</p>
                                <p className="text-white font-medium">{selectedMoto.brand}</p>
                              </div>
                              <div>
                                <p className="text-zinc-500">Modèle</p>
                                <p className="text-white font-medium">{selectedMoto.model}</p>
                              </div>
                              <div>
                                <p className="text-zinc-500">Année</p>
                                <p className="text-white font-medium">{selectedMoto.year}</p>
                              </div>
                              <div>
                                <p className="text-zinc-500">Nombre de kits</p>
                                <p className="text-white font-medium">{sortedKits.length}</p>
                              </div>
                            </div>

                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                                <p className="text-xs uppercase text-zinc-500 mb-1">Fourche</p>
                                <p className="text-white font-medium">
                                  {selectedMoto.forkBrand || stockSuspension?.forkBrand || "Non spécifié"}
                                </p>
                                <p className="text-zinc-500 text-xs">
                                  {selectedMoto.forkModel || stockSuspension?.forkModel || "Modèle non renseigné"}
                                </p>
                              </div>
                              <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                                <p className="text-xs uppercase text-zinc-500 mb-1">Amortisseur</p>
                                <p className="text-white font-medium">
                                  {selectedMoto.shockBrand || stockSuspension?.shockBrand || "Non spécifié"}
                                </p>
                                <p className="text-zinc-500 text-xs">
                                  {selectedMoto.shockModel || stockSuspension?.shockModel || "Modèle non renseigné"}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="rounded-xl border border-zinc-800 bg-black/60 p-4">
                            <h3 className="text-lg font-semibold text-white mb-3">Kit actif</h3>
                            {activeKit ? (
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                                    <span className="font-medium text-white">{activeKit.name}</span>
                                  </div>
                                  <Badge className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
                                    Kit actif
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-5 gap-2 text-center text-xs">
                                  <div className="rounded-md bg-zinc-900/70 p-1.5">
                                    <p className="text-zinc-500">F.C</p>
                                    <p className="text-white font-semibold">
                                      {activeKit.forkCompression ?? activeKit.baseForkCompression ?? "-"}
                                    </p>
                                  </div>
                                  <div className="rounded-md bg-zinc-900/70 p-1.5">
                                    <p className="text-zinc-500">F.D</p>
                                    <p className="text-white font-semibold">
                                      {activeKit.forkRebound ?? activeKit.baseForkRebound ?? "-"}
                                    </p>
                                  </div>
                                  <div className="rounded-md bg-zinc-900/70 p-1.5">
                                    <p className="text-zinc-500">BV</p>
                                    <p className="text-white font-semibold">
                                      {activeKit.shockCompressionLow ?? activeKit.baseShockCompressionLow ?? "-"}
                                    </p>
                                  </div>
                                  <div className="rounded-md bg-zinc-900/70 p-1.5">
                                    <p className="text-zinc-500">HV</p>
                                    <p className="text-white font-semibold">
                                      {activeKit.shockCompressionHigh ?? activeKit.baseShockCompressionHigh ?? "-"}
                                    </p>
                                  </div>
                                  <div className="rounded-md bg-zinc-900/70 p-1.5">
                                    <p className="text-zinc-500">S.D</p>
                                    <p className="text-white font-semibold">
                                      {activeKit.shockRebound ?? activeKit.baseShockRebound ?? "-"}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => setActiveTab("kits")}
                                    className="flex-1 bg-purple-600 hover:bg-purple-500 h-9 text-sm"
                                  >
                                    Voir les kits
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => setActiveTab("configs")}
                                    className="flex-1 border-zinc-700 hover:bg-zinc-800 h-9 text-sm"
                                  >
                                    Voir les configs
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-zinc-500">Aucun kit configuré.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === "kits" && (
                      <div className="space-y-4">
                        <Button
                          onClick={handleOpenKitDialog}
                          className="w-full bg-purple-600 hover:bg-purple-500 font-semibold h-9 text-sm"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Nouveau kit
                        </Button>

                        {sortedKits.length === 0 ? (
                          <div className="text-center py-16 border border-dashed border-zinc-800 rounded-xl">
                            <Package className="h-12 w-12 mx-auto mb-3 text-zinc-700" />
                            <p className="text-zinc-400 mb-1">Aucun kit configuré</p>
                            <p className="text-zinc-500 text-sm">
                              Crée ton premier kit de suspension.
                            </p>
                          </div>
                        ) : (
                          <div className="grid gap-3 xl:grid-cols-2">
                            {sortedKits.map((kit) => {
                              const draft = kitDrafts[kit._id] || createKitDraft(kit);
                              const defaultForkBrand =
                                draft.forkBrand || stockSuspension?.forkBrand || "";
                              const defaultForkModel =
                                draft.forkModel || stockSuspension?.forkModel || "";
                              const defaultShockBrand =
                                draft.shockBrand || stockSuspension?.shockBrand || "";
                              const defaultShockModel =
                                draft.shockModel || stockSuspension?.shockModel || "";

                              return (
                                <div
                                  key={kit._id}
                                  className={`rounded-xl border p-3 ${
                                    kit.isDefault
                                      ? "border-purple-500/40 bg-purple-500/8"
                                      : "border-zinc-800 bg-black/50"
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2">
                                        <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                                        <Input
                                          value={draft.name}
                                          onChange={(e) =>
                                            handleKitDraftChange(kit._id, { name: e.target.value })
                                          }
                                          className="h-8 bg-zinc-900 border-zinc-700 text-white text-sm font-semibold"
                                        />
                                      </div>
                                      <div className="mt-2 flex items-center gap-2">
                                        {kit.isDefault ? (
                                          <Badge className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
                                            Kit actif
                                          </Badge>
                                        ) : (
                                          <Badge variant="outline" className="border-zinc-700 text-zinc-500">
                                            Inactif
                                          </Badge>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1">
                                      {!kit.isDefault && (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => handleSetDefaultKit(kit._id)}
                                          className="text-zinc-400 hover:text-emerald-400"
                                        >
                                          <Check className="h-4 w-4" />
                                        </Button>
                                      )}
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 w-8 p-0 text-zinc-400"
                                          >
                                            <MoreHorizontal className="h-4 w-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
                                          <DropdownMenuItem
                                            onClick={() => openRenameDialog(kit._id, kit.name)}
                                            className="text-zinc-300 text-xs"
                                          >
                                            <Edit3 className="h-3 w-3 mr-2" />
                                            Renommer
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            onClick={() => handleDuplicateKit(kit._id)}
                                            className="text-zinc-300 text-xs"
                                          >
                                            <Copy className="h-3 w-3 mr-2" />
                                            Dupliquer
                                          </DropdownMenuItem>
                                          <DropdownMenuSeparator className="bg-zinc-800" />
                                          <DropdownMenuItem
                                            onClick={() => handleDeleteKit(kit._id)}
                                            className="text-red-400 text-xs"
                                          >
                                            <Trash2 className="h-3 w-3 mr-2" />
                                            Supprimer
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  </div>

                                  <div className="space-y-3">
                                    <Input
                                      value={draft.description}
                                      onChange={(e) =>
                                        handleKitDraftChange(kit._id, { description: e.target.value })
                                      }
                                      placeholder="Description"
                                      className="h-8 bg-zinc-900 border-zinc-700 text-sm"
                                    />

                                    <div className="grid grid-cols-2 gap-2">
                                      <select
                                        value={draft.sportType}
                                        onChange={(e) =>
                                          handleKitDraftChange(kit._id, { sportType: e.target.value })
                                        }
                                        className="h-8 rounded-md border border-zinc-700 bg-zinc-900 px-2 text-sm text-white"
                                      >
                                        <option value="">Type de sport</option>
                                        {SPORT_TYPES.map((sport) => (
                                          <option key={sport.value} value={sport.value}>
                                            {sport.label}
                                          </option>
                                        ))}
                                      </select>
                                      <select
                                        value={draft.terrainType}
                                        onChange={(e) =>
                                          handleKitDraftChange(kit._id, { terrainType: e.target.value })
                                        }
                                        className="h-8 rounded-md border border-zinc-700 bg-zinc-900 px-2 text-sm text-white"
                                      >
                                        <option value="">Type de terrain</option>
                                        {TERRAIN_TYPES.map((terrain) => (
                                          <option key={terrain.value} value={terrain.value}>
                                            {terrain.label}
                                          </option>
                                        ))}
                                      </select>
                                    </div>

                                    <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 space-y-2">
                                      <div className="grid grid-cols-2 gap-2">
                                        <Input
                                          value={defaultForkBrand}
                                          onChange={(e) =>
                                            handleKitDraftChange(kit._id, { forkBrand: e.target.value })
                                          }
                                          placeholder="Fourche — Marque"
                                          className="h-8 bg-zinc-900 border-zinc-700 text-sm"
                                        />
                                        <Input
                                          value={defaultShockBrand}
                                          onChange={(e) =>
                                            handleKitDraftChange(kit._id, { shockBrand: e.target.value })
                                          }
                                          placeholder="Amortisseur — Marque"
                                          className="h-8 bg-zinc-900 border-zinc-700 text-sm"
                                        />
                                      </div>
                                      <div className="grid grid-cols-2 gap-2">
                                        <Input
                                          value={defaultForkModel}
                                          onChange={(e) =>
                                            handleKitDraftChange(kit._id, { forkModel: e.target.value })
                                          }
                                          placeholder="Fourche — Modèle"
                                          className="h-8 bg-zinc-900 border-zinc-700 text-sm"
                                        />
                                        <Input
                                          value={defaultShockModel}
                                          onChange={(e) =>
                                            handleKitDraftChange(kit._id, { shockModel: e.target.value })
                                          }
                                          placeholder="Amortisseur — Modèle"
                                          className="h-8 bg-zinc-900 border-zinc-700 text-sm"
                                        />
                                      </div>
                                    </div>

                                    <label className="flex items-center gap-2 text-xs text-zinc-400">
                                      <input
                                        type="checkbox"
                                        checked={!draft.isStockSuspension}
                                        onChange={(e) => {
                                          const aftermarket = e.target.checked;
                                          handleKitDraftChange(kit._id, {
                                            isStockSuspension: !aftermarket,
                                            ...(aftermarket
                                              ? {}
                                              : {
                                                  forkBrand: stockSuspension?.forkBrand || "",
                                                  forkModel: stockSuspension?.forkModel || "",
                                                  shockBrand: stockSuspension?.shockBrand || "",
                                                  shockModel: stockSuspension?.shockModel || "",
                                                }),
                                          });
                                        }}
                                        className="h-3.5 w-3.5 rounded border-zinc-600 bg-zinc-900"
                                      />
                                      Suspension modifiée (aftermarket)
                                    </label>

                                    <div className="grid grid-cols-2 gap-2">
                                      <Input
                                        value={draft.forkSpringRate}
                                        onChange={(e) =>
                                          handleKitDraftChange(kit._id, { forkSpringRate: e.target.value })
                                        }
                                        placeholder="Ressort fourche"
                                        className="h-8 bg-zinc-900 border-zinc-700 text-sm"
                                      />
                                      <Input
                                        value={draft.shockSpringRate}
                                        onChange={(e) =>
                                          handleKitDraftChange(kit._id, { shockSpringRate: e.target.value })
                                        }
                                        placeholder="Ressort amortisseur"
                                        className="h-8 bg-zinc-900 border-zinc-700 text-sm"
                                      />
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                      <Input
                                        value={draft.forkOilWeight}
                                        onChange={(e) =>
                                          handleKitDraftChange(kit._id, { forkOilWeight: e.target.value })
                                        }
                                        placeholder="Huile fourche"
                                        className="h-8 bg-zinc-900 border-zinc-700 text-sm"
                                      />
                                      <Input
                                        value={draft.forkOilLevel}
                                        onChange={(e) =>
                                          handleKitDraftChange(kit._id, { forkOilLevel: e.target.value })
                                        }
                                        placeholder="Niveau huile"
                                        className="h-8 bg-zinc-900 border-zinc-700 text-sm"
                                      />
                                    </div>

                                    <Input
                                      value={draft.valvingNotes}
                                      onChange={(e) =>
                                        handleKitDraftChange(kit._id, { valvingNotes: e.target.value })
                                      }
                                      placeholder="Notes valving"
                                      className="h-8 bg-zinc-900 border-zinc-700 text-sm"
                                    />
                                    <Input
                                      value={draft.otherMods}
                                      onChange={(e) =>
                                        handleKitDraftChange(kit._id, { otherMods: e.target.value })
                                      }
                                      placeholder="Autres modifications"
                                      className="h-8 bg-zinc-900 border-zinc-700 text-sm"
                                    />

                                    <Button
                                      onClick={() => handleSaveInlineKit(kit._id)}
                                      disabled={savingKitId === kit._id}
                                      className="w-full bg-purple-600 hover:bg-purple-500 h-8"
                                    >
                                      {savingKitId === kit._id ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                                      ) : (
                                        <Check className="h-3.5 w-3.5 mr-2" />
                                      )}
                                      Sauvegardé
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === "configs" && (
                      <div className="space-y-4">
                        <Button
                          onClick={() => setIsConfigChoiceDialogOpen(true)}
                          className="w-full bg-purple-600 hover:bg-purple-500 font-semibold h-9 text-sm"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Nouvelle config
                        </Button>

                        <div className="grid gap-3 md:grid-cols-2">
                          <select
                            value={selectedKitId || ""}
                            onChange={(e) =>
                              setSelectedKitId(
                                e.target.value ? (e.target.value as Id<"suspensionKits">) : null
                              )
                            }
                            className="h-9 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-xs sm:text-sm text-white"
                          >
                            <option value="">Kits suspensions</option>
                            {sortedKits.map((kit) => (
                              <option key={kit._id} value={kit._id}>
                                {kit.name}
                              </option>
                            ))}
                          </select>

                          <select
                            value={configSortOrder}
                            onChange={(e) =>
                              setConfigSortOrder(e.target.value as ConfigSortOrder)
                            }
                            className="h-9 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-xs sm:text-sm text-white"
                          >
                            <option value="recent">Date (plus récent)</option>
                            <option value="oldest">Date (plus ancien)</option>
                          </select>
                        </div>

                        {selectedKitId ? (
                          <KitConfigsList
                            kitId={selectedKitId}
                            selectedConfigId={selectedConfigId}
                            onSelectConfig={setSelectedConfigId}
                            onSetActiveConfig={handleSetActiveConfig}
                            sortOrder={configSortOrder}
                          />
                        ) : (
                          <div className="text-center py-16 border border-dashed border-zinc-800 rounded-xl">
                            <ListChecks className="h-12 w-12 mx-auto mb-3 text-zinc-700" />
                            <p className="text-zinc-400">
                              Sélectionne un kit pour afficher ses configs.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isConfigChoiceDialogOpen} onOpenChange={setIsConfigChoiceDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Nouvelle config</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Choisis la méthode de création de ta configuration de suspension.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <Button
              onClick={handleLaunchAssistedConfig}
              disabled={isLaunchingAssistedConfig}
              className="w-full justify-start h-11 bg-purple-600 hover:bg-purple-500"
            >
              {isLaunchingAssistedConfig ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Config assistée (IA)
            </Button>

            <Button
              variant="outline"
              onClick={handleLaunchManualConfig}
              className="w-full justify-start h-11 border-zinc-700 bg-zinc-950 text-zinc-100 hover:bg-zinc-800"
            >
              <Wrench className="h-4 w-4 mr-2" />
              Config manuelle
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Moto Dialog */}
      <Dialog open={isAddMotoDialogOpen} onOpenChange={setIsAddMotoDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
          <DialogHeader className="shrink-0">
            <DialogTitle className="text-white">Ajouter une moto</DialogTitle>
            <DialogDescription>Ajoutez une nouvelle moto à votre garage</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto min-h-0 -mx-6 px-6">
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
          </div>
          <div className="shrink-0 pt-4 border-t border-zinc-800">
            <Button onClick={handleCreateMoto} disabled={!newMoto.brand || !newMoto.model || isLoading} className="w-full bg-purple-600 hover:bg-purple-500">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />} Ajouter
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Kit Dialog */}
      <Dialog open={isKitDialogOpen} onOpenChange={setIsKitDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
          <DialogHeader className="shrink-0">
            <DialogTitle className="text-white">Nouveau kit</DialogTitle>
            <DialogDescription>Créer un nouveau kit de suspension</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto min-h-0 -mx-6 px-6">
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
          </div>
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
