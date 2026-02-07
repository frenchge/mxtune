"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Minus, Plus, RotateCcw, RotateCw, Target, Info, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Couleurs selon la zone de réglage
const getZoneColor = (percentage: number, hasRecommended: boolean, recommendedPercentage?: number) => {
  if (hasRecommended && recommendedPercentage !== undefined) {
    const diff = Math.abs(percentage - recommendedPercentage);
    if (diff <= 5) return { color: "emerald", label: "Zone idéale", emoji: "✓" };
    if (diff <= 15) return { color: "amber", label: "Zone acceptable", emoji: "~" };
    return { color: "red", label: "Écart important", emoji: "!" };
  }
  
  // Sans recommandation, on utilise des zones génériques
  if (percentage <= 25) return { color: "blue", label: "Souple", emoji: "💨" };
  if (percentage <= 50) return { color: "emerald", label: "Équilibré", emoji: "✓" };
  if (percentage <= 75) return { color: "amber", label: "Ferme", emoji: "⚡" };
  return { color: "red", label: "Très ferme", emoji: "🔒" };
};

// Descriptions de ressenti par réglage
const FEELING_DESCRIPTIONS: Record<string, Record<string, string>> = {
  compression: {
    increase: "Plus de résistance aux chocs, meilleur maintien en virage",
    decrease: "Plus de confort sur petites bosses, suspension plus active",
  },
  rebound: {
    increase: "Retour plus lent, moins de rebonds, plus stable",
    decrease: "Retour plus rapide, meilleure réactivité, peut rebondir",
  },
  default: {
    increase: "Augmente la résistance",
    decrease: "Diminue la résistance",
  },
};

