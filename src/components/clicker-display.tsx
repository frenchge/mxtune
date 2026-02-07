"use client";

import { 
  clicksToPercentage, 
  calculateBalance, 
  getPercentageColor, 
  getPercentageBgColor,
  getPositionDescription,
  calculateAdjustment,
  DIRECTION_LABELS,
  type SuspensionBalance 
} from "@/lib/clicker-utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MiniGauge } from "@/components/ui/mini-gauge";
import { ArrowRight, RotateCcw, RotateCw, Scale, Gauge } from "lucide-react";

interface ClickerDisplayProps {
  // Valeurs actuelles
  forkCompression?: number;
  forkRebound?: number;
  shockCompressionLow?: number;
  shockCompressionHigh?: number;
  shockRebound?: number;
  // Plages max
  maxForkCompression: number;
  maxForkRebound: number;
  maxShockCompressionLow: number;
  maxShockCompressionHigh: number;
  maxShockRebound: number;
  // Optionnel: valeurs cibles pour afficher la différence
  targetForkCompression?: number;
  targetForkRebound?: number;
  targetShockCompressionLow?: number;
  targetShockCompressionHigh?: number;
  targetShockRebound?: number;
  // Mode compact ou détaillé
  compact?: boolean;
  showBalance?: boolean;
}

// Composant pour une barre de progression avec pourcentage
function ClickerBar({ 
  label, 
  clicks, 
  maxClicks, 
  targetClicks,
  compact = false 
}: { 
  label: string; 
  clicks: number; 
  maxClicks: number; 
  targetClicks?: number;
  compact?: boolean;
}) {
  const percentage = clicksToPercentage(clicks, maxClicks);
  const hasTarget = targetClicks !== undefined && targetClicks !== clicks;
  const targetPercentage = targetClicks !== undefined ? clicksToPercentage(targetClicks, maxClicks) : undefined;
  
  const adjustment = hasTarget && targetClicks !== undefined
    ? calculateAdjustment(clicks, targetClicks, maxClicks)
    : null;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-500 w-16 truncate">{label}</span>
        <MiniGauge percentage={percentage} size="xs" />
        <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden relative">
          <div 
            className={`h-full ${getPercentageBgColor(percentage)} transition-all`}
            style={{ width: `${percentage}%` }}
          />
          {hasTarget && targetPercentage !== undefined && (
            <div 
              className="absolute top-0 h-full w-0.5 bg-white"
              style={{ left: `${targetPercentage}%` }}
            />
          )}
        </div>
        <span className={`text-xs font-mono ${getPercentageColor(percentage)}`}>
          {percentage}%
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MiniGauge percentage={percentage} size="sm" />
          <span className="text-sm text-zinc-400">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-600">{clicks}/{maxClicks} clics</span>
          <span className={`text-sm font-bold ${getPercentageColor(percentage)}`}>
            {percentage}%
          </span>
        </div>
      </div>
      <div className="relative">
        <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
          <div 
            className={`h-full ${getPercentageBgColor(percentage)} transition-all duration-300`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {hasTarget && targetPercentage !== undefined && (
          <div 
            className="absolute top-0 h-3 w-1 bg-purple-500 rounded-full"
            style={{ left: `calc(${targetPercentage}% - 2px)` }}
            title={`Cible: ${targetPercentage}%`}
          />
        )}
      </div>
      <div className="flex items-center justify-between text-xs text-zinc-600">
        <span>Souple</span>
        <span>{getPositionDescription(percentage)}</span>
        <span>Dur</span>
      </div>
      {adjustment && adjustment.clicks > 0 && (
        <div className="flex items-center gap-2 mt-2 p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
          {adjustment.direction === "CCW" ? (
            <RotateCcw className="h-4 w-4 text-purple-400" />
          ) : (
            <RotateCw className="h-4 w-4 text-purple-400" />
          )}
          <span className="text-sm text-purple-300">
            <strong>{adjustment.clicks} clic{adjustment.clicks > 1 ? 's' : ''}</strong>
            {' '}
            {DIRECTION_LABELS[adjustment.direction].action.toLowerCase()}
          </span>
          <ArrowRight className="h-3 w-3 text-zinc-500" />
          <span className="text-sm text-zinc-400">
            {adjustment.fromPercentage}% → {adjustment.toPercentage}%
          </span>
        </div>
      )}
    </div>
  );
}

