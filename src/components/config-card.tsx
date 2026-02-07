"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/ui/brand-logo";
import { MiniGauge } from "@/components/ui/mini-gauge";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Heart,
  Globe,
  Lock,
  Link as LinkIcon,
  Copy,
  Check,
  Users,
  Bookmark,
  BookmarkCheck,
  Weight,
  UserPlus,
  UserMinus,
  Share2,
  Trash2,
  Plus,
  Minus,
  TestTube2,
  CheckCircle2,
  FlaskConical,
} from "lucide-react";
import { clicksToPercentage, getPercentageColor, getPositionDescription } from "@/lib/clicker-utils";
import { Badge } from "@/components/ui/badge";

const SPORT_TYPES = [
  { value: "enduro", label: "Enduro" },
  { value: "motocross", label: "Motocross" },
  { value: "supermoto", label: "Supermoto" },
  { value: "trail", label: "Trail / Balade" },
  { value: "trial", label: "Trial" },
];

const TERRAIN_TYPES = [
  { value: "sable", label: "Sable" },
  { value: "boue", label: "Boue" },
  { value: "dur", label: "Terrain dur" },
  { value: "rocailleux", label: "Rocailleux" },
  { value: "mixte", label: "Mixte" },
];

const LEVELS = [
  { value: "débutant", label: "Débutant" },
  { value: "intermédiaire", label: "Intermédiaire" },
  { value: "expert", label: "Expert" },
];

const STYLES = [
  { value: "neutre", label: "Neutre" },
  { value: "agressif", label: "Agressif" },
  { value: "souple", label: "Souple" },
];

const OBJECTIVES = [
  { value: "confort", label: "Confort" },
  { value: "performance", label: "Performance" },
  { value: "mixte", label: "Mixte" },
];

export interface ConfigCardConfig {
  _id: string;
  name: string;
  description?: string;
  forkCompression?: number;
  forkRebound?: number;
  shockCompressionLow?: number;
  shockCompressionHigh?: number;
  shockRebound?: number;
  staticSag?: number;
  dynamicSag?: number;
  tirePressureFront?: number;
  tirePressureRear?: number;
  sportType?: string;
  terrainType?: string;
  riderWeight?: number;
  riderLevel?: string;
  riderStyle?: string;
  riderObjective?: string;
  visibility?: string;
  isPublic?: boolean;
  shareLink?: string;
  likes?: number;
  saves?: number; // Nombre de sauvegardes
  tests?: number; // Nombre de tests
  validatedSessions?: number; // Sessions validées
  createdAt: number;
  moto?: {
    brand: string;
    model: string;
    year: number;
  } | null;
  // Plages de clics max (pour pourcentages style Clickers MX)
  maxForkCompression?: number;
  maxForkRebound?: number;
  maxShockCompressionLow?: number;
  maxShockCompressionHigh?: number;
  maxShockRebound?: number;
  user?: {
    _id: string;
    name: string;
    username?: string;
    imageUrl?: string;
  } | null;
}

export interface ConfigCardProps {
  config: ConfigCardConfig;
  // Display options
  showUser?: boolean;
  showFollowButton?: boolean;
  showVisibilityControls?: boolean;
  showDeleteButton?: boolean;
  showLikeButton?: boolean;
  showSaveButton?: boolean;
  showAdjustButtons?: boolean;
  showPercentages?: boolean; // Afficher les pourcentages style Clickers MX
  // State
  currentUserId?: string;
  isOwner?: boolean;
  isSaved?: boolean;
  isLiked?: boolean;
  isFollowingUser?: boolean;
  copiedLink?: string | null;
  // Actions
  onDelete?: () => void;
  onVisibilityChange?: (visibility: string) => void;
  onCopyLink?: (link: string) => void;
  onLike?: () => void;
  onSave?: () => void;
  onUnsave?: () => void;
  onToggleFollow?: () => void;
  onUpdateField?: (field: string, value: number) => void;
}

