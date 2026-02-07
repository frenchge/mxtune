"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Bike, ChevronDown, Plus, Check, Loader2, Settings2, Star } from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";
import { BRANDS, getModelsForBrand, getYearsForBrand } from "@/data/moto-models";
import { BrandLogo } from "@/components/ui/brand-logo";

interface MotoSelectorProps {
  selectedMotoId?: Id<"motos">;
  selectedKitId?: Id<"suspensionKits">;
  onSelectMoto: (motoId: Id<"motos">, kitId?: Id<"suspensionKits">) => void;
}

export function MotoSelector({ selectedMotoId, selectedKitId, onSelectMoto }: MotoSelectorProps) {
  const { user } = useCurrentUser();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const motos = useQuery(
    api.motos.getByUser,
    user?._id ? { userId: user._id } : "skip"
  );

  const createMoto = useMutation(api.motos.create);

  const selectedMoto = motos?.find((m) => m._id === selectedMotoId);
  const selectedKit = selectedMoto?.kits?.find((k) => k._id === selectedKitId);

  const [newMoto, setNewMoto] = useState({
    brand: "",
    model: "",
    year: 2024,
    forkBrand: "",
    forkModel: "",
    shockBrand: "",
    shockModel: "",
  });

  // Réinitialiser modèle et année quand la marque change
  useEffect(() => {
    if (newMoto.brand) {
      const years = getYearsForBrand(newMoto.brand);
      setNewMoto(prev => ({ 
        ...prev, 
        model: "", 
        year: years[0] || 2024 
      }));
    }
  }, [newMoto.brand]);

  const availableModels = newMoto.brand ? getModelsForBrand(newMoto.brand) : [];
  const availableYears = newMoto.brand ? getYearsForBrand(newMoto.brand) : [];

  const handleCreate = async () => {
    if (!user?._id || !newMoto.brand || !newMoto.model) return;

    setIsLoading(true);
    try {
      const motoId = await createMoto({
        userId: user._id,
        brand: newMoto.brand,
        model: newMoto.model,
        year: newMoto.year,
        forkBrand: newMoto.forkBrand || undefined,
        forkModel: newMoto.forkModel || undefined,
        shockBrand: newMoto.shockBrand || undefined,
        shockModel: newMoto.shockModel || undefined,
      });
      setIsDialogOpen(false);
      setNewMoto({
        brand: "",
        model: "",
        year: 2024,
        forkBrand: "",
        forkModel: "",
        shockBrand: "",
        shockModel: "",
      });
      onSelectMoto(motoId);
    } catch (error) {
      console.error("Erreur lors de la création:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="h-9 gap-2 bg-zinc-800 border-zinc-700 hover:bg-zinc-700 hover:border-zinc-600 text-white"
          >
            {selectedMoto ? (
              <BrandLogo brand={selectedMoto.brand} size="sm" />
            ) : (
              <Bike className="h-4 w-4 text-purple-500" />
            )}
            <span className="max-w-[200px] truncate">
              {selectedMoto
                ? selectedKit 
                  ? `${selectedMoto.brand} ${selectedMoto.model} • ${selectedKit.name}`
                  : `${selectedMoto.brand} ${selectedMoto.model}`
                : "Sélectionner une moto"}
            </span>
            <ChevronDown className="h-4 w-4 text-zinc-400" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-[280px] bg-zinc-900 border-zinc-800"
        >
          {motos && motos.length > 0 ? (
            <>
              {motos.map((moto) => (
                moto.kits && moto.kits.length > 0 ? (
                  <DropdownMenuSub key={moto._id}>
                    <DropdownMenuSubTrigger className="flex items-center justify-between cursor-pointer hover:bg-zinc-800 data-[state=open]:bg-zinc-800">
                      <div className="flex items-center gap-2">
                        <BrandLogo brand={moto.brand} size="sm" />
                        <div>
                          <p className="text-sm font-medium">
                            {moto.brand} {moto.model}
                          </p>
                          <p className="text-xs text-zinc-500">{moto.year} • {moto.kits.length} kit{moto.kits.length > 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      {selectedMotoId === moto._id && !selectedKitId && (
                        <Check className="h-4 w-4 text-purple-500 mr-2" />
                      )}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="bg-zinc-900 border-zinc-800 min-w-[200px]">
                      {/* Option pour sélectionner la moto sans kit spécifique */}
                      <DropdownMenuItem
                        onClick={() => onSelectMoto(moto._id, undefined)}
                        className="flex items-center justify-between cursor-pointer hover:bg-zinc-800"
                      >
                        <div className="flex items-center gap-2">
                          <Bike className="h-4 w-4 text-zinc-400" />
                          <span className="text-sm">Kit par défaut</span>
                        </div>
                        {selectedMotoId === moto._id && !selectedKitId && (
                          <Check className="h-4 w-4 text-purple-500" />
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-zinc-800" />
                      {/* Liste des kits */}
                      {moto.kits.map((kit) => (
                        <DropdownMenuItem
                          key={kit._id}
                          onClick={() => onSelectMoto(moto._id, kit._id)}
                          className="flex items-center justify-between cursor-pointer hover:bg-zinc-800"
                        >
                          <div className="flex items-center gap-2">
                            <Settings2 className={`h-4 w-4 ${kit.isDefault ? 'text-purple-400' : 'text-zinc-400'}`} />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm">{kit.name}</span>
                                {kit.isDefault && (
                                  <Star className="h-3 w-3 text-yellow-400" />
                                )}
                                {kit.isStockSuspension && (
                                  <span className="text-[9px] bg-purple-500/20 text-purple-400 px-1 py-0.5 rounded">OEM</span>
                                )}
                              </div>
                              {(kit.terrainType || kit.country) && (
                                <p className="text-[10px] text-zinc-500">
                                  {[kit.terrainType, kit.country].filter(Boolean).join(' • ')}
                                </p>
                              )}
                            </div>
                          </div>
                          {selectedKitId === kit._id && (
                            <Check className="h-4 w-4 text-purple-500" />
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                ) : (
                  <DropdownMenuItem
                    key={moto._id}
                    onClick={() => onSelectMoto(moto._id, undefined)}
                    className="flex items-center justify-between cursor-pointer hover:bg-zinc-800"
                  >
                    <div className="flex items-center gap-2">
                      <BrandLogo brand={moto.brand} size="sm" />
                      <div>
                        <p className="text-sm font-medium">
                          {moto.brand} {moto.model}
                        </p>
                        <p className="text-xs text-zinc-500">{moto.year}</p>
                      </div>
                    </div>
                    {selectedMotoId === moto._id && (
                      <Check className="h-4 w-4 text-purple-500" />
                    )}
                  </DropdownMenuItem>
                )
              ))}
              <DropdownMenuSeparator className="bg-zinc-800" />
            </>
          ) : (
            <div className="px-2 py-3 text-center text-sm text-zinc-500">
              Aucune moto dans ton garage
            </div>
          )}

          <DropdownMenuItem
            onClick={() => setIsDialogOpen(true)}
            className="cursor-pointer hover:bg-zinc-800 text-purple-400"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une moto
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialog pour ajouter une moto */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Bike className="h-5 w-5 text-purple-500" />
              Ajouter une moto
            </DialogTitle>
            <DialogDescription>
              Ajoute les informations de ta moto pour obtenir une config personnalisée
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">
                  Marque *
                </label>
                <select
                  value={newMoto.brand}
                  onChange={(e) =>
                    setNewMoto({ ...newMoto, brand: e.target.value, model: "" })
                  }
                  className="w-full p-2 rounded-md bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Sélectionner...</option>
                  {BRANDS.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">
                  Modèle *
                </label>
                <select
                  value={newMoto.model}
                  onChange={(e) =>
                    setNewMoto({ ...newMoto, model: e.target.value })
                  }
                  disabled={!newMoto.brand}
                  className="w-full p-2 rounded-md bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                >
                  <option value="">Sélectionner...</option>
                  {availableModels.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">Année</label>
              <select
                value={newMoto.year}
                onChange={(e) =>
                  setNewMoto({ ...newMoto, year: parseInt(e.target.value) })
                }
                disabled={!newMoto.brand}
                className="w-full p-2 rounded-md bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
              >
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div className="border-t border-zinc-800 pt-4">
              <p className="text-sm text-zinc-400 mb-3">
                Suspensions (optionnel)
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-zinc-500">Marque fourche</label>
                  <Input
                    value={newMoto.forkBrand}
                    onChange={(e) =>
                      setNewMoto({ ...newMoto, forkBrand: e.target.value })
                    }
                    placeholder="Ex: WP"
                    className="bg-zinc-800 border-zinc-700 text-white h-9"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-zinc-500">Modèle fourche</label>
                  <Input
                    value={newMoto.forkModel}
                    onChange={(e) =>
                      setNewMoto({ ...newMoto, forkModel: e.target.value })
                    }
                    placeholder="Ex: XACT 48"
                    className="bg-zinc-800 border-zinc-700 text-white h-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-3">
                <div className="space-y-2">
                  <label className="text-xs text-zinc-500">
                    Marque amortisseur
                  </label>
                  <Input
                    value={newMoto.shockBrand}
                    onChange={(e) =>
                      setNewMoto({ ...newMoto, shockBrand: e.target.value })
                    }
                    placeholder="Ex: WP"
                    className="bg-zinc-800 border-zinc-700 text-white h-9"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-zinc-500">
                    Modèle amortisseur
                  </label>
                  <Input
                    value={newMoto.shockModel}
                    onChange={(e) =>
                      setNewMoto({ ...newMoto, shockModel: e.target.value })
                    }
                    placeholder="Ex: XACT"
                    className="bg-zinc-800 border-zinc-700 text-white h-9"
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={handleCreate}
              disabled={isLoading || !newMoto.brand || !newMoto.model}
              className="w-full bg-purple-500 hover:bg-purple-600 font-bold italic"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Ajouter au garage
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
