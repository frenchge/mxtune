"use client";

import { cn } from "@/lib/utils";
import { 
  Bike, 
  CheckCircle2, 
  AlertTriangle, 
  Circle,
  Settings2,
  Gauge,
  Calendar,
  ChevronRight,
  Zap,
  Shield,
  Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface MotoHealthStatus {
  sagOk: boolean;
  sagValue?: number;
  tirePressureOk?: boolean;
  tirePressureFront?: number;
  tirePressureRear?: number;
  lastConfigDate?: Date;
  lastConfigName?: string;
  readyToRide: boolean;
}

interface ActiveMotoStatusProps {
  moto: {
    id: string;
    brand: string;
    model: string;
    year: number;
    imageUrl?: string;
  };
  kit?: {
    id: string;
    brand: string;
    model: string;
  } | null;
  activeConfig?: {
    id: string;
    name: string;
    terrainType?: string;
    sportType?: string;
  } | null;
  health?: MotoHealthStatus;
  onSelectMoto?: () => void;
  onSelectKit?: () => void;
  onSelectConfig?: () => void;
  className?: string;
}

export function ActiveMotoStatus({
  moto,
  kit,
  activeConfig,
  health,
  onSelectMoto,
  onSelectKit,
  onSelectConfig,
  className,
}: ActiveMotoStatusProps) {
  const isReady = health?.readyToRide ?? false;

  return (
    <div className={cn(
      "rounded-xl border bg-gradient-to-br from-zinc-900 to-zinc-950 overflow-hidden",
      isReady ? "border-emerald-500/30" : "border-amber-500/30",
      className
    )}>
      {/* Header avec badge "En cours" */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Icône moto avec indicateur de statut */}
            <div className="relative">
              <div className={cn(
                "h-12 w-12 rounded-xl flex items-center justify-center",
                isReady ? "bg-emerald-500/20" : "bg-amber-500/20"
              )}>
                <Bike className={cn(
                  "h-6 w-6",
                  isReady ? "text-emerald-400" : "text-amber-400"
                )} />
              </div>
              {/* Indicateur pulsant */}
              <span className={cn(
                "absolute -top-1 -right-1 h-4 w-4 rounded-full border-2 border-zinc-900",
                isReady ? "bg-emerald-500" : "bg-amber-500"
              )}>
                <span className={cn(
                  "absolute inset-0 rounded-full animate-ping",
                  isReady ? "bg-emerald-500" : "bg-amber-500"
                )} />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white">
                  {moto.brand} {moto.model}
                </h3>
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-wider",
                    isReady 
                      ? "border-emerald-500/50 text-emerald-400 bg-emerald-500/10" 
                      : "border-amber-500/50 text-amber-400 bg-amber-500/10"
                  )}
                >
                  {isReady ? "✓ Prête" : "⚠ À vérifier"}
                </Badge>
              </div>
              <p className="text-xs text-zinc-500">{moto.year}</p>
            </div>
          </div>

          {onSelectMoto && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSelectMoto}
              className="text-zinc-400 hover:text-white"
            >
              Changer
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>

      {/* Kit actif */}
      <div 
        className={cn(
          "p-3 border-b border-zinc-800/50 bg-zinc-900/30",
          onSelectKit && "cursor-pointer hover:bg-zinc-800/30 transition-colors"
        )}
        onClick={onSelectKit}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 uppercase tracking-wider">Kit monté</span>
          </div>
          {kit ? (
            <span className="text-sm font-medium text-white">
              {kit.brand} {kit.model}
            </span>
          ) : (
            <span className="text-sm text-zinc-500 italic">Aucun kit</span>
          )}
        </div>
      </div>

      {/* Config active */}
      <div 
        className={cn(
          "p-3 border-b border-zinc-800/50 bg-zinc-900/30",
          onSelectConfig && "cursor-pointer hover:bg-zinc-800/30 transition-colors"
        )}
        onClick={onSelectConfig}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-zinc-500" />
            <span className="text-xs text-zinc-500 uppercase tracking-wider">Config active</span>
          </div>
          {activeConfig ? (
            <div className="flex items-center gap-2">
              {activeConfig.terrainType && (
                <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-400">
                  {activeConfig.terrainType}
                </Badge>
              )}
              <span className="text-sm font-medium text-white">{activeConfig.name}</span>
            </div>
          ) : (
            <span className="text-sm text-zinc-500 italic">Aucune config</span>
          )}
        </div>
      </div>

      {/* Santé de la moto */}
      {health && (
        <div className="p-4 space-y-3">
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            État de la moto
          </h4>
          
          <div className="grid grid-cols-2 gap-2">
            {/* SAG */}
            <HealthIndicator
              label="SAG"
              value={health.sagValue ? `${health.sagValue}mm` : undefined}
              ok={health.sagOk}
              icon={<Gauge className="h-3.5 w-3.5" />}
            />
            
            {/* Pression pneus */}
            <HealthIndicator
              label="Pneus"
              value={health.tirePressureFront && health.tirePressureRear 
                ? `${health.tirePressureFront}/${health.tirePressureRear}` 
                : undefined}
              ok={health.tirePressureOk}
              icon={<Circle className="h-3.5 w-3.5" />}
            />
          </div>

          {/* Dernière config testée */}
          {health.lastConfigDate && (
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                Dernier réglage : {health.lastConfigName || "Config"} 
                ({formatRelativeDate(health.lastConfigDate)})
              </span>
            </div>
          )}
        </div>
      )}

      {/* Footer avec statut global */}
      <div className={cn(
        "px-4 py-3 flex items-center justify-between",
        isReady ? "bg-emerald-500/5" : "bg-amber-500/5"
      )}>
        <div className="flex items-center gap-2">
          {isReady ? (
            <>
              <Shield className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-400">Prête à rouler</span>
            </>
          ) : (
            <>
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-medium text-amber-400">Vérifications recommandées</span>
            </>
          )}
        </div>
        <Zap className={cn(
          "h-5 w-5",
          isReady ? "text-emerald-400" : "text-amber-400"
        )} />
      </div>
    </div>
  );
}