// Composant pour les valeurs ajustables avec +/-
function AdjustableValue({
  value,
  field,
  unit,
  step = 1,
  min = 0,
  max = 50,
  maxClicks,
  showPercentage = false,
  onUpdate,
  editable = false,
}: {
  value: number;
  field: string;
  unit: string;
  step?: number;
  min?: number;
  max?: number;
  maxClicks?: number;
  showPercentage?: boolean;
  onUpdate?: (field: string, value: number) => void;
  editable?: boolean;
}) {
  const [isUpdating, setIsUpdating] = useState(false);
  
  const percentage = maxClicks && maxClicks > 0 ? clicksToPercentage(value, maxClicks) : null;

  const handleAdjust = async (delta: number) => {
    if (!onUpdate || isUpdating) return;
    const newValue = Math.max(min, Math.min(max, Number((value + delta).toFixed(2))));
    if (newValue !== value) {
      setIsUpdating(true);
      await onUpdate(field, newValue);
      setTimeout(() => setIsUpdating(false), 300);
    }
  };

  if (!editable) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-2">
          {showPercentage && percentage !== null && (
            <MiniGauge percentage={percentage} size="xs" />
          )}
          <p className="text-lg font-bold text-white">
            {value} <span className="text-xs text-zinc-500">{unit}</span>
          </p>
        </div>
        {showPercentage && percentage !== null && (
          <p className={`text-xs font-medium ${getPercentageColor(percentage)}`}>
            {percentage}%
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleAdjust(-step);
          }}
          disabled={isUpdating || value <= min}
          className="p-1 rounded bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Minus className="h-3 w-3 text-zinc-300" />
        </button>
        
        {showPercentage && percentage !== null && (
          <MiniGauge percentage={percentage} size="sm" showLabels />
        )}
        
        <p className={`text-lg font-bold text-white min-w-[45px] text-center ${isUpdating ? "opacity-50" : ""}`}>
          {value} <span className="text-xs text-zinc-500">{unit}</span>
        </p>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleAdjust(step);
          }}
          disabled={isUpdating || value >= max}
          className="p-1 rounded bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="h-3 w-3 text-zinc-300" />
        </button>
      </div>
      {showPercentage && percentage !== null && (
        <p className={`text-xs font-medium ${getPercentageColor(percentage)}`}>
          {percentage}% • {getPositionDescription(percentage)}
        </p>
      )}
    </div>
  );
}

