"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { 
  clicksToPercentage, 
  getPercentageColor,
  calculateAdjustment,
  DIRECTION_LABELS 
} from "@/lib/clicker-utils";
import { type SuspensionSettings, type SuspensionRanges } from "./suspension-adjuster";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MiniGauge } from "@/components/ui/mini-gauge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  GitCompare, 
  ArrowRight, 
  RotateCcw, 
  RotateCw,
  ChevronDown,
  ChevronUp,
  Check,
} from "lucide-react";

interface SetupCompareProps {
  currentSettings: SuspensionSettings;
  ranges: SuspensionRanges;
  motoId: Id<"motos">;
}

interface ComparisonRow {
  label: string;
  key: keyof SuspensionSettings;
  maxKey: keyof SuspensionRanges;
  currentValue: number;
  compareValue: number;
  maxValue: number;
}

export function SetupCompare({
  currentSettings,
  ranges,
  motoId,
}: SetupCompareProps) {
  const [selectedKitId, setSelectedKitId] = useState<string>("");
  
  // Récupérer la moto avec ses kits pour la comparaison
  const moto = useQuery(api.motos.getById, { motoId });
  
  const selectedKit = moto?.kits?.find(k => k._id === selectedKitId);
  
  const compareSettings: SuspensionSettings | null = selectedKit ? {
    forkCompression: selectedKit.forkCompression ?? 0,
    forkRebound: selectedKit.forkRebound ?? 0,
    shockCompressionLow: selectedKit.shockCompressionLow ?? 0,
    shockCompressionHigh: selectedKit.shockCompressionHigh ?? 0,
    shockRebound: selectedKit.shockRebound ?? 0,
  } : null;

  const comparisons: ComparisonRow[] = compareSettings ? [
    {
      label: "Fourche Compression",
      key: "forkCompression",
      maxKey: "maxForkCompression",
      currentValue: currentSettings.forkCompression,
      compareValue: compareSettings.forkCompression,
      maxValue: ranges.maxForkCompression,
    },
    {
      label: "Fourche Détente",
      key: "forkRebound",
      maxKey: "maxForkRebound",
      currentValue: currentSettings.forkRebound,
      compareValue: compareSettings.forkRebound,
      maxValue: ranges.maxForkRebound,
    },
    {
      label: "Amortisseur Comp. BV",
      key: "shockCompressionLow",
      maxKey: "maxShockCompressionLow",
      currentValue: currentSettings.shockCompressionLow,
      compareValue: compareSettings.shockCompressionLow,
      maxValue: ranges.maxShockCompressionLow,
    },
    {
      label: "Amortisseur Comp. HV",
      key: "shockCompressionHigh",
      maxKey: "maxShockCompressionHigh",
      currentValue: currentSettings.shockCompressionHigh,
      compareValue: compareSettings.shockCompressionHigh,
      maxValue: ranges.maxShockCompressionHigh,
    },
    {
      label: "Amortisseur Détente",
      key: "shockRebound",
      maxKey: "maxShockRebound",
      currentValue: currentSettings.shockRebound,
      compareValue: compareSettings.shockRebound,
      maxValue: ranges.maxShockRebound,
    },
  ] : [];

  const getDiffIcon = (diff: number) => {
    if (diff === 0) return <Check className="h-4 w-4 text-emerald-400" />;
    if (diff > 0) return <ChevronUp className="h-4 w-4 text-blue-400" />;
    return <ChevronDown className="h-4 w-4 text-orange-400" />;
  };

  return (
    <Card className="bg-zinc-900/80 border-zinc-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-white flex items-center gap-2">
          <GitCompare className="h-5 w-5 text-purple-500" />
          Comparer les setups
        </CardTitle>
        <CardDescription>
          Comparez vos réglages actuels avec un autre kit
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sélecteur de kit à comparer */}
        <div className="space-y-2">
          <label className="text-sm text-zinc-400">Kit à comparer</label>
          <Select value={selectedKitId} onValueChange={setSelectedKitId}>
            <SelectTrigger className="bg-zinc-800 border-zinc-700">
              <SelectValue placeholder="Choisir un kit..." />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800">
              {moto?.kits?.map((kit) => (
                <SelectItem key={kit._id} value={kit._id}>
                  {kit.name}
                  {kit.isDefault && " ⭐"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tableau de comparaison */}
        {compareSettings ? (
          <div className="space-y-4">
            {/* Header */}
            <div className="grid grid-cols-12 gap-2 text-xs text-zinc-500 uppercase tracking-wider pb-2 border-b border-zinc-800">
              <div className="col-span-4">Réglage</div>
              <div className="col-span-3 text-center">Actuel</div>
              <div className="col-span-2 text-center">Diff</div>
              <div className="col-span-3 text-center">{selectedKit?.name}</div>
            </div>

            {/* Lignes de comparaison */}
            {comparisons.map((row) => {
              const diff = row.currentValue - row.compareValue;
              const currentPct = clicksToPercentage(row.currentValue, row.maxValue);
              const comparePct = clicksToPercentage(row.compareValue, row.maxValue);

              return (
                <div key={row.key} className="grid grid-cols-12 gap-2 items-center py-3 border-b border-zinc-800/50">
                  <div className="col-span-4">
                    <p className="text-sm text-white font-medium">{row.label}</p>
                    <p className="text-xs text-zinc-600">Max: {row.maxValue} clics</p>
                  </div>
                  
                  <div className="col-span-3 flex flex-col items-center gap-1">
                    <MiniGauge percentage={currentPct} size="xs" />
                    <p className="text-lg font-bold text-white">{row.currentValue}</p>
                    <p className={`text-xs ${getPercentageColor(currentPct)}`}>{currentPct}%</p>
                  </div>
                  
                  <div className="col-span-2 flex flex-col items-center gap-1">
                    {getDiffIcon(diff)}
                    {diff !== 0 && (
                      <p className={`text-xs font-medium ${diff > 0 ? "text-blue-400" : "text-orange-400"}`}>
                        {diff > 0 ? "+" : ""}{diff}
                      </p>
                    )}
                  </div>
                  
                  <div className="col-span-3 flex flex-col items-center gap-1">
                    <MiniGauge percentage={comparePct} size="xs" />
                    <p className="text-lg font-bold text-zinc-400">{row.compareValue}</p>
                    <p className={`text-xs ${getPercentageColor(comparePct)}`}>{comparePct}%</p>
                  </div>
                </div>
              );
            })}

            {/* Résumé des ajustements */}
            <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
              <h4 className="text-sm font-medium text-purple-300 mb-3 flex items-center gap-2">
                <ArrowRight className="h-4 w-4" />
                Pour atteindre &quot;{selectedKit?.name}&quot;
              </h4>
              <div className="space-y-2">
                {comparisons.map((row) => {
                  if (row.currentValue === row.compareValue) return null;
                  const adjustment = calculateAdjustment(row.currentValue, row.compareValue, row.maxValue);
                  
                  return (
                    <div key={row.key} className="flex items-center gap-2 text-sm">
                      {adjustment.direction === "CCW" ? (
                        <RotateCcw className="h-4 w-4 text-purple-400 shrink-0" />
                      ) : (
                        <RotateCw className="h-4 w-4 text-purple-400 shrink-0" />
                      )}
                      <span className="text-zinc-400">{row.label}:</span>
                      <span className="text-white font-medium">
                        {adjustment.clicks} clic{adjustment.clicks > 1 ? "s" : ""} à {DIRECTION_LABELS[adjustment.direction].action.toLowerCase()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-zinc-500">
            <GitCompare className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>Sélectionnez un kit pour comparer les réglages</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