// Composant pour les indicateurs de santé individuels
function HealthIndicator({ 
  label, 
  value, 
  ok, 
  icon 
}: { 
  label: string; 
  value?: string; 
  ok?: boolean; 
  icon: React.ReactNode;
}) {
  const isOk = ok ?? true;
  
  return (
    <div className={cn(
      "flex items-center gap-2 p-2 rounded-lg",
      isOk ? "bg-emerald-500/10" : "bg-amber-500/10"
    )}>
      <div className={cn(
        "p-1.5 rounded",
        isOk ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
      )}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</p>
        <p className={cn(
          "text-sm font-medium truncate",
          isOk ? "text-emerald-400" : "text-amber-400"
        )}>
          {value || (isOk ? "OK" : "À vérifier")}
        </p>
      </div>
      {isOk ? (
        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
      ) : (
        <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
      )}
    </div>
  );
}

// Helper pour formater les dates relatives
function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} sem.`;
  return `Il y a ${Math.floor(diffDays / 30)} mois`;
}

// ===========================================
// Signature de pilotage pour le profil
// ===========================================
interface RidingSignatureProps {
  level: string;
  style: string;
  terrain: string;
  objective: string;
  weight?: number;
  className?: string;
}

export function RidingSignature({ 
  level, 
  style, 
  terrain, 
  objective,
  weight,
  className 
}: RidingSignatureProps) {
  return (
    <div className={cn(
      "p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-zinc-900 border border-purple-500/20",
      className
    )}>
      <h4 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-3">
        Signature de pilotage
      </h4>
      
      <div className="flex flex-wrap gap-2">
        <SignatureBadge label={level} color="purple" />
        <SignatureBadge label={style} color="blue" />
        <SignatureBadge label={terrain} color="amber" />
        <SignatureBadge label={objective} color="emerald" />
        {weight && <SignatureBadge label={`${weight} kg`} color="zinc" />}
      </div>
      
      <p className="text-xs text-zinc-500 mt-3 italic">
        {level} • {style} • {terrain} • {objective}
      </p>
    </div>
  );
}

function SignatureBadge({ 
  label, 
  color 
}: { 
  label: string; 
  color: "purple" | "blue" | "amber" | "emerald" | "zinc";
}) {
  const colorClasses = {
    purple: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    blue: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    amber: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    emerald: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    zinc: "bg-zinc-700/50 text-zinc-400 border-zinc-600/30",
  };

  return (
    <span className={cn(
      "px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide border",
      colorClasses[color]
    )}>
      {label}
    </span>
  );
}
