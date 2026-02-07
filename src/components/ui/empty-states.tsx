"use client";

import { cn } from "@/lib/utils";
import { 
  Bike, 
  MessageSquare, 
  Settings2, 
  Users, 
  Bookmark, 
  Heart,
  Plus,
  ArrowRight,
  Sparkles,
  Target,
  Zap,
  HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ===========================================
// Empty State générique avec call-to-action
// ===========================================
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionIcon?: React.ReactNode;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  tips?: string[];
  variant?: "default" | "chat" | "moto" | "config" | "community";
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionIcon,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  tips,
  variant = "default",
  className,
}: EmptyStateProps) {
  const variantStyles = {
    default: "border-zinc-800 bg-zinc-900/30",
    chat: "border-purple-500/20 bg-purple-500/5",
    moto: "border-blue-500/20 bg-blue-500/5",
    config: "border-amber-500/20 bg-amber-500/5",
    community: "border-emerald-500/20 bg-emerald-500/5",
  };

  const variantIconStyles = {
    default: "bg-zinc-800 text-zinc-400",
    chat: "bg-purple-500/20 text-purple-400",
    moto: "bg-blue-500/20 text-blue-400",
    config: "bg-amber-500/20 text-amber-400",
    community: "bg-emerald-500/20 text-emerald-400",
  };

  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-8 rounded-xl border text-center",
      variantStyles[variant],
      className
    )}>
      {/* Icône animée */}
      <div className={cn(
        "h-16 w-16 rounded-2xl flex items-center justify-center mb-4",
        variantIconStyles[variant]
      )}>
        {icon}
      </div>

      {/* Titre et description */}
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-zinc-400 max-w-sm mb-6">{description}</p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        {actionLabel && onAction && (
          <Button onClick={onAction} className="gap-2 bg-purple-600 hover:bg-purple-500">
            {actionIcon || <Plus className="h-4 w-4" />}
            {actionLabel}
          </Button>
        )}
        {secondaryActionLabel && onSecondaryAction && (
          <Button variant="outline" onClick={onSecondaryAction} className="gap-2">
            <HelpCircle className="h-4 w-4" />
            {secondaryActionLabel}
          </Button>
        )}
      </div>

      {/* Tips pédagogiques */}
      {tips && tips.length > 0 && (
        <div className="mt-6 p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50 max-w-sm">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2 flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Conseil
          </h4>
          <ul className="space-y-1 text-left">
            {tips.map((tip, i) => (
              <li key={i} className="text-sm text-zinc-400 flex items-start gap-2">
                <ArrowRight className="h-3.5 w-3.5 text-purple-400 mt-0.5 shrink-0" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ===========================================
// Empty States prédéfinis pour chaque section
// ===========================================

export function EmptyMotoState({ onAddMoto }: { onAddMoto?: () => void }) {
  return (
    <EmptyState
      variant="moto"
      icon={<Bike className="h-8 w-8" />}
      title="Aucune moto configurée"
      description="Ajoute ta première moto pour commencer à optimiser tes réglages de suspension."
      actionLabel="Ajouter ma moto"
      onAction={onAddMoto}
      tips={[
        "Tu peux ajouter plusieurs motos",
        "Précise ton kit de suspension si tu en as un",
        "Les réglages seront adaptés à ta moto",
      ]}
    />
  );
}

export function EmptyConfigState({ onStartChat, onBrowseCommunity }: { onStartChat?: () => void; onBrowseCommunity?: () => void }) {
  return (
    <EmptyState
      variant="config"
      icon={<Settings2 className="h-8 w-8" />}
      title="Pas encore de config sauvegardée"
      description="Crée ta première config en discutant avec l'IA ou explore les configs de la communauté."
      actionLabel="Démarrer une session IA"
      actionIcon={<MessageSquare className="h-4 w-4" />}
      onAction={onStartChat}
      secondaryActionLabel="Voir la communauté"
      onSecondaryAction={onBrowseCommunity}
      tips={[
        "L'IA analyse ton profil et ta moto",
        "Tes configs sont sauvegardées automatiquement",
        "Tu peux les partager avec la communauté",
      ]}
    />
  );
}

export function EmptySavedConfigsState({ onBrowseCommunity }: { onBrowseCommunity?: () => void }) {
  return (
    <EmptyState
      variant="community"
      icon={<Bookmark className="h-8 w-8" />}
      title="Aucune config sauvegardée"
      description="Explore les configs de la communauté et sauvegarde celles qui t'intéressent."
      actionLabel="Explorer la communauté"
      actionIcon={<Users className="h-4 w-4" />}
      onAction={onBrowseCommunity}
      tips={[
        "Sauvegarde les configs pour les retrouver facilement",
        "Compare-les avec tes réglages actuels",
        "Adapte-les à ton profil",
      ]}
    />
  );
}

export function EmptyCommunityState() {
  return (
    <EmptyState
      variant="community"
      icon={<Users className="h-8 w-8" />}
      title="Aucune config ne correspond"
      description="Essaie d'ajuster tes filtres ou explore toutes les configs disponibles."
      tips={[
        "Élargis ta recherche avec moins de filtres",
        "Les nouvelles configs arrivent régulièrement",
        "Crée et partage ta propre config !",
      ]}
    />
  );
}

export function EmptyChatState({ onSelectMoto }: { onSelectMoto?: () => void }) {
  return (
    <EmptyState
      variant="chat"
      icon={<MessageSquare className="h-8 w-8" />}
      title="Prêt à optimiser tes suspensions"
      description="Sélectionne une moto pour commencer ta session de réglage personnalisée."
      actionLabel="Sélectionner une moto"
      actionIcon={<Bike className="h-4 w-4" />}
      onAction={onSelectMoto}
      tips={[
        "L'IA s'adapte à ton niveau et ton style",
        "Tu peux sauvegarder tes réglages à tout moment",
        "Chaque session est unique et personnalisée",
      ]}
    />
  );
}

// ===========================================
// Skeleton loaders expressifs
// ===========================================
interface SkeletonCardProps {
  variant?: "config" | "moto" | "user" | "chat";
  className?: string;
}

export function SkeletonCard({ variant = "config", className }: SkeletonCardProps) {
  return (
    <div className={cn(
      "rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden animate-pulse",
      className
    )}>
      {/* Header */}
      <div className="p-4 border-b border-zinc-800/50">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-zinc-800" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-24 bg-zinc-800 rounded" />
            <div className="h-3 w-32 bg-zinc-800/50 rounded" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {variant === "config" && (
          <>
            <div className="h-5 w-3/4 bg-zinc-800 rounded" />
            <div className="h-3 w-full bg-zinc-800/50 rounded" />
            <div className="h-3 w-2/3 bg-zinc-800/50 rounded" />
            
            {/* Tags skeleton */}
            <div className="flex gap-2 pt-2">
              <div className="h-6 w-16 bg-zinc-800 rounded-full" />
              <div className="h-6 w-20 bg-zinc-800 rounded-full" />
              <div className="h-6 w-14 bg-zinc-800 rounded-full" />
            </div>
          </>
        )}

        {variant === "moto" && (
          <>
            <div className="h-6 w-1/2 bg-zinc-800 rounded" />
            <div className="h-4 w-1/3 bg-zinc-800/50 rounded" />
            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="h-16 bg-zinc-800/50 rounded-lg" />
              <div className="h-16 bg-zinc-800/50 rounded-lg" />
            </div>
          </>
        )}

        {variant === "chat" && (
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-zinc-800 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-full bg-zinc-800 rounded" />
                <div className="h-4 w-3/4 bg-zinc-800 rounded" />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <div className="flex-1 space-y-2 text-right">
                <div className="h-4 w-2/3 bg-purple-500/20 rounded ml-auto" />
              </div>
              <div className="h-8 w-8 rounded-full bg-purple-500/20 shrink-0" />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-zinc-800/50 flex justify-between">
        <div className="h-4 w-20 bg-zinc-800/50 rounded" />
        <div className="h-4 w-16 bg-zinc-800/50 rounded" />
      </div>
    </div>
  );
}

// ===========================================
// Loading state pour les pages
// ===========================================
interface PageLoadingProps {
  title?: string;
  subtitle?: string;
  className?: string;
}

export function PageLoading({ title = "Chargement", subtitle, className }: PageLoadingProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center min-h-[400px] text-center",
      className
    )}>
      <div className="relative mb-6">
        {/* Cercle animé */}
        <div className="h-16 w-16 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin" />
        {/* Icône centrale */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Zap className="h-6 w-6 text-purple-400 animate-pulse" />
        </div>
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      {subtitle && <p className="text-sm text-zinc-500 mt-1">{subtitle}</p>}
    </div>
  );
}

// ===========================================
// Success state temporaire
// ===========================================
interface SuccessToastProps {
  message: string;
  description?: string;
  className?: string;
}

export function SuccessToast({ message, description, className }: SuccessToastProps) {
  return (
    <div className={cn(
      "flex items-start gap-3 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-sm",
      "animate-in slide-in-from-top-2 fade-in duration-300",
      className
    )}>
      <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
        <Target className="h-4 w-4 text-white" />
      </div>
      <div>
        <p className="font-semibold text-emerald-400">{message}</p>
        {description && <p className="text-sm text-zinc-400 mt-0.5">{description}</p>}
      </div>
    </div>
  );
}
