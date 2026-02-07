"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { ProfileSidebar } from "@/components/sidebar/profile-sidebar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfigCard } from "@/components/config-card";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { 
  Settings2, 
  Filter,
  Users,
  Bookmark,
  UserCheck,
  Globe,
  TrendingUp,
  Sparkles,
  MessageSquare
} from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";
import { BRANDS, getModelsForBrand } from "@/data/moto-models";
import { 
  EmptyState,
  EmptyConfigState, 
  EmptySavedConfigsState, 
  EmptyCommunityState 
} from "@/components/ui/empty-states";
import { SocialProofBadges } from "@/components/community/social-proof";
import { useRouter } from "next/navigation";

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

export default function ConfigsPage() {
  const { user } = useCurrentUser();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("communaute");
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  
  // Filtres
  const [brandFilter, setBrandFilter] = useState<string>("");
  const [modelFilter, setModelFilter] = useState<string>("");
  const [sportFilter, setSportFilter] = useState<string>("");
  const [terrainFilter, setTerrainFilter] = useState<string>("");
  const [levelFilter, setLevelFilter] = useState<string>("");
  const [styleFilter, setStyleFilter] = useState<string>("");
  const [objectiveFilter, setObjectiveFilter] = useState<string>("");

  const configs = useQuery(
    api.configs.getByUser,
    user?._id ? { userId: user._id } : "skip"
  );

  const publicConfigs = useQuery(api.configs.getPublic, {
    brand: brandFilter || undefined,
    model: modelFilter || undefined,
    sportType: sportFilter || undefined,
    terrainType: terrainFilter || undefined,
    riderLevel: levelFilter || undefined,
    riderStyle: styleFilter || undefined,
    riderObjective: objectiveFilter || undefined,
  });

  const savedConfigs = useQuery(
    api.savedConfigs.getByUser,
    user?._id ? { userId: user._id } : "skip"
  );

  const savedConfigIds = useQuery(
    api.savedConfigs.getSavedIds,
    user?._id ? { userId: user._id } : "skip"
  );

  const likedConfigIds = useQuery(
    api.configLikes.getLikedIds,
    user?._id ? { userId: user._id } : "skip"
  );

  const followingConfigs = useQuery(
    api.configs.getFromFollowing,
    user?._id ? { userId: user._id } : "skip"
  );

  const followingIds = useQuery(
    api.follows.getFollowingIds,
    user?._id ? { userId: user._id } : "skip"
  );

  const deleteConfig = useMutation(api.configs.remove);
  const updateConfig = useMutation(api.configs.update);
  const updateConfigField = useMutation(api.configs.updateField);
  const toggleLikeConfig = useMutation(api.configLikes.toggleLike);
  const saveConfig = useMutation(api.savedConfigs.save);
  const unsaveConfig = useMutation(api.savedConfigs.unsave);
  const toggleFollowUser = useMutation(api.follows.toggleFollow);

  const handleDelete = async (configId: Id<"configs">) => {
    await deleteConfig({ configId });
  };

  const handleVisibilityChange = async (configId: Id<"configs">, visibility: string) => {
    await updateConfig({ configId, visibility });
  };

  const handleUpdateField = async (configId: Id<"configs">, field: string, value: number) => {
    await updateConfigField({ configId, field, value });
  };

  const handleSaveConfig = async (configId: Id<"configs">) => {
    if (!user?._id) return;
    await saveConfig({ userId: user._id, configId });
  };

  const handleUnsaveConfig = async (configId: Id<"configs">) => {
    if (!user?._id) return;
    await unsaveConfig({ userId: user._id, configId });
  };

  const isConfigSaved = (configId: Id<"configs">) => {
    return savedConfigIds?.includes(configId) || false;
  };

  const isConfigLiked = (configId: Id<"configs">) => {
    return likedConfigIds?.includes(configId) || false;
  };

  const handleToggleLike = async (configId: Id<"configs">) => {
    if (!user?._id) return; // Ne pas permettre le like si non connecté
    await toggleLikeConfig({ userId: user._id, configId });
  };

  const handleToggleFollow = async (followingId: Id<"users">) => {
    if (!user?._id) return;
    await toggleFollowUser({ followerId: user._id, followingId });
  };

  const isUserFollowed = (userId: Id<"users">) => {
    return followingIds?.includes(userId) || false;
  };

  const copyShareLink = (shareLink: string) => {
    const fullUrl = `${window.location.origin}/config/${shareLink}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(shareLink);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const availableModels = brandFilter ? getModelsForBrand(brandFilter) : [];

  const clearFilters = () => {
    setBrandFilter("");
    setModelFilter("");
    setSportFilter("");
    setTerrainFilter("");
    setLevelFilter("");
    setStyleFilter("");
    setObjectiveFilter("");
  };

  const hasFilters = brandFilter || modelFilter || sportFilter || terrainFilter || levelFilter || styleFilter || objectiveFilter;

  // Fonction de filtrage locale pour les configs
  const filterConfigs = <T extends { 
    motoYear?: string; 
    motoBrand?: string; 
    motoModel?: string; 
    sportType?: string; 
    terrainType?: string;
    riderLevel?: string;
    riderStyle?: string;
    riderObjective?: string;
  }>(configList: T[] | undefined): T[] => {
    if (!configList) return [];
    return configList.filter(config => {
      if (brandFilter && config.motoBrand !== brandFilter) return false;
      if (modelFilter && config.motoModel !== modelFilter) return false;
      if (sportFilter && config.sportType !== sportFilter) return false;
      if (terrainFilter && config.terrainType !== terrainFilter) return false;
      if (levelFilter && config.riderLevel !== levelFilter) return false;
      if (styleFilter && config.riderStyle !== styleFilter) return false;
      if (objectiveFilter && config.riderObjective !== objectiveFilter) return false;
      return true;
    });
  };

  // Appliquer les filtres à toutes les listes
  const filteredConfigs = filterConfigs(configs);
  const filteredSavedConfigs = filterConfigs(savedConfigs?.filter(Boolean) as typeof savedConfigs);
  const filteredFollowingConfigs = filterConfigs(followingConfigs);

  // Fonction pour obtenir le label de période
  const getTimelineLabel = (timestamp: number): string => {
    const now = new Date();
    const date = new Date(timestamp);
    
    // Reset time to start of day for comparison
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const configDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    const diffTime = today.getTime() - configDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Hier";
    if (diffDays === 2) return "Il y a 2 jours";
    if (diffDays === 3) return "Il y a 3 jours";
    if (diffDays === 4) return "Il y a 4 jours";
    if (diffDays === 5) return "Il y a 5 jours";
    if (diffDays === 6) return "Il y a 6 jours";
    if (diffDays <= 13) return "La semaine dernière";
    if (diffDays <= 20) return "Il y a 2 semaines";
    if (diffDays <= 27) return "Il y a 3 semaines";
    if (diffDays <= 60) return "Le mois dernier";
    if (diffDays <= 90) return "Il y a 2 mois";
    if (diffDays <= 180) return "Il y a quelques mois";
    return "Il y a longtemps";
  };

  // Grouper les configs par période
  const groupedPublicConfigs = publicConfigs?.reduce((acc, config) => {
    const label = getTimelineLabel(config.createdAt);
    if (!acc[label]) acc[label] = [];
    acc[label].push(config);
    return acc;
  }, {} as Record<string, typeof publicConfigs>);

  // Ordre des périodes
  const timelineOrder = [
    "Aujourd'hui",
    "Hier",
    "Il y a 2 jours",
    "Il y a 3 jours",
    "Il y a 4 jours",
    "Il y a 5 jours",
    "Il y a 6 jours",
    "La semaine dernière",
    "Il y a 2 semaines",
    "Il y a 3 semaines",
    "Le mois dernier",
    "Il y a 2 mois",
    "Il y a quelques mois",
    "Il y a longtemps"
  ];

  const sortedTimelineKeys = groupedPublicConfigs 
    ? Object.keys(groupedPublicConfigs).sort((a, b) => timelineOrder.indexOf(a) - timelineOrder.indexOf(b))
    : [];

  return (
    <>
      <SignedOut>
        <div className="flex h-screen items-center justify-center bg-zinc-950">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-white">CONNECTE-TOI POUR VOIR LES CONFIGS</h1>
            <SignInButton mode="modal">
              <Button className="bg-purple-500 hover:bg-purple-600 font-bold italic">
                Se connecter
              </Button>
            </SignInButton>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="flex flex-col h-screen bg-zinc-950">
            <div className="flex flex-1 overflow-hidden">
              <div className="flex-1 overflow-auto p-8">
                <div className="max-w-4xl mx-auto space-y-6">
                  <div>
                    <h1 className="text-2xl font-bold text-white">
                      COMMUNAUTÉ
                    </h1>
                    <p className="text-zinc-400 mt-1 normal-case not-italic font-normal">
                      Découvre les configs partagées par la communauté
                    </p>
                  </div>

                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="bg-zinc-900 border border-zinc-800 p-1">
                      <TabsTrigger 
                        value="communaute" 
                        className="data-[state=active]:bg-purple-500 data-[state=active]:text-white gap-2"
                      >
                        <Globe className="h-4 w-4" />
                        EXPLORER
                      </TabsTrigger>
                      <TabsTrigger 
                        value="suivi" 
                        className="data-[state=active]:bg-purple-500 data-[state=active]:text-white gap-2"
                      >
                        <UserCheck className="h-4 w-4" />
                        SUIVI
                      </TabsTrigger>
                      <TabsTrigger 
                        value="sauvegardees" 
                        className="data-[state=active]:bg-purple-500 data-[state=active]:text-white gap-2"
                      >
                        <Bookmark className="h-4 w-4" />
                        SAUVEGARDÉES
                      </TabsTrigger>
                      <TabsTrigger 
                        value="mes-configs" 
                        className="data-[state=active]:bg-purple-500 data-[state=active]:text-white gap-2"
                      >
                        <Settings2 className="h-4 w-4" />
                        MES PARTAGES
                      </TabsTrigger>
                    </TabsList>

                    {/* Filtres - communs à tous les onglets */}
                    <div className="flex flex-wrap items-center gap-3 p-4 mt-4 bg-zinc-900/50 rounded-lg border border-zinc-800">
                      <Filter className="h-4 w-4 text-zinc-500" />
                      
                      <select
                        value={brandFilter}
                        onChange={(e) => {
                          setBrandFilter(e.target.value);
                          setModelFilter("");
                        }}
                        className="px-3 py-1.5 rounded-md bg-zinc-800 border border-zinc-700 text-sm text-white"
                      >
                        <option value="">Toutes marques</option>
                        {BRANDS.map(brand => (
                          <option key={brand} value={brand}>{brand}</option>
                        ))}
                      </select>

                      <select
                        value={modelFilter}
                        onChange={(e) => setModelFilter(e.target.value)}
                        disabled={!brandFilter}
                        className="px-3 py-1.5 rounded-md bg-zinc-800 border border-zinc-700 text-sm text-white disabled:opacity-50"
                      >
                        <option value="">Tous modèles</option>
                        {availableModels.map(model => (
                          <option key={model} value={model}>{model}</option>
                        ))}
                      </select>

                      <select
                        value={sportFilter}
                        onChange={(e) => setSportFilter(e.target.value)}
                        className="px-3 py-1.5 rounded-md bg-zinc-800 border border-zinc-700 text-sm text-white"
                      >
                        <option value="">Tous sports</option>
                        {SPORT_TYPES.map(sport => (
                          <option key={sport.value} value={sport.value}>{sport.label}</option>
                        ))}
                      </select>

                      <select
                        value={terrainFilter}
                        onChange={(e) => setTerrainFilter(e.target.value)}
                        className="px-3 py-1.5 rounded-md bg-zinc-800 border border-zinc-700 text-sm text-white"
                      >
                        <option value="">Tous terrains</option>
                        {TERRAIN_TYPES.map(terrain => (
                          <option key={terrain.value} value={terrain.value}>{terrain.label}</option>
                        ))}
                      </select>

                      <div className="w-px h-6 bg-zinc-700" />

                      <select
                        value={levelFilter}
                        onChange={(e) => setLevelFilter(e.target.value)}
                        className="px-3 py-1.5 rounded-md bg-zinc-800 border border-zinc-700 text-sm text-white"
                      >
                        <option value="">Tous niveaux</option>
                        {LEVELS.map(level => (
                          <option key={level.value} value={level.value}>{level.label}</option>
                        ))}
                      </select>

                      <select
                        value={styleFilter}
                        onChange={(e) => setStyleFilter(e.target.value)}
                        className="px-3 py-1.5 rounded-md bg-zinc-800 border border-zinc-700 text-sm text-white"
                      >
                        <option value="">Tous styles</option>
                        {STYLES.map(style => (
                          <option key={style.value} value={style.value}>{style.label}</option>
                        ))}
                      </select>

                      <select
                        value={objectiveFilter}
                        onChange={(e) => setObjectiveFilter(e.target.value)}
                        className="px-3 py-1.5 rounded-md bg-zinc-800 border border-zinc-700 text-sm text-white"
                      >
                        <option value="">Tous objectifs</option>
                        {OBJECTIVES.map(obj => (
                          <option key={obj.value} value={obj.value}>{obj.label}</option>
                        ))}
                      </select>

                      {hasFilters && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={clearFilters}
                          className="text-zinc-400 hover:text-white"
                        >
                          Effacer
                        </Button>
                      )}
                    </div>

                    {/* Mes Configs */}
                    <TabsContent value="mes-configs" className="mt-4 space-y-4">
                      {filteredConfigs?.map((config) => (
                        <ConfigCard
                          key={config._id}
                          config={config}
                          isOwner={true}
                          showUser={false}
                          showVisibilityControls={true}
                          showDeleteButton={true}
                          showLikeButton={false}
                          showSaveButton={false}
                          showAdjustButtons={true}
                          onDelete={() => handleDelete(config._id)}
                          onVisibilityChange={(v) => handleVisibilityChange(config._id, v)}
                          onCopyLink={copyShareLink}
                          copiedLink={copiedLink}
                          onUpdateField={(field, value) => handleUpdateField(config._id, field, value)}
                        />
                      ))}

                      {(!filteredConfigs || filteredConfigs.length === 0) && (
                        <EmptyConfigState 
                          onStartChat={() => router.push("/chat/new")}
                          onBrowseCommunity={() => setActiveTab("communaute")}
                        />
                      )}
                    </TabsContent>

                    {/* Configs Sauvegardées */}
                    <TabsContent value="sauvegardees" className="mt-4 space-y-4">
                      {filteredSavedConfigs?.filter(Boolean).map((config) => config && (
                        <ConfigCard
                          key={config._id}
                          config={config}
                          currentUserId={user?._id}
                          isOwner={false}
                          isSaved={true}
                          isLiked={isConfigLiked(config._id)}
                          showUser={true}
                          showFollowButton={true}
                          isFollowingUser={config.user ? isUserFollowed(config.user._id as Id<"users">) : false}
                          onToggleFollow={config.user ? () => handleToggleFollow(config.user!._id as Id<"users">) : undefined}
                          onUnsave={() => handleUnsaveConfig(config._id)}
                          onLike={() => handleToggleLike(config._id)}
                        />
                      ))}

                      {(!filteredSavedConfigs || filteredSavedConfigs.length === 0) && (
                        <EmptySavedConfigsState 
                          onBrowseCommunity={() => setActiveTab("communaute")}
                        />
                      )}
                    </TabsContent>

                    {/* Communauté */}
                    <TabsContent value="communaute" className="mt-4 space-y-4">
                      {/* Timeline grouped configs */}
                      {sortedTimelineKeys.map((timeLabel) => (
                        <div key={timeLabel} className="space-y-3">
                          {/* Timeline header */}
                          <div className="flex items-center gap-3 pt-2">
                            <div className="h-px flex-1 bg-zinc-800" />
                            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider px-2">
                              {timeLabel}
                            </span>
                            <div className="h-px flex-1 bg-zinc-800" />
                          </div>
                          
                          {/* Configs in this period */}
                          {groupedPublicConfigs?.[timeLabel]?.map((config) => (
                            <ConfigCard
                              key={config._id}
                              config={config}
                              currentUserId={user?._id}
                              isOwner={config.userId === user?._id}
                              isSaved={isConfigSaved(config._id)}
                              isLiked={isConfigLiked(config._id)}
                              isFollowingUser={config.user?._id ? isUserFollowed(config.user._id as Id<"users">) : false}
                              onLike={() => handleToggleLike(config._id)}
                              onSave={config.userId !== user?._id ? () => handleSaveConfig(config._id) : undefined}
                              onUnsave={config.userId !== user?._id ? () => handleUnsaveConfig(config._id) : undefined}
                              onDelete={config.userId === user?._id ? () => handleDelete(config._id) : undefined}
                              onVisibilityChange={config.userId === user?._id ? (v) => handleVisibilityChange(config._id, v) : undefined}
                              onCopyLink={copyShareLink}
                              copiedLink={copiedLink}
                              onToggleFollow={config.user?._id && config.userId !== user?._id ? () => handleToggleFollow(config.user!._id as Id<"users">) : undefined}
                            />
                          ))}
                        </div>
                      ))}

                      {(!publicConfigs || publicConfigs.length === 0) && (
                        <EmptyCommunityState />
                      )}
                    </TabsContent>

                    {/* Suivi - Configs des utilisateurs suivis */}
                    <TabsContent value="suivi" className="mt-4 space-y-4">
                      {filteredFollowingConfigs?.map((config) => (
                        <ConfigCard
                          key={config._id}
                          config={config}
                          currentUserId={user?._id}
                          isOwner={false}
                          isSaved={isConfigSaved(config._id)}
                          isLiked={isConfigLiked(config._id)}
                          isFollowingUser={config.user?._id ? isUserFollowed(config.user._id as Id<"users">) : false}
                          onLike={() => handleToggleLike(config._id)}
                          onSave={() => handleSaveConfig(config._id)}
                          onUnsave={() => handleUnsaveConfig(config._id)}
                          onToggleFollow={config.user?._id ? () => handleToggleFollow(config.user!._id as Id<"users">) : undefined}
                        />
                      ))}

                      {(!filteredFollowingConfigs || filteredFollowingConfigs.length === 0) && (
                        <EmptyState
                          variant="community"
                          icon={<UserCheck className="h-8 w-8" />}
                          title={hasFilters ? "Aucune config trouvée" : "Tu ne suis personne pour l'instant"}
                          description={hasFilters 
                            ? "Essaie de modifier tes filtres pour élargir la recherche."
                            : "Suis des riders dans l'onglet Explorer pour voir leurs nouvelles configs ici automatiquement."}
                          actionLabel={!hasFilters ? "Explorer la communauté" : undefined}
                          actionIcon={!hasFilters ? <Globe className="h-4 w-4" /> : undefined}
                          onAction={!hasFilters ? () => setActiveTab("communaute") : undefined}
                          tips={!hasFilters ? [
                            "Trouve des riders avec un profil similaire au tien",
                            "Tu recevras leurs configs dès qu'ils en partagent",
                            "Compare facilement les configs entre riders",
                          ] : undefined}
                        />
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              </div>

              <ProfileSidebar />
            </div>
          </SidebarInset>
        </SidebarProvider>
      </SignedIn>
    </>
  );
}
