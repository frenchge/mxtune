"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MiniGauge } from "@/components/ui/mini-gauge";
import { cn } from "@/lib/utils";
import { Bot, User, Plus, Minus, Zap, BookOpen, Target, Settings, CheckCircle, ArrowRight, Gauge, AlertTriangle, ThumbsUp, ThumbsDown, RefreshCw, Download } from "lucide-react";
import { useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";

interface ConfigType {
  name?: string;
  description?: string;
  forkCompression?: number;
  forkRebound?: number;
  forkPreload?: string;
  shockCompressionLow?: number;
  shockCompressionHigh?: number;
  shockRebound?: number;
  shockPreload?: string;
  staticSag?: number;
  dynamicSag?: number;
  tirePressureFront?: number;
  tirePressureRear?: number;
  sportType?: string;
  terrainType?: string;
  conditions?: string;
}

interface Message {
  _id: string;
  role: string;
  content: string;
  metadata?: {
    config?: ConfigType;
  };
  createdAt: number;
}

interface BaseValues {
  forkCompression?: number;
  forkRebound?: number;
  shockCompressionLow?: number;
  shockCompressionHigh?: number;
  shockRebound?: number;
}

interface ChatMessageProps {
  message: Message;
  userImage?: string;
  onButtonClick?: (action: string, buttonText?: string) => void;
  onUpdateConfig?: (configId: string, field: string, value: number) => Promise<void>;
  savedConfigId?: string;
  baseValues?: BaseValues;
}

// Zone de couleur selon la position du réglage
function getValueZone(percentage: number) {
  if (percentage <= 25) return { color: "blue", label: "Souple", bg: "bg-blue-500", text: "text-blue-400", barGradient: "from-blue-500 to-blue-600" };
  if (percentage <= 50) return { color: "emerald", label: "Équilibré", bg: "bg-emerald-500", text: "text-emerald-400", barGradient: "from-emerald-500 to-emerald-600" };
  if (percentage <= 75) return { color: "amber", label: "Ferme", bg: "bg-amber-500", text: "text-amber-400", barGradient: "from-amber-500 to-amber-600" };
  return { color: "red", label: "Très ferme", bg: "bg-red-500", text: "text-red-400", barGradient: "from-red-500 to-red-600" };
}

// Composant pour un réglage avec boutons +/- et feedback visuel
function AdjustableValue({ 
  label, 
  value, 
  unit, 
  hint,
  field,
  step = 1,
  min = 0,
  max = 30,
  onAdjust,
  disabled,
  baseValue
}: { 
  label: string;
  value: number;
  unit: string;
  hint: string;
  field: string;
  step?: number;
  min?: number;
  max?: number;
  onAdjust: (field: string, newValue: number) => void;
  disabled?: boolean;
  baseValue?: number;
}) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [animDir, setAnimDir] = useState<"up" | "down" | null>(null);

  const percentage = Math.round(((value - min) / (max - min)) * 100);
  const zone = getValueZone(percentage);
  const isTurns = unit === "tours";
  const dialAngle = isTurns ? (value * 360) % 360 : 0;

  const handleIncrement = () => {
    const newValue = Math.min(value + step, max);
    if (newValue !== value) {
      setAnimDir("up");
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 200);
      if (navigator.vibrate) navigator.vibrate(8);
      onAdjust(field, newValue);
    }
  };

  const handleDecrement = () => {
    const newValue = Math.max(value - step, min);
    if (newValue !== value) {
      setAnimDir("down");
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 200);
      if (navigator.vibrate) navigator.vibrate(8);
      onAdjust(field, newValue);
    }
  };

  return (
    <div className={cn(
      "bg-zinc-800/50 rounded-xl p-3 border transition-all duration-200",
      isAnimating ? "border-zinc-600 shadow-md" : "border-zinc-800/50"
    )}>
      {/* Header avec label + zone badge */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">{label}</p>
        <span className={cn(
          "text-[9px] px-1.5 py-0.5 rounded-full font-medium",
          zone.color === "blue" && "bg-blue-500/15 text-blue-400",
          zone.color === "emerald" && "bg-emerald-500/15 text-emerald-400",
          zone.color === "amber" && "bg-amber-500/15 text-amber-400",
          zone.color === "red" && "bg-red-500/15 text-red-400"
        )}>
          {zone.label}
        </span>
      </div>

      {/* Barre de progression colorée */}
      <div className="relative h-1.5 bg-zinc-700/50 rounded-full mb-2.5 overflow-hidden">
        <div 
          className={cn("absolute left-0 top-0 h-full rounded-full transition-all duration-300", `bg-gradient-to-r ${zone.barGradient}`)}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Contrôles: -  valeur  + */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleDecrement}
          disabled={disabled || value <= min}
          className={cn(
            "h-7 w-7 rounded-lg flex items-center justify-center transition-all active:scale-90",
            "bg-zinc-700/80 hover:bg-blue-500/30 hover:text-blue-400",
            "disabled:opacity-30 disabled:cursor-not-allowed"
          )}
        >
          <Minus className="h-3 w-3" />
        </button>
        
        <div className="text-center">
          {isTurns && (
            <div className="flex items-center justify-center mb-1">
              <div className="relative h-10 w-10">
                <svg viewBox="0 0 100 100" className="h-full w-full">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#27272a" strokeWidth="8" />
                  {[0, 90, 180, 270].map((angle) => (
                    <line
                      key={angle}
                      x1={50 + 30 * Math.cos((angle - 90) * Math.PI / 180)}
                      y1={50 + 30 * Math.sin((angle - 90) * Math.PI / 180)}
                      x2={50 + 40 * Math.cos((angle - 90) * Math.PI / 180)}
                      y2={50 + 40 * Math.sin((angle - 90) * Math.PI / 180)}
                      stroke="#52525b"
                      strokeWidth="2"
                    />
                  ))}
                  <circle cx="50" cy="50" r="6" fill={value >= 0 ? "#f59e0b" : "#3b82f6"} />
                </svg>
                <div
                  className="absolute inset-0 flex items-center justify-center transition-transform duration-300"
                  style={{ transform: `rotate(${dialAngle}deg)` }}
                >
                  <div className={cn(
                    "w-1 h-10 rounded-full origin-bottom transform -translate-y-1",
                    value >= 0 ? "bg-gradient-to-t from-amber-500 to-amber-300" : "bg-gradient-to-t from-blue-500 to-blue-300"
                  )} />
                </div>
              </div>
            </div>
          )}
          <p className={cn(
            "text-lg font-bold text-white transition-transform",
            isAnimating && animDir === "up" && "animate-bounce-up",
            isAnimating && animDir === "down" && "animate-bounce-down"
          )}>
            {step < 1 ? value.toFixed(1) : value}
            <span className="text-xs text-zinc-500 ml-1">{unit}</span>
          </p>
          {baseValue !== undefined && value !== baseValue && (
            <span className={cn(
              "text-[10px] font-semibold",
              value > baseValue ? "text-amber-400" : "text-blue-400"
            )}>
              {value > baseValue ? "+" : ""}{step < 1 ? (value - baseValue).toFixed(1) : value - baseValue} vs base
            </span>
          )}
          {baseValue !== undefined && value === baseValue && (
            <span className="text-[10px] text-zinc-600">= base</span>
          )}
        </div>

        <button
          onClick={handleIncrement}
          disabled={disabled || value >= max}
          className={cn(
            "h-7 w-7 rounded-lg flex items-center justify-center transition-all active:scale-90",
            "bg-zinc-700/80 hover:bg-emerald-500/30 hover:text-emerald-400",
            "disabled:opacity-30 disabled:cursor-not-allowed"
          )}
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      {/* Hint micro-copy */}
      <p className="text-[9px] text-zinc-500 italic mt-1.5 text-center">{hint}</p>
    </div>
  );
}

