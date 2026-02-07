"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, Check, Settings2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

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

export default function SharedConfigPage() {
  const params = useParams();
  const shareLink = params.shareLink as string;
  const [copied, setCopied] = useState(false);

  const config = useQuery(api.configs.getByShareLink, { shareLink });

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (config === undefined) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-pulse text-zinc-500">Chargement...</div>
      </div>
    );
  }

  if (config === null) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Settings2 className="h-16 w-16 mx-auto text-zinc-700" />
          <h1 className="text-2xl font-bold text-white">CONFIG INTROUVABLE</h1>
          <p className="text-zinc-500 normal-case">
            Cette configuration n&apos;existe pas ou a été supprimée
          </p>
          <Link href="/">
            <Button className="bg-purple-500 hover:bg-purple-600 mt-4 font-bold italic">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à l&apos;accueil
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.png" alt="MXTune" width={44} height={44} />
          </Link>
          
          <Button
            variant="outline"
            size="sm"
            onClick={copyLink}
            className="gap-2 border-zinc-700 text-zinc-400 hover:text-white"
          >
            {copied ? (
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
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Titre et Moto */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-3 normal-case">{config.name}</h1>
          {config.moto && (
            <p className="text-xl text-purple-400 font-medium">
              {config.moto.brand} {config.moto.model} ({config.moto.year})
            </p>
          )}
          {config.user && (
            <Link 
              href={`/user/${config.user.username || config.user.name}`}
              className="inline-flex items-center justify-center gap-2 mt-3 hover:opacity-80 transition-opacity"
            >
              {config.user.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={config.user.imageUrl} 
                  alt="" 
                  className="h-6 w-6 rounded-full"
                />
              )}
              <span className="text-sm text-zinc-500 normal-case">
                par <span className="text-purple-400 hover:text-purple-300">@{config.user.username || config.user.name}</span>
              </span>
            </Link>
          )}
        </div>

        {/* Description */}
        {config.description && (
          <p className="text-center text-zinc-400 max-w-2xl mx-auto mb-6 normal-case">
            {config.description}
          </p>
        )}

        {/* Rider Info */}
        {(config.riderWeight || config.riderLevel || config.riderStyle || config.riderObjective) && (
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {config.riderWeight && (
              <Badge variant="outline" className="border-purple-500/30 text-purple-400 gap-1.5 py-1.5 px-3">
                {config.riderWeight} kg
              </Badge>
            )}
            {config.riderLevel && (
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 gap-1.5 py-1.5 px-3">
                {LEVELS.find(l => l.value === config.riderLevel)?.label || config.riderLevel}
              </Badge>
            )}
            {config.riderStyle && (
              <Badge variant="outline" className="border-amber-500/30 text-amber-400 gap-1.5 py-1.5 px-3">
                Style {STYLES.find(s => s.value === config.riderStyle)?.label || config.riderStyle}
              </Badge>
            )}
            {config.riderObjective && (
              <Badge variant="outline" className="border-blue-500/30 text-blue-400 gap-1.5 py-1.5 px-3">
                {OBJECTIVES.find(o => o.value === config.riderObjective)?.label || config.riderObjective}
              </Badge>
            )}
          </div>
        )}

        {/* Config Card */}
        <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500/20 via-purple-500/10 to-zinc-900 px-8 py-6 border-b border-zinc-800">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-purple-400" />
              RÉGLAGES SUSPENSION
            </h2>
          </div>

          <CardContent className="p-8">
            {/* Fourche */}
            <div className="mb-8">
              <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider mb-4">
                Fourche
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {config.forkCompression !== undefined && (
                  <ConfigValue 
                    label="COMPRESSION" 
                    value={config.forkCompression} 
                    unit="clics"
                    color="purple"
                  />
                )}
                {config.forkRebound !== undefined && (
                  <ConfigValue 
                    label="DÉTENTE" 
                    value={config.forkRebound} 
                    unit="clics"
                    color="purple"
                  />
                )}
              </div>
            </div>

            {/* Amortisseur */}
            <div className="mb-8">
              <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-4">
                Amortisseur
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {config.shockCompressionLow !== undefined && (
                  <ConfigValue 
                    label="COMP. BASSE VIT." 
                    value={config.shockCompressionLow} 
                    unit="clics"
                    color="amber"
                  />
                )}
                {config.shockCompressionHigh !== undefined && (
                  <ConfigValue 
                    label="COMP. HAUTE VIT." 
                    value={config.shockCompressionHigh} 
                    unit="clics"
                    color="amber"
                  />
                )}
                {config.shockRebound !== undefined && (
                  <ConfigValue 
                    label="DÉTENTE" 
                    value={config.shockRebound} 
                    unit="clics"
                    color="amber"
                  />
                )}
              </div>
            </div>

            {/* SAG */}
            {(config.staticSag !== undefined || config.dynamicSag !== undefined) && (
              <div className="mb-8">
                <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-4">
                  SAG / Affaissement
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {config.staticSag !== undefined && (
                    <ConfigValue 
                      label="SAG STATIQUE" 
                      value={config.staticSag} 
                      unit="mm"
                      color="emerald"
                    />
                  )}
                  {config.dynamicSag !== undefined && (
                    <ConfigValue 
                      label="SAG PILOTE" 
                      value={config.dynamicSag} 
                      unit="mm"
                      color="emerald"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Tags */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-zinc-800">
              {config.sportType && (
                <Badge variant="outline" className="border-purple-500/30 text-purple-400 px-3 py-1">
                  {SPORT_TYPES.find(s => s.value === config.sportType)?.label || config.sportType}
                </Badge>
              )}
              {config.terrainType && (
                <Badge variant="outline" className="border-amber-500/30 text-amber-400 px-3 py-1">
                  {TERRAIN_TYPES.find(t => t.value === config.terrainType)?.label || config.terrainType}
                </Badge>
              )}
              {config.terrain && !config.sportType && (
                <Badge variant="outline" className="border-zinc-700 px-3 py-1">{config.terrain}</Badge>
              )}
              {config.conditions && !config.terrainType && (
                <Badge variant="outline" className="border-zinc-700 px-3 py-1">{config.conditions}</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-zinc-500 mb-4 normal-case">
            Tu veux créer tes propres configs ?
          </p>
          <Link href="/">
            <Button size="lg" className="bg-purple-500 hover:bg-purple-600 font-bold italic">
              DÉCOUVRIR MXTUNE
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function ConfigValue({ 
  label, 
  value, 
  unit, 
  color 
}: { 
  label: string; 
  value: number; 
  unit: string;
  color: "purple" | "amber" | "emerald";
}) {
  const colorClasses = {
    purple: "border-purple-500/30 bg-purple-500/5",
    amber: "border-amber-500/30 bg-amber-500/5",
    emerald: "border-emerald-500/30 bg-emerald-500/5",
  };

  return (
    <div className={`rounded-xl p-4 text-center border ${colorClasses[color]}`}>
      <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider mb-2">{label}</p>
      <p className="text-3xl font-bold text-white">
        {value}
        <span className="text-sm font-normal text-zinc-400 ml-1">{unit}</span>
      </p>
    </div>
  );
}