// Composant pour la visualisation de l'équilibre
function BalanceVisual({ balance }: { balance: SuspensionBalance }) {
  const getBalanceColor = (b: "FRONT_HEAVY" | "BALANCED" | "REAR_HEAVY") => {
    switch (b) {
      case "FRONT_HEAVY": return "text-blue-400";
      case "REAR_HEAVY": return "text-orange-400";
      case "BALANCED": return "text-emerald-400";
    }
  };

  const getBalanceLabel = (b: "FRONT_HEAVY" | "BALANCED" | "REAR_HEAVY") => {
    switch (b) {
      case "FRONT_HEAVY": return "Avant lourd";
      case "REAR_HEAVY": return "Arrière lourd";
      case "BALANCED": return "Équilibré";
    }
  };

  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-white flex items-center gap-2">
          <Scale className="h-4 w-4 text-purple-500" />
          Équilibre AV/AR
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Visualisation graphique */}
        <div className="relative h-32 bg-zinc-800/50 rounded-lg p-4">
          {/* Moto stylisée */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg viewBox="0 0 200 80" className="w-full h-full max-w-[200px]">
              {/* Roue avant */}
              <circle 
                cx="40" cy="50" r="20" 
                fill="none" 
                stroke={balance.compressionBalance === "FRONT_HEAVY" ? "#60a5fa" : balance.compressionBalance === "REAR_HEAVY" ? "#9ca3af" : "#34d399"}
                strokeWidth="4"
              />
              {/* Roue arrière */}
              <circle 
                cx="160" cy="50" r="20" 
                fill="none" 
                stroke={balance.compressionBalance === "REAR_HEAVY" ? "#fb923c" : balance.compressionBalance === "FRONT_HEAVY" ? "#9ca3af" : "#34d399"}
                strokeWidth="4"
              />
              {/* Cadre */}
              <path 
                d="M 40 50 L 70 30 L 130 30 L 160 50" 
                fill="none" 
                stroke="#71717a" 
                strokeWidth="3"
              />
              <path 
                d="M 70 30 L 50 50 M 130 30 L 150 50" 
                fill="none" 
                stroke="#71717a" 
                strokeWidth="2"
              />
            </svg>
          </div>
          
          {/* Indicateurs */}
          <div className="absolute top-2 left-4 text-xs">
            <p className="text-zinc-500">Avant</p>
            <p className={`font-bold ${getPercentageColor(balance.frontCompression)}`}>
              C: {balance.frontCompression}%
            </p>
            <p className={`font-bold ${getPercentageColor(balance.frontRebound)}`}>
              R: {balance.frontRebound}%
            </p>
          </div>
          <div className="absolute top-2 right-4 text-xs text-right">
            <p className="text-zinc-500">Arrière</p>
            <p className={`font-bold ${getPercentageColor(balance.rearCompression)}`}>
              C: {balance.rearCompression}%
            </p>
            <p className={`font-bold ${getPercentageColor(balance.rearRebound)}`}>
              R: {balance.rearRebound}%
            </p>
          </div>
        </div>

        {/* Status */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-2 bg-zinc-800/50 rounded-lg text-center">
            <p className="text-xs text-zinc-500 mb-1">Compression</p>
            <p className={`text-sm font-bold ${getBalanceColor(balance.compressionBalance)}`}>
              {getBalanceLabel(balance.compressionBalance)}
            </p>
          </div>
          <div className="p-2 bg-zinc-800/50 rounded-lg text-center">
            <p className="text-xs text-zinc-500 mb-1">Détente</p>
            <p className={`text-sm font-bold ${getBalanceColor(balance.reboundBalance)}`}>
              {getBalanceLabel(balance.reboundBalance)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Composant principal
export function ClickerDisplay({
  forkCompression = 0,
  forkRebound = 0,
  shockCompressionLow = 0,
  shockCompressionHigh = 0,
  shockRebound = 0,
  maxForkCompression,
  maxForkRebound,
  maxShockCompressionLow,
  maxShockCompressionHigh,
  maxShockRebound,
  targetForkCompression,
  targetForkRebound,
  targetShockCompressionLow,
  targetShockCompressionHigh,
  targetShockRebound,
  compact = false,
  showBalance = true,
}: ClickerDisplayProps) {
  const balance = calculateBalance(
    forkCompression,
    forkRebound,
    shockCompressionLow,
    shockRebound,
    maxForkCompression,
    maxForkRebound,
    maxShockCompressionLow,
    maxShockRebound,
    shockCompressionHigh,
    maxShockCompressionHigh
  );

  if (compact) {
    return (
      <div className="space-y-2 p-3 bg-zinc-800/50 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Gauge className="h-4 w-4 text-purple-500" />
          <span className="text-xs font-medium text-zinc-400">Réglages clickers</span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <div className="space-y-1.5">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Fourche</p>
            <ClickerBar label="Comp" clicks={forkCompression} maxClicks={maxForkCompression} compact />
            <ClickerBar label="Dét" clicks={forkRebound} maxClicks={maxForkRebound} compact />
          </div>
          <div className="space-y-1.5">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Amortisseur</p>
            <ClickerBar label="BV" clicks={shockCompressionLow} maxClicks={maxShockCompressionLow} compact />
            <ClickerBar label="HV" clicks={shockCompressionHigh} maxClicks={maxShockCompressionHigh} compact />
            <ClickerBar label="Dét" clicks={shockRebound} maxClicks={maxShockRebound} compact />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Fourche */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white">Fourche</CardTitle>
            <CardDescription>Réglages avant</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ClickerBar 
              label="Compression" 
              clicks={forkCompression} 
              maxClicks={maxForkCompression}
              targetClicks={targetForkCompression}
            />
            <ClickerBar 
              label="Détente" 
              clicks={forkRebound} 
              maxClicks={maxForkRebound}
              targetClicks={targetForkRebound}
            />
          </CardContent>
        </Card>

        {/* Amortisseur */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white">Amortisseur</CardTitle>
            <CardDescription>Réglages arrière</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ClickerBar 
              label="Compression BV" 
              clicks={shockCompressionLow} 
              maxClicks={maxShockCompressionLow}
              targetClicks={targetShockCompressionLow}
            />
            <ClickerBar 
              label="Compression HV" 
              clicks={shockCompressionHigh} 
              maxClicks={maxShockCompressionHigh}
              targetClicks={targetShockCompressionHigh}
            />
            <ClickerBar 
              label="Détente" 
              clicks={shockRebound} 
              maxClicks={maxShockRebound}
              targetClicks={targetShockRebound}
            />
          </CardContent>
        </Card>
      </div>

      {showBalance && <BalanceVisual balance={balance} />}
    </div>
  );
}

// Export du composant de barre seul pour utilisation individuelle
export { ClickerBar };
