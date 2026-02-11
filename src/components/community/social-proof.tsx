"use client";

import { cn } from "@/lib/utils";
import { 
  Heart, 
  Users, 
  TestTube2, 
  TrendingUp, 
  CheckCircle2, 
  Star,
  Award,
  Flame,
  ThumbsUp,
  MessageCircle,
  Eye
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { usernameHandle } from "@/lib/user-display";

// ===========================================
// Badges de preuve sociale pour les configs
// ===========================================
interface SocialProofBadgesProps {
  likes?: number;
  saves?: number;
  tests?: number;
  validatedSessions?: number;
  isTopConfig?: boolean;
  isTrending?: boolean;
  matchScore?: number; // Score de compatibilité avec le profil du user
  className?: string;
}

export function SocialProofBadges({
  likes = 0,
  saves = 0,
  tests = 0,
  validatedSessions = 0,
  isTopConfig = false,
  isTrending = false,
  matchScore,
  className,
}: SocialProofBadgesProps) {
  const hasSignificantEngagement = likes >= 5 || saves >= 3 || tests >= 10;

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {/* Badge Top Config */}
      {isTopConfig && (
        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 gap-1">
          <Award className="h-3 w-3" />
          Top Config
        </Badge>
      )}

      {/* Badge Trending */}
      {isTrending && (
        <Badge className="bg-gradient-to-r from-pink-500 to-rose-500 text-white border-0 gap-1 animate-pulse">
          <Flame className="h-3 w-3" />
          Tendance
        </Badge>
      )}

      {/* Score de compatibilité */}
      {matchScore !== undefined && matchScore >= 70 && (
        <Badge className={cn(
          "border-0 gap-1",
          matchScore >= 90 
            ? "bg-emerald-500 text-white" 
            : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
        )}>
          <Target className="h-3 w-3" />
          {matchScore}% compatible
        </Badge>
      )}

      {/* Nombre de tests */}
      {tests > 0 && (
        <Badge variant="outline" className="border-blue-500/30 text-blue-400 gap-1">
          <TestTube2 className="h-3 w-3" />
          {formatNumber(tests)} tests
        </Badge>
      )}

      {/* Sessions validées */}
      {validatedSessions >= 3 && (
        <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Validée {validatedSessions}x
        </Badge>
      )}

      {/* Likes significatifs */}
      {likes >= 5 && (
        <Badge variant="outline" className="border-pink-500/30 text-pink-400 gap-1">
          <Heart className="h-3 w-3 fill-current" />
          {formatNumber(likes)}
        </Badge>
      )}

      {/* Saves significatifs */}
      {saves >= 3 && (
        <Badge variant="outline" className="border-purple-500/30 text-purple-400 gap-1">
          <Users className="h-3 w-3" />
          {formatNumber(saves)} pilotes
        </Badge>
      )}
    </div>
  );
}

// Import manquant
import { Target } from "lucide-react";

// ===========================================
// Card de config communauté améliorée
// ===========================================
interface CommunityConfigHighlightProps {
  title: string;
  description?: string;
  author: {
    name: string;
    username?: string;
    imageUrl?: string;
    isVerified?: boolean;
  };
  moto: {
    brand: string;
    model: string;
    year: number;
  };
  stats: {
    likes: number;
    saves: number;
    tests: number;
    validatedSessions: number;
  };
  tags: string[];
  matchScore?: number;
  highlightReason?: string;
  onClick?: () => void;
  className?: string;
}

