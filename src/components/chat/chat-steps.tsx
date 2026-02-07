"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface ChatStepsProps {
  currentStep: string;
}

const steps = [
  { id: "collecte", label: "COLLECTE", number: 1 },
  { id: "verification", label: "VÉRIFICATION", number: 2 },
  { id: "proposition", label: "PROPOSITION", number: 3 },
  { id: "test", label: "TEST", number: 4 },
];

export function ChatSteps({ currentStep }: ChatStepsProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="max-w-3xl mx-auto px-4 h-[65px] flex items-center">
      <div className="flex items-center gap-1 pl-12">
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isPending = index > currentIndex;

        return (
          <div key={step.id} className="flex items-center">
            <div className="flex items-center gap-1.5">
              <div
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-colors",
                  isCompleted && "bg-purple-500 text-white",
                  isCurrent && "bg-purple-500 text-white",
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
                  "text-xs font-medium tracking-wider hidden sm:inline",
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
                  "mx-2 h-px w-6 sm:w-8",
                  index < currentIndex ? "bg-purple-500" : "bg-zinc-700"
                )}
              />
            )}
          </div>
        );
      })}
      </div>
    </div>
  );
}
