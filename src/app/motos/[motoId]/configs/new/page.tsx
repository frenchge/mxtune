"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { useCurrentUser } from "@/hooks/use-current-user";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { BrandLogo } from "@/components/ui/brand-logo";
import { FullSuspensionAdjuster, SuspensionRanges, SuspensionSettings } from "@/components/clickers/suspension-adjuster";
import { ArrowLeft, Bike, Loader2, Save } from "lucide-react";
import { SignInButton, useAuth } from "@clerk/nextjs";

const SPORT_TYPES = [
  { value: "enduro", label: "Enduro" },
  { value: "motocross", label: "Motocross" },
  { value: "supermoto", label: "Supermoto" },
  { value: "trail", label: "Trail" },
];

const TERRAIN_TYPES = [
  { value: "sable", label: "Sable" },
  { value: "boue", label: "Boue" },
  { value: "dur", label: "Terrain dur" },
  { value: "rocailleux", label: "Rocailleux" },
  { value: "mixte", label: "Mixte" },
];

type KitLike = {
  _id: Id<"suspensionKits">;
  name: string;
  description?: string;
  sportType?: string;
  terrainType?: string;
  isDefault?: boolean;
  forkCompression?: number;
  forkRebound?: number;
  shockCompressionLow?: number;
  shockCompressionHigh?: number;
  shockRebound?: number;
  baseForkCompression?: number;
  baseForkRebound?: number;
  baseShockCompressionLow?: number;
  baseShockCompressionHigh?: number;
  baseShockRebound?: number;
  maxForkCompression?: number;
  maxForkRebound?: number;
  maxShockCompressionLow?: number;
  maxShockCompressionHigh?: number;
  maxShockRebound?: number;
};

function readNumber(value: number | undefined, fallback: number): number {
  return typeof value === "number" ? value : fallback;
}

function getSettingsFromKit(kit: KitLike | null | undefined): SuspensionSettings {
  return {
    forkCompression: readNumber(kit?.forkCompression, readNumber(kit?.baseForkCompression, 0)),
    forkRebound: readNumber(kit?.forkRebound, readNumber(kit?.baseForkRebound, 0)),
    shockCompressionLow: readNumber(kit?.shockCompressionLow, readNumber(kit?.baseShockCompressionLow, 0)),
    shockCompressionHigh: readNumber(kit?.shockCompressionHigh, readNumber(kit?.baseShockCompressionHigh, 0)),
    shockRebound: readNumber(kit?.shockRebound, readNumber(kit?.baseShockRebound, 0)),
  };
}

function getBaselineFromKit(kit: KitLike | null | undefined): SuspensionSettings {
  return {
    forkCompression: readNumber(kit?.baseForkCompression, 0),
    forkRebound: readNumber(kit?.baseForkRebound, 0),
    shockCompressionLow: readNumber(kit?.baseShockCompressionLow, 0),
    shockCompressionHigh: readNumber(kit?.baseShockCompressionHigh, 0),
    shockRebound: readNumber(kit?.baseShockRebound, 0),
  };
}

function getRangesFromKit(kit: KitLike | null | undefined): SuspensionRanges {
  return {
    maxForkCompression: Math.max(1, readNumber(kit?.maxForkCompression, 25)),
    maxForkRebound: Math.max(1, readNumber(kit?.maxForkRebound, 25)),
    maxShockCompressionLow: Math.max(1, readNumber(kit?.maxShockCompressionLow, 25)),
    maxShockCompressionHigh: Math.max(1, readNumber(kit?.maxShockCompressionHigh, 6)),
    maxShockRebound: Math.max(1, readNumber(kit?.maxShockRebound, 25)),
  };
}

