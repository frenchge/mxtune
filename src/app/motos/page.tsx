"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useRouter } from "next/navigation";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AutocompleteInput } from "@/components/ui/autocomplete-input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SignInButton, useAuth } from "@clerk/nextjs";
import {
  Bike, Plus, Loader2, Eye,
  Wrench, Package, Star, ChevronRight,
} from "lucide-react";
import { BRANDS, getModelsForBrand, getYearsForBrand, getStockSuspension } from "@/data/moto-models";
import { BrandLogo } from "@/components/ui/brand-logo";

export default function MotosPage() {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { user } = useCurrentUser();
  const router = useRouter();

  const motos = useQuery(
    api.motos.getByUser,
    user?._id ? { userId: user._id } : "skip"
  );

  const createMoto = useMutation(api.motos.create);

  // Dialog states
  const [isAddMotoDialogOpen, setIsAddMotoDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [suspensionFilter, setSuspensionFilter] = useState<string>("all");

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

  const availableModels = newMoto.brand ? getModelsForBrand(newMoto.brand) : [];
  const availableYears = newMoto.brand ? getYearsForBrand(newMoto.brand) : [];
  const brandOptions = useMemo(() => {
    const list = motos ? Array.from(new Set(motos.map((m) => m.brand))) : [];
    return list.sort((a, b) => a.localeCompare(b));
  }, [motos]);

  const filteredMotos = useMemo(() => {
    if (!motos) return [];
    const query = searchTerm.trim().toLowerCase();
    return motos.filter((moto) => {
      const matchesSearch = query
        ? `${moto.brand} ${moto.model} ${moto.year}`.toLowerCase().includes(query)
        : true;
      const matchesBrand = brandFilter === "all" ? true : moto.brand === brandFilter;
      const matchesSuspension =
        suspensionFilter === "all"
          ? true
          : suspensionFilter === "stock"
            ? moto.isStockSuspension !== false
            : moto.isStockSuspension === false;
      return matchesSearch && matchesBrand && matchesSuspension;
    });
  }, [motos, searchTerm, brandFilter, suspensionFilter]);

  // Reset model and year when brand changes
  useEffect(() => {
    if (newMoto.brand) {
      const years = getYearsForBrand(newMoto.brand);
      setNewMoto(prev => ({ ...prev, model: "", year: years[0] || 2024 }));
    }
  }, [newMoto.brand]);

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
        forkBrand, forkModel, shockBrand, shockModel,
        suspensionNotes: newMoto.suspensionNotes || undefined,
        ...clickRanges,
      });
      setIsAddMotoDialogOpen(false);
      setNewMoto({ brand: "", model: "", year: 2024, isStockSuspension: true, customForkBrand: "", customForkModel: "", customShockBrand: "", customShockModel: "", suspensionNotes: "" });
      router.push(`/motos/${motoId}`);
    } catch (error) {
      console.error("Erreur lors de la création:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!authLoaded) {
    return (
      <SidebarProvider>
        <div className="h-screen flex w-full bg-zinc-950 overflow-hidden">
          <AppSidebar />
          <SidebarInset className="flex-1 overflow-hidden">
            <div className="flex-1 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-purple-500" /></div>
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
          <SidebarInset className="flex-1 overflow-hidden">
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Bike className="h-16 w-16 mx-auto mb-4 text-purple-500" />
                <h2 className="text-xl font-semibold text-white mb-4">Connexion requise</h2>
                <SignInButton><Button className="bg-purple-600 hover:bg-purple-500">Se connecter</Button></SignInButton>
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="h-screen flex w-full bg-zinc-950 overflow-hidden">
        <AppSidebar />
        <SidebarInset className="flex-1 !flex-row overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-8 pt-8 pb-6 shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-white uppercase tracking-tight">
                    GARAGE
                  </h1>
                  <p className="text-zinc-400 mt-1 normal-case not-italic font-normal">
                    Gère tes motos et leurs configurations
                  </p>
                </div>
                <Button
                  onClick={() => setIsAddMotoDialogOpen(true)}
                  className="bg-purple-600 hover:bg-purple-500 h-10 px-4 shrink-0"
                >
                  <Plus className="h-4 w-4 mr-1" /> Ajouter une moto
                </Button>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher une moto..."
                  className="bg-zinc-900 border-zinc-800 h-10 text-sm w-full sm:w-72"
                />
                <Select value={brandFilter} onValueChange={setBrandFilter}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-800 h-10 text-sm w-full sm:w-56">
                    <SelectValue placeholder="Toutes marques" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    <SelectItem value="all">Toutes marques</SelectItem>
                    {brandOptions.map((brand) => (
                      <SelectItem key={brand} value={brand}>
                        {brand}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={suspensionFilter} onValueChange={setSuspensionFilter}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-800 h-10 text-sm w-full sm:w-56">
                    <SelectValue placeholder="Toutes suspensions" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    <SelectItem value="all">Toutes suspensions</SelectItem>
                    <SelectItem value="stock">Stock</SelectItem>
                    <SelectItem value="aftermarket">Aftermarket</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Moto Cards Grid */}
            <ScrollArea className="flex-1">
              <div className="px-8 pb-8">
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
                ) : filteredMotos.length === 0 ? (
                  <div className="text-center py-16">
                    <Bike className="h-16 w-16 mx-auto mb-4 text-zinc-700" />
                    <h3 className="text-lg font-semibold text-zinc-400 mb-2">Aucune moto trouvée</h3>
                    <p className="text-zinc-500 mb-4">Essaie d&apos;ajuster tes filtres ou ta recherche</p>
                    <Button onClick={() => { setSearchTerm(""); setBrandFilter("all"); setSuspensionFilter("all"); }} className="bg-zinc-800 hover:bg-zinc-700 text-white">
                      Réinitialiser les filtres
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                    {filteredMotos.map((moto) => {
                      const activeKit = moto.kits?.find(k => k.isDefault) || moto.kits?.[0];
                      const stockSusp = getStockSuspension(moto.brand);
                      const isAftermarket = moto.isStockSuspension === false;
                      return (
                        <div
                          key={moto._id}
                          onClick={() => router.push(`/motos/${moto._id}`)}
                          className="group rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900/90 via-zinc-900/70 to-zinc-900/40 hover:border-purple-500/40 hover:shadow-[0_0_0_1px_rgba(168,85,247,0.15)] transition-all cursor-pointer overflow-hidden"
                        >
                          <div className="p-5">
                          {/* Header */}
                          <div className="flex items-start gap-3.5 mb-4">
                            <BrandLogo brand={moto.brand} size="lg" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-white truncate text-[15px]">{moto.brand} {moto.model}</h3>
                                {moto.isPublic && <Eye className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
                              </div>
                              <p className="text-sm text-zinc-500 mt-0.5">{moto.year}</p>
                            </div>
                          </div>

                          {/* Suspension base */}
                          <div className="mb-4 text-xs text-zinc-500">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              {isAftermarket ? (
                                <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[10px] px-1.5 py-0">
                                  <Wrench className="h-2.5 w-2.5 mr-0.5" /> Aftermarket
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-zinc-800 text-zinc-400 border-zinc-700 text-[10px] px-1.5 py-0">
                                  <Package className="h-2.5 w-2.5 mr-0.5" /> Stock
                                </Badge>
                              )}
                            </div>
                            <p className="text-zinc-400 leading-relaxed">
                              {moto.forkBrand || stockSusp?.forkBrand || "—"} / {moto.shockBrand || stockSusp?.shockBrand || "—"}
                            </p>
                          </div>

                          {/* Active kit quick peek */}
                          {activeKit && (
                            <div className="p-3 bg-zinc-800/55 rounded-xl border border-zinc-700/60 mb-4">
                              <div className="flex items-center gap-2 mb-1.5">
                                <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                                <span className="text-xs text-zinc-300 font-medium truncate">Kit actif: {activeKit.name}</span>
                              </div>
                              {(activeKit.terrainType || activeKit.sportType) && (
                                <p className="text-[11px] text-zinc-500">
                                  {[activeKit.sportType, activeKit.terrainType].filter(Boolean).join(" · ")}
                                </p>
                              )}
                            </div>
                          )}
                          </div>

                          {/* Footer */}
                          <div className="flex items-center justify-between border-t border-zinc-800/80 px-5 py-3 text-xs text-zinc-500">
                            <span>{moto.kits?.length || 0} kit{(moto.kits?.length || 0) > 1 ? "s" : ""} configuré{(moto.kits?.length || 0) > 1 ? "s" : ""}</span>
                            <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
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

      {/* Add Moto Dialog */}
      <Dialog open={isAddMotoDialogOpen} onOpenChange={setIsAddMotoDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg max-h-[85vh] p-0 flex flex-col">
          <DialogHeader className="shrink-0 px-6 pt-6">
            <DialogTitle className="text-white">Ajouter une moto</DialogTitle>
            <DialogDescription>Ajoutez une nouvelle moto à votre garage</DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto px-6">
            <div className="space-y-5 py-4">
              <div className="space-y-2.5 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                <Label className="text-zinc-300 text-xs font-medium uppercase tracking-wide">Marque *</Label>
                <AutocompleteInput
                  value={newMoto.brand}
                  onValueChange={(brand) => setNewMoto(prev => ({ ...prev, brand }))}
                  options={BRANDS}
                  placeholder="KTM, Yamaha, Honda..."
                  className="bg-zinc-800 border-zinc-700 h-10 text-sm"
                />
              </div>
              {newMoto.brand && (
                <>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-3.5">
                    <p className="text-zinc-300 text-xs font-medium uppercase tracking-wide">Identification</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-zinc-400 text-xs">Modèle *</Label>
                        <AutocompleteInput
                          value={newMoto.model}
                          onValueChange={(model) => setNewMoto(prev => ({ ...prev, model }))}
                          options={availableModels}
                          placeholder="EXC 300, YZ 250F..."
                          className="bg-zinc-800 border-zinc-700 h-10 text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-zinc-400 text-xs">Année *</Label>
                        <select value={newMoto.year} onChange={(e) => setNewMoto(prev => ({ ...prev, year: parseInt(e.target.value) }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm">
                          {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-zinc-800" />
                  <div className="space-y-3.5 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                    <Label className="text-zinc-300 text-xs font-medium uppercase tracking-wide">Base suspension</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button type="button" onClick={() => setNewMoto(prev => ({ ...prev, isStockSuspension: true }))} className={`p-3 rounded-lg border-2 transition-all ${newMoto.isStockSuspension ? "border-purple-500 bg-purple-500/10" : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"}`}>
                        <Package className={`h-5 w-5 mx-auto mb-1.5 ${newMoto.isStockSuspension ? "text-purple-400" : "text-zinc-400"}`} />
                        <span className={`text-sm font-medium block ${newMoto.isStockSuspension ? "text-white" : "text-zinc-400"}`}>Stock / OEM</span>
                      </button>
                      <button type="button" onClick={() => setNewMoto(prev => ({ ...prev, isStockSuspension: false }))} className={`p-3 rounded-lg border-2 transition-all ${!newMoto.isStockSuspension ? "border-purple-500 bg-purple-500/10" : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"}`}>
                        <Wrench className={`h-5 w-5 mx-auto mb-1.5 ${!newMoto.isStockSuspension ? "text-purple-400" : "text-zinc-400"}`} />
                        <span className={`text-sm font-medium block ${!newMoto.isStockSuspension ? "text-white" : "text-zinc-400"}`}>Aftermarket</span>
                      </button>
                    </div>
                    {newMoto.isStockSuspension && (() => {
                      const stockSusp = getStockSuspension(newMoto.brand);
                      return stockSusp ? (
                        <div className="p-3.5 bg-zinc-800/50 rounded-lg border border-zinc-700/60">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div><span className="text-zinc-500">Fourche:</span><span className="text-zinc-300 ml-1">{stockSusp.forkBrand} {stockSusp.forkModel}</span></div>
                            <div><span className="text-zinc-500">Amortisseur:</span><span className="text-zinc-300 ml-1">{stockSusp.shockBrand} {stockSusp.shockModel}</span></div>
                          </div>
                        </div>
                      ) : null;
                    })()}
                    {!newMoto.isStockSuspension && (
                      <div className="space-y-3 p-3.5 bg-zinc-800/50 rounded-lg border border-zinc-700/60">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-zinc-400 text-xs">Fourche — Marque</Label>
                            <Input value={newMoto.customForkBrand} onChange={(e) => setNewMoto(prev => ({ ...prev, customForkBrand: e.target.value }))} placeholder="WP, KYB, Öhlins..." className="bg-zinc-800 border-zinc-700 h-9 text-sm" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-zinc-400 text-xs">Amortisseur — Marque</Label>
                            <Input value={newMoto.customShockBrand} onChange={(e) => setNewMoto(prev => ({ ...prev, customShockBrand: e.target.value }))} placeholder="WP, Öhlins..." className="bg-zinc-800 border-zinc-700 h-9 text-sm" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
          <DialogFooter className="shrink-0 border-t border-zinc-800 bg-zinc-900 px-6 py-4 sm:justify-between">
            <Button variant="outline" onClick={() => setIsAddMotoDialogOpen(false)} className="border-zinc-700 text-zinc-300">
              Annuler
            </Button>
            <Button onClick={handleCreateMoto} disabled={!newMoto.brand || !newMoto.model || isLoading} className="bg-purple-600 hover:bg-purple-500 min-w-36">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />} Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
