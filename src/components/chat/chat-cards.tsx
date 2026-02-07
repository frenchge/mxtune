"use client";

import { cn } from "@/lib/utils";
import { 
  AlertTriangle, 
  Lightbulb, 
  Target, 
  CheckCircle2, 
  TestTube2,
  ArrowRight,
  Sparkles,
  Wrench,
  TrendingUp,
  TrendingDown,
  Equal,
  RotateCcw,
  RotateCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

// ===========================================
// Card Diagnostic - Pour afficher un problème identifié
// ===========================================
interface DiagnosticCardProps {
  symptom: string;
  severity?: "low" | "medium" | "high";
  className?: string;
}

export function DiagnosticCard({ symptom, severity = "medium", className }: DiagnosticCardProps) {
  const severityStyles = {
    low: "border-amber-500/30 bg-amber-500/5",
    medium: "border-orange-500/30 bg-orange-500/5",
    high: "border-red-500/30 bg-red-500/5",
  };

  const severityIcons = {
    low: <AlertTriangle className="h-5 w-5 text-amber-400" />,
    medium: <AlertTriangle className="h-5 w-5 text-orange-400" />,
    high: <AlertTriangle className="h-5 w-5 text-red-400" />,
  };

  const severityLabels = {
    low: "Mineur",
    medium: "Modéré",
    high: "Important",
  };

  return (
    <div className={cn(
      "rounded-xl border p-4 backdrop-blur-sm transition-all duration-300 hover:scale-[1.01]",
      severityStyles[severity],
      className
    )}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          {severityIcons[severity]}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Diagnostic
            </span>
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full font-medium",
              severity === "high" && "bg-red-500/20 text-red-400",
              severity === "medium" && "bg-orange-500/20 text-orange-400",
              severity === "low" && "bg-amber-500/20 text-amber-400"
            )}>
              {severityLabels[severity]}
            </span>
          </div>
          <p className="text-white font-medium">{symptom}</p>
        </div>
      </div>
    </div>
  );
}

// ===========================================
// Card Hypothèse - Pour afficher une cause probable
// ===========================================
interface HypothesisCardProps {
  cause: string;
  explanation?: string;
  confidence?: "low" | "medium" | "high";
  className?: string;
}