export function ChatMessage({ message, userImage, onButtonClick, onUpdateConfig, savedConfigId, baseValues }: ChatMessageProps) {
  const isUser = message.role === "user";
  const initialConfig = message.metadata?.config;
  const [localConfig, setLocalConfig] = useState<ConfigType | undefined>(initialConfig);
  const [isAdjusting, setIsAdjusting] = useState(false);

  const config = localConfig;

  const handleAdjust = useCallback(async (field: string, newValue: number) => {
    if (!localConfig) return;
    
    setIsAdjusting(true);
    
    // Mise à jour locale immédiate
    const updatedConfig = { ...localConfig, [field]: newValue };
    setLocalConfig(updatedConfig);
    
    // Si on a un configId sauvegardé, mettre à jour dans la DB
    if (savedConfigId && onUpdateConfig) {
      try {
        await onUpdateConfig(savedConfigId, field, newValue);
      } catch (error) {
        console.error("Erreur lors de la mise à jour:", error);
      }
    }
    
    setIsAdjusting(false);
  }, [localConfig, savedConfigId, onUpdateConfig]);

  // Parse les boutons du contenu - format: [BUTTON:titre|description:action]
  const parseContent = (content: string) => {
    const buttonRegex = /\[BUTTON:([^|\]]+)(?:\|([^:]+))?:([^\]]+)\]/g;
    const parts: (string | { type: "button"; text: string; description?: string; action: string })[] = [];
    let lastIndex = 0;
    let match;

    const sanitizeCtaText = (value?: string) => {
      if (!value) return undefined;
      const cleaned = value
        .replace(/\[BUTTON.*$/gi, "")
        .replace(/\s*\].*$/g, "")
        .replace(/\b(step|etape|étape|stage)\s*\d+\b/gi, "")
        .replace(/[\[\]]/g, "")
        .replace(/\s{2,}/g, " ")
        .trim();
      return cleaned.length >= 2 ? cleaned : undefined;
    };

    while ((match = buttonRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(content.slice(lastIndex, match.index));
      }
      parts.push({ 
        type: "button", 
        text: sanitizeCtaText(match[1]) || match[1].trim(), 
        description: sanitizeCtaText(match[2]) || undefined,
        action: match[3] 
      });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push(content.slice(lastIndex));
    }

    return parts;
  };

  const contentParts = parseContent(message.content);

  return (
    <div
      className={cn(
        "flex gap-4 p-6",
        isUser ? "bg-transparent" : "bg-zinc-900/50"
      )}
    >
      <Avatar className="h-8 w-8 shrink-0">
        {isUser ? (
          <>
            <AvatarImage src={userImage} />
            <AvatarFallback className="bg-zinc-700">
              <User className="h-4 w-4" />
            </AvatarFallback>
          </>
        ) : (
          <AvatarFallback className="bg-purple-500">
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        )}
      </Avatar>

      <div className="flex-1 space-y-4">
        <div className="prose prose-invert prose-sm max-w-none">
          {contentParts.map((part, index) => {
            if (typeof part === "string") {
              return (
                <ReactMarkdown
                  key={index}
                  components={{
                    strong: ({ children }) => (
                      <strong className="font-bold text-white">{children}</strong>
                    ),
                    em: ({ children }) => (
                      <em className="italic text-zinc-300">{children}</em>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal list-inside space-y-1 my-2">{children}</ol>
                    ),
                    li: ({ children }) => (
                      <li className="text-zinc-300">{children}</li>
                    ),
                    p: ({ children }) => (
                      <p className="text-zinc-200 leading-relaxed mb-2">{children}</p>
                    ),
                    h1: ({ children }) => (
                      <h1 className="text-xl font-bold text-white mt-4 mb-2">{children}</h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-lg font-bold text-white mt-3 mb-2">{children}</h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-base font-semibold text-white mt-2 mb-1">{children}</h3>
                    ),
                    code: ({ children }) => (
                      <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-purple-400 text-sm">{children}</code>
                    ),
                  }}
                >
                  {part}
                </ReactMarkdown>
              );
            } else {
              return null; // Les boutons seront rendus séparément
            }
          })}
        </div>

        {/* Afficher la config suggérée si présente */}
        {config && (
          <div className="mt-4 bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="p-4 space-y-4">
              <h4 className="text-xs font-semibold text-purple-500 uppercase tracking-wider">
                Réglages Recommandés
              </h4>
              
              {/* Type de config badges */}
              {(config.sportType || config.terrainType) && (
                <div className="flex items-center gap-2">
                  {config.terrainType && (
                    <span className="text-xs font-semibold text-amber-400 bg-amber-500/20 px-3 py-1.5 rounded-lg uppercase tracking-wide">
                      Config {config.terrainType}
                    </span>
                  )}
                  {config.sportType && (
                    <span className="text-xs font-semibold text-purple-400 bg-purple-500/20 px-3 py-1.5 rounded-lg uppercase tracking-wide">
                      {config.sportType}
                    </span>
                  )}
                </div>
              )}

              {/* Fourche */}
              {(config.forkCompression !== undefined || config.forkRebound !== undefined) && (
                <div className="space-y-2">
                  <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Fourche</p>
                  <div className="grid grid-cols-2 gap-2">
                    {config.forkCompression !== undefined && (
                      <AdjustableValue
                        label="Compression"
                        value={config.forkCompression}
                        unit="clics"
                        hint="Ouvre pour assouplir"
                        field="forkCompression"
                        step={1}
                        min={0}
                        max={30}
                        onAdjust={handleAdjust}
                        disabled={isAdjusting}
                        baseValue={baseValues?.forkCompression}
                      />
                    )}
                    {config.forkRebound !== undefined && (
                      <AdjustableValue
                        label="Détente"
                        value={config.forkRebound}
                        unit="clics"
                        hint="Ouvre pour ralentir"
                        field="forkRebound"
                        step={1}
                        min={0}
                        max={30}
                        onAdjust={handleAdjust}
                        disabled={isAdjusting}
                        baseValue={baseValues?.forkRebound}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Amortisseur */}
              {(config.shockCompressionLow !== undefined || config.shockCompressionHigh !== undefined || config.shockRebound !== undefined) && (
                <div className="space-y-2">
                  <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Amortisseur</p>
                  <div className="grid grid-cols-2 gap-2">
                    {config.shockCompressionLow !== undefined && (
                      <AdjustableValue
                        label="Comp. BV"
                        value={config.shockCompressionLow}
                        unit="clics"
                        hint="Basse vitesse, confort"
                        field="shockCompressionLow"
                        step={1}
                        min={0}
                        max={30}
                        onAdjust={handleAdjust}
                        disabled={isAdjusting}
                        baseValue={baseValues?.shockCompressionLow}
                      />
                    )}
                    {config.shockCompressionHigh !== undefined && (
                      <AdjustableValue
                        label="Comp. HV"
                        value={config.shockCompressionHigh}
                        unit="tours"
                        hint="Haute vitesse, gros chocs"
                        field="shockCompressionHigh"
                        step={0.5}
                        min={0}
                        max={5}
                        onAdjust={handleAdjust}
                        disabled={isAdjusting}
                        baseValue={baseValues?.shockCompressionHigh}
                      />
                    )}
                    {config.shockRebound !== undefined && (
                      <AdjustableValue
                        label="Détente"
                        value={config.shockRebound}
                        unit="clics"
                        hint="Ouvre pour ralentir"
                        field="shockRebound"
                        step={1}
                        min={0}
                        max={30}
                        onAdjust={handleAdjust}
                        disabled={isAdjusting}
                        baseValue={baseValues?.shockRebound}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* SAG */}
              {config.staticSag !== undefined && (
                <div className="space-y-2">
                  <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">SAG</p>
                  <div className="grid grid-cols-2 gap-2">
                    <AdjustableValue
                      label="SAG Arrière"
                      value={config.staticSag}
                      unit="mm"
                      hint="Idéal: 30-35mm"
                      field="staticSag"
                      step={1}
                      min={20}
                      max={50}
                      onAdjust={handleAdjust}
                      disabled={isAdjusting}
                    />
                  </div>
                </div>
              )}

              {/* Pression Pneus */}
              {(config.tirePressureFront !== undefined || config.tirePressureRear !== undefined) && (
                <div className="space-y-2">
                  <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Pression Pneus</p>
                  <div className="grid grid-cols-2 gap-2">
                    {config.tirePressureFront !== undefined && (
                      <AdjustableValue
                        label="Avant"
                        value={config.tirePressureFront}
                        unit="bar"
                        hint="Moins = plus de grip"
                        field="tirePressureFront"
                        step={0.1}
                        min={0.4}
                        max={1.5}
                        onAdjust={handleAdjust}
                        disabled={isAdjusting}
                      />
                    )}
                    {config.tirePressureRear !== undefined && (
                      <AdjustableValue
                        label="Arrière"
                        value={config.tirePressureRear}
                        unit="bar"
                        hint="Moins = plus de grip"
                        field="tirePressureRear"
                        step={0.1}
                        min={0.4}
                        max={1.5}
                        onAdjust={handleAdjust}
                        disabled={isAdjusting}
                      />
                    )}
                  </div>
                </div>
              )}

              <p className="text-xs text-zinc-500 italic pt-2 border-t border-zinc-800">
                Les réglages de clics sont toujours indiqués &quot;depuis fermé&quot;.
              </p>
            </div>
          </div>
        )}

        {/* Boutons stylisés en carte avec icônes intelligentes */}
        {contentParts.some(part => typeof part !== "string") && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {contentParts.map((part, index) => {
              if (typeof part !== "string") {
                // Icône dynamique selon l'action
                const getButtonIcon = (action: string, text: string) => {
                  const actionLower = action.toLowerCase();
                  const textLower = text.toLowerCase();
                  
                  if (actionLower.includes("direct") || actionLower.includes("rapide") || textLower.includes("direct") || textLower.includes("rapide")) {
                    return <Zap className="h-5 w-5" />;
                  }
                  if (actionLower.includes("pas") || textLower.includes("pas-à-pas") || textLower.includes("méthode") || textLower.includes("complet")) {
                    return <BookOpen className="h-5 w-5" />;
                  }
                  if (actionLower.includes("confirm") || actionLower.includes("valider") || actionLower.includes("oui")) {
                    return <CheckCircle className="h-5 w-5" />;
                  }
                  if (actionLower.includes("tester") || actionLower.includes("test")) {
                    return <Target className="h-5 w-5" />;
                  }
                  if (actionLower.includes("modifier") || actionLower.includes("non")) {
                    return <RefreshCw className="h-5 w-5" />;
                  }
                  if (actionLower.includes("sauvegard") || actionLower.includes("save")) {
                    return <Download className="h-5 w-5" />;
                  }
                  if (actionLower.includes("continuer") || actionLower.includes("next")) {
                    return <ArrowRight className="h-5 w-5" />;
                  }
                  return <Settings className="h-5 w-5" />;
                };

                const getButtonColor = (action: string, text: string) => {
                  const actionLower = action.toLowerCase();
                  const textLower = text.toLowerCase();
                  
                  if (actionLower.includes("direct") || actionLower.includes("rapide") || textLower.includes("direct")) {
                    return "from-orange-500/20 to-orange-600/10 border-orange-500/30 hover:border-orange-500/60 text-orange-400";
                  }
                  if (actionLower.includes("pas") || textLower.includes("pas-à-pas") || textLower.includes("complet")) {
                    return "from-blue-500/20 to-blue-600/10 border-blue-500/30 hover:border-blue-500/60 text-blue-400";
                  }
                  if (actionLower.includes("confirm") || actionLower.includes("oui")) {
                    return "from-green-500/20 to-green-600/10 border-green-500/30 hover:border-green-500/60 text-green-400";
                  }
                  return "from-purple-500/20 to-purple-600/10 border-purple-500/30 hover:border-purple-500/60 text-purple-400";
                };

                const iconColorClass = getButtonColor(part.action, part.text);
                
                return (
                  <button
                    key={index}
                    onClick={() => onButtonClick?.(part.action, part.text)}
                    className={cn(
                      "group relative p-5 rounded-xl bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 border transition-all duration-300 text-left hover:scale-[1.02] active:scale-[0.98]",
                      iconColorClass
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "h-10 w-10 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                        iconColorClass.includes("orange") ? "bg-orange-500/20 group-hover:bg-orange-500/30" :
                        iconColorClass.includes("blue") ? "bg-blue-500/20 group-hover:bg-blue-500/30" :
                        iconColorClass.includes("green") ? "bg-green-500/20 group-hover:bg-green-500/30" :
                        "bg-purple-500/20 group-hover:bg-purple-500/30"
                      )}>
                        {getButtonIcon(part.action, part.text)}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm uppercase tracking-wide mb-1">
                          {part.text}
                        </h4>
                        {part.description && (
                          <p className="text-xs text-zinc-400 font-normal normal-case">
                            {part.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              }
              return null;
            })}
          </div>
        )}

        <p className="text-xs text-zinc-600">
          {new Date(message.createdAt).toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}
