"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { 
  Sliders, 
  Clock, 
  ChevronRight,
  Settings2,
  RotateCw,
  Minus,
  Plus
} from "lucide-react";

interface KitConfigSectionProps {
  kitId: Id<"suspensionKits">;
  kitName: string;
  currentSettings: {
    forkCompression?: number;
    forkRebound?: number;
    shockCompressionLow?: number;
    shockCompressionHigh?: number;
    shockRebound?: number;
  };
  isOwner: boolean;
}

// Helper component for displaying a setting value with proper unit
function SettingValue({ 
  label, 
  value, 
  unit 
}: { 
  label: string; 
  value: number | undefined; 
  unit: "clics" | "tours";
}) {
  if (value === undefined) return null;
  
  const isTurns = unit === "tours";
  const displayValue = isTurns ? (value > 0 ? `+${value}` : `${value}`) : `${value}`;
  
  return (
    <div className="flex items-center gap-1.5 bg-zinc-800/70 rounded px-2 py-1">
      <span className="text-zinc-500 text-[10px]">{label}</span>
      <span className={`font-medium text-xs ${isTurns ? (value > 0 ? 'text-amber-400' : value < 0 ? 'text-blue-400' : 'text-white') : 'text-white'}`}>
        {displayValue}
      </span>
      {isTurns ? (
        <RotateCw className="h-2.5 w-2.5 text-amber-400" />
      ) : (
        <span className="text-zinc-600 text-[9px]">clics</span>
      )}
    </div>
  );
}

export function KitConfigSection({ 
  kitId, 
  kitName, 
  currentSettings,
  isOwner 
}: KitConfigSectionProps) {
  const configs = useQuery(api.configs.getByKit, { kitId });

  const hasCurrentSettings = 
    currentSettings.forkCompression !== undefined ||
    currentSettings.forkRebound !== undefined ||
    currentSettings.shockCompressionLow !== undefined ||
    currentSettings.shockCompressionHigh !== undefined ||
    currentSettings.shockRebound !== undefined;

  return (
    <div className="space-y-3 pt-3 border-t border-zinc-800/50">
      {/* Config actuelle */}
      <div className="p-3 bg-gradient-to-br from-purple-500/10 to-transparent rounded-lg border border-purple-500/20">
        <div className="flex items-center gap-2 mb-3">
          <Sliders className="h-3.5 w-3.5 text-purple-400" />
          <span className="text-xs font-medium text-purple-400">Config actuelle</span>
        </div>
        
        {hasCurrentSettings ? (
          <div className="space-y-2">
            {/* Fourche */}
            <div className="space-y-1">
              <p className="text-[10px] text-blue-400 uppercase tracking-wider font-medium">Fourche</p>
              <div className="flex flex-wrap gap-1.5">
                <SettingValue label="C" value={currentSettings.forkCompression} unit="clics" />
                <SettingValue label="D" value={currentSettings.forkRebound} unit="clics" />
              </div>
            </div>
            
            {/* Amortisseur */}
            <div className="space-y-1">
              <p className="text-[10px] text-amber-400 uppercase tracking-wider font-medium">Amortisseur</p>
              <div className="flex flex-wrap gap-1.5">
                <SettingValue label="BV" value={currentSettings.shockCompressionLow} unit="tours" />
                <SettingValue label="HV" value={currentSettings.shockCompressionHigh} unit="tours" />
                <SettingValue label="D" value={currentSettings.shockRebound} unit="clics" />
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-zinc-500">Aucun réglage défini. Utilisez Clickers pour configurer.</p>
        )}
      </div>

      {/* Liste des configs sauvegardées */}
      {configs && configs.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Settings2 className="h-3 w-3 text-zinc-500" />
            <span className="text-xs text-zinc-500">Configs sauvegardées ({configs.length})</span>
          </div>
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {configs.map((config) => (
              <div 
                key={config._id}
                className="flex items-center justify-between p-2 bg-zinc-800/50 rounded-md hover:bg-zinc-800 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white truncate">{config.name}</p>
                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                      <Clock className="h-2.5 w-2.5" />
                      {new Date(config.createdAt).toLocaleDateString('fr-FR', { 
                        day: 'numeric', 
                        month: 'short' 
                      })}
                      {config.terrainType && (
                        <>
                          <span>•</span>
                          <span>{config.terrainType}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-3 w-3 text-zinc-600 group-hover:text-zinc-400 flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message si aucune config */}
      {(!configs || configs.length === 0) && (
        <p className="text-[10px] text-zinc-600 text-center py-1">
          Les configs de l&apos;IA seront sauvegardées ici
        </p>
      )}
    </div>
  );
}