export function ConfigCard({
  config,
  showUser = true,
  showFollowButton = true,
  showVisibilityControls = false,
  showDeleteButton = false,
  showLikeButton = true,
  showSaveButton = true,
  showAdjustButtons = false,
  showPercentages = false,
  currentUserId,
  isOwner = false,
  isSaved = false,
  isLiked = false,
  isFollowingUser = false,
  copiedLink,
  onDelete,
  onVisibilityChange,
  onCopyLink,
  onLike,
  onSave,
  onUnsave,
  onToggleFollow,
  onUpdateField,
}: ConfigCardProps) {
  const visibility = config.visibility || (config.isPublic ? "public" : "private");

  const getVisibilityIcon = () => {
    switch (visibility) {
      case "public":
        return <Globe className="h-4 w-4 text-emerald-400" />;
      case "link":
        return <LinkIcon className="h-4 w-4 text-blue-400" />;
      default:
        return <Lock className="h-4 w-4 text-zinc-500" />;
    }
  };

  // Conseils pour chaque réglage
  const getSettingTip = (setting: string) => {
    switch (setting) {
      case "forkCompression":
        return "Ouvre pour assouplir";
      case "forkRebound":
        return "Ouvre pour ralentir";
      case "shockCompressionLow":
        return "Basse vitesse, confort";
      case "shockCompressionHigh":
        return "Haute vitesse, gros chocs";
      case "shockRebound":
        return "Ouvre pour ralentir";
      case "staticSag":
        return "Idéal: 30-35mm";
      case "dynamicSag":
        return "Idéal: 95-105mm";
      default:
        return "";
    }
  };

  const hasSettings =
    config.forkCompression !== undefined ||
    config.forkRebound !== undefined ||
    config.shockCompressionLow !== undefined ||
    config.shockRebound !== undefined ||
    config.staticSag !== undefined ||
    config.dynamicSag !== undefined ||
    config.tirePressureFront !== undefined ||
    config.tirePressureRear !== undefined;

  // L'user affiché n'est pas nous-même
  const canFollow =
    showFollowButton &&
    !isOwner &&
    config.user &&
    onToggleFollow &&
    config.user._id !== currentUserId;

  const hasRiderInfo =
    config.riderLevel ||
    config.riderStyle ||
    config.riderObjective ||
    config.riderWeight;

  return (
    <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800 overflow-hidden hover:border-zinc-700 transition-all group py-0">
      <CardContent className="p-0">
        {/* User Header avec bouton Suivre et badges */}
        {showUser && !isOwner && config.user && (
          <div className="flex items-center gap-3 px-5 pt-4 pb-2 border-b border-zinc-800/50 overflow-x-auto">
            {/* Avatar */}
            <Link
              href={`/user/${config.user.username || config.user.name}`}
              className="shrink-0 hover:opacity-80 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              {config.user.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={config.user.imageUrl}
                  alt=""
                  className="h-8 w-8 rounded-full border border-zinc-700"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center">
                  <Users className="h-4 w-4 text-zinc-600" />
                </div>
              )}
            </Link>

            {/* Username */}
            <Link
              href={`/user/${config.user.username || config.user.name}`}
              className="shrink-0 hover:opacity-80 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-sm font-medium text-white hover:text-purple-400 transition-colors">
                @{config.user.username || config.user.name}
              </span>
            </Link>

            {/* Bouton Suivre */}
            {canFollow && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFollow?.();
                }}
                className={`shrink-0 h-7 text-xs gap-1.5 ${
                  isFollowingUser
                    ? "border-purple-500/50 text-purple-400 hover:text-purple-300 hover:border-purple-400"
                    : "border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500"
                }`}
              >
                {isFollowingUser ? (
                  <>
                    <UserMinus className="h-3 w-3" />
                    Suivi
                  </>
                ) : (
                  <>
                    <UserPlus className="h-3 w-3" />
                    Suivre
                  </>
                )}
              </Button>
            )}

            {/* Badges du rider */}
            {hasRiderInfo && (
              <div className="flex items-center gap-1.5 ml-auto shrink-0">
                {config.riderLevel && (
                  <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full">
                    {LEVELS.find((l) => l.value === config.riderLevel)?.label ||
                      config.riderLevel}
                  </span>
                )}
                {config.riderStyle && (
                  <span className="text-[10px] font-medium text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full">
                    {STYLES.find((s) => s.value === config.riderStyle)?.label ||
                      config.riderStyle}
                  </span>
                )}
                {config.riderObjective && (
                  <span className="text-[10px] font-medium text-blue-400 bg-blue-500/15 px-2 py-0.5 rounded-full">
                    {OBJECTIVES.find((o) => o.value === config.riderObjective)
                      ?.label || config.riderObjective}
                  </span>
                )}
                {config.riderWeight && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full">
                    <Weight className="h-3 w-3" />
                    {config.riderWeight} kg
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Badges rider pour les configs owner OU quand showUser=false (pas de user header) */}
        {(isOwner || !showUser) && hasRiderInfo && (
          <div className="flex flex-wrap items-center gap-1.5 px-5 pt-4 pb-0">
            {config.riderLevel && (
              <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/15 px-2.5 py-1 rounded-full">
                {LEVELS.find((l) => l.value === config.riderLevel)?.label ||
                  config.riderLevel}
              </span>
            )}
            {config.riderStyle && (
              <span className="text-[10px] font-medium text-amber-400 bg-amber-500/15 px-2.5 py-1 rounded-full">
                {STYLES.find((s) => s.value === config.riderStyle)?.label ||
                  config.riderStyle}
              </span>
            )}
            {config.riderObjective && (
              <span className="text-[10px] font-medium text-blue-400 bg-blue-500/15 px-2.5 py-1 rounded-full">
                {OBJECTIVES.find((o) => o.value === config.riderObjective)
                  ?.label || config.riderObjective}
              </span>
            )}
            {config.riderWeight && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-zinc-400 bg-zinc-800 px-2.5 py-1 rounded-full">
                <Weight className="h-3 w-3" />
                {config.riderWeight} kg
              </span>
            )}
          </div>
        )}

        {/* Header */}
        <div
          className={`p-5 ${(isOwner || !showUser) && hasRiderInfo ? "pt-3" : !isOwner && config.user && showUser ? "pt-3" : ""} pb-4`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              {/* Brand Logo */}
              {config.moto && (
                <BrandLogo
                  brand={config.moto.brand}
                  size="xl"
                  className="shrink-0"
                />
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-white text-lg truncate">
                    {config.name}
                  </h3>
                  {showVisibilityControls && getVisibilityIcon()}
                </div>

                <div className="flex items-center gap-2">
                  <p className="text-xs text-zinc-500">
                    {new Date(config.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                  {Date.now() - config.createdAt < 7 * 24 * 60 * 60 * 1000 && (
                    <Badge variant="outline" className="border-amber-500/30 text-amber-400 gap-1 text-[9px] py-0 px-1.5">
                      <FlaskConical className="h-2.5 w-2.5" />
                      À tester
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
              {showVisibilityControls ? (
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-500 hover:text-purple-400"
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="bg-zinc-900 border-zinc-800"
                    >
                      <DropdownMenuItem
                        onClick={() => onVisibilityChange?.("private")}
                        className="gap-2"
                      >
                        <Lock className="h-4 w-4" />
                        Privé
                        {visibility === "private" && (
                          <Check className="h-4 w-4 ml-auto text-purple-400" />
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onVisibilityChange?.("link")}
                        className="gap-2"
                      >
                        <LinkIcon className="h-4 w-4" />
                        Lien uniquement
                        {visibility === "link" && (
                          <Check className="h-4 w-4 ml-auto text-purple-400" />
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onVisibilityChange?.("public")}
                        className="gap-2"
                      >
                        <Globe className="h-4 w-4" />
                        Communauté
                        {visibility === "public" && (
                          <Check className="h-4 w-4 ml-auto text-purple-400" />
                        )}
                      </DropdownMenuItem>

                      {(visibility === "link" || visibility === "public") &&
                        config.shareLink && (
                          <>
                            <DropdownMenuSeparator className="bg-zinc-800" />
                            <DropdownMenuItem
                              onClick={() => onCopyLink?.(config.shareLink!)}
                              className="gap-2"
                            >
                              {copiedLink === config.shareLink ? (
                                <>
                                  <Check className="h-4 w-4 text-green-400" />
                                  Copié !
                                </>
                              ) : (
                                <>
                                  <Copy className="h-4 w-4" />
                                  Copier le lien
                                </>
                              )}
                            </DropdownMenuItem>
                          </>
                        )}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {showDeleteButton && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onDelete}
                      className="h-8 w-8 text-zinc-500 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </>
              ) : (
                <>
                  {/* Save/Unsave button */}
                  {showSaveButton && (onSave || onUnsave) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={isSaved ? onUnsave : onSave}
                      className={`h-8 w-8 ${isSaved ? "text-purple-400 hover:text-purple-300" : "text-zinc-500 hover:text-purple-400"}`}
                    >
                      {isSaved ? (
                        <BookmarkCheck className="h-4 w-4" />
                      ) : (
                        <Bookmark className="h-4 w-4" />
                      )}
                    </Button>
                  )}

                  {showLikeButton && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onLike}
                      className={`gap-1.5 h-8 ${isLiked ? "text-red-400 hover:text-red-300" : "text-zinc-500 hover:text-red-400"}`}
                    >
                      <Heart
                        className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`}
                      />
                      <span className="text-xs">{config.likes || 0}</span>
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Settings Grid - Amélioré avec tous les réglages et conseils */}
        {hasSettings && (
          <div className="px-5 pb-4 space-y-3">
            {/* Type de config en badge grand */}
            {(config.sportType || config.terrainType) && (
              <div className="flex items-center gap-2 mb-3">
                {config.terrainType && (
                  <span className="text-xs font-semibold text-amber-400 bg-amber-500/20 px-3 py-1.5 rounded-lg uppercase tracking-wide">
                    Config{" "}
                    {TERRAIN_TYPES.find((t) => t.value === config.terrainType)
                      ?.label || config.terrainType}
                  </span>
                )}
                {config.sportType && (
                  <span className="text-xs font-semibold text-purple-400 bg-purple-500/20 px-3 py-1.5 rounded-lg uppercase tracking-wide">
                    {SPORT_TYPES.find((s) => s.value === config.sportType)
                      ?.label || config.sportType}
                  </span>
                )}
              </div>
            )}

            {/* Fourche */}
            {(config.forkCompression !== undefined ||
              config.forkRebound !== undefined) && (
              <div className="space-y-2">
                <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                  Fourche
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {config.forkCompression !== undefined && (
                    <div className="bg-zinc-800/50 rounded-lg p-3 group/setting">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] text-zinc-500 font-medium">
                          Compression
                        </p>
                        <AdjustableValue
                          value={config.forkCompression}
                          field="forkCompression"
                          unit="clics"
                          step={1}
                          min={0}
                          max={config.maxForkCompression || 40}
                          maxClicks={config.maxForkCompression}
                          showPercentage={showPercentages}
                          editable={showAdjustButtons && !!onUpdateField}
                          onUpdate={onUpdateField}
                        />
                      </div>
                      <p className="text-[9px] text-purple-400/70 italic">
                        {getSettingTip("forkCompression")}
                      </p>
                    </div>
                  )}
                  {config.forkRebound !== undefined && (
                    <div className="bg-zinc-800/50 rounded-lg p-3 group/setting">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] text-zinc-500 font-medium">
                          Détente
                        </p>
                        <AdjustableValue
                          value={config.forkRebound}
                          field="forkRebound"
                          unit="clics"
                          step={1}
                          min={0}
                          max={config.maxForkRebound || 40}
                          maxClicks={config.maxForkRebound}
                          showPercentage={showPercentages}
                          editable={showAdjustButtons && !!onUpdateField}
                          onUpdate={onUpdateField}
                        />
                      </div>
                      <p className="text-[9px] text-purple-400/70 italic">
                        {getSettingTip("forkRebound")}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Amortisseur */}
            {(config.shockCompressionLow !== undefined ||
              config.shockCompressionHigh !== undefined ||
              config.shockRebound !== undefined) && (
              <div className="space-y-2">
                <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                  Amortisseur
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {config.shockCompressionLow !== undefined && (
                    <div className="bg-zinc-800/50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] text-zinc-500 font-medium">
                          Comp. BV
                        </p>
                        <AdjustableValue
                          value={config.shockCompressionLow}
                          field="shockCompressionLow"
                          unit="clics"
                          step={1}
                          min={0}
                          max={config.maxShockCompressionLow || 40}
                          maxClicks={config.maxShockCompressionLow}
                          showPercentage={showPercentages}
                          editable={showAdjustButtons && !!onUpdateField}
                          onUpdate={onUpdateField}
                        />
                      </div>
                      <p className="text-[9px] text-purple-400/70 italic">
                        {getSettingTip("shockCompressionLow")}
                      </p>
                    </div>
                  )}
                  {config.shockCompressionHigh !== undefined && (
                    <div className="bg-zinc-800/50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] text-zinc-500 font-medium">
                          Comp. HV
                        </p>
                        <AdjustableValue
                          value={config.shockCompressionHigh}
                          field="shockCompressionHigh"
                          unit="clics"
                          step={1}
                          min={0}
                          max={config.maxShockCompressionHigh || 10}
                          maxClicks={config.maxShockCompressionHigh}
                          showPercentage={showPercentages}
                          editable={showAdjustButtons && !!onUpdateField}
                          onUpdate={onUpdateField}
                        />
                      </div>
                      <p className="text-[9px] text-purple-400/70 italic">
                        {getSettingTip("shockCompressionHigh")}
                      </p>
                    </div>
                  )}
                  {config.shockRebound !== undefined && (
                    <div className="bg-zinc-800/50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] text-zinc-500 font-medium">
                          Détente
                        </p>
                        <AdjustableValue
                          value={config.shockRebound}
                          field="shockRebound"
                          unit="clics"
                          step={1}
                          min={0}
                          max={config.maxShockRebound || 40}
                          maxClicks={config.maxShockRebound}
                          showPercentage={showPercentages}
                          editable={showAdjustButtons && !!onUpdateField}
                          onUpdate={onUpdateField}
                        />
                      </div>
                      <p className="text-[9px] text-purple-400/70 italic">
                        {getSettingTip("shockRebound")}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SAG */}
            {(config.staticSag !== undefined ||
              config.dynamicSag !== undefined) && (
              <div className="space-y-2">
                <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                  SAG
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {config.staticSag !== undefined && (
                    <div className="bg-zinc-800/50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] text-zinc-500 font-medium">
                          Statique
                        </p>
                        <AdjustableValue
                          value={config.staticSag}
                          field="staticSag"
                          unit="mm"
                          step={1}
                          min={15}
                          max={60}
                          editable={showAdjustButtons && !!onUpdateField}
                          onUpdate={onUpdateField}
                        />
                      </div>
                      <p className="text-[9px] text-purple-400/70 italic">
                        {getSettingTip("staticSag")}
                      </p>
                    </div>
                  )}
                  {config.dynamicSag !== undefined && (
                    <div className="bg-zinc-800/50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] text-zinc-500 font-medium">
                          Dynamique
                        </p>
                        <AdjustableValue
                          value={config.dynamicSag}
                          field="dynamicSag"
                          unit="mm"
                          step={1}
                          min={80}
                          max={130}
                          editable={showAdjustButtons && !!onUpdateField}
                          onUpdate={onUpdateField}
                        />
                      </div>
                      <p className="text-[9px] text-purple-400/70 italic">
                        {getSettingTip("dynamicSag")}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Pression Pneus */}
            {(config.tirePressureFront !== undefined ||
              config.tirePressureRear !== undefined) && (
              <div className="space-y-2">
                <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                  Pression Pneus
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {config.tirePressureFront !== undefined && (
                    <div className="bg-zinc-800/50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] text-zinc-500 font-medium">
                          Avant
                        </p>
                        <AdjustableValue
                          value={config.tirePressureFront}
                          field="tirePressureFront"
                          unit="bar"
                          step={0.05}
                          min={0.4}
                          max={1.5}
                          editable={showAdjustButtons && !!onUpdateField}
                          onUpdate={onUpdateField}
                        />
                      </div>
                      <p className="text-[9px] text-purple-400/70 italic">
                        Moins = plus de grip
                      </p>
                    </div>
                  )}
                  {config.tirePressureRear !== undefined && (
                    <div className="bg-zinc-800/50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] text-zinc-500 font-medium">
                          Arrière
                        </p>
                        <AdjustableValue
                          value={config.tirePressureRear}
                          field="tirePressureRear"
                          unit="bar"
                          step={0.05}
                          min={0.4}
                          max={1.5}
                          editable={showAdjustButtons && !!onUpdateField}
                          onUpdate={onUpdateField}
                        />
                      </div>
                      <p className="text-[9px] text-purple-400/70 italic">
                        Moins = plus de grip
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Social Proof Badges - Indicateurs de confiance */}
        {!isOwner && ((config.likes && config.likes >= 1) || (config.saves && config.saves >= 1) || (config.validatedSessions && config.validatedSessions >= 1)) && (
          <div className="px-5 pb-4">
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-zinc-800/50">
              {config.saves && config.saves >= 1 && (
                <Badge variant="outline" className="border-purple-500/30 text-purple-400 gap-1 text-[10px]">
                  <Users className="h-3 w-3" />
                  {config.saves} {config.saves === 1 ? "pilote" : "pilotes"}
                </Badge>
              )}
              {config.likes && config.likes >= 3 && (
                <Badge variant="outline" className="border-pink-500/30 text-pink-400 gap-1 text-[10px]">
                  <Heart className="h-3 w-3 fill-current" />
                  {config.likes} ♥
                </Badge>
              )}
              {config.validatedSessions && config.validatedSessions >= 1 && (
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 gap-1 text-[10px]">
                  <CheckCircle2 className="h-3 w-3" />
                  Validée {config.validatedSessions}x
                </Badge>
              )}
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
}