export default function NewManualConfigPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { user } = useCurrentUser();

  const motoId = params.motoId as Id<"motos">;
  const queryKitId = searchParams.get("kitId") as Id<"suspensionKits"> | null;

  const moto = useQuery(api.motos.getById, { motoId });
  const createConfig = useMutation(api.configs.create);

  const [selectedKitId, setSelectedKitId] = useState<Id<"suspensionKits"> | null>(null);
  const [configName, setConfigName] = useState("");
  const [description, setDescription] = useState("");
  const [sportType, setSportType] = useState("");
  const [terrainType, setTerrainType] = useState("");
  const [settings, setSettings] = useState<SuspensionSettings>({
    forkCompression: 0,
    forkRebound: 0,
    shockCompressionLow: 0,
    shockCompressionHigh: 0,
    shockRebound: 0,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!moto) return;

    const hasSelectedKit = selectedKitId && moto.kits.some((kit) => kit._id === selectedKitId);
    if (hasSelectedKit) return;

    const requestedKit = queryKitId ? moto.kits.find((kit) => kit._id === queryKitId) : undefined;
    const fallbackKit = requestedKit || moto.kits.find((kit) => kit.isDefault) || moto.kits[0];
    setSelectedKitId(fallbackKit?._id ?? null);
  }, [moto, selectedKitId, queryKitId]);

  const selectedKit = useMemo(
    () => moto?.kits.find((kit) => kit._id === selectedKitId),
    [moto?.kits, selectedKitId]
  );

  const ranges = useMemo(() => getRangesFromKit(selectedKit), [selectedKit]);
  const baselineSettings = useMemo(() => getBaselineFromKit(selectedKit), [selectedKit]);

  useEffect(() => {
    if (!selectedKit) return;
    const formattedDate = new Date().toLocaleDateString("fr-FR");

    setSettings(getSettingsFromKit(selectedKit));
    setDescription(selectedKit.description || "");
    setSportType(selectedKit.sportType || "");
    setTerrainType(selectedKit.terrainType || "");
    setConfigName(`Config ${selectedKit.name} - ${formattedDate}`);
  }, [selectedKit?._id]);

  const handleReset = () => {
    if (!selectedKit) return;
    setSettings(getSettingsFromKit(selectedKit));
  };

  const handleSave = async () => {
    if (!user?._id || !moto || !selectedKitId || !configName.trim()) return;

    setIsSaving(true);
    try {
      await createConfig({
        motoId: moto._id,
        suspensionKitId: selectedKitId,
        name: configName.trim(),
        description: description.trim() || undefined,
        sportType: sportType || undefined,
        terrainType: terrainType || undefined,
        forkCompression: settings.forkCompression,
        forkRebound: settings.forkRebound,
        shockCompressionLow: settings.shockCompressionLow,
        shockCompressionHigh: settings.shockCompressionHigh,
        shockRebound: settings.shockRebound,
        riderWeight: user.weight,
        riderLevel: user.level,
        riderStyle: user.style,
        riderObjective: user.objective,
        visibility: "private",
      });

      router.push("/motos");
    } catch (error) {
      console.error("Erreur lors de la création de la config:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!authLoaded) {
    return (
      <SidebarProvider>
        <div className="h-screen flex w-full bg-zinc-950 overflow-hidden">
          <AppSidebar />
          <SidebarInset className="flex-1 overflow-hidden">
            <div className="h-full flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            </div>
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
            <div className="h-full flex items-center justify-center">
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

  if (moto === undefined) {
    return (
      <SidebarProvider>
        <div className="h-screen flex w-full bg-zinc-950 overflow-hidden">
          <AppSidebar />
          <SidebarInset className="flex-1 overflow-hidden">
            <div className="h-full flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  if (moto === null) {
    return (
      <SidebarProvider>
        <div className="h-screen flex w-full bg-zinc-950 overflow-hidden">
          <AppSidebar />
          <SidebarInset className="flex-1 overflow-hidden">
            <div className="h-full flex flex-col items-center justify-center gap-4">
              <Bike className="h-16 w-16 text-zinc-600" />
              <h2 className="text-xl font-semibold text-white">Moto introuvable</h2>
              <Button onClick={() => router.push("/motos")} className="bg-purple-600 hover:bg-purple-500">
                Retour à mes motos
              </Button>
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
        <SidebarInset className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            <div className="max-w-6xl mx-auto px-6 py-6 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push("/motos")}
                    className="text-zinc-400 hover:text-white hover:bg-zinc-800"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <BrandLogo brand={moto.brand} size="md" />
                  <div className="min-w-0">
                    <h1 className="text-2xl font-bold text-white truncate">
                      {moto.brand} {moto.model} {moto.year}
                    </h1>
                    <p className="text-sm text-zinc-500">Création manuelle d&apos;une config</p>
                  </div>
                </div>
              </div>

              <Card className="bg-zinc-900/60 border-zinc-800">
                <CardContent className="p-5 space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-zinc-400">Nom de la config</Label>
                      <Input
                        value={configName}
                        onChange={(e) => setConfigName(e.target.value)}
                        placeholder="Ex: MX Sable"
                        className="bg-zinc-800 border-zinc-700 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-zinc-400">Kit suspension</Label>
                      <select
                        value={selectedKitId || ""}
                        onChange={(e) =>
                          setSelectedKitId(
                            e.target.value ? (e.target.value as Id<"suspensionKits">) : null
                          )
                        }
                        className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 text-sm text-white"
                      >
                        {moto.kits.map((kit) => (
                          <option key={kit._id} value={kit._id}>
                            {kit.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-zinc-400">Type de sport</Label>
                      <select
                        value={sportType}
                        onChange={(e) => setSportType(e.target.value)}
                        className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 text-sm text-white"
                      >
                        <option value="">Sélectionner</option>
                        {SPORT_TYPES.map((sport) => (
                          <option key={sport.value} value={sport.value}>
                            {sport.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-zinc-400">Type de terrain</Label>
                      <select
                        value={terrainType}
                        onChange={(e) => setTerrainType(e.target.value)}
                        className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 text-sm text-white"
                      >
                        <option value="">Sélectionner</option>
                        {TERRAIN_TYPES.map((terrain) => (
                          <option key={terrain.value} value={terrain.value}>
                            {terrain.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-zinc-400">Description</Label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Contexte de roulage, sensations, objectif..."
                      className="h-20 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-500 resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={handleReset}
                      className="border-zinc-700 bg-zinc-900 hover:bg-zinc-800"
                    >
                      Réinitialiser
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={!selectedKitId || !configName.trim() || isSaving}
                      className="bg-purple-600 hover:bg-purple-500"
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Sauver
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <FullSuspensionAdjuster
                settings={settings}
                ranges={ranges}
                baselineSettings={baselineSettings}
                onSettingsChange={setSettings}
              />
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
