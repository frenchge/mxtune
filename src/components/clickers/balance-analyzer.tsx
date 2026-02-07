"use client";

import { 
  calculateBalance, 
  getPercentageColor,
} from "@/lib/clicker-utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MiniGauge } from "@/components/ui/mini-gauge";
import { Scale, AlertTriangle, CheckCircle2, Info } from "lucide-react";

interface BalanceAnalyzerProps {
  forkCompression: number;
  forkRebound: number;
  shockCompressionLow: number;
  shockCompressionHigh: number;
  shockRebound: number;
  maxForkCompression: number;
  maxForkRebound: number;
  maxShockCompressionLow: number;
  maxShockCompressionHigh: number;
  maxShockRebound: number;
}

// Analyse de l'équilibre avec recommandations
export function BalanceAnalyzer({
  forkCompression,
  forkRebound,
  shockCompressionLow,
  shockCompressionHigh,
  shockRebound,
  maxForkCompression,
  maxForkRebound,
  maxShockCompressionLow,
  maxShockCompressionHigh,
  maxShockRebound,
}: BalanceAnalyzerProps) {
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

  const getBalanceInfo = (b: "FRONT_HEAVY" | "BALANCED" | "REAR_HEAVY") => {
    switch (b) {
      case "FRONT_HEAVY":
        return {
          label: "Avant plus ferme",
          color: "text-blue-400",
          bgColor: "bg-blue-500/10",
          borderColor: "border-blue-500/30",
          icon: AlertTriangle,
        };
      case "REAR_HEAVY":
        return {
          label: "Arrière plus ferme",
          color: "text-orange-400",
          bgColor: "bg-orange-500/10",
          borderColor: "border-orange-500/30",
          icon: AlertTriangle,
        };
      case "BALANCED":
        return {
          label: "Équilibré",
          color: "text-emerald-400",
          bgColor: "bg-emerald-500/10",
          borderColor: "border-emerald-500/30",
          icon: CheckCircle2,
        };
    }
  };

  const compressionInfo = getBalanceInfo(balance.compressionBalance);
  const reboundInfo = getBalanceInfo(balance.reboundBalance);

  // Recommandations basées sur l'analyse
  const getRecommendations = (): string[] => {
    const recs: string[] = [];
    
    if (balance.compressionBalance === "FRONT_HEAVY") {
      recs.push("La fourche est plus ferme que l'amortisseur. Essayez d'ouvrir la compression avant ou de fermer l'arrière.");
    } else if (balance.compressionBalance === "REAR_HEAVY") {
      recs.push("L'amortisseur est plus ferme que la fourche. Essayez d'ouvrir la compression arrière ou de fermer l'avant.");
    }
    
    if (balance.reboundBalance === "FRONT_HEAVY") {
      recs.push("La détente avant est plus lente que l'arrière. Cela peut causer un déséquilibre en sortie de virage.");
    } else if (balance.reboundBalance === "REAR_HEAVY") {
      recs.push("La détente arrière est plus lente que l'avant. Cela peut affecter la stabilité au freinage.");
    }

    // Vérifier les extrêmes
    if (balance.frontCompression < 20 || balance.frontCompression > 80) {
      recs.push(`Compression fourche à ${balance.frontCompression}% - position ${balance.frontCompression < 20 ? "très souple" : "très ferme"}.`);
    }
    if (balance.rearCompression < 20 || balance.rearCompression > 80) {
      recs.push(`Compression amortisseur à ${balance.rearCompression}% - position ${balance.rearCompression < 20 ? "très souple" : "très ferme"}.`);
    }

    return recs;
  };

  const recommendations = getRecommendations();
  const isBalanced = balance.compressionBalance === "BALANCED" && balance.reboundBalance === "BALANCED";

  return (
    <Card className="bg-zinc-900/80 border-zinc-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-white flex items-center gap-2">
          <Scale className="h-5 w-5 text-purple-500" />
          Analyse d&apos;équilibre AV/AR
        </CardTitle>
        <CardDescription>
          Comparaison entre la fourche et l&apos;amortisseur
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Visualisation graphique du véhicule */}
        <div className="relative h-40 bg-zinc-800/30 rounded-xl p-4 overflow-hidden">
          {/* Moto stylisée SVG */}
          <svg viewBox="0 0 300 100" className="w-full h-full">
            {/* Sol */}
            <line x1="0" y1="85" x2="300" y2="85" stroke="#3f3f46" strokeWidth="2" />
            
            {/* Roue avant */}
            <circle 
              cx="60" cy="70" r="25" 
              fill="none" 
              stroke={balance.compressionBalance === "FRONT_HEAVY" ? "#60a5fa" : balance.compressionBalance === "REAR_HEAVY" ? "#71717a" : "#34d399"}
              strokeWidth="6"
              className="transition-colors duration-300"
            />
            <circle cx="60" cy="70" r="8" fill="#27272a" />
            
            {/* Roue arrière */}
            <circle 
              cx="240" cy="70" r="25" 
              fill="none" 
              stroke={balance.compressionBalance === "REAR_HEAVY" ? "#fb923c" : balance.compressionBalance === "FRONT_HEAVY" ? "#71717a" : "#34d399"}
              strokeWidth="6"
              className="transition-colors duration-300"
            />
            <circle cx="240" cy="70" r="8" fill="#27272a" />
            
            {/* Fourche (avec animation selon la fermeté) */}
            <line 
              x1="60" y1="45" x2="90" y2="25" 
              stroke={balance.compressionBalance === "FRONT_HEAVY" ? "#60a5fa" : "#71717a"}
              strokeWidth="4"
              strokeLinecap="round"
            />
            <line 
              x1="60" y1="48" x2="75" y2="35" 
              stroke={balance.compressionBalance === "FRONT_HEAVY" ? "#60a5fa" : "#52525b"}
              strokeWidth="2"
              strokeLinecap="round"
            />
            
            {/* Cadre */}
            <path 
              d="M 90 25 L 150 20 L 220 30 L 240 45" 
              fill="none" 
              stroke="#52525b" 
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            {/* Réservoir */}
            <ellipse cx="140" cy="22" rx="25" ry="8" fill="#3f3f46" />
            
            {/* Selle */}
            <path 
              d="M 160 22 Q 190 15 220 28" 
              fill="none" 
              stroke="#52525b" 
              strokeWidth="8"
              strokeLinecap="round"
            />
            
            {/* Amortisseur arrière */}
            <line 
              x1="200" y1="35" x2="230" y2="55" 
              stroke={balance.compressionBalance === "REAR_HEAVY" ? "#fb923c" : "#71717a"}
              strokeWidth="4"
              strokeLinecap="round"
            />
            <circle 
              cx="215" cy="45" r="5" 
              fill={balance.compressionBalance === "REAR_HEAVY" ? "#fb923c" : "#52525b"}
            />
            
            {/* Bras oscillant */}
            <line x1="200" y1="45" x2="240" y2="45" stroke="#52525b" strokeWidth="3" />
            
            {/* Labels de pourcentage */}
            <text x="60" y="15" textAnchor="middle" className="text-xs fill-zinc-400">
              Avant
            </text>
            <text x="60" y="28" textAnchor="middle" className={`text-sm font-bold ${getPercentageColor(balance.frontCompression).replace('text-', 'fill-')}`}>
              {balance.frontCompression}%
            </text>
            
            <text x="240" y="15" textAnchor="middle" className="text-xs fill-zinc-400">
              Arrière
            </text>
            <text x="240" y="28" textAnchor="middle" className={`text-sm font-bold ${getPercentageColor(balance.rearCompression).replace('text-', 'fill-')}`}>
              {balance.rearCompression}%
            </text>
          </svg>
        </div>

        {/* Stats de balance */}
        <div className="grid grid-cols-2 gap-4">
          {/* Compression */}
          <div className={`p-4 rounded-xl ${compressionInfo.bgColor} border ${compressionInfo.borderColor}`}>
            <div className="flex items-center gap-2 mb-2">
              <compressionInfo.icon className={`h-4 w-4 ${compressionInfo.color}`} />
              <span className="text-sm font-medium text-zinc-300">Compression</span>
            </div>
            <p className={`text-lg font-bold ${compressionInfo.color}`}>
              {compressionInfo.label}
            </p>
            <div className="mt-3 flex justify-between items-center">
              <div className="flex flex-col items-center gap-1">
                <MiniGauge percentage={balance.frontCompression} size="sm" showLabels />
                <span className="text-xs text-zinc-500">AV: {balance.frontCompression}%</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <MiniGauge percentage={balance.rearCompression} size="sm" showLabels />
                <span className="text-xs text-zinc-500">AR: {balance.rearCompression}%</span>
              </div>
            </div>
          </div>

          {/* Détente */}
          <div className={`p-4 rounded-xl ${reboundInfo.bgColor} border ${reboundInfo.borderColor}`}>
            <div className="flex items-center gap-2 mb-2">
              <reboundInfo.icon className={`h-4 w-4 ${reboundInfo.color}`} />
              <span className="text-sm font-medium text-zinc-300">Détente</span>
            </div>
            <p className={`text-lg font-bold ${reboundInfo.color}`}>
              {reboundInfo.label}
            </p>
            <div className="mt-3 flex justify-between items-center">
              <div className="flex flex-col items-center gap-1">
                <MiniGauge percentage={balance.frontRebound} size="sm" showLabels />
                <span className="text-xs text-zinc-500">AV: {balance.frontRebound}%</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <MiniGauge percentage={balance.rearRebound} size="sm" showLabels />
                <span className="text-xs text-zinc-500">AR: {balance.rearRebound}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recommandations */}
        {recommendations.length > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <Info className="h-4 w-4" />
              <span>Recommandations</span>
            </div>
            <ul className="space-y-1">
              {recommendations.map((rec, i) => (
                <li key={i} className="text-xs text-zinc-500 pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-purple-500">
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        ) : isBalanced ? (
          <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <p className="text-sm text-emerald-300">
              Vos réglages sont bien équilibrés ! ✓
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
