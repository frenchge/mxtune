"use client";

import { useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { ProfileSidebar } from "@/components/sidebar/profile-sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AutocompleteInput } from "@/components/ui/autocomplete-input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SignInButton, useAuth } from "@clerk/nextjs";
import {
  ArrowLeft, Bike, Plus, Trash2, Loader2, Eye, EyeOff,
  Wrench, Settings2, MapPin, Star, Edit3, Save, X,
  Calendar, Package, ImageIcon, Upload, Sliders, Check
} from "lucide-react";
import { Id } from "../../../../convex/_generated/dataModel";
import { BRANDS, getModelsForBrand, getYearsForBrand, getStockSuspension } from "@/data/moto-models";
import { getForkBrands, getShockBrands, getForkModelsForBrand, getShockModelsForBrand } from "@/data/suspension-brands";
import { BrandLogo } from "@/components/ui/brand-logo";
import { ClickersPanel } from "@/components/clickers";
import { KitConfigSection } from "@/components/kit-config-section";

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

export default function MotoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const motoId = params.motoId as Id<"motos">;
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { user } = useCurrentUser();

  const moto = useQuery(api.motos.getById, { motoId });
  const createKit = useMutation(api.suspensionKits.create);
  const setDefaultKit = useMutation(api.suspensionKits.setDefault);
  const updateKit = useMutation(api.suspensionKits.update);
  const updateMoto = useMutation(api.motos.update);
  const createConfig = useMutation(api.configs.create);

  const [selectedKitId, setSelectedKitId] = useState<Id<"suspensionKits"> | null>(null);
  const [view, setView] = useState<"kits" | "config">("kits");
  const [isEditMoto, setIsEditMoto] = useState(false);
  const [isNewKitOpen, setIsNewKitOpen] = useState(false);
  const [isSaveConfigOpen, setIsSaveConfigOpen] = useState(false);
  const [newConfigName, setNewConfigName] = useState("");
  const [newConfigDescription, setNewConfigDescription] = useState("");
  const [selectedConfigId, setSelectedConfigId] = useState<Id<"configs"> | null>(null);

  const [editMoto, setEditMoto] = useState({
    brand: "",
    model: "",
    year: 2024,
    isStockSuspension: true,
    forkBrand: "",
    forkModel: "",
    shockBrand: "",
    shockModel: "",
    suspensionNotes: "",
    isPublic: false,
  });

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

  const kits = moto?.kits ?? [];
  const activeKit = kits.find(k => k.isDefault) || kits[0];
  const resolvedSelectedKitId = selectedKitId ?? activeKit?._id ?? null;
  const selectedKit = kits.find(k => k._id === resolvedSelectedKitId) || activeKit;
  const stockSuspension = moto?.brand ? getStockSuspension(moto.brand) : null;

  const kitConfigs = useQuery(
    api.configs.getByKit,
    selectedKit?._id && user?._id ? { kitId: selectedKit._id, userId: user._id } : "skip"
  );
  const selectedConfig = kitConfigs?.find((config) => config._id === selectedConfigId);
  const currentConfig = selectedConfig ?? kitConfigs?.[0];

  const startMotoEdition = () => {
    if (!moto) return;
    setEditMoto({
      brand: moto.brand,
      model: moto.model,
      year: moto.year,
      isStockSuspension: moto.isStockSuspension ?? true,
      forkBrand: moto.forkBrand || "",
      forkModel: moto.forkModel || "",
      shockBrand: moto.shockBrand || "",
      shockModel: moto.shockModel || "",
      suspensionNotes: moto.suspensionNotes || "",
      isPublic: moto.isPublic ?? false,
    });
    setIsEditMoto(true);
  };

  const editModels = useMemo(() => (editMoto.brand ? getModelsForBrand(editMoto.brand) : []), [editMoto.brand]);
  const editYears = useMemo(() => (editMoto.brand ? getYearsForBrand(editMoto.brand) : []), [editMoto.brand]);

  const handleUpdateMoto = async () => {
    if (!moto) return;
    await updateMoto({
      motoId: moto._id,
      brand: editMoto.brand,
      model: editMoto.model,
      year: editMoto.year,
      isStockSuspension: editMoto.isStockSuspension,
      forkBrand: editMoto.isStockSuspension ? (getStockSuspension(editMoto.brand)?.forkBrand || undefined) : (editMoto.forkBrand || undefined),
      forkModel: editMoto.isStockSuspension ? (getStockSuspension(editMoto.brand)?.forkModel || undefined) : (editMoto.forkModel || undefined),
      shockBrand: editMoto.isStockSuspension ? (getStockSuspension(editMoto.brand)?.shockBrand || undefined) : (editMoto.shockBrand || undefined),
      shockModel: editMoto.isStockSuspension ? (getStockSuspension(editMoto.brand)?.shockModel || undefined) : (editMoto.shockModel || undefined),
      suspensionNotes: editMoto.suspensionNotes || undefined,
      isPublic: editMoto.isPublic,
    });
    setIsEditMoto(false);
  };

  const handleCreateKit = async () => {
    if (!user?._id || !moto || !newKit.name) return;
    await createKit({
      userId: user._id,
      motoId: moto._id,
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
    setIsNewKitOpen(false);
  };

  const handleSetActiveKit = async (kitId: Id<"suspensionKits">) => {
    await setDefaultKit({ kitId });
    setSelectedKitId(kitId);
    setSelectedConfigId(null);
  };

  const handleApplySavedConfig = async (configId: Id<"configs">) => {
    if (!selectedKit || !kitConfigs) return;
    const config = kitConfigs.find((entry) => entry._id === configId);
    if (!config) return;

    await updateKit({
      kitId: selectedKit._id,
      forkCompression: config.forkCompression ?? selectedKit.forkCompression ?? selectedKit.baseForkCompression ?? 10,
      forkRebound: config.forkRebound ?? selectedKit.forkRebound ?? selectedKit.baseForkRebound ?? 10,
      shockCompressionLow: config.shockCompressionLow ?? selectedKit.shockCompressionLow ?? selectedKit.baseShockCompressionLow ?? 10,
      shockCompressionHigh: config.shockCompressionHigh ?? selectedKit.shockCompressionHigh ?? selectedKit.baseShockCompressionHigh ?? 10,
      shockRebound: config.shockRebound ?? selectedKit.shockRebound ?? selectedKit.baseShockRebound ?? 10,
    });

    setSelectedConfigId(configId);
    setView("config");
  };

  const handleSaveConfig = async () => {
    if (!moto || !selectedKit || !newConfigName.trim()) return;
    await createConfig({
      motoId: moto._id,
      suspensionKitId: selectedKit._id,
      name: newConfigName.trim(),
      description: newConfigDescription || undefined,
      forkCompression: selectedKit.forkCompression ?? selectedKit.baseForkCompression ?? undefined,
      forkRebound: selectedKit.forkRebound ?? selectedKit.baseForkRebound ?? undefined,
      shockCompressionLow: selectedKit.shockCompressionLow ?? selectedKit.baseShockCompressionLow ?? undefined,
      shockCompressionHigh: selectedKit.shockCompressionHigh ?? selectedKit.baseShockCompressionHigh ?? undefined,
      shockRebound: selectedKit.shockRebound ?? selectedKit.baseShockRebound ?? undefined,
      visibility: "private",
      isPublic: false,
    });
    setIsSaveConfigOpen(false);
    setNewConfigName("");
    setNewConfigDescription("");
  };

  if (!authLoaded) {
    return (
      <SidebarProvider>
        <div className="h-screen flex w-full bg-zinc-950 overflow-hidden">
          <AppSidebar />
          <SidebarInset className="flex-1 !flex-row overflow-hidden min-h-0">
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            </div>
            <ProfileSidebar />
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  if (!isSignedIn) {
    return (
      <SidebarProvider>
        <div className="h-screen flex w-full bg-zinc-950 overflow-hidden">
          <AppSidebar />
          <SidebarInset className="flex-1 !flex-row overflow-hidden min-h-0">
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

  if (!moto) {
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

  return (
    <SidebarProvider>
      <div className="h-screen flex w-full bg-zinc-950 overflow-hidden">
        <AppSidebar />
        <SidebarInset className="flex-1 !flex-row overflow-hidden min-h-0">
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            <div className="p-6 border-b border-zinc-800 shrink-0 bg-zinc-950">
              <div className="flex items-start gap-6">
                <div className="flex items-start gap-4">
                  <Button size="sm" variant="ghost" onClick={() => router.push("/motos")} className="mt-1 text-zinc-400 hover:text-white">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <BrandLogo brand={moto.brand} size="xl" />
                  <div>
                    <h1 className="text-2xl font-bold text-white">
                      {moto.brand} {moto.model} {moto.year}
                    </h1>
                    <div className="flex items-center gap-2 mt-2 text-sm text-zinc-400">
                      {moto.isStockSuspension === false ? (
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[11px]">
                          <Wrench className="h-3 w-3 mr-1" /> Aftermarket
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-zinc-800 text-zinc-400 border-zinc-700 text-[11px]">
                          <Package className="h-3 w-3 mr-1" /> Stock / OEM
                        </Badge>
                      )}
                      <span>{moto.forkBrand || stockSuspension?.forkBrand || "—"} · {moto.shockBrand || stockSuspension?.shockBrand || "—"}</span>
                    </div>
                    {moto.suspensionNotes && (
                      <p className="text-xs text-zinc-500 mt-1">{moto.suspensionNotes}</p>
                    )}
                  </div>
                </div>
              </div>

            </div>

            <ScrollArea className="flex-1 min-h-0">
              <div className="p-6 space-y-6">
                <div className="border border-zinc-800 rounded-xl bg-zinc-900/40 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold text-white">Details de la moto</h2>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => (isEditMoto ? setIsEditMoto(false) : startMotoEdition())}
                      className="text-zinc-400 hover:text-white"
                    >
                      {isEditMoto ? "Annuler" : "Modifier"}
                    </Button>
                  </div>

                  {isEditMoto ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-zinc-400 text-xs">Marque</Label>
                          <select
                            value={editMoto.brand}
                            onChange={(e) => {
                              const brand = e.target.value;
                              const years = getYearsForBrand(brand);
                              setEditMoto(prev => ({ ...prev, brand, model: "", year: years[0] || 2024 }));
                            }}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm"
                          >
                            <option value="">Sélectionner</option>
                            {BRANDS.map(brand => <option key={brand} value={brand}>{brand}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-zinc-400 text-xs">Modèle</Label>
                          <select
                            value={editMoto.model}
                            onChange={(e) => setEditMoto(prev => ({ ...prev, model: e.target.value }))}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm"
                          >
                            <option value="">Sélectionner</option>
                            {editModels.map(model => <option key={model} value={model}>{model}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-zinc-400 text-xs">Année</Label>
                          <select
                            value={editMoto.year}
                            onChange={(e) => setEditMoto(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm"
                          >
                            {editYears.map(year => <option key={year} value={year}>{year}</option>)}
                          </select>
                        </div>
                      </div>

                      <Separator className="bg-zinc-800" />

                      <div className="space-y-3">
                        <Label className="text-zinc-300 text-xs font-medium">Base suspension</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setEditMoto(prev => ({ ...prev, isStockSuspension: true }))}
                            className={`p-2.5 rounded-lg border transition-all text-sm ${editMoto.isStockSuspension ? "border-purple-500 bg-purple-500/10 text-white" : "border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600"}`}
                          >
                            <Package className={`h-4 w-4 mx-auto mb-1 ${editMoto.isStockSuspension ? "text-purple-400" : "text-zinc-500"}`} />
                            Stock
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditMoto(prev => ({ ...prev, isStockSuspension: false }))}
                            className={`p-2.5 rounded-lg border transition-all text-sm ${!editMoto.isStockSuspension ? "border-purple-500 bg-purple-500/10 text-white" : "border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600"}`}
                          >
                            <Wrench className={`h-4 w-4 mx-auto mb-1 ${!editMoto.isStockSuspension ? "text-purple-400" : "text-zinc-500"}`} />
                            Modifié
                          </button>
                        </div>

                        {editMoto.isStockSuspension && (() => {
                          const stockSusp = getStockSuspension(editMoto.brand);
                          return stockSusp ? (
                            <div className="p-3 bg-zinc-800/50 rounded-lg grid grid-cols-2 gap-2 text-sm">
                              <div><span className="text-zinc-500">Fourche:</span> <span className="text-zinc-300">{stockSusp.forkBrand} {stockSusp.forkModel}</span></div>
                              <div><span className="text-zinc-500">Amortisseur:</span> <span className="text-zinc-300">{stockSusp.shockBrand} {stockSusp.shockModel}</span></div>
                            </div>
                          ) : null;
                        })()}

                        {!editMoto.isStockSuspension && (
                          <div className="grid grid-cols-2 gap-3 p-3 bg-zinc-800/50 rounded-lg">
                            <div className="space-y-1.5">
                              <Label className="text-zinc-400 text-[10px]">Fourche — Marque</Label>
                              <Input value={editMoto.forkBrand} onChange={(e) => setEditMoto(prev => ({ ...prev, forkBrand: e.target.value }))} placeholder="WP, KYB..." className="bg-zinc-800 border-zinc-700 h-8 text-sm" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-zinc-400 text-[10px]">Fourche — Modèle</Label>
                              <Input value={editMoto.forkModel} onChange={(e) => setEditMoto(prev => ({ ...prev, forkModel: e.target.value }))} placeholder="XACT, SSS..." className="bg-zinc-800 border-zinc-700 h-8 text-sm" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-zinc-400 text-[10px]">Amortisseur — Marque</Label>
                              <Input value={editMoto.shockBrand} onChange={(e) => setEditMoto(prev => ({ ...prev, shockBrand: e.target.value }))} placeholder="WP, Öhlins..." className="bg-zinc-800 border-zinc-700 h-8 text-sm" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-zinc-400 text-[10px]">Amortisseur — Modèle</Label>
                              <Input value={editMoto.shockModel} onChange={(e) => setEditMoto(prev => ({ ...prev, shockModel: e.target.value }))} placeholder="XACT, TTx..." className="bg-zinc-800 border-zinc-700 h-8 text-sm" />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-zinc-400 text-xs">Notes</Label>
                        <Input
                          value={editMoto.suspensionNotes}
                          onChange={(e) => setEditMoto(prev => ({ ...prev, suspensionNotes: e.target.value }))}
                          placeholder="Notes sur les modifications..."
                          className="bg-zinc-800 border-zinc-700 h-8 text-sm"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="editPublic"
                          checked={editMoto.isPublic}
                          onChange={(e) => setEditMoto(prev => ({ ...prev, isPublic: e.target.checked }))}
                          className="w-4 h-4 rounded border-zinc-600 bg-zinc-800"
                        />
                        <Label htmlFor="editPublic" className="text-zinc-400 text-xs flex items-center gap-1.5">
                          <Eye className="h-3 w-3" /> Profil public
                        </Label>
                      </div>

                      <Button onClick={handleUpdateMoto} className="bg-purple-600 hover:bg-purple-500">
                        <Check className="h-4 w-4 mr-1" /> Enregistrer
                      </Button>
                    </div>
                  ) : (
                    <div className="text-sm text-zinc-400">
                      <p><span className="text-zinc-500">Base:</span> {moto.isStockSuspension === false ? "Modifiée" : "Stock"}</p>
                      <p><span className="text-zinc-500">Fourche:</span> {moto.forkBrand || stockSuspension?.forkBrand || "—"} {moto.forkModel || stockSuspension?.forkModel || ""}</p>
                      <p><span className="text-zinc-500">Amortisseur:</span> {moto.shockBrand || stockSuspension?.shockBrand || "—"} {moto.shockModel || stockSuspension?.shockModel || ""}</p>
                      {moto.suspensionNotes && (<p><span className="text-zinc-500">Notes:</span> {moto.suspensionNotes}</p>)}
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 via-zinc-900/80 to-zinc-900/80 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.14em] text-purple-300">Setup actif</p>
                      <p className="text-sm text-white mt-1">
                        {selectedKit?.name || "Aucun kit"} • {currentConfig?.name || "Config active"}
                      </p>
                    </div>
                    <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px]">ACTIF</Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                    <div className="space-y-2">
                      <p className="text-[11px] text-zinc-400">Kit</p>
                      <Select
                        value={selectedKit?._id ?? ""}
                        onValueChange={(value) => {
                          setSelectedKitId(value as Id<"suspensionKits">);
                          setSelectedConfigId(null);
                        }}
                      >
                        <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
                          <SelectValue placeholder="Sélectionner un kit" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800">
                          {kits.map(kit => (
                            <SelectItem key={kit._id} value={kit._id} className="text-white">
                              {kit.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[11px] text-zinc-400">Config</p>
                      <Select
                        value={selectedConfigId ?? "__active__"}
                        onValueChange={(value) => {
                          if (value === "__active__") {
                            setSelectedConfigId(null);
                            setView("config");
                            return;
                          }
                          void handleApplySavedConfig(value as Id<"configs">);
                        }}
                      >
                        <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
                          <SelectValue placeholder="Config active" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800">
                          <SelectItem value="__active__" className="text-white">
                            {currentConfig?.name || "Config active"}
                          </SelectItem>
                          {kitConfigs?.map((config) => (
                            <SelectItem key={config._id} value={config._id} className="text-white">
                              {config.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-[11px] text-zinc-500">{kitConfigs?.length || 0} configs</p>
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-zinc-400">
                    Base suspension: {moto.isStockSuspension === false ? "Modifiée" : "Stock"} • {moto.forkBrand || stockSuspension?.forkBrand || "—"} / {moto.shockBrand || stockSuspension?.shockBrand || "—"}
                  </p>
                </div>

                <Tabs value={view} onValueChange={(value) => setView(value as "kits" | "config")}>
                  <div className="flex items-center justify-between mb-4">
                    <TabsList className="bg-zinc-900 border border-zinc-800">
                      <TabsTrigger value="kits" className="data-[state=active]:bg-purple-600">Kits</TabsTrigger>
                      <TabsTrigger value="config" className="data-[state=active]:bg-purple-600">Configs</TabsTrigger>
                    </TabsList>
                    {view === "kits" ? (
                      <Button onClick={() => setIsNewKitOpen(true)} className="bg-purple-600 hover:bg-purple-500">
                        <Plus className="h-4 w-4 mr-1" /> Nouveau kit
                      </Button>
                    ) : (
                      <Button onClick={() => setIsSaveConfigOpen(true)} className="bg-purple-600 hover:bg-purple-500">
                        <Plus className="h-4 w-4 mr-1" /> Nouvelle config
                      </Button>
                    )}
                  </div>

                  <TabsContent value="kits" className="space-y-4">
                    {kits.length === 0 ? (
                      <div className="text-center py-12 border border-dashed border-zinc-800 rounded-lg">
                        <Package className="h-12 w-12 mx-auto mb-3 text-zinc-700" />
                        <p className="text-zinc-400 mb-1">Aucun kit configuré</p>
                        <p className="text-zinc-500 text-sm mb-4">Créez votre premier kit de suspension</p>
                        <Button size="sm" onClick={() => setIsNewKitOpen(true)} className="bg-purple-600 hover:bg-purple-500">
                          <Plus className="h-4 w-4 mr-1" /> Créer un kit
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {kits.map((kit) => {
                          const isActive = kit.isDefault;
                          return (
                            <div key={kit._id} className={`p-4 rounded-xl border transition-colors ${isActive ? "border-purple-500/40 bg-purple-500/10" : "border-zinc-800/80 bg-zinc-900/20 opacity-80 hover:opacity-100 hover:border-zinc-700"}`}>
                              <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    {isActive && <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />}
                                    <h3 className="font-semibold text-white truncate">{kit.name}</h3>
                                    <Badge variant="outline" className={isActive ? "bg-purple-500/20 text-purple-400 border-purple-500/30 text-[10px]" : "bg-zinc-800 text-zinc-500 border-zinc-700 text-[10px]"}>
                                      {isActive ? "Kit actuel" : "Inactif"}
                                    </Badge>
                                  </div>
                                  <div className="flex flex-wrap gap-2 text-xs text-zinc-500 mt-1">
                                    {kit.sportType && <span>{SPORT_TYPES.find(t => t.value === kit.sportType)?.label}</span>}
                                    {kit.terrainType && <span>{TERRAIN_TYPES.find(t => t.value === kit.terrainType)?.label}</span>}
                                    {kit.country && <span>{kit.country}</span>}
                                  </div>
                                  <p className="text-xs text-zinc-400 mt-2">
                                    {kit.description || "Réglage équilibré pour la piste"}
                                  </p>
                                  <div className="text-[11px] text-zinc-500 mt-3">
                                    <span className="text-zinc-400">Config active:</span> {currentConfig?.name || "Config active"}
                                    <span className="mx-2">•</span>
                                    {kitConfigs?.length || 0} configs
                                  </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                  {!isActive && (
                                    <Button size="sm" onClick={() => handleSetActiveKit(kit._id)} className="bg-emerald-600 hover:bg-emerald-500">
                                      <Check className="h-3 w-3 mr-1" /> Activer ce kit
                                    </Button>
                                  )}
                                  {isActive ? (
                                    <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-[10px]">
                                      <Check className="h-3 w-3 mr-1" /> Kit actif
                                    </Badge>
                                  ) : (
                                    <Button size="sm" variant="ghost" onClick={() => { setSelectedKitId(kit._id); setView("config"); }} className="text-zinc-400 hover:text-purple-300">
                                      Voir configs
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="config" className="space-y-4">
                    <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Config active</h2>

                    {selectedKit ? (
                      <ClickersPanel
                        motoId={moto._id}
                        kitId={selectedKit._id}
                        userId={user?._id}
                        initialSettings={{
                          forkCompression: selectedKit.forkCompression ?? selectedKit.baseForkCompression ?? 10,
                          forkRebound: selectedKit.forkRebound ?? selectedKit.baseForkRebound ?? 10,
                          shockCompressionLow: selectedKit.shockCompressionLow ?? selectedKit.baseShockCompressionLow ?? 10,
                          shockCompressionHigh: selectedKit.shockCompressionHigh ?? selectedKit.baseShockCompressionHigh ?? 10,
                          shockRebound: selectedKit.shockRebound ?? selectedKit.baseShockRebound ?? 10,
                        }}
                        ranges={{
                          maxForkCompression: selectedKit.maxForkCompression ?? 25,
                          maxForkRebound: selectedKit.maxForkRebound ?? 25,
                          maxShockCompressionLow: selectedKit.maxShockCompressionLow ?? 25,
                          maxShockCompressionHigh: selectedKit.maxShockCompressionHigh ?? 25,
                          maxShockRebound: selectedKit.maxShockRebound ?? 25,
                        }}
                        forkBrand={selectedKit.forkBrand || stockSuspension?.forkBrand}
                        shockBrand={selectedKit.shockBrand || stockSuspension?.shockBrand}
                        kitName={selectedKit.name}
                        isDefault={selectedKit.isDefault}
                        motoBrand={moto.brand}
                        motoModel={moto.model}
                        initialKitInfo={{
                          name: selectedKit.name,
                          description: selectedKit.description,
                          terrainType: selectedKit.terrainType,
                          sportType: selectedKit.sportType,
                          country: selectedKit.country,
                          isStockSuspension: selectedKit.isStockSuspension,
                          forkBrand: selectedKit.forkBrand,
                          forkModel: selectedKit.forkModel,
                          shockBrand: selectedKit.shockBrand,
                          shockModel: selectedKit.shockModel,
                          forkSpringRate: selectedKit.forkSpringRate,
                          shockSpringRate: selectedKit.shockSpringRate,
                          forkOilWeight: selectedKit.forkOilWeight,
                          forkOilLevel: selectedKit.forkOilLevel,
                          valvingNotes: selectedKit.valvingNotes,
                          otherMods: selectedKit.otherMods,
                        }}
                      />
                    ) : (
                      <div className="text-center py-12 border border-dashed border-zinc-800 rounded-lg">
                        <Settings2 className="h-12 w-12 mx-auto mb-3 text-zinc-700" />
                        <p className="text-zinc-400">Sélectionnez un kit pour voir la config actuelle</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </ScrollArea>
          </div>
          <ProfileSidebar />
        </SidebarInset>
      </div>

      <Dialog open={isNewKitOpen} onOpenChange={setIsNewKitOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg max-h-[85vh] p-0 flex flex-col">
          <DialogHeader className="shrink-0 px-6 pt-6">
            <DialogTitle className="text-white">Nouveau kit</DialogTitle>
            <DialogDescription>Créer un nouveau kit de suspension</DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto px-6">
            <div className="space-y-5 py-4">
              <div className="space-y-2.5 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                <Label className="text-zinc-300 text-xs font-medium uppercase tracking-wide">Nom du kit *</Label>
                <Input value={newKit.name} onChange={(e) => setNewKit(prev => ({ ...prev, name: e.target.value }))} placeholder="Ex: Setup Sable" className="bg-zinc-800 border-zinc-700 h-10" />
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-3.5">
                <p className="text-zinc-300 text-xs font-medium uppercase tracking-wide">Contexte d&apos;utilisation</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-400 text-xs">Sport</Label>
                    <select value={newKit.sportType} onChange={(e) => setNewKit(prev => ({ ...prev, sportType: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm">
                      <option value="">Sélectionner</option>
                      {SPORT_TYPES.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-400 text-xs">Terrain</Label>
                    <select value={newKit.terrainType} onChange={(e) => setNewKit(prev => ({ ...prev, terrainType: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm">
                      <option value="">Sélectionner</option>
                      {TERRAIN_TYPES.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <Separator className="bg-zinc-800" />

              <div className="space-y-3.5 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                <p className="text-zinc-300 text-xs font-medium uppercase tracking-wide">Suspension</p>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="aftermarket" checked={!newKit.isStockSuspension} onChange={(e) => {
                    if (e.target.checked) {
                      setNewKit(prev => ({ ...prev, isStockSuspension: false, forkBrand: "", forkModel: "", shockBrand: "", shockModel: "" }));
                    } else {
                      setNewKit(prev => ({ ...prev, isStockSuspension: true }));
                    }
                  }} className="w-4 h-4 rounded border-zinc-600 bg-zinc-800" />
                  <Label htmlFor="aftermarket" className="text-zinc-300">Suspensions aftermarket</Label>
                </div>

                {!newKit.isStockSuspension && (
                  <div className="space-y-3 p-3.5 bg-zinc-800/50 rounded-lg border border-zinc-700/60">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-zinc-400 text-xs">Fourche — Marque</Label>
                        <AutocompleteInput
                          value={newKit.forkBrand}
                          onValueChange={(forkBrand) => setNewKit(prev => ({ ...prev, forkBrand, forkModel: "" }))}
                          options={getForkBrands()}
                          placeholder="WP, KYB, Ohlins..."
                          className="bg-zinc-800 border-zinc-700 h-10 text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-zinc-400 text-xs">Amortisseur — Marque</Label>
                        <AutocompleteInput
                          value={newKit.shockBrand}
                          onValueChange={(shockBrand) => setNewKit(prev => ({ ...prev, shockBrand, shockModel: "" }))}
                          options={getShockBrands()}
                          placeholder="WP, Ohlins, Showa..."
                          className="bg-zinc-800 border-zinc-700 h-10 text-sm"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-zinc-400 text-xs">Fourche — Modèle</Label>
                        <AutocompleteInput
                          value={newKit.forkModel}
                          onValueChange={(forkModel) => setNewKit(prev => ({ ...prev, forkModel }))}
                          options={getForkModelsForBrand(newKit.forkBrand)}
                          placeholder="XACT, SSS, RXF..."
                          className="bg-zinc-800 border-zinc-700 h-10 text-sm"
                          disabled={!newKit.forkBrand}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-zinc-400 text-xs">Amortisseur — Modèle</Label>
                        <AutocompleteInput
                          value={newKit.shockModel}
                          onValueChange={(shockModel) => setNewKit(prev => ({ ...prev, shockModel }))}
                          options={getShockModelsForBrand(newKit.shockBrand)}
                          placeholder="TTX, Factory, Trax..."
                          className="bg-zinc-800 border-zinc-700 h-10 text-sm"
                          disabled={!newKit.shockBrand}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="shrink-0 border-t border-zinc-800 bg-zinc-900 px-6 py-4 sm:justify-between">
            <Button variant="outline" onClick={() => setIsNewKitOpen(false)} className="border-zinc-700 text-zinc-300">
              Annuler
            </Button>
            <Button onClick={handleCreateKit} disabled={!newKit.name} className="bg-purple-600 hover:bg-purple-500 min-w-36">
              <Plus className="h-4 w-4 mr-2" /> Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSaveConfigOpen} onOpenChange={setIsSaveConfigOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Nouvelle config</DialogTitle>
            <DialogDescription>Enregistrer la config active</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
              <div className="space-y-1.5">
                <Label className="text-zinc-300 text-xs font-medium uppercase tracking-wide">Nom *</Label>
                <Input value={newConfigName} onChange={(e) => setNewConfigName(e.target.value)} className="bg-zinc-800 border-zinc-700 h-10" placeholder="Ex: Sable Maroc" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-zinc-400 text-xs">Description</Label>
                <Input value={newConfigDescription} onChange={(e) => setNewConfigDescription(e.target.value)} className="bg-zinc-800 border-zinc-700 h-10" placeholder="Notes..." />
              </div>
            </div>
          </div>
          <DialogFooter className="pt-2 sm:justify-between">
            <Button variant="outline" onClick={() => setIsSaveConfigOpen(false)} className="border-zinc-700 text-zinc-300">Annuler</Button>
            <Button onClick={handleSaveConfig} disabled={!newConfigName.trim()} className="bg-purple-600 hover:bg-purple-500 min-w-36">
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}

function MotoDetailPageLegacy() {
  const params = useParams();
  const router = useRouter();
  const motoId = params.motoId as Id<"motos">;
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  
  const { user } = useCurrentUser();
  const moto = useQuery(api.motos.getById, { motoId });
  
  const updateMoto = useMutation(api.motos.update);
  const deleteMoto = useMutation(api.motos.remove);
  const createKit = useMutation(api.suspensionKits.create);
  const deleteKit = useMutation(api.suspensionKits.remove);
  const setDefaultKit = useMutation(api.suspensionKits.setDefault);
  const updateKit = useMutation(api.suspensionKits.update);
  
  // File storage mutations
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const addImageToMoto = useMutation(api.files.addImageToMoto);
  const removeImageFromMoto = useMutation(api.files.removeImageFromMoto);
  
  // Query for image URLs
  const imageUrls = useQuery(
    api.files.getUrls,
    moto?.images && moto.images.length > 0 ? { storageIds: moto.images } : "skip"
  );

  const [isEditing, setIsEditing] = useState(false);
  const [isKitDialogOpen, setIsKitDialogOpen] = useState(false);
  const [editingKitId, setEditingKitId] = useState<Id<"suspensionKits"> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [clickersKitId, setClickersKitId] = useState<Id<"suspensionKits"> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editedMoto, setEditedMoto] = useState({
    brand: "",
    model: "",
    year: 2024,
    isPublic: false,
  });

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
    forkOilWeight: "",
    forkOilLevel: "",
    valvingNotes: "",
    otherMods: "",
  });

  // Vérifier si l'utilisateur est propriétaire
  const isOwner = user?._id === moto?.userId;

  const stockSuspension = moto?.brand ? getStockSuspension(moto.brand) : null;

  const startEditing = () => {
    if (moto) {
      setEditedMoto({
        brand: moto.brand,
        model: moto.model,
        year: moto.year,
        isPublic: moto.isPublic || false,
      });
      setIsEditing(true);
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const saveChanges = async () => {
    if (!moto) return;
    setIsSaving(true);
    try {
      await updateMoto({
        motoId: moto._id,
        brand: editedMoto.brand,
        model: editedMoto.model,
        year: editedMoto.year,
        isPublic: editedMoto.isPublic,
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMoto = async () => {
    if (!moto || !confirm("Supprimer cette moto et tous ses kits ?")) return;
    try {
      await deleteMoto({ motoId: moto._id });
      router.push("/motos");
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
    }
  };

  const handleTogglePublic = async () => {
    if (!moto) return;
    await updateMoto({
      motoId: moto._id,
      isPublic: !moto.isPublic,
    });
  };

  const resetKitForm = () => {
    setNewKit({
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
      forkOilWeight: "",
      forkOilLevel: "",
      valvingNotes: "",
      otherMods: "",
    });
    setEditingKitId(null);
  };

  const openKitDialog = (kitId?: Id<"suspensionKits">) => {
    if (kitId && moto?.kits) {
      const kit = moto.kits.find(k => k._id === kitId);
      if (kit) {
        setNewKit({
          name: kit.name,
          description: kit.description || "",
          terrainType: kit.terrainType || "",
          sportType: kit.sportType || "",
          country: kit.country || "",
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
        setEditingKitId(kitId);
      }
    } else {
      resetKitForm();
    }
    setIsKitDialogOpen(true);
  };

  const handleSaveKit = async () => {
    if (!user?._id || !moto || !newKit.name) return;
    setIsLoading(true);
    try {
      if (editingKitId) {
        await updateKit({
          kitId: editingKitId,
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
          forkOilWeight: newKit.forkOilWeight || undefined,
          forkOilLevel: newKit.forkOilLevel || undefined,
          valvingNotes: newKit.valvingNotes || undefined,
          otherMods: newKit.otherMods || undefined,
        });
      } else {
        await createKit({
          motoId: moto._id,
          userId: user._id,
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
          forkOilWeight: newKit.forkOilWeight || undefined,
          forkOilLevel: newKit.forkOilLevel || undefined,
          valvingNotes: newKit.valvingNotes || undefined,
          otherMods: newKit.otherMods || undefined,
        });
      }
      setIsKitDialogOpen(false);
      resetKitForm();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du kit:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteKit = async (kitId: Id<"suspensionKits">) => {
    if (!confirm("Supprimer ce kit ?")) return;
    try {
      await deleteKit({ kitId });
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
    }
  };

  const handleSetDefaultKit = async (kitId: Id<"suspensionKits">) => {
    try {
      await setDefaultKit({ kitId });
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  // Image upload handler
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !moto) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith("image/")) {
      alert("Veuillez sélectionner une image");
      return;
    }

    // Limite de taille (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("L'image ne doit pas dépasser 5MB");
      return;
    }

    setIsUploadingImage(true);
    try {
      // Obtenir l'URL de téléchargement
      const uploadUrl = await generateUploadUrl();
      
      // Uploader le fichier
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      
      const { storageId } = await result.json();
      
      // Ajouter l'image à la moto
      await addImageToMoto({ motoId: moto._id, storageId });
    } catch (error) {
      console.error("Erreur lors de l'upload:", error);
      alert("Erreur lors de l'upload de l'image");
    } finally {
      setIsUploadingImage(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Image delete handler
  const handleDeleteImage = async (storageId: Id<"_storage">) => {
    if (!moto || !confirm("Supprimer cette image ?")) return;
    try {
      await removeImageFromMoto({ motoId: moto._id, storageId });
      setSelectedImage(null);
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
    }
  };

  const availableModels = editedMoto.brand ? getModelsForBrand(editedMoto.brand) : [];
  const availableYears = editedMoto.brand ? getYearsForBrand(editedMoto.brand) : [];

  // Auth loading state - wait for Clerk to determine auth state
  if (!authLoaded) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-zinc-950 overflow-hidden">
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
        <div className="min-h-screen flex w-full bg-zinc-950 overflow-hidden">
          <AppSidebar />
          <SidebarInset className="flex-1 !flex-row overflow-hidden">
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Bike className="h-16 w-16 mx-auto mb-4 text-purple-500" />
                <h2 className="text-xl font-semibold text-white mb-4">Connexion requise</h2>
                <SignInButton>
                  <Button className="bg-purple-600 hover:bg-purple-500">
                    Se connecter
                  </Button>
                </SignInButton>
              </div>
            </div>
            <ProfileSidebar />
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  // Loading state - moto is undefined while query is in progress
  if (moto === undefined) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-zinc-950 overflow-hidden">
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

  // Not found state - moto is null
  if (moto === null) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-zinc-950 overflow-hidden">
          <AppSidebar />
          <SidebarInset className="flex-1 !flex-row overflow-hidden">
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <Bike className="h-16 w-16 text-zinc-600" />
              <h2 className="text-xl font-semibold text-white">Moto introuvable</h2>
              <p className="text-zinc-500">Cette moto n&apos;existe pas ou a été supprimée.</p>
              <Button
                onClick={() => router.push("/motos")}
                className="mt-4 bg-purple-600 hover:bg-purple-500"
              >
                Retour à mes motos
              </Button>
            </div>
            <ProfileSidebar />
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-zinc-950 overflow-hidden">
        <AppSidebar />
        <SidebarInset className="flex-1 !flex-row overflow-hidden">
          <div className="flex-1 overflow-auto">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50">
              <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push("/motos")}
                    className="text-zinc-400 hover:text-white"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <div className="flex items-center gap-3">
                    <BrandLogo brand={moto.brand} size="lg" />
                    <div>
                      <h1 className="text-xl font-bold text-white">
                        {moto.brand} {moto.model}
                      </h1>
                      <p className="text-sm text-zinc-500">{moto.year}</p>
                    </div>
                  </div>
                </div>
                
                {isOwner && (
                  <div className="flex items-center gap-2">
                      <button
                        onClick={handleTogglePublic}
                        className={`p-2 rounded-lg transition-colors ${
                          moto.isPublic 
                            ? "bg-emerald-500/20 text-emerald-400" 
                            : "bg-zinc-800 text-zinc-400"
                        }`}
                        title={moto.isPublic ? "Moto publique" : "Moto privée"}
                      >
                        {moto.isPublic ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                      {!isEditing ? (
                        <Button
                          variant="outline"
                          onClick={startEditing}
                          className="gap-2 bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
                        >
                          <Edit3 className="h-4 w-4" />
                          Modifier
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            onClick={cancelEditing}
                            className="gap-2 bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
                          >
                            <X className="h-4 w-4" />
                            Annuler
                          </Button>
                          <Button
                            onClick={saveChanges}
                            disabled={isSaving}
                            className="gap-2 bg-purple-600 hover:bg-purple-500"
                          >
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Sauvegarder
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleDeleteMoto}
                        className="text-zinc-500 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
                {/* Mode édition de la moto */}
                {isEditing && (
                  <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                      <CardTitle className="text-lg text-white">Modifier la moto</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="text-zinc-400">Marque</Label>
                          <select
                            value={editedMoto.brand}
                            onChange={(e) => setEditedMoto({ ...editedMoto, brand: e.target.value, model: "" })}
                            className="w-full h-10 bg-zinc-800 border border-zinc-700 rounded-md px-3 text-white"
                          >
                            {BRANDS.map((b) => (
                              <option key={b} value={b}>{b}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-zinc-400">Modèle</Label>
                          <select
                            value={editedMoto.model}
                            onChange={(e) => setEditedMoto({ ...editedMoto, model: e.target.value })}
                            className="w-full h-10 bg-zinc-800 border border-zinc-700 rounded-md px-3 text-white"
                          >
                            <option value="">Sélectionner</option>
                            {availableModels.map((m) => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-zinc-400">Année</Label>
                          <select
                            value={editedMoto.year}
                            onChange={(e) => setEditedMoto({ ...editedMoto, year: parseInt(e.target.value) })}
                            className="w-full h-10 bg-zinc-800 border border-zinc-700 rounded-md px-3 text-white"
                          >
                            {availableYears.map((y) => (
                              <option key={y} value={y}>{y}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Informations générales */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Suspensions d'origine */}
                  <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                      <CardTitle className="text-lg text-white flex items-center gap-2">
                        <Package className="h-5 w-5 text-purple-500" />
                        Suspensions d&apos;origine
                      </CardTitle>
                      <CardDescription>
                        Équipement de série pour {moto.brand}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {stockSuspension ? (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-zinc-800/50 rounded-lg">
                              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Fourche</p>
                              <p className="text-white font-medium">{stockSuspension.forkBrand}</p>
                              <p className="text-sm text-zinc-400">{stockSuspension.forkModel}</p>
                            </div>
                            <div className="p-4 bg-zinc-800/50 rounded-lg">
                              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Amortisseur</p>
                              <p className="text-white font-medium">{stockSuspension.shockBrand}</p>
                              <p className="text-sm text-zinc-400">{stockSuspension.shockModel}</p>
                            </div>
                          </div>
                          {stockSuspension.notes && (
                            <p className="text-xs text-zinc-500 italic">{stockSuspension.notes}</p>
                          )}
                        </>
                      ) : (
                        <p className="text-zinc-500 text-sm">Informations non disponibles</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Stats rapides */}
                  <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                      <CardTitle className="text-lg text-white flex items-center gap-2">
                        <Settings2 className="h-5 w-5 text-amber-500" />
                        Résumé
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-zinc-800/50 rounded-lg text-center">
                          <p className="text-3xl font-bold text-purple-400">{moto.kits?.length || 0}</p>
                          <p className="text-sm text-zinc-500">Kit{(moto.kits?.length || 0) > 1 ? 's' : ''} configuré{(moto.kits?.length || 0) > 1 ? 's' : ''}</p>
                        </div>
                        <div className="p-4 bg-zinc-800/50 rounded-lg text-center">
                          <p className="text-3xl font-bold text-emerald-400">
                            <Calendar className="h-8 w-8 mx-auto" />
                          </p>
                          <p className="text-sm text-zinc-500">{moto.year}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Section Photos */}
                <Card className="bg-zinc-900/50 border-zinc-800">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg text-white flex items-center gap-2">
                          <ImageIcon className="h-5 w-5 text-blue-500" />
                          Photos
                        </CardTitle>
                        <CardDescription>
                          {moto.images?.length || 0} photo{(moto.images?.length || 0) > 1 ? 's' : ''} de votre moto
                        </CardDescription>
                      </div>
                      {isOwner && (
                        <div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            id="image-upload"
                          />
                          <Button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploadingImage}
                            className="gap-2 bg-blue-600 hover:bg-blue-500"
                          >
                            {isUploadingImage ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Upload className="h-4 w-4" />
                            )}
                            Ajouter une photo
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {imageUrls && imageUrls.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {imageUrls.map((img: { id: Id<"_storage">; url: string | null }) => (
                          img.url && (
                            <div 
                              key={img.id} 
                              className="relative group aspect-square rounded-lg overflow-hidden bg-zinc-800 cursor-pointer"
                              onClick={() => setSelectedImage(img.url)}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={img.url}
                                alt="Photo de la moto"
                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                              />
                              {isOwner && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteImage(img.id);
                                  }}
                                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          )
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-zinc-500">
                        <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Aucune photo ajoutée</p>
                        {isOwner && (
                          <p className="text-sm mt-2">Ajoutez des photos de votre moto</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Section Kits */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-white">Config</h2>
                      <p className="text-sm text-zinc-500">Gérez vos différentes configurations</p>
                    </div>
                    {isOwner && (
                      <Button
                        onClick={() => openKitDialog()}
                        className="gap-2 bg-purple-600 hover:bg-purple-500"
                      >
                        <Plus className="h-4 w-4" />
                        Ajouter un kit
                      </Button>
                    )}
                  </div>

                  {moto.kits && moto.kits.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {moto.kits.map((kit) => (
                        <Card 
                          key={kit._id}
                          className={`bg-zinc-900/50 border transition-colors ${
                            kit.isDefault 
                              ? "border-purple-500/50 bg-purple-500/5" 
                              : "border-zinc-800 hover:border-zinc-700"
                          }`}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                <div className={`p-2 rounded-lg ${kit.isDefault ? "bg-purple-500/20" : "bg-zinc-800"}`}>
                                  <Settings2 className={`h-4 w-4 ${kit.isDefault ? "text-purple-400" : "text-zinc-400"}`} />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <CardTitle className="text-base text-white">{kit.name}</CardTitle>
                                    {kit.isDefault && (
                                      <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                                    )}
                                  </div>
                                  {kit.description && (
                                    <CardDescription className="text-xs">{kit.description}</CardDescription>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {/* Badges */}
                            <div className="flex flex-wrap gap-1.5">
                              {kit.isStockSuspension ? (
                                <span className="text-[10px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">
                                  OEM
                                </span>
                              ) : (
                                <span className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded flex items-center gap-1">
                                  <Wrench className="h-3 w-3" />
                                  Modifié
                                </span>
                              )}
                              {kit.terrainType && (
                                <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {kit.terrainType}
                                </span>
                              )}
                              {kit.sportType && (
                                <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                                  {kit.sportType}
                                </span>
                              )}
                              {kit.country && (
                                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">
                                  {kit.country}
                                </span>
                              )}
                            </div>

                            {/* Suspensions info */}
                            {kit.isStockSuspension && stockSuspension ? (
                              <div className="p-3 bg-purple-500/10 rounded-lg text-xs">
                                <p className="text-purple-400 font-medium mb-1">Suspensions d&apos;origine</p>
                                <div className="grid grid-cols-2 gap-2 text-zinc-400">
                                  <div>
                                    <span className="text-zinc-500">Fourche:</span> {stockSuspension.forkBrand} {stockSuspension.forkModel}
                                  </div>
                                  <div>
                                    <span className="text-zinc-500">Amortisseur:</span> {stockSuspension.shockBrand} {stockSuspension.shockModel}
                                  </div>
                                </div>
                              </div>
                            ) : !kit.isStockSuspension && (kit.forkBrand || kit.shockBrand) ? (
                              <div className="p-3 bg-amber-500/10 rounded-lg text-xs">
                                <p className="text-amber-400 font-medium mb-1">Suspensions modifiées</p>
                                <div className="grid grid-cols-2 gap-2 text-zinc-400">
                                  {kit.forkBrand && (
                                    <div>
                                      <span className="text-zinc-500">Fourche:</span> {kit.forkBrand} {kit.forkModel}
                                    </div>
                                  )}
                                  {kit.shockBrand && (
                                    <div>
                                      <span className="text-zinc-500">Amortisseur:</span> {kit.shockBrand} {kit.shockModel}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : null}

                            {/* Détails techniques */}
                            {(kit.forkSpringRate || kit.shockSpringRate || kit.forkOilWeight) && (
                              <div className="text-xs text-zinc-500 space-y-1">
                                {kit.forkSpringRate && <p>Ressort AV: {kit.forkSpringRate}</p>}
                                {kit.shockSpringRate && <p>Ressort AR: {kit.shockSpringRate}</p>}
                                {kit.forkOilWeight && <p>Huile: {kit.forkOilWeight}</p>}
                              </div>
                            )}

                            {/* Actions */}
                            {isOwner && (
                              <div className="flex items-center gap-2 pt-2 border-t border-zinc-800">
                                {/* Bouton Clickers MX */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setClickersKitId(kit._id)}
                                  className="text-purple-400 border-purple-500/30 hover:bg-purple-500/10 h-8 px-2 gap-1"
                                >
                                  <Sliders className="h-3 w-3" />
                                  Clickers
                                </Button>
                                {!kit.isDefault && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleSetDefaultKit(kit._id)}
                                    className="text-zinc-400 hover:text-yellow-400 h-8 px-2 gap-1"
                                  >
                                    <Star className="h-3 w-3" />
                                    Défaut
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openKitDialog(kit._id)}
                                  className="text-zinc-400 hover:text-purple-400 h-8 px-2 gap-1"
                                >
                                  <Edit3 className="h-3 w-3" />
                                  Modifier
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteKit(kit._id)}
                                  className="text-zinc-500 hover:text-red-400 h-8 px-2 gap-1 ml-auto"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            )}

                            {/* Config actuelle et configs sauvegardées */}
                            <KitConfigSection
                              kitId={kit._id}
                              kitName={kit.name}
                              currentSettings={{
                                forkCompression: kit.forkCompression,
                                forkRebound: kit.forkRebound,
                                shockCompressionLow: kit.shockCompressionLow,
                                shockCompressionHigh: kit.shockCompressionHigh,
                                shockRebound: kit.shockRebound,
                              }}
                              isOwner={isOwner}
                            />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="bg-zinc-900/50 border-zinc-800">
                      <CardContent className="py-12 text-center">
                        <Package className="h-12 w-12 mx-auto mb-4 text-zinc-600" />
                        <p className="text-zinc-500 mb-4">Aucun kit configuré pour cette moto</p>
                        {isOwner && (
                          <Button
                            onClick={() => openKitDialog()}
                            className="gap-2 bg-purple-600 hover:bg-purple-500"
                          >
                            <Plus className="h-4 w-4" />
                            Créer votre premier kit
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          <ProfileSidebar />
        </SidebarInset>
      </div>

      {/* Dialog d'ajout/modification de kit */}
      <Dialog open={isKitDialogOpen} onOpenChange={setIsKitDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingKitId ? "Modifier le kit" : "Nouveau kit de suspension"}
            </DialogTitle>
            <DialogDescription>
              {editingKitId ? "Modifiez les détails de ce kit" : `Configuration pour votre ${moto.brand} ${moto.model}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Nom et description */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-400">Nom du kit *</Label>
                <Input
                  value={newKit.name}
                  onChange={(e) => setNewKit({ ...newKit, name: e.target.value })}
                  placeholder="Ex: Sable mou, Enduro classique..."
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400">Description</Label>
                <Input
                  value={newKit.description}
                  onChange={(e) => setNewKit({ ...newKit, description: e.target.value })}
                  placeholder="Description courte..."
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
            </div>

            {/* Type de terrain et sport */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-400">Type de terrain</Label>
                <select
                  value={newKit.terrainType}
                  onChange={(e) => setNewKit({ ...newKit, terrainType: e.target.value })}
                  className="w-full h-10 bg-zinc-800 border border-zinc-700 rounded-md px-3 text-white"
                >
                  <option value="">Aucun</option>
                  {TERRAIN_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400">Discipline</Label>
                <select
                  value={newKit.sportType}
                  onChange={(e) => setNewKit({ ...newKit, sportType: e.target.value })}
                  className="w-full h-10 bg-zinc-800 border border-zinc-700 rounded-md px-3 text-white"
                >
                  <option value="">Aucun</option>
                  {SPORT_TYPES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400">Pays</Label>
                <Input
                  value={newKit.country}
                  onChange={(e) => setNewKit({ ...newKit, country: e.target.value })}
                  placeholder="Ex: France..."
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
            </div>

            <Separator className="bg-zinc-800" />

            {/* Type de suspensions */}
            <div className="space-y-3">
              <Label className="text-zinc-400">Suspensions de ce kit</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setNewKit({ ...newKit, isStockSuspension: true })}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    newKit.isStockSuspension
                      ? "border-purple-500 bg-purple-500/10"
                      : "border-zinc-700 bg-zinc-800/50"
                  }`}
                >
                  <p className={`text-sm font-medium ${newKit.isStockSuspension ? "text-white" : "text-zinc-400"}`}>
                    Origine
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setNewKit({ ...newKit, isStockSuspension: false })}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    !newKit.isStockSuspension
                      ? "border-amber-500 bg-amber-500/10"
                      : "border-zinc-700 bg-zinc-800/50"
                  }`}
                >
                  <p className={`text-sm font-medium ${!newKit.isStockSuspension ? "text-white" : "text-zinc-400"}`}>
                    Modifiées
                  </p>
                </button>
              </div>
            </div>

            {/* Affichage des suspensions d'origine si kit stock */}
            {newKit.isStockSuspension && stockSuspension && (
              <div className="space-y-3 p-4 bg-purple-500/5 border border-purple-500/20 rounded-lg">
                <p className="text-sm text-purple-400 font-medium">
                  Suspensions d&apos;origine {moto.brand}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Fourche</p>
                    <p className="text-sm text-white">{stockSuspension.forkBrand} {stockSuspension.forkModel}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Amortisseur</p>
                    <p className="text-sm text-white">{stockSuspension.shockBrand} {stockSuspension.shockModel}</p>
                  </div>
                </div>
                {stockSuspension.notes && (
                  <p className="text-xs text-zinc-500 italic">{stockSuspension.notes}</p>
                )}
              </div>
            )}

            {/* Détails techniques si modifiées */}
            {!newKit.isStockSuspension && (
              <div className="space-y-4 p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                <p className="text-sm text-amber-400 font-medium flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  Modifications du kit
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-zinc-500">Marque fourche</Label>
                    <Input
                      value={newKit.forkBrand}
                      onChange={(e) => setNewKit({ ...newKit, forkBrand: e.target.value })}
                      placeholder="Ex: WP, Öhlins..."
                      className="bg-zinc-800 border-zinc-700 text-white h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-zinc-500">Modèle fourche</Label>
                    <Input
                      value={newKit.forkModel}
                      onChange={(e) => setNewKit({ ...newKit, forkModel: e.target.value })}
                      placeholder="Ex: XACT Pro..."
                      className="bg-zinc-800 border-zinc-700 text-white h-9"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-zinc-500">Marque amortisseur</Label>
                    <Input
                      value={newKit.shockBrand}
                      onChange={(e) => setNewKit({ ...newKit, shockBrand: e.target.value })}
                      placeholder="Ex: WP, Öhlins..."
                      className="bg-zinc-800 border-zinc-700 text-white h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-zinc-500">Modèle amortisseur</Label>
                    <Input
                      value={newKit.shockModel}
                      onChange={(e) => setNewKit({ ...newKit, shockModel: e.target.value })}
                      placeholder="Ex: XACT Pro..."
                      className="bg-zinc-800 border-zinc-700 text-white h-9"
                    />
                  </div>
                </div>

                <Separator className="bg-zinc-700" />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-zinc-500">Ressort fourche</Label>
                    <Input
                      value={newKit.forkSpringRate}
                      onChange={(e) => setNewKit({ ...newKit, forkSpringRate: e.target.value })}
                      placeholder="Ex: 0.44 kg/mm"
                      className="bg-zinc-800 border-zinc-700 text-white h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-zinc-500">Ressort amortisseur</Label>
                    <Input
                      value={newKit.shockSpringRate}
                      onChange={(e) => setNewKit({ ...newKit, shockSpringRate: e.target.value })}
                      placeholder="Ex: 5.2 kg/mm"
                      className="bg-zinc-800 border-zinc-700 text-white h-9"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-zinc-500">Huile fourche</Label>
                    <Input
                      value={newKit.forkOilWeight}
                      onChange={(e) => setNewKit({ ...newKit, forkOilWeight: e.target.value })}
                      placeholder="Ex: Motorex 5W"
                      className="bg-zinc-800 border-zinc-700 text-white h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-zinc-500">Niveau huile</Label>
                    <Input
                      value={newKit.forkOilLevel}
                      onChange={(e) => setNewKit({ ...newKit, forkOilLevel: e.target.value })}
                      placeholder="Ex: 380mm"
                      className="bg-zinc-800 border-zinc-700 text-white h-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-zinc-500">Notes de valving</Label>
                  <Input
                    value={newKit.valvingNotes}
                    onChange={(e) => setNewKit({ ...newKit, valvingNotes: e.target.value })}
                    placeholder="Modifications internes..."
                    className="bg-zinc-800 border-zinc-700 text-white h-9"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-zinc-500">Autres modifications</Label>
                  <Input
                    value={newKit.otherMods}
                    onChange={(e) => setNewKit({ ...newKit, otherMods: e.target.value })}
                    placeholder="Clapets, pistons..."
                    className="bg-zinc-800 border-zinc-700 text-white h-9"
                  />
                </div>
              </div>
            )}

            {/* Boutons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsKitDialogOpen(false);
                  resetKitForm();
                }}
                className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
              >
                Annuler
              </Button>
              <Button
                onClick={handleSaveKit}
                disabled={!newKit.name || isLoading}
                className="bg-purple-600 hover:bg-purple-500 gap-2"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingKitId ? "Sauvegarder" : "Créer le kit"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Lightbox Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-4xl p-2">
          {selectedImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={selectedImage}
              alt="Photo de la moto"
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Clickers MX Dialog */}
      <Dialog open={!!clickersKitId} onOpenChange={() => setClickersKitId(null)}>
        <DialogContent className="bg-zinc-950 border-zinc-800 !w-[90vw] !max-w-[1800px] h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Clickers MX - Config suspension</DialogTitle>
            <DialogDescription>
              Ajustez votre config de suspension avec le systeme Clickers MX
            </DialogDescription>
          </DialogHeader>
          {clickersKitId && moto && (() => {
            const kit = moto.kits?.find(k => k._id === clickersKitId);
            if (!kit) return null;
            
            const settings = {
              forkCompression: kit.forkCompression ?? kit.baseForkCompression ?? 10,
              forkRebound: kit.forkRebound ?? kit.baseForkRebound ?? 10,
              shockCompressionLow: kit.shockCompressionLow ?? kit.baseShockCompressionLow ?? 10,
              shockCompressionHigh: kit.shockCompressionHigh ?? kit.baseShockCompressionHigh ?? 10,
              shockRebound: kit.shockRebound ?? kit.baseShockRebound ?? 10,
            };
            
            const ranges = {
              maxForkCompression: kit.maxForkCompression ?? 25,
              maxForkRebound: kit.maxForkRebound ?? 25,
              maxShockCompressionLow: kit.maxShockCompressionLow ?? 25,
              maxShockCompressionHigh: kit.maxShockCompressionHigh ?? 25,
              maxShockRebound: kit.maxShockRebound ?? 25,
            };
            
            return (
              <div className="p-8">
                <ClickersPanel
                  motoId={moto._id}
                  kitId={kit._id}
                  userId={user?._id}
                  initialSettings={settings}
                  ranges={ranges}
                  forkBrand={kit.forkBrand || stockSuspension?.forkBrand}
                  shockBrand={kit.shockBrand || stockSuspension?.shockBrand}
                  kitName={kit.name}
                  isDefault={kit.isDefault}
                  motoBrand={moto.brand}
                  motoModel={moto.model}
                />
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