interface EnhancedClickerProps {
  label: string;
  sublabel?: string;
  value: number;
  maxValue: number;
  minValue?: number;
  recommendedValue?: number;
  originalValue?: number;
  onChange: (value: number) => void;
  unit?: string;
  type?: "compression" | "rebound" | "sag" | "pressure" | "default";
  tip?: string;
  showFeelingHints?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function EnhancedClicker({
  label,
  sublabel,
  value,
  maxValue,
  minValue = 0,
  recommendedValue,
  originalValue,
  onChange,
  unit = "clics",
  type = "default",
  tip,
  showFeelingHints = true,
  size = "md",
  className,
}: EnhancedClickerProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [lastDirection, setLastDirection] = useState<"up" | "down" | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const percentage = ((value - minValue) / (maxValue - minValue)) * 100;
  const recommendedPercentage = recommendedValue !== undefined 
    ? ((recommendedValue - minValue) / (maxValue - minValue)) * 100 
    : undefined;
  
  const zone = getZoneColor(percentage, recommendedValue !== undefined, recommendedPercentage);
  const diffFromOriginal = originalValue !== undefined ? value - originalValue : 0;
  const diffFromRecommended = recommendedValue !== undefined ? value - recommendedValue : 0;

  // Feeling descriptions
  const feelingType = type === "compression" || type === "rebound" ? type : "default";
  const feelingDesc = FEELING_DESCRIPTIONS[feelingType];

  // Animation de feedback
  const triggerFeedback = useCallback((direction: "up" | "down") => {
    setLastDirection(direction);
    setIsAnimating(true);
    
    // Micro vibration si supportée (mobile)
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
    
    setTimeout(() => setIsAnimating(false), 150);
  }, []);

  const handleIncrement = () => {
    if (value < maxValue) {
      onChange(value + 1);
      triggerFeedback("up");
    }
  };

  const handleDecrement = () => {
    if (value > minValue) {
      onChange(value - 1);
      triggerFeedback("down");
    }
  };

  const handleGoToRecommended = () => {
    if (recommendedValue !== undefined) {
      onChange(recommendedValue);
      triggerFeedback(recommendedValue > value ? "up" : "down");
    }
  };

  const handleReset = () => {
    if (originalValue !== undefined) {
      onChange(originalValue);
    }
  };

  // Couleurs dynamiques selon la zone
  const colorClasses = {
    emerald: {
      bg: "bg-emerald-500",
      border: "border-emerald-500/30",
      text: "text-emerald-400",
      glow: "shadow-emerald-500/20",
      gradient: "from-emerald-500 to-emerald-600",
    },
    amber: {
      bg: "bg-amber-500",
      border: "border-amber-500/30",
      text: "text-amber-400",
      glow: "shadow-amber-500/20",
      gradient: "from-amber-500 to-amber-600",
    },
    red: {
      bg: "bg-red-500",
      border: "border-red-500/30",
      text: "text-red-400",
      glow: "shadow-red-500/20",
      gradient: "from-red-500 to-red-600",
    },
    blue: {
      bg: "bg-blue-500",
      border: "border-blue-500/30",
      text: "text-blue-400",
      glow: "shadow-blue-500/20",
      gradient: "from-blue-500 to-blue-600",
    },
  };

  const colors = colorClasses[zone.color as keyof typeof colorClasses];

  const sizeClasses = {
    sm: "p-3",
    md: "p-4",
    lg: "p-5",
  };

  return (
    <div 
      ref={containerRef}
      className={cn(
        "rounded-xl border bg-zinc-900/80 backdrop-blur-sm transition-all duration-300",
        colors.border,
        isAnimating && `ring-2 ring-offset-2 ring-offset-zinc-950 ${colors.border} shadow-lg ${colors.glow}`,
        sizeClasses[size],
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-white">{label}</h4>
            {tip && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-zinc-500 hover:text-zinc-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-sm max-w-[200px]">{tip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          {sublabel && <p className="text-xs text-zinc-500">{sublabel}</p>}
        </div>
        
        {/* Badge de zone */}
        <div className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
          `bg-${zone.color}-500/20 ${colors.text}`
        )}>
          <span>{zone.emoji}</span>
          <span>{zone.label}</span>
        </div>
      </div>

      {/* Barre de progression principale */}
      <div className="relative h-10 bg-zinc-800 rounded-lg overflow-hidden mb-3">
        {/* Crans/graduations */}
        <div className="absolute inset-0 flex justify-between px-1">
          {Array.from({ length: maxValue - minValue + 1 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-px h-full transition-colors",
                i <= value - minValue ? "bg-zinc-600/50" : "bg-zinc-700/30"
              )}
            />
          ))}
        </div>

        {/* Barre de valeur */}
        <div
          className={cn(
            "absolute left-0 top-0 h-full rounded-lg transition-all duration-200",
            `bg-gradient-to-r ${colors.gradient}`,
            isAnimating && "brightness-125"
          )}
          style={{ width: `${percentage}%` }}
        />

        {/* Marqueur de valeur recommandée */}
        {recommendedValue !== undefined && recommendedPercentage !== undefined && (
          <div
            className="absolute top-0 h-full w-1 bg-purple-400 rounded-full shadow-lg shadow-purple-500/50 transition-all"
            style={{ left: `calc(${recommendedPercentage}% - 2px)` }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-purple-400 rounded-full animate-pulse" />
          </div>
        )}

        {/* Marqueur de valeur originale */}
        {originalValue !== undefined && originalValue !== value && (
          <div
            className="absolute top-0 h-full w-0.5 bg-zinc-500/50"
            style={{ left: `${((originalValue - minValue) / (maxValue - minValue)) * 100}%` }}
          />
        )}

        {/* Valeur au centre */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn(
            "text-2xl font-bold text-white drop-shadow-lg transition-transform",
            isAnimating && lastDirection === "up" && "animate-bounce-up",
            isAnimating && lastDirection === "down" && "animate-bounce-down"
          )}>
            {value}
          </span>
          <span className="text-sm text-zinc-400 ml-1">{unit}</span>
        </div>
      </div>

      {/* Contrôles +/- */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDecrement}
          disabled={value <= minValue}
          className={cn(
            "flex-1 h-11 border-zinc-700 hover:bg-red-500/20 hover:border-red-500/50 transition-all",
            "disabled:opacity-30 disabled:cursor-not-allowed"
          )}
        >
          <Minus className="h-4 w-4 mr-1" />
          <span className="text-sm">Ouvrir</span>
        </Button>
        
        <div className="text-center px-3">
          <p className="text-lg font-bold text-white">{percentage.toFixed(0)}%</p>
          <p className="text-[10px] text-zinc-500">{value}/{maxValue}</p>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleIncrement}
          disabled={value >= maxValue}
          className={cn(
            "flex-1 h-11 border-zinc-700 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all",
            "disabled:opacity-30 disabled:cursor-not-allowed"
          )}
        >
          <span className="text-sm">Fermer</span>
          <Plus className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Feeling hints - Micro-copy orienté ressenti */}
      {showFeelingHints && (
        <div className={cn(
          "text-xs p-2 rounded-lg transition-all",
          "bg-zinc-800/50 border border-zinc-700/50"
        )}>
          <div className="flex items-start gap-2">
            <Sparkles className="h-3.5 w-3.5 text-purple-400 mt-0.5 shrink-0" />
            <div>
              {diffFromRecommended !== 0 && recommendedValue !== undefined ? (
                <p className="text-zinc-300">
                  <span className={diffFromRecommended > 0 ? "text-red-400" : "text-blue-400"}>
                    {diffFromRecommended > 0 ? "+" : ""}{diffFromRecommended} {unit}
                  </span>
                  {" "}par rapport à la recommandation
                </p>
              ) : diffFromOriginal !== 0 && originalValue !== undefined ? (
                <p className="text-zinc-300">
                  <span className={diffFromOriginal > 0 ? "text-amber-400" : "text-blue-400"}>
                    {diffFromOriginal > 0 ? "+" : ""}{diffFromOriginal} {unit}
                  </span>
                  {" "}par rapport à l&apos;origine
                </p>
              ) : (
                <p className="text-zinc-400">
                  {lastDirection === "up" ? feelingDesc.increase : lastDirection === "down" ? feelingDesc.decrease : "Ajuste pour affiner ton ressenti"}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Actions rapides */}
      <div className="flex gap-2 mt-3">
        {recommendedValue !== undefined && value !== recommendedValue && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleGoToRecommended}
            className="flex-1 gap-1 border-purple-500/30 text-purple-400 hover:bg-purple-500/20"
          >
            <Target className="h-3.5 w-3.5" />
            Aller à {recommendedValue}
          </Button>
        )}
        
        {originalValue !== undefined && value !== originalValue && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleReset}
            className="text-zinc-400 hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Reset
          </Button>
        )}
      </div>
    </div>
  );
}

// Animation CSS custom (à ajouter dans globals.css)
// @keyframes bounce-up { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
// @keyframes bounce-down { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(4px); } }
// .animate-bounce-up { animation: bounce-up 0.15s ease-out; }
// .animate-bounce-down { animation: bounce-down 0.15s ease-out; }