export function CommunityConfigHighlight({
  title,
  description,
  author,
  moto,
  stats,
  tags,
  matchScore,
  highlightReason,
  onClick,
  className,
}: CommunityConfigHighlightProps) {
  const isHighlyValidated = stats.validatedSessions >= 3;
  const isPopular = stats.likes >= 10 || stats.saves >= 5;
  const authorHandle = usernameHandle(author.username);

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative rounded-xl border bg-gradient-to-br from-zinc-900 to-zinc-950 overflow-hidden transition-all duration-300 cursor-pointer",
        "hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10",
        isHighlyValidated ? "border-emerald-500/30" : "border-zinc-800",
        className
      )}
    >
      {/* Bandeau de mise en avant */}
      {highlightReason && (
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-1 text-xs font-semibold text-white text-center">
          {highlightReason}
        </div>
      )}

      <div className={cn("p-4", highlightReason && "pt-8")}>
        {/* Header avec auteur */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {author.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={author.imageUrl}
                alt={authorHandle}
                className="h-8 w-8 rounded-full border border-zinc-700"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center">
                <Users className="h-4 w-4 text-zinc-600" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium text-white">{authorHandle}</span>
                {author.isVerified && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-400" />
                )}
              </div>
              <span className="text-xs text-zinc-500">
                {moto.brand} {moto.model} {moto.year}
              </span>
            </div>
          </div>

          {/* Score de compatibilité */}
          {matchScore !== undefined && (
            <div className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-lg",
              matchScore >= 80 
                ? "bg-emerald-500/20 text-emerald-400" 
                : matchScore >= 60 
                  ? "bg-amber-500/20 text-amber-400"
                  : "bg-zinc-800 text-zinc-400"
            )}>
              <Target className="h-3.5 w-3.5" />
              <span className="text-sm font-bold">{matchScore}%</span>
            </div>
          )}
        </div>

        {/* Titre et description */}
        <h3 className="font-bold text-white mb-1 group-hover:text-purple-400 transition-colors">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-zinc-400 line-clamp-2 mb-3">{description}</p>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {tags.slice(0, 4).map((tag, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide bg-zinc-800 text-zinc-400"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Stats sociales */}
        <div className="flex items-center gap-4 pt-3 border-t border-zinc-800">
          <StatItem icon={<Heart className="h-3.5 w-3.5" />} value={stats.likes} label="likes" />
          <StatItem icon={<Users className="h-3.5 w-3.5" />} value={stats.saves} label="saves" />
          <StatItem icon={<TestTube2 className="h-3.5 w-3.5" />} value={stats.tests} label="tests" />
          {isHighlyValidated && (
            <div className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Validée</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatItem({ 
  icon, 
  value, 
  label 
}: { 
  icon: React.ReactNode; 
  value: number; 
  label: string;
}) {
  if (value === 0) return null;
  
  return (
    <div className="flex items-center gap-1 text-zinc-500">
      {icon}
      <span className="text-xs">{formatNumber(value)}</span>
    </div>
  );
}

// ===========================================
// Section "Configs tendances"
// ===========================================
interface TrendingConfigsSectionProps {
  title?: string;
  subtitle?: string;
  configs: Array<{
    id: string;
    name: string;
    author: string;
    authorImage?: string;
    likes: number;
    tests: number;
    terrain?: string;
    weight?: string;
  }>;
  onConfigClick?: (id: string) => void;
  className?: string;
}

export function TrendingConfigsSection({
  title = "Configs tendances",
  subtitle = "Les plus testées ce mois-ci",
  configs,
  onConfigClick,
  className,
}: TrendingConfigsSectionProps) {
  if (configs.length === 0) return null;

  return (
    <div className={cn("space-y-3", className)}>
      <div>
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-pink-400" />
          {title}
        </h3>
        <p className="text-sm text-zinc-500">{subtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {configs.slice(0, 3).map((config, index) => (
          <div
            key={config.id}
            onClick={() => onConfigClick?.(config.id)}
            className={cn(
              "relative p-3 rounded-lg border cursor-pointer transition-all",
              "bg-gradient-to-br from-zinc-900 to-zinc-950",
              "hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10",
              index === 0 
                ? "border-amber-500/30 ring-1 ring-amber-500/20" 
                : "border-zinc-800"
            )}
          >
            {/* Badge de rang */}
            <div className={cn(
              "absolute -top-2 -left-2 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold",
              index === 0 && "bg-amber-500 text-white",
              index === 1 && "bg-zinc-400 text-zinc-900",
              index === 2 && "bg-amber-700 text-white"
            )}>
              {index + 1}
            </div>

            <div className="flex items-center gap-2 mb-2">
              {config.authorImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={config.authorImage}
                  alt=""
                  className="h-6 w-6 rounded-full"
                />
              ) : (
                <div className="h-6 w-6 rounded-full bg-zinc-800" />
              )}
              <span className="text-xs text-zinc-500">{config.author}</span>
            </div>

            <h4 className="font-semibold text-white text-sm mb-2 line-clamp-1">
              {config.name}
            </h4>

            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {config.terrain && (
                  <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-400">
                    {config.terrain}
                  </Badge>
                )}
                {config.weight && (
                  <Badge variant="outline" className="text-[10px] border-zinc-600 text-zinc-400">
                    {config.weight}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span className="flex items-center gap-1">
                  <TestTube2 className="h-3 w-3" />
                  {config.tests}
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="h-3 w-3" />
                  {config.likes}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===========================================
// Composant "Recommandé pour toi"
// ===========================================
interface RecommendedForYouProps {
  configs: Array<{
    id: string;
    name: string;
    matchScore: number;
    reason: string;
    terrain?: string;
    weight?: string;
  }>;
  onConfigClick?: (id: string) => void;
  className?: string;
}

export function RecommendedForYou({
  configs,
  onConfigClick,
  className,
}: RecommendedForYouProps) {
  if (configs.length === 0) return null;

  return (
    <div className={cn("space-y-3", className)}>
      <div>
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Star className="h-5 w-5 text-amber-400" />
          Recommandé pour toi
        </h3>
        <p className="text-sm text-zinc-500">Configs qui matchent ton profil</p>
      </div>

      <div className="space-y-2">
        {configs.slice(0, 3).map((config) => (
          <div
            key={config.id}
            onClick={() => onConfigClick?.(config.id)}
            className={cn(
              "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all",
              "bg-zinc-900/50 border-zinc-800",
              "hover:border-emerald-500/50 hover:bg-emerald-500/5"
            )}
          >
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-white text-sm truncate">{config.name}</h4>
              <p className="text-xs text-zinc-500 truncate">{config.reason}</p>
            </div>
            
            <div className="flex items-center gap-2 ml-3">
              {config.terrain && (
                <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-400">
                  {config.terrain}
                </Badge>
              )}
              <div className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-bold",
                config.matchScore >= 80 
                  ? "bg-emerald-500 text-white" 
                  : "bg-emerald-500/20 text-emerald-400"
              )}>
                {config.matchScore}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Helper pour formater les nombres
function formatNumber(num: number): string {
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num.toString();
}
