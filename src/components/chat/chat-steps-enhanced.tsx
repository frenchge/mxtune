"use client";

import { cn } from "@/lib/utils";
import { Check, Circle } from "lucide-react";
import { useEffect, useState } from "react";

interface Step {
  id: string;
  label: string;
  number: number;
  description?: string;
}

interface ChatStepsEnhancedProps {
  currentStep: string;
  completedSteps?: string[];
  className?: string;
}

const steps: Step[] = [
  { id: "collecte", label: "COLLECTE", number: 1, description: "Analyse de ta situation" },
  { id: "verification", label: "VÉRIFICATION", number: 2, description: "Confirmation des données" },
  { id: "proposition", label: "PROPOSITION", number: 3, description: "Réglages recommandés" },
  { id: "test", label: "TEST", number: 4, description: "Validation terrain" },
];

export function ChatStepsEnhanced({ currentStep, completedSteps = [], className }: ChatStepsEnhancedProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStep);
  const [animatingStep, setAnimatingStep] = useState<string | null>(null);

  // Animation quand une étape change
  useEffect(() => {
    setAnimatingStep(currentStep);
    const timer = setTimeout(() => setAnimatingStep(null), 600);
    return () => clearTimeout(timer);
  }, [currentStep]);

  return (
    <div className={cn("w-full", className)}>
      {/* Version desktop - horizontal avec descriptions */}
      <div className="hidden md:block">
        <div className="max-w-3xl mx-auto px-4">
          <div className="relative">
            {/* Ligne de progression de fond */}
            <div className="absolute top-5 left-[calc(12.5%)] right-[calc(12.5%)] h-0.5 bg-zinc-800" />
            
            {/* Ligne de progression active */}
            <div 
              className="absolute top-5 left-[calc(12.5%)] h-0.5 bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-500 ease-out"
              style={{ 
                width: `calc(${Math.min(currentIndex, steps.length - 1) / (steps.length - 1) * 75}%)` 
              }}
            />

            <div className="relative flex justify-between">
              {steps.map((step, index) => {
                const isCompleted = index < currentIndex || completedSteps.includes(step.id);
                const isCurrent = index === currentIndex;
                const isPending = index > currentIndex && !completedSteps.includes(step.id);
                const isAnimating = animatingStep === step.id;

                return (
                  <div key={step.id} className="flex flex-col items-center" style={{ width: '25%' }}>
                    {/* Cercle de l'étape */}
                    <div
                      className={cn(
                        "relative flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all duration-300",
                        isCompleted && "bg-purple-500 text-white shadow-lg shadow-purple-500/30",
                        isCurrent && "bg-purple-500 text-white ring-4 ring-purple-500/30 shadow-lg shadow-purple-500/40",
                        isPending && "bg-zinc-800 text-zinc-500 border border-zinc-700",
                        isAnimating && "scale-110"
                      )}
                    >
                      {isCompleted ? (
                        <Check className={cn("h-5 w-5", isAnimating && "animate-bounce")} />
                      ) : (
                        <span className={cn(isCurrent && "animate-pulse")}>{step.number}</span>
                      )}
                      
                      {/* Pulse animation pour l'étape courante */}
                      {isCurrent && (
                        <span className="absolute inset-0 rounded-full bg-purple-500 animate-ping opacity-30" />
                      )}
                    </div>

                    {/* Label et description */}
                    <div className="mt-3 text-center">
                      <span
                        className={cn(
                          "text-xs font-semibold tracking-wider block",
                          isCurrent && "text-white",
                          isCompleted && "text-purple-400",
                          isPending && "text-zinc-600"
                        )}
                      >
                        {step.label}
                      </span>
                      <span
                        className={cn(
                          "text-[10px] mt-0.5 block",
                          isCurrent && "text-zinc-400",
                          isCompleted && "text-zinc-500",
                          isPending && "text-zinc-700"
                        )}
                      >
                        {step.description}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Version mobile - compact horizontal */}
      <div className="md:hidden px-4 py-2">
        <div className="flex items-center justify-center gap-1">
          {steps.map((step, index) => {
            const isCompleted = index < currentIndex || completedSteps.includes(step.id);
            const isCurrent = index === currentIndex;
            const isPending = index > currentIndex && !completedSteps.includes(step.id);

            return (
              <div key={step.id} className="flex items-center">
                <div className="flex items-center gap-1.5">
                  <div
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-all duration-300",
                      isCompleted && "bg-purple-500 text-white",
                      isCurrent && "bg-purple-500 text-white ring-2 ring-purple-500/30",
                      isPending && "bg-zinc-800 text-zinc-500"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      step.number
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-xs font-medium tracking-wider",
                      isCurrent && "text-white",
                      isCompleted && "text-zinc-400",
                      isPending && "text-zinc-600"
                    )}
                  >
                    {step.label}
                  </span>
                </div>

                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "mx-2 h-px w-4",
                      index < currentIndex ? "bg-purple-500" : "bg-zinc-700"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Indicateur de progression en pourcentage */}
      <div className="max-w-3xl mx-auto px-4 mt-2">
        <div className="flex items-center justify-between text-[10px] text-zinc-600">
          <span>Progression</span>
          <span className="text-purple-400 font-medium">
            {Math.round((currentIndex / (steps.length - 1)) * 100)}%
          </span>
        </div>
        <div className="h-1 bg-zinc-800 rounded-full overflow-hidden mt-1">
          <div 
            className="h-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all duration-500 ease-out rounded-full"
            style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ===========================================
// Timeline verticale pour le chat
// ===========================================
interface TimelineEvent {
  id: string;
  type: "step" | "action" | "validation" | "result";
  title: string;
  description?: string;
  timestamp?: Date;
  completed?: boolean;
}

interface ChatTimelineProps {
  events: TimelineEvent[];
  className?: string;
}

export function ChatTimeline({ events, className }: ChatTimelineProps) {
  const typeStyles = {
    step: {
      bg: "bg-purple-500",
      icon: Circle,
      iconColor: "text-white"
    },
    action: {
      bg: "bg-blue-500",
      icon: Circle,
      iconColor: "text-white"
    },
    validation: {
      bg: "bg-emerald-500",
      icon: Check,
      iconColor: "text-white"
    },
    result: {
      bg: "bg-amber-500",
      icon: Circle,
      iconColor: "text-white"
    }
  };

  return (
    <div className={cn("relative", className)}>
      {/* Ligne verticale */}
      <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-zinc-800" />

      <div className="space-y-4">
        {events.map((event, index) => {
          const style = typeStyles[event.type];
          const Icon = event.completed ? Check : style.icon;

          return (
            <div key={event.id} className="relative flex gap-4 pl-1">
              {/* Icône */}
              <div
                className={cn(
                  "relative z-10 flex h-6 w-6 items-center justify-center rounded-full",
                  event.completed ? "bg-emerald-500" : style.bg,
                  !event.completed && "opacity-60"
                )}
              >
                <Icon className={cn("h-3 w-3", style.iconColor)} />
              </div>

              {/* Contenu */}
              <div className="flex-1 pb-2">
                <div className="flex items-center gap-2">
                  <p className={cn(
                    "text-sm font-medium",
                    event.completed ? "text-zinc-300" : "text-white"
                  )}>
                    {event.title}
                  </p>
                  {event.completed && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-medium">
                      ✓ Fait
                    </span>
                  )}
                </div>
                {event.description && (
                  <p className="text-xs text-zinc-500 mt-0.5">{event.description}</p>
                )}
                {event.timestamp && (
                  <p className="text-[10px] text-zinc-600 mt-1">
                    {event.timestamp.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
