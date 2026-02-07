"use client";

import { useState, useEffect, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { 
  FullSuspensionAdjuster, 
  type SuspensionSettings, 
  type SuspensionRanges 
} from "./suspension-adjuster";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Sliders, 
  Bookmark, 
  Plus,
  Check,
  Settings2,
  Info,
  Loader2,
  Clock,
  Trash2,
  Download,
} from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";
import { getForkBrands, getShockBrands, getForkModelsForBrand, getShockModelsForBrand } from "@/data/suspension-brands";
import { getStockSuspension } from "@/data/moto-models";

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

interface KitInfo {
  name: string;
  description?: string;
  terrainType?: string;
  sportType?: string;
  country?: string;
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
}

interface ClickersPanelProps {
  motoId: Id<"motos">;
  kitId: Id<"suspensionKits">;
  initialSettings: SuspensionSettings;
  ranges: SuspensionRanges;
  forkBrand?: string;
  shockBrand?: string;
  kitName: string;
  isDefault?: boolean;
  motoBrand?: string;
  motoModel?: string;
  // Kit info for editing
  initialKitInfo?: KitInfo;
}

export function ClickersPanel({
  motoId,
  kitId,
  initialSettings,
  ranges,
  forkBrand,
  shockBrand,
  kitName,
  isDefault,
  motoBrand,
  motoModel,
  initialKitInfo,
}: ClickersPanelProps) {
  // État local des réglages
  const [settings, setSettings] = useState<SuspensionSettings>(initialSettings);
  const [baselineSettings, setBaselineSettings] = useState<SuspensionSettings | undefined>();
  const [showSaveBaselineDialog, setShowSaveBaselineDialog] = useState(false);
  const [lastSaved, setLastSaved] = useState<SuspensionSettings>(initialSettings);
  
  // Kit info state
  const [kitInfo, setKitInfo] = useState<KitInfo>(initialKitInfo || { name: kitName });
  const [isSavingInfo, setIsSavingInfo] = useState(false);
  const [infoSaved, setInfoSaved] = useState(true);
  
  // Configs state
  const [isApplyingConfig, setIsApplyingConfig] = useState<Id<"configs"> | null>(null);
  
  // Queries
  const kitConfigs = useQuery(api.configs.getByKit, { kitId });
  
  // Mutations Convex
  const updateKit = useMutation(api.suspensionKits.update);
  const deleteConfig = useMutation(api.configs.remove);
  
  // Track unsaved kit info changes
  useEffect(() => {
    if (initialKitInfo) {
      const hasChanges = JSON.stringify(kitInfo) !== JSON.stringify(initialKitInfo);
      setInfoSaved(!hasChanges);
    }
  }, [kitInfo, initialKitInfo]);
  
  // Save kit info
  const handleSaveKitInfo = async () => {
    setIsSavingInfo(true);
    try {
      await updateKit({
        kitId,
        name: kitInfo.name,
        description: kitInfo.description || undefined,
        terrainType: kitInfo.terrainType || undefined,
        sportType: kitInfo.sportType || undefined,
        country: kitInfo.country || undefined,
        isStockSuspension: kitInfo.isStockSuspension,
        forkBrand: kitInfo.forkBrand || undefined,
        forkModel: kitInfo.forkModel || undefined,
        shockBrand: kitInfo.shockBrand || undefined,
        shockModel: kitInfo.shockModel || undefined,
        forkSpringRate: kitInfo.forkSpringRate || undefined,
        shockSpringRate: kitInfo.shockSpringRate || undefined,
        forkOilWeight: kitInfo.forkOilWeight || undefined,
        forkOilLevel: kitInfo.forkOilLevel || undefined,
        valvingNotes: kitInfo.valvingNotes || undefined,
        otherMods: kitInfo.otherMods || undefined,
      });
      setInfoSaved(true);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
    } finally {
      setIsSavingInfo(false);
    }
  };
  
  // Auto-save when settings change (with debounce)
  
  // Auto-save when settings change (with debounce)
  useEffect(() => {
    // Don't save if settings match lastSaved
    if (
      settings.forkCompression === lastSaved.forkCompression &&
      settings.forkRebound === lastSaved.forkRebound &&
      settings.shockCompressionLow === lastSaved.shockCompressionLow &&
      settings.shockCompressionHigh === lastSaved.shockCompressionHigh &&
      settings.shockRebound === lastSaved.shockRebound
    ) {
      return;
    }

    const saveTimeout = setTimeout(async () => {
      try {
        await updateKit({
          kitId,
          forkCompression: settings.forkCompression,
          forkRebound: settings.forkRebound,
          shockCompressionLow: settings.shockCompressionLow,
          shockCompressionHigh: settings.shockCompressionHigh,
          shockRebound: settings.shockRebound,
        });
        setLastSaved(settings);
      } catch (error) {
        console.error("Erreur lors de la sauvegarde:", error);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(saveTimeout);
  }, [settings, lastSaved, kitId, updateKit]);

  // Appliquer la baseline
  const applyBaseline = useCallback(() => {
    if (baselineSettings) {
      setSettings(baselineSettings);
    }
  }, [baselineSettings]);

  // Appliquer une config sauvegardée
  const applyConfig = useCallback(async (config: {
    _id: Id<"configs">;
    forkCompression?: number;
    forkRebound?: number;
    shockCompressionLow?: number;
    shockCompressionHigh?: number;
    shockRebound?: number;
  }) => {
    setIsApplyingConfig(config._id);
    try {
      const newSettings: SuspensionSettings = {
        forkCompression: config.forkCompression ?? settings.forkCompression,
        forkRebound: config.forkRebound ?? settings.forkRebound,
        shockCompressionLow: config.shockCompressionLow ?? settings.shockCompressionLow,
        shockCompressionHigh: config.shockCompressionHigh ?? settings.shockCompressionHigh,
        shockRebound: config.shockRebound ?? settings.shockRebound,
      };
      setSettings(newSettings);
      // The auto-save will handle persisting to DB
    } finally {
      setTimeout(() => setIsApplyingConfig(null), 500);
    }
  }, [settings]);

  // Supprimer une config
  const handleDeleteConfig = async (configId: Id<"configs">) => {
    if (!confirm("Supprimer cette config ?")) return;
    await deleteConfig({ configId });
  };

  return (
    <div className="space-y-6">
      {/* Header avec info moto */}
      <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
        <div className="flex items-center gap-4">
          {motoBrand && <BrandLogo brand={motoBrand} size="lg" />}
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-purple-500" />
              {kitName}
            </h2>
            <p className="text-sm text-zinc-500">
              {motoBrand} {motoModel}
              {isDefault && (
                <span className="ml-2 inline-flex items-center gap-1 text-yellow-400">
                  <Star className="h-3 w-3 fill-yellow-400" />
                  Kit par défaut
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Info suspensions */}
          <div className="text-right text-xs text-zinc-500">
            <p>Fourche: {forkBrand || "Standard"}</p>
            <p>Amortisseur: {shockBrand || "Standard"}</p>
          </div>
        </div>
      </div>

      {/* Tabs principales */}
      <Tabs defaultValue="current" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-zinc-900 border border-zinc-800">
          <TabsTrigger value="current" className="gap-2 data-[state=active]:bg-purple-600">
            <Sliders className="h-4 w-4" />
            Config actuelle
          </TabsTrigger>
          <TabsTrigger value="configs" className="gap-2 data-[state=active]:bg-purple-600">
            <Bookmark className="h-4 w-4" />
            Configs
          </TabsTrigger>
          <TabsTrigger value="info" className="gap-2 data-[state=active]:bg-purple-600">
            <Info className="h-4 w-4" />
            Info du kit
          </TabsTrigger>
        </TabsList>

        {/* Tab Configs */}
        <TabsContent value="configs" className="mt-6">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Bookmark className="h-5 w-5 text-purple-400" />
                Configs sauvegardées
              </h3>
              <span className="text-sm text-zinc-500">
                {kitConfigs?.length || 0} config{(kitConfigs?.length || 0) > 1 ? 's' : ''}
              </span>
            </div>

            {kitConfigs && kitConfigs.length > 0 ? (
              <div className="space-y-3">
                {kitConfigs.map((config) => (
                  <div 
                    key={config._id}
                    className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800 hover:border-purple-500/30 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-white">{config.name}</h4>
                        <div className="flex items-center gap-2 text-xs text-zinc-500 mt-1">
                          <Clock className="h-3 w-3" />
                          {new Date(config.createdAt).toLocaleDateString('fr-FR', { 
                            day: 'numeric', 
                            month: 'long',
                            year: 'numeric'
                          })}
                          {config.terrainType && (
                            <>
                              <span>•</span>
                              <span className="text-amber-400">{config.terrainType}</span>
                            </>
                          )}
                          {config.sportType && (
                            <>
                              <span>•</span>
                              <span className="text-blue-400">{config.sportType}</span>
                            </>
                          )}
                        </div>
                        {config.description && (
                          <p className="text-xs text-zinc-500 mt-2">{config.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => applyConfig(config)}
                          disabled={isApplyingConfig === config._id}
                          className="bg-purple-600 hover:bg-purple-500 gap-1"
                        >
                          {isApplyingConfig === config._id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Download className="h-3 w-3" />
                          )}
                          Charger
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteConfig(config._id)}
                          className="h-8 w-8 text-zinc-500 hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Valeurs de la config - même style que l'onglet Ajustements */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* Fourche */}
                      <div className="p-3 bg-zinc-800/50 rounded-lg">
                        <p className="text-[10px] text-blue-400 uppercase tracking-wider font-medium mb-2">Fourche</p>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="text-center p-2 bg-zinc-900/50 rounded">
                            <p className="text-lg font-bold text-white">{config.forkCompression ?? '-'}</p>
                            <p className="text-[9px] text-zinc-500">Compression</p>
                          </div>
                          <div className="text-center p-2 bg-zinc-900/50 rounded">
                            <p className="text-lg font-bold text-white">{config.forkRebound ?? '-'}</p>
                            <p className="text-[9px] text-zinc-500">Détente</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Amortisseur */}
                      <div className="p-3 bg-zinc-800/50 rounded-lg">
                        <p className="text-[10px] text-amber-400 uppercase tracking-wider font-medium mb-2">Amortisseur</p>
                        <div className="grid grid-cols-3 gap-1">
                          <div className="text-center p-2 bg-zinc-900/50 rounded">
                            <p className={`text-lg font-bold ${(config.shockCompressionLow ?? 0) > 0 ? 'text-amber-400' : (config.shockCompressionLow ?? 0) < 0 ? 'text-blue-400' : 'text-white'}`}>
                              {config.shockCompressionLow !== undefined ? (config.shockCompressionLow > 0 ? `+${config.shockCompressionLow}` : config.shockCompressionLow) : '-'}
                            </p>
                            <p className="text-[9px] text-zinc-500">BV</p>
                          </div>
                          <div className="text-center p-2 bg-zinc-900/50 rounded">
                            <p className={`text-lg font-bold ${(config.shockCompressionHigh ?? 0) > 0 ? 'text-amber-400' : (config.shockCompressionHigh ?? 0) < 0 ? 'text-blue-400' : 'text-white'}`}>
                              {config.shockCompressionHigh !== undefined ? (config.shockCompressionHigh > 0 ? `+${config.shockCompressionHigh}` : config.shockCompressionHigh) : '-'}
                            </p>
                            <p className="text-[9px] text-zinc-500">HV</p>
                          </div>
                          <div className="text-center p-2 bg-zinc-900/50 rounded">
                            <p className="text-lg font-bold text-white">{config.shockRebound ?? '-'}</p>
                            <p className="text-[9px] text-zinc-500">Détente</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-zinc-900/30 rounded-xl border border-zinc-800">
                <Bookmark className="h-12 w-12 mx-auto mb-4 text-zinc-700" />
                <p className="text-zinc-400 mb-2">Aucune config sauvegardée</p>
                <p className="text-xs text-zinc-600">
                  Utilise le chat IA pour générer des configs personnalisées
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab Config actuelle */}
        <TabsContent value="current" className="mt-6">
          <FullSuspensionAdjuster
            settings={settings}
            ranges={ranges}
            baselineSettings={baselineSettings}
            onSettingsChange={setSettings}
          />

          {/* Charger/Sauvegarder baseline */}
          <div className="mt-6 p-4 bg-zinc-900/30 rounded-xl border border-zinc-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bookmark className="h-4 w-4 text-purple-500" />
                <span className="text-sm text-zinc-400">Baseline de référence</span>
              </div>
              <div className="flex items-center gap-2">
                {baselineSettings ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={applyBaseline}
                      className="gap-1 border-zinc-700 text-xs"
                    >
                      <Check className="h-3 w-3" />
                      Appliquer
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setBaselineSettings(undefined)}
                      className="text-xs text-zinc-500"
                    >
                      Retirer
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSaveBaselineDialog(true)}
                    className="gap-1 border-zinc-700 text-xs"
                  >
                    <Plus className="h-3 w-3" />
                    Définir actuel comme baseline
                  </Button>
                )}
              </div>
            </div>
            {baselineSettings && (
              <div className="mt-3 grid grid-cols-5 gap-2 text-xs">
                <div className="p-2 bg-zinc-800/50 rounded text-center">
                  <p className="text-zinc-500">Fork Comp</p>
                  <p className="text-white font-medium">{baselineSettings.forkCompression}</p>
                </div>
                <div className="p-2 bg-zinc-800/50 rounded text-center">
                  <p className="text-zinc-500">Fork Reb</p>
                  <p className="text-white font-medium">{baselineSettings.forkRebound}</p>
                </div>
                <div className="p-2 bg-zinc-800/50 rounded text-center">
                  <p className="text-zinc-500">Shock BV</p>
                  <p className="text-white font-medium">{baselineSettings.shockCompressionLow}</p>
                </div>
                <div className="p-2 bg-zinc-800/50 rounded text-center">
                  <p className="text-zinc-500">Shock HV</p>
                  <p className="text-white font-medium">{baselineSettings.shockCompressionHigh}</p>
                </div>
                <div className="p-2 bg-zinc-800/50 rounded text-center">
                  <p className="text-zinc-500">Shock Reb</p>
                  <p className="text-white font-medium">{baselineSettings.shockRebound}</p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab Info du kit */}
        <TabsContent value="info" className="mt-6">
          <div className="space-y-6 max-w-3xl mx-auto">
            {/* Nom et Description */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-400">Nom du kit *</Label>
                <Input 
                  value={kitInfo.name} 
                  onChange={(e) => setKitInfo(prev => ({ ...prev, name: e.target.value }))} 
                  placeholder="Ex: Setup Sable Maroc" 
                  className="bg-zinc-800 border-zinc-700" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400">Pays/Région</Label>
                <Input 
                  value={kitInfo.country || ""} 
                  onChange={(e) => setKitInfo(prev => ({ ...prev, country: e.target.value }))} 
                  placeholder="Ex: France, Maroc..." 
                  className="bg-zinc-800 border-zinc-700" 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400">Description</Label>
              <Input 
                value={kitInfo.description || ""} 
                onChange={(e) => setKitInfo(prev => ({ ...prev, description: e.target.value }))} 
                placeholder="Notes sur ce kit..." 
                className="bg-zinc-800 border-zinc-700" 
              />
            </div>
            
            {/* Type de sport et terrain */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-400">Type de sport</Label>
                <select 
                  value={kitInfo.sportType || ""} 
                  onChange={(e) => setKitInfo(prev => ({ ...prev, sportType: e.target.value }))} 
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                >
                  <option value="">Sélectionner</option>
                  {SPORT_TYPES.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400">Type de terrain</Label>
                <select 
                  value={kitInfo.terrainType || ""} 
                  onChange={(e) => setKitInfo(prev => ({ ...prev, terrainType: e.target.value }))} 
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                >
                  <option value="">Sélectionner</option>
                  {TERRAIN_TYPES.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                </select>
              </div>
            </div>
            
            <Separator className="bg-zinc-800" />
            
            {/* Suspension modifiée */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="stockSuspensionPanel" 
                  checked={!kitInfo.isStockSuspension} 
                  onChange={(e) => setKitInfo(prev => ({ ...prev, isStockSuspension: !e.target.checked }))} 
                  className="w-4 h-4 rounded border-zinc-600 bg-zinc-800" 
                />
                <Label htmlFor="stockSuspensionPanel" className="text-zinc-300">Suspension modifiée (aftermarket)</Label>
              </div>
              {!kitInfo.isStockSuspension && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-zinc-800/50 rounded-lg">
                  <div className="space-y-2">
                    <Label className="text-zinc-400">Marque fourche</Label>
                    <Input 
                      value={kitInfo.forkBrand || ""} 
                      onChange={(e) => setKitInfo(prev => ({ ...prev, forkBrand: e.target.value }))} 
                      placeholder="Ex: WP, KYB, Öhlins..." 
                      className="bg-zinc-800 border-zinc-700" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-400">Modèle fourche</Label>
                    <Input 
                      value={kitInfo.forkModel || ""} 
                      onChange={(e) => setKitInfo(prev => ({ ...prev, forkModel: e.target.value }))} 
                      placeholder="Ex: XACT Pro..." 
                      className="bg-zinc-800 border-zinc-700" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-400">Marque amortisseur</Label>
                    <Input 
                      value={kitInfo.shockBrand || ""} 
                      onChange={(e) => setKitInfo(prev => ({ ...prev, shockBrand: e.target.value }))} 
                      placeholder="Ex: WP, KYB, Öhlins..." 
                      className="bg-zinc-800 border-zinc-700" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-400">Modèle amortisseur</Label>
                    <Input 
                      value={kitInfo.shockModel || ""} 
                      onChange={(e) => setKitInfo(prev => ({ ...prev, shockModel: e.target.value }))} 
                      placeholder="Ex: TTX Flow..." 
                      className="bg-zinc-800 border-zinc-700" 
                    />
                  </div>
                </div>
              )}
            </div>
            
            <Separator className="bg-zinc-800" />
            
            {/* Specs techniques */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-400">Ressort fourche</Label>
                <Input 
                  value={kitInfo.forkSpringRate || ""} 
                  onChange={(e) => setKitInfo(prev => ({ ...prev, forkSpringRate: e.target.value }))} 
                  placeholder="Ex: 0.44 kg/mm" 
                  className="bg-zinc-800 border-zinc-700" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400">Ressort amortisseur</Label>
                <Input 
                  value={kitInfo.shockSpringRate || ""} 
                  onChange={(e) => setKitInfo(prev => ({ ...prev, shockSpringRate: e.target.value }))} 
                  placeholder="Ex: 48 N/mm" 
                  className="bg-zinc-800 border-zinc-700" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400">Huile fourche</Label>
                <Input 
                  value={kitInfo.forkOilWeight || ""} 
                  onChange={(e) => setKitInfo(prev => ({ ...prev, forkOilWeight: e.target.value }))} 
                  placeholder="Ex: 5W" 
                  className="bg-zinc-800 border-zinc-700" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400">Niveau huile</Label>
                <Input 
                  value={kitInfo.forkOilLevel || ""} 
                  onChange={(e) => setKitInfo(prev => ({ ...prev, forkOilLevel: e.target.value }))} 
                  placeholder="Ex: 130mm" 
                  className="bg-zinc-800 border-zinc-700" 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400">Notes valving</Label>
              <Input 
                value={kitInfo.valvingNotes || ""} 
                onChange={(e) => setKitInfo(prev => ({ ...prev, valvingNotes: e.target.value }))} 
                placeholder="Notes sur le valving..." 
                className="bg-zinc-800 border-zinc-700" 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400">Autres modifications</Label>
              <Input 
                value={kitInfo.otherMods || ""} 
                onChange={(e) => setKitInfo(prev => ({ ...prev, otherMods: e.target.value }))} 
                placeholder="Autres mods..." 
                className="bg-zinc-800 border-zinc-700" 
              />
            </div>
            
            {/* Save button */}
            <Button 
              onClick={handleSaveKitInfo} 
              disabled={!kitInfo.name || isSavingInfo || infoSaved} 
              className="w-full bg-purple-600 hover:bg-purple-500"
            >
              {isSavingInfo ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : infoSaved ? (
                <Check className="h-4 w-4 mr-2" />
              ) : null}
              {infoSaved ? "Sauvegardé" : "Sauvegarder les infos"}
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog pour sauvegarder baseline */}
      <Dialog open={showSaveBaselineDialog} onOpenChange={setShowSaveBaselineDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">Définir comme baseline</DialogTitle>
            <DialogDescription>
              La baseline servira de référence pour afficher les différences et guider vos ajustements.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-zinc-400 mb-4">
              Réglages actuels qui seront définis comme baseline:
            </p>
            <div className="grid grid-cols-5 gap-2 text-xs">
              <div className="p-3 bg-zinc-800 rounded text-center">
                <p className="text-zinc-500">Fork Comp</p>
                <p className="text-white font-bold text-lg">{settings.forkCompression}</p>
              </div>
              <div className="p-3 bg-zinc-800 rounded text-center">
                <p className="text-zinc-500">Fork Reb</p>
                <p className="text-white font-bold text-lg">{settings.forkRebound}</p>
              </div>
              <div className="p-3 bg-zinc-800 rounded text-center">
                <p className="text-zinc-500">Shock BV</p>
                <p className="text-white font-bold text-lg">{settings.shockCompressionLow}</p>
              </div>
              <div className="p-3 bg-zinc-800 rounded text-center">
                <p className="text-zinc-500">Shock HV</p>
                <p className="text-white font-bold text-lg">{settings.shockCompressionHigh}</p>
              </div>
              <div className="p-3 bg-zinc-800 rounded text-center">
                <p className="text-zinc-500">Shock Reb</p>
                <p className="text-white font-bold text-lg">{settings.shockRebound}</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSaveBaselineDialog(false)}
              className="border-zinc-700"
            >
              Annuler
            </Button>
            <Button
              onClick={() => {
                setBaselineSettings({ ...settings });
                setShowSaveBaselineDialog(false);
              }}
              className="bg-purple-600 hover:bg-purple-500"
            >
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
