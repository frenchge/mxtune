"use client";

import { useCallback } from "react";
import { 
  clicksToPercentage, 
  getPercentageColor, 
  getPositionDescription,
  calculateAdjustment,
  DIRECTION_LABELS,
} from "@/lib/clicker-utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  RotateCcw, 
  RotateCw, 
  RefreshCw,
  Target,
  Save,
  Undo2,
  Minus,
  Plus
} from "lucide-react";

// Unit types for different adjustment mechanisms
export type AdjustmentUnit = "clics" | "tours";

interface AdjusterProps {
  label: string;
  sublabel?: string;
  value: number;
  maxValue: number;
  minValue?: number; // For tours, can be negative
  targetValue?: number;
  onChange: (value: number) => void;
  tip?: string;
  color?: "purple" | "blue" | "amber" | "emerald";
  unit?: AdjustmentUnit;
}

// Composant d'ajusteur visuel style Clickers MX
export function SuspensionAdjuster({
  label,
  sublabel,
  value,
  maxValue,
  minValue = 0,
  targetValue,
  onChange,
  tip,
  color = "purple",
  unit = "clics",
}: AdjusterProps) {
  const isTurns = unit === "tours";
  const unitLabel = isTurns ? "tours" : "clics";
  const unitLabelSingular = isTurns ? "tour" : "clic";
  
  // For turns, we allow negative values
  const effectiveMin = isTurns ? (minValue ?? -10) : 0;
  const effectiveMax = isTurns ? maxValue : maxValue;
  
  // Calculate percentage differently for turns vs clicks
  const percentage = isTurns 
    ? 50 // Tours don't use percentage
    : clicksToPercentage(value, maxValue);
    
  const hasTarget = targetValue !== undefined && targetValue !== value;
  const adjustment = hasTarget ? calculateAdjustment(value, targetValue, maxValue) : null;

  const colorClasses = {
    purple: "from-purple-500 to-purple-600 border-purple-500/30",
    blue: "from-blue-500 to-blue-600 border-blue-500/30",
    amber: "from-amber-500 to-amber-600 border-amber-500/30",
    emerald: "from-emerald-500 to-emerald-600 border-emerald-500/30",
  };

  const handleIncrement = () => {
    if (isTurns || value < maxValue) onChange(value + 1);
  };

  const handleDecrement = () => {
    if (isTurns || value > 0) onChange(value - 1);
  };

  const handleGoToTarget = () => {
    if (targetValue !== undefined) onChange(targetValue);
  };

  // Calculer l'angle de rotation pour le cadran
  // For clicks: 0-270 degrees based on percentage
  // For turns: full 360° rotation based on value, each turn = 360°
  const dialAngle = isTurns 
    ? (value * 360) % 360 // Full rotation per turn
    : (percentage / 100) * 270 - 135;

  // Render different visuals for turns vs clicks
  if (isTurns) {
    return (
      <div className="relative">
        <Card className="bg-zinc-900/80 border-zinc-800 overflow-hidden">
          <CardContent className="p-5 space-y-4">
            {/* Header for turns */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">{label}</h3>
                {sublabel && <p className="text-xs text-zinc-500">{sublabel}</p>}
              </div>
              <div className="text-right">
                <p className={`text-2xl font-bold ${value > 0 ? 'text-amber-400' : value < 0 ? 'text-blue-400' : 'text-zinc-400'}`}>
                  {value > 0 ? `+${value}` : value}
                </p>
                <p className="text-xs text-zinc-500">
                  {unitLabel}
                </p>
              </div>
            </div>

            {/* Full circle visual for turns */}
            <div className="relative flex justify-center py-3">
              <div className="relative w-28 h-28">
                {/* Full circle background */}
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  {/* Outer ring */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#27272a"
                    strokeWidth="8"
                  />
                  {/* Tick marks around the circle */}
                  {[0, 90, 180, 270].map((angle) => (
                    <line
                      key={angle}
                      x1={50 + 32 * Math.cos((angle - 90) * Math.PI / 180)}
                      y1={50 + 32 * Math.sin((angle - 90) * Math.PI / 180)}
                      x2={50 + 40 * Math.cos((angle - 90) * Math.PI / 180)}
                      y2={50 + 40 * Math.sin((angle - 90) * Math.PI / 180)}
                      stroke="#52525b"
                      strokeWidth="2"
                    />
                  ))}
                  {/* Center point */}
                  <circle cx="50" cy="50" r="6" fill="#f59e0b" />
                  {/* Direction indicator arc - shows direction of last turn */}
                  {value !== 0 && (
                    <path
                      d={`M 50 10 A 40 40 0 ${Math.abs(value * 360) > 180 ? 1 : 0} ${value > 0 ? 1 : 0} ${
                        50 + 40 * Math.sin(value * 360 * Math.PI / 180)
                      } ${50 - 40 * Math.cos(value * 360 * Math.PI / 180)}`}
                      fill="none"
                      stroke={value > 0 ? "#f59e0b" : "#3b82f6"}
                      strokeWidth="8"
                      strokeLinecap="round"
                      className="transition-all duration-300"
                    />
                  )}
                </svg>

                {/* Rotating needle */}
                <div 
                  className="absolute inset-0 flex items-center justify-center transition-transform duration-300"
                  style={{ transform: `rotate(${dialAngle}deg)` }}
                >
                  <div className="w-1.5 h-12 bg-gradient-to-t from-amber-500 to-amber-300 rounded-full origin-bottom transform -translate-y-2" />
                </div>

                {/* Direction labels */}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-zinc-500">0</div>
              </div>
            </div>

            {/* Rotation controls */}
            <div className="flex items-center justify-center gap-5">
              <Button
                variant="outline"
                size="icon"
                onClick={handleDecrement}
                className="h-12 w-12 rounded-full border-2 border-zinc-600 hover:border-blue-500 hover:bg-blue-500/20 transition-all"
              >
                <RotateCcw className="h-5 w-5 text-zinc-200" />
              </Button>
              
              <div className="text-center px-4">
                <p className={`text-4xl font-bold ${value > 0 ? 'text-amber-400' : value < 0 ? 'text-blue-400' : 'text-white'}`}>
                  {value > 0 ? `+${value}` : value}
                </p>
                <p className="text-xs text-zinc-500">{unitLabel}</p>
              </div>
              
              <Button
                variant="outline"
                size="icon"
                onClick={handleIncrement}
                className="h-12 w-12 rounded-full border-2 border-zinc-600 hover:border-amber-500 hover:bg-amber-500/20 transition-all"
              >
                <RotateCw className="h-5 w-5 text-zinc-200" />
              </Button>
            </div>

            {/* Visual indicator bar showing turns from center (0) */}
            <div className="space-y-1">
              <div className="relative h-3 bg-zinc-800 rounded-full overflow-hidden">
                {/* Center mark */}
                <div className="absolute left-1/2 top-0 h-full w-0.5 bg-zinc-600 -translate-x-0.5" />
                {/* Value bar */}
                <div 
                  className={`absolute top-0 h-full transition-all duration-300 ${
                    value >= 0 ? 'bg-gradient-to-r from-zinc-600 to-amber-500' : 'bg-gradient-to-l from-zinc-600 to-blue-500'
                  }`}
                  style={{ 
                    left: value >= 0 ? '50%' : `${50 - Math.min(Math.abs(value) * 5, 50)}%`,
                    width: `${Math.min(Math.abs(value) * 5, 50)}%`
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-zinc-500">
                <span className="text-blue-400">← Serrer</span>
                <span>0</span>
                <span className="text-amber-400">Desserrer →</span>
              </div>
            </div>

            {/* Conseil */}
            {tip && (
              <p className="text-sm text-purple-400/80 italic text-center">{tip}</p>
            )}

            {/* Guide d'ajustement vers la cible */}
            {adjustment && adjustment.clicks > 0 && (
              <div className="mt-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {adjustment.direction === "CCW" ? (
                      <RotateCcw className="h-5 w-5 text-purple-400" />
                    ) : (
                      <RotateCw className="h-5 w-5 text-purple-400" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-purple-300">
                        {adjustment.clicks} {adjustment.clicks > 1 ? unitLabel : unitLabelSingular} à {DIRECTION_LABELS[adjustment.direction].action.toLowerCase()}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {value > 0 ? `+${value}` : value} → {targetValue !== undefined ? (targetValue > 0 ? `+${targetValue}` : targetValue) : ''}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleGoToTarget}
                    className="bg-purple-600 hover:bg-purple-500 gap-1"
                  >
                    <Target className="h-3 w-3" />
                    Appliquer
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Original clicks visual
  return (
    <div className="relative">
      <Card className="bg-zinc-900/80 border-zinc-800 overflow-hidden">
        <CardContent className="p-5 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">{label}</h3>
              {sublabel && <p className="text-xs text-zinc-500">{sublabel}</p>}
            </div>
            <div className="text-right">
              <p className={`text-2xl font-bold ${getPercentageColor(percentage)}`}>
                {percentage}%
              </p>
              <p className="text-xs text-zinc-500">
                {value}/{maxValue} {unitLabel}
              </p>
            </div>
          </div>

          {/* Cadran visuel */}
          <div className="relative flex justify-center py-3">
            <div className="relative w-28 h-28">
              {/* Cercle de fond avec gradient */}
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {/* Arc de fond */}
                <path
                  d="M 15 75 A 40 40 0 1 1 85 75"
                  fill="none"
                  stroke="#27272a"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
                {/* Arc de progression */}
                <path
                  d="M 15 75 A 40 40 0 1 1 85 75"
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${(percentage / 100) * 188} 188`}
                  className="transition-all duration-300"
                />
                {/* Marqueur de cible */}
                {hasTarget && targetValue !== undefined && (
                  <circle
                    cx={50 + 40 * Math.cos(((clicksToPercentage(targetValue, maxValue) / 100) * 270 - 225) * (Math.PI / 180))}
                    cy={50 + 40 * Math.sin(((clicksToPercentage(targetValue, maxValue) / 100) * 270 - 225) * (Math.PI / 180))}
                    r="4"
                    fill="#a855f7"
                    className="animate-pulse"
                  />
                )}
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="50%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Indicateur central */}
              <div 
                className="absolute inset-0 flex items-center justify-center"
                style={{ transform: `rotate(${dialAngle}deg)` }}
              >
                <div className="w-1 h-10 bg-white rounded-full origin-bottom transform -translate-y-1" />
              </div>

              {/* Labels Souple/Dur */}
              <div className="absolute bottom-0 left-0 text-xs text-emerald-400 font-medium">Souple</div>
              <div className="absolute bottom-0 right-0 text-xs text-red-400 font-medium">Dur</div>
            </div>
          </div>

          {/* Contrôles +/- ou rotation */}
          <div className="flex items-center justify-center gap-5">
            {isTurns ? (
              // Rotation controls for turns
              <>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleDecrement}
                  disabled={value <= 0}
                  className="h-12 w-12 rounded-full border-2 border-zinc-600 hover:border-amber-500 hover:bg-amber-500/20 transition-all"
                >
                  <RotateCcw className="h-5 w-5 text-zinc-200" />
                </Button>
                
                <div className="text-center px-4">
                  <p className="text-4xl font-bold text-white">{value}</p>
                  <p className="text-xs text-zinc-500">{unitLabel}</p>
                </div>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleIncrement}
                  disabled={value >= maxValue}
                  className="h-12 w-12 rounded-full border-2 border-zinc-600 hover:border-amber-500 hover:bg-amber-500/20 transition-all"
                >
                  <RotateCw className="h-5 w-5 text-zinc-200" />
                </Button>
              </>
            ) : (
              // Plus/minus controls for clicks
              <>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleDecrement}
                  disabled={value <= 0}
                  className="h-12 w-12 rounded-full border-2 border-zinc-600 hover:border-red-500 hover:bg-red-500/20 text-2xl font-bold transition-all"
                >
                  <Minus className="h-5 w-5 text-zinc-200" />
                </Button>
                
                <div className="text-center px-4">
                  <p className="text-4xl font-bold text-white">{value}</p>
                  <p className="text-xs text-zinc-500">{unitLabel} sortis</p>
                </div>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleIncrement}
                  disabled={value >= maxValue}
                  className="h-12 w-12 rounded-full border-2 border-zinc-600 hover:border-emerald-500 hover:bg-emerald-500/20 text-2xl font-bold transition-all"
                >
                  <Plus className="h-5 w-5 text-zinc-200" />
                </Button>
              </>
            )}
          </div>

          {/* Barre de progression linéaire */}
          <div className="space-y-1">
            <div className="relative h-3 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r ${colorClasses[color]} transition-all duration-300`}
                style={{ width: `${percentage}%` }}
              />
              {hasTarget && targetValue !== undefined && (
                <div 
                  className="absolute top-0 h-full w-1 bg-purple-400 rounded-full"
                  style={{ left: `calc(${clicksToPercentage(targetValue, maxValue)}% - 2px)` }}
                />
              )}
            </div>
            <div className="flex justify-between text-xs text-zinc-500">
              <span>0%</span>
              <span className={`font-medium ${getPercentageColor(percentage)}`}>{getPositionDescription(percentage)}</span>
              <span>100%</span>
            </div>
          </div>

          {/* Conseil */}
          {tip && (
            <p className="text-sm text-purple-400/80 italic text-center">{tip}</p>
          )}

          {/* Guide d'ajustement vers la cible */}
          {adjustment && adjustment.clicks > 0 && (
            <div className="mt-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {adjustment.direction === "CCW" ? (
                    <RotateCcw className="h-5 w-5 text-purple-400" />
                  ) : (
                    <RotateCw className="h-5 w-5 text-purple-400" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-purple-300">
                      {adjustment.clicks} {adjustment.clicks > 1 ? unitLabel : unitLabelSingular} à {DIRECTION_LABELS[adjustment.direction].action.toLowerCase()}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {adjustment.fromPercentage}% → {adjustment.toPercentage}%
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={handleGoToTarget}
                  className="bg-purple-600 hover:bg-purple-500 gap-1"
                >
                  <Target className="h-3 w-3" />
                  Appliquer
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Types pour les réglages complets
export interface SuspensionSettings {
  forkCompression: number;
  forkRebound: number;
  shockCompressionLow: number;
  shockCompressionHigh: number;
  shockRebound: number;
}

export interface SuspensionRanges {
  maxForkCompression: number;
  maxForkRebound: number;
  maxShockCompressionLow: number;
  maxShockCompressionHigh: number;
  maxShockRebound: number;
}

interface FullAdjusterProps {
  settings: SuspensionSettings;
  ranges: SuspensionRanges;
  baselineSettings?: SuspensionSettings;
  onSettingsChange: (settings: SuspensionSettings) => void;
  onSave?: () => void;
  onReset?: () => void;
  isSaving?: boolean;
  hasChanges?: boolean;
}

// Composant complet avec tous les ajusteurs
export function FullSuspensionAdjuster({
  settings,
  ranges,
  baselineSettings,
  onSettingsChange,
}: FullAdjusterProps) {
  const updateSetting = useCallback((key: keyof SuspensionSettings, value: number) => {
    onSettingsChange({ ...settings, [key]: value });
  }, [settings, onSettingsChange]);

  return (
    <div className="space-y-6">
      {/* Fourche */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-1 w-8 bg-blue-500 rounded-full" />
          <h2 className="text-xl font-bold text-white">Fourche</h2>
          <span className="text-sm text-zinc-500">Suspension avant</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SuspensionAdjuster
            label="Compression"
            sublabel="Résistance à l'enfoncement"
            value={settings.forkCompression}
            maxValue={ranges.maxForkCompression}
            targetValue={baselineSettings?.forkCompression}
            onChange={(v) => updateSetting("forkCompression", v)}
            tip="↑ Plus = résiste mieux aux gros chocs"
            color="blue"
            unit="clics"
          />
          <SuspensionAdjuster
            label="Détente (Rebound)"
            sublabel="Vitesse de retour"
            value={settings.forkRebound}
            maxValue={ranges.maxForkRebound}
            targetValue={baselineSettings?.forkRebound}
            onChange={(v) => updateSetting("forkRebound", v)}
            tip="↑ Plus = retour plus lent, moins de rebonds"
            color="blue"
            unit="clics"
          />
        </div>
      </div>

      {/* Amortisseur */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-1 w-8 bg-amber-500 rounded-full" />
          <h2 className="text-xl font-bold text-white">Amortisseur</h2>
          <span className="text-sm text-zinc-500">Suspension arrière</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <SuspensionAdjuster
            label="Compression BV"
            sublabel="Basse vitesse - confort"
            value={settings.shockCompressionLow}
            maxValue={ranges.maxShockCompressionLow}
            targetValue={baselineSettings?.shockCompressionLow}
            onChange={(v) => updateSetting("shockCompressionLow", v)}
            tip="Affecte le confort en roulant"
            color="amber"
            unit="tours"
          />
          <SuspensionAdjuster
            label="Compression HV"
            sublabel="Haute vitesse - gros chocs"
            value={settings.shockCompressionHigh}
            maxValue={ranges.maxShockCompressionHigh}
            targetValue={baselineSettings?.shockCompressionHigh}
            onChange={(v) => updateSetting("shockCompressionHigh", v)}
            tip="Réception de sauts, grosses bosses"
            color="amber"
            unit="tours"
          />
          <SuspensionAdjuster
            label="Détente (Rebound)"
            sublabel="Vitesse de retour"
            value={settings.shockRebound}
            maxValue={ranges.maxShockRebound}
            targetValue={baselineSettings?.shockRebound}
            onChange={(v) => updateSetting("shockRebound", v)}
            tip="↑ Plus = retour plus lent"
            color="amber"
            unit="clics"
          />
        </div>
      </div>
    </div>
  );
}