export function HypothesisCard({ cause, explanation, confidence = "medium", className }: HypothesisCardProps) {
  const confidenceStyles = {
    low: "border-zinc-600/50 bg-zinc-800/30",
    medium: "border-purple-500/30 bg-purple-500/5",
    high: "border-purple-500/50 bg-purple-500/10",
  };

  const confidenceLabels = {
    low: "Possible",
    medium: "Probable",
    high: "Très probable",
  };

  return (
    <div className={cn(
      "rounded-xl border p-4 backdrop-blur-sm transition-all duration-300 hover:scale-[1.01]",
      confidenceStyles[confidence],
      className
    )}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          <Lightbulb className="h-5 w-5 text-purple-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Cause probable
            </span>
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full font-medium bg-purple-500/20 text-purple-400",
              confidence === "high" && "bg-purple-500/30"
            )}>
              {confidenceLabels[confidence]}
            </span>
          </div>
          <p className="text-white font-medium">{cause}</p>
          {explanation && (
            <p className="text-zinc-400 text-sm mt-2">{explanation}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ===========================================
// Card Action - Pour proposer un ajustement à faire
// ===========================================
interface ActionCardProps {
  action: string;
  setting: string;
  direction: "increase" | "decrease" | "neutral";
  clicks?: number;
  unit?: string;
  impact?: string;
  onApply?: () => void;
  onMarkTested?: () => void;
  className?: string;
}

export function ActionCard({ 
  action, 
  setting, 
  direction, 
  clicks, 
  unit = "clics",
  impact,
  onApply,
  onMarkTested,
  className 
}: ActionCardProps) {
  const [applied, setApplied] = useState(false);
  const [tested, setTested] = useState(false);

  const directionIcons = {
    increase: <TrendingUp className="h-4 w-4" />,
    decrease: <TrendingDown className="h-4 w-4" />,
    neutral: <Equal className="h-4 w-4" />,
  };

  const directionColors = {
    increase: "text-emerald-400",
    decrease: "text-red-400",
    neutral: "text-zinc-400",
  };

  const directionLabels = {
    increase: "Ouvrir",
    decrease: "Fermer",
    neutral: "Ajuster",
  };

  const handleApply = () => {
    setApplied(true);
    onApply?.();
  };

  const handleMarkTested = () => {
    setTested(true);
    onMarkTested?.();
  };

  return (
    <div className={cn(
      "rounded-xl border border-blue-500/30 bg-blue-500/5 p-4 backdrop-blur-sm transition-all duration-300",
      applied && "border-emerald-500/30 bg-emerald-500/5",
      className
    )}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 p-2 rounded-lg bg-blue-500/20">
          <Wrench className="h-5 w-5 text-blue-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Action recommandée
            </span>
          </div>
          <p className="text-white font-medium mb-2">{action}</p>
          
          {/* Détail de l'ajustement */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50 mb-3">
            <div className={cn("flex items-center gap-1", directionColors[direction])}>
              {direction === "increase" ? <RotateCcw className="h-4 w-4" /> : <RotateCw className="h-4 w-4" />}
              <span className="font-bold">{directionLabels[direction]}</span>
            </div>
            <div className="h-4 w-px bg-zinc-700" />
            <span className="text-zinc-300">{setting}</span>
            {clicks && (
              <>
                <div className="h-4 w-px bg-zinc-700" />
                <span className="font-bold text-white">
                  {direction === "increase" ? "+" : "-"}{clicks} {unit}
                </span>
              </>
            )}
          </div>

          {/* Impact attendu */}
          {impact && (
            <p className="text-sm text-purple-400/80 italic mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              {impact}
            </p>
          )}

          {/* Boutons d'action */}
          <div className="flex gap-2">
            {onApply && (
              <Button
                size="sm"
                onClick={handleApply}
                disabled={applied}
                className={cn(
                  "gap-2 transition-all",
                  applied 
                    ? "bg-emerald-600 hover:bg-emerald-600" 
                    : "bg-blue-600 hover:bg-blue-500"
                )}
              >
                {applied ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Appliqué
                  </>
                ) : (
                  <>
                    <ArrowRight className="h-4 w-4" />
                    Appliquer
                  </>
                )}
              </Button>
            )}
            {onMarkTested && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleMarkTested}
                disabled={tested}
                className={cn(
                  "gap-2 border-zinc-700",
                  tested && "border-emerald-500/50 text-emerald-400"
                )}
              >
                {tested ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Testé
                  </>
                ) : (
                  <>
                    <TestTube2 className="h-4 w-4" />
                    Marquer testé
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ===========================================
// Card Résultat Attendu - Pour expliquer ce qu'on devrait ressentir
// ===========================================
interface ExpectedResultCardProps {
  result: string;
  feeling?: string;
  className?: string;
}

export function ExpectedResultCard({ result, feeling, className }: ExpectedResultCardProps) {
  return (
    <div className={cn(
      "rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 backdrop-blur-sm transition-all duration-300 hover:scale-[1.01]",
      className
    )}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 p-2 rounded-lg bg-emerald-500/20">
          <Target className="h-5 w-5 text-emerald-400" />
        </div>
        <div className="flex-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block mb-1">
            Résultat attendu
          </span>
          <p className="text-white font-medium">{result}</p>
          {feeling && (
            <p className="text-emerald-400/80 text-sm mt-2 italic flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Tu devrais ressentir : {feeling}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ===========================================
// Card Session Summary - Résumé de fin de session
// ===========================================
interface SessionSummaryCardProps {
  adjustments: Array<{
    setting: string;
    before: number;
    after: number;
    unit: string;
  }>;
  improvementAreas?: string[];
  nextSteps?: string[];
  onShare?: () => void;
  className?: string;
}

export function SessionSummaryCard({ 
  adjustments, 
  improvementAreas,
  nextSteps,
  onShare,
  className 
}: SessionSummaryCardProps) {
  return (
    <div className={cn(
      "rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-zinc-900/50 p-5 backdrop-blur-sm",
      className
    )}>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-purple-500/20">
          <CheckCircle2 className="h-6 w-6 text-purple-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Session terminée !</h3>
          <p className="text-sm text-zinc-400">Voici le résumé de tes ajustements</p>
        </div>
      </div>

      {/* Ajustements effectués */}
      {adjustments.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
            Ajustements effectués
          </h4>
          <div className="space-y-2">
            {adjustments.map((adj, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-zinc-800/50">
                <span className="text-zinc-300">{adj.setting}</span>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500">{adj.before}</span>
                  <ArrowRight className="h-3 w-3 text-zinc-600" />
                  <span className="text-emerald-400 font-bold">{adj.after}</span>
                  <span className="text-xs text-zinc-500">{adj.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Améliorations prévues */}
      {improvementAreas && improvementAreas.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
            Améliorations attendues
          </h4>
          <ul className="space-y-1">
            {improvementAreas.map((area, i) => (
              <li key={i} className="text-sm text-emerald-400/80 flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3" />
                {area}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Prochaines étapes */}
      {nextSteps && nextSteps.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
            Prochaines étapes
          </h4>
          <ul className="space-y-1">
            {nextSteps.map((step, i) => (
              <li key={i} className="text-sm text-zinc-300 flex items-center gap-2">
                <span className="h-5 w-5 rounded-full bg-purple-500/20 text-purple-400 text-xs flex items-center justify-center font-bold">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Bouton partager */}
      {onShare && (
        <Button onClick={onShare} className="w-full bg-purple-600 hover:bg-purple-500 gap-2">
          <Sparkles className="h-4 w-4" />
          Partager cette session
        </Button>
      )}
    </div>
  );
}

// ===========================================
// Card Tip - Pour donner des conseils contextuels
// ===========================================
interface TipCardProps {
  tip: string;
  type?: "info" | "warning" | "success";
  className?: string;
}

export function TipCard({ tip, type = "info", className }: TipCardProps) {
  const typeStyles = {
    info: "border-blue-500/20 bg-blue-500/5",
    warning: "border-amber-500/20 bg-amber-500/5",
    success: "border-emerald-500/20 bg-emerald-500/5",
  };

  const typeIcons = {
    info: <Lightbulb className="h-4 w-4 text-blue-400" />,
    warning: <AlertTriangle className="h-4 w-4 text-amber-400" />,
    success: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
  };

  return (
    <div className={cn(
      "rounded-lg border p-3 flex items-start gap-2",
      typeStyles[type],
      className
    )}>
      {typeIcons[type]}
      <p className="text-sm text-zinc-300">{tip}</p>
    </div>
  );
}
