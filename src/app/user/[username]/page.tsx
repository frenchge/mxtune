"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { ConfigCard } from "@/components/config-card";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { 
  ArrowLeft, 
  User, 
  Weight, 
  Target, 
  Gauge, 
  Settings2,
  Bike,
  UserPlus,
  UserMinus,
  Eye,
  EyeOff,
  Bookmark,
  Save,
  Loader2
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { BrandLogo } from "@/components/ui/brand-logo";
import { Id } from "../../../../convex/_generated/dataModel";

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

export default function UserProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { user: currentUser } = useCurrentUser();

  const user = useQuery(api.users.getByUsername, { username });
  const configs = useQuery(
    api.users.getPublicConfigs,
    user?._id ? { userId: user._id } : "skip"
  );
  const publicMotos = useQuery(
    api.motos.getPublicByUser,
    user?._id ? { userId: user._id as Id<"users"> } : "skip"
  );
  const followStats = useQuery(
    api.follows.getStats,
    user?._id ? { userId: user._id } : "skip"
  );
  
  // Saved configs for own profile
  const savedConfigs = useQuery(
    api.savedConfigs.getByUser,
    user?._id && currentUser?._id && user._id === currentUser._id
      ? { userId: user._id as Id<"users"> }
      : "skip"
  );
  
  // Check if this is the current user's own profile
  const isOwnProfile = currentUser?._id && user?._id && currentUser._id === user._id;
  
  // Check if the profile user follows the current user
  const isFollowingMe = useQuery(
    api.follows.isFollowing,
    user?._id && currentUser?._id && user._id !== currentUser._id
      ? { followerId: user._id as Id<"users">, followingId: currentUser._id }
      : "skip"
  );

  // Check if current user follows this profile
  const amIFollowing = useQuery(
    api.follows.isFollowing,
    user?._id && currentUser?._id && user._id !== currentUser._id
      ? { followerId: currentUser._id, followingId: user._id as Id<"users"> }
      : "skip"
  );

  const toggleFollow = useMutation(api.follows.toggleFollow);

  const handleToggleFollow = async () => {
    if (!currentUser?._id || !user?._id) return;
    await toggleFollow({ 
      followerId: currentUser._id, 
      followingId: user._id as Id<"users"> 
    });
  };

  if (user === undefined) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-pulse text-zinc-500">Chargement...</div>
      </div>
    );
  }

  if (user === null) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <User className="h-16 w-16 mx-auto text-zinc-700" />
          <h1 className="text-2xl font-bold text-white">UTILISATEUR INTROUVABLE</h1>
          <p className="text-zinc-500 normal-case">
            Cet utilisateur n&apos;existe pas
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
    <>
      {/* Version avec sidebars pour les utilisateurs connectés */}
      <SignedIn>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="flex flex-col h-screen bg-zinc-950">
            <div className="flex-1 overflow-auto">
              <ProfileContent 
                user={user} 
                configs={configs} 
                publicMotos={publicMotos}
                savedConfigs={savedConfigs?.filter((c): c is NonNullable<typeof c> => c !== null)}
                followStats={followStats} 
                isFollowingMe={isFollowingMe} 
                amIFollowing={amIFollowing}
                isOwnProfile={!!isOwnProfile}
                onToggleFollow={handleToggleFollow}
                showHeader={false} 
              />
            </div>
          </SidebarInset>
        </SidebarProvider>
      </SignedIn>

      {/* Version standalone pour les visiteurs non connectés */}
      <SignedOut>
        <ProfileContent 
          user={user} 
          configs={configs} 
          publicMotos={publicMotos}
          savedConfigs={undefined}
          followStats={followStats} 
          isFollowingMe={false} 
          amIFollowing={false}
          isOwnProfile={false}
          showHeader={true} 
        />
      </SignedOut>
    </>
  );
}

// Composant de contenu du profil réutilisable
interface ProfileContentProps {
  user: {
    _id: string;
    name: string;
    username?: string;
    imageUrl?: string;
    weight?: number;
    level?: string;
    style?: string;
    objective?: string;
  };
  configs: Array<{
    _id: string;
    name: string;
    description?: string;
    forkCompression?: number;
    forkRebound?: number;
    shockCompressionLow?: number;
    shockCompressionHigh?: number;
    shockRebound?: number;
    staticSag?: number;
    dynamicSag?: number;
    tirePressureFront?: number;
    tirePressureRear?: number;
    sportType?: string;
    terrainType?: string;
    riderWeight?: number;
    riderLevel?: string;
    riderStyle?: string;
    riderObjective?: string;
    visibility?: string;
    shareLink?: string;
    likes?: number;
    createdAt: number;
    moto?: {
      brand: string;
      model: string;
      year: number;
    } | null;
  }> | undefined;
  publicMotos?: Array<{
    _id: string;
    brand: string;
    model: string;
    year: number;
    forkBrand?: string;
    forkModel?: string;
    shockBrand?: string;
    shockModel?: string;
    isPublic?: boolean;
  }> | undefined;
  savedConfigs?: Array<{
    _id: string;
    name: string;
    description?: string;
    forkCompression?: number;
    forkRebound?: number;
    shockCompressionLow?: number;
    shockCompressionHigh?: number;
    shockRebound?: number;
    staticSag?: number;
    dynamicSag?: number;
    tirePressureFront?: number;
    tirePressureRear?: number;
    sportType?: string;
    terrainType?: string;
    riderWeight?: number;
    riderLevel?: string;
    riderStyle?: string;
    riderObjective?: string;
    visibility?: string;
    shareLink?: string;
    likes?: number;
    createdAt: number;
    savedAt?: number;
    moto?: {
      brand: string;
      model: string;
      year: number;
    } | null;
    user?: {
      _id: string;
      name: string;
      username?: string;
      imageUrl?: string;
    } | null;
  }> | undefined;
  onToggleMotoVisibility?: (motoId: string, currentVisibility: boolean | undefined) => void;
  followStats?: {
    followers: number;
    following: number;
  };
  isFollowingMe?: boolean;
  amIFollowing?: boolean;
  isOwnProfile: boolean;
  onToggleFollow?: () => void;
  showHeader: boolean;
}

export function ProfileContent({ 
  user, 
  configs, 
  publicMotos,
  savedConfigs,
  followStats, 
  isFollowingMe, 
  amIFollowing,
  isOwnProfile,
  onToggleFollow,
  onToggleMotoVisibility,
  showHeader 
}: ProfileContentProps) {
  const { user: currentUser, clerkUser } = useCurrentUser();
  const updateProfile = useMutation(api.users.updateProfile);
  const [activeTab, setActiveTab] = useState("configs");
  const [profileWeight, setProfileWeight] = useState(user.weight ?? 75);
  const [profileLevel, setProfileLevel] = useState(user.level ?? "");
  const [profileStyle, setProfileStyle] = useState(user.style ?? "");
  const [profileObjective, setProfileObjective] = useState(user.objective ?? "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const canEditProfile = isOwnProfile && currentUser?._id === user._id;

  useEffect(() => {
    setProfileWeight(user.weight ?? 75);
    setProfileLevel(user.level ?? "");
    setProfileStyle(user.style ?? "");
    setProfileObjective(user.objective ?? "");
  }, [user._id, user.weight, user.level, user.style, user.objective]);

  const handleSaveProfile = async () => {
    if (!canEditProfile || !clerkUser?.id) return;

    setIsSavingProfile(true);
    try {
      await updateProfile({
        clerkId: clerkUser.id,
        weight: profileWeight || undefined,
        level: profileLevel || undefined,
        style: profileStyle || undefined,
        objective: profileObjective || undefined,
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil:", error);
    } finally {
      setIsSavingProfile(false);
    }
  };
  
  return (
    <div className={showHeader ? "min-h-screen bg-zinc-950" : ""}>
      {/* Header - seulement pour les visiteurs non connectés */}
      {showHeader && (
        <div className="border-b border-zinc-800 bg-zinc-900/50">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <Image src="/logo.png" alt="MXTune" width={44} height={44} />
            </Link>
            
            <Link href="/configs">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-zinc-700 text-zinc-400 hover:text-white"
              >
                <Settings2 className="h-4 w-4" />
                Communauté
              </Button>
            </Link>
          </div>
        </div>
      )}

      <div className={`max-w-4xl mx-auto px-6 py-12 ${!showHeader ? 'pt-8' : ''}`}>
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-10">
          {/* Avatar */}
          <div className="relative">
            {user.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.imageUrl}
                alt=""
                className="h-28 w-28 rounded-full border-4 border-purple-500/30"
              />
            ) : (
              <div className="h-28 w-28 rounded-full bg-zinc-800 border-4 border-purple-500/30 flex items-center justify-center">
                <User className="h-12 w-12 text-zinc-600" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <h1 className="text-3xl font-bold text-white">
                @{user.username || user.name}
              </h1>
              {isFollowingMe && (
                <span className="text-xs font-medium text-zinc-500 bg-zinc-800 px-2 py-1 rounded-full">
                  Vous suit
                </span>
              )}
            </div>
            
            {/* Followers / Following */}
            {followStats && (
              <div className="flex justify-center md:justify-start gap-4 mt-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-bold text-white">{followStats.followers}</span>
                  <span className="text-sm text-zinc-500">followers</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-bold text-white">{followStats.following}</span>
                  <span className="text-sm text-zinc-500">suivi(s)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-bold text-white">{configs?.length || 0}</span>
                  <span className="text-sm text-zinc-500">configs</span>
                </div>
              </div>
            )}
            
            {/* Stats badges */}
            <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
              {user.weight && (
                <Badge variant="outline" className="border-purple-500/30 text-purple-400 gap-1.5 py-1.5">
                  <Weight className="h-3.5 w-3.5" />
                  {user.weight} kg
                </Badge>
              )}
              {user.level && (
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 gap-1.5 py-1.5">
                  <Gauge className="h-3.5 w-3.5" />
                  {LEVELS.find(l => l.value === user.level)?.label || user.level}
                </Badge>
              )}
              {user.style && (
                <Badge variant="outline" className="border-amber-500/30 text-amber-400 gap-1.5 py-1.5">
                  <Target className="h-3.5 w-3.5" />
                  Style {STYLES.find(s => s.value === user.style)?.label || user.style}
                </Badge>
              )}
              {user.objective && (
                <Badge variant="outline" className="border-blue-500/30 text-blue-400 gap-1.5 py-1.5">
                  <Target className="h-3.5 w-3.5" />
                  {OBJECTIVES.find(o => o.value === user.objective)?.label || user.objective}
                </Badge>
              )}
            </div>

            {/* Follow button - only for other users */}
            {!isOwnProfile && onToggleFollow && (
              <div className="mt-4 flex justify-center md:justify-start">
                <Button
                  variant={amIFollowing ? "outline" : "default"}
                  onClick={onToggleFollow}
                  className={amIFollowing 
                    ? "border-purple-500/50 text-purple-400 hover:text-purple-300 hover:border-purple-400 gap-2" 
                    : "bg-purple-500 hover:bg-purple-600 gap-2"
                  }
                >
                  {amIFollowing ? (
                    <>
                      <UserMinus className="h-4 w-4" />
                      Ne plus suivre
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Suivre
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-zinc-900 border border-zinc-800 p-1 mb-6">
            {isOwnProfile && (
              <TabsTrigger 
                value="profile" 
                className="data-[state=active]:bg-purple-500 data-[state=active]:text-white gap-2"
              >
                <User className="h-4 w-4" />
                MON PROFIL
              </TabsTrigger>
            )}
            <TabsTrigger 
              value="configs" 
              className="data-[state=active]:bg-purple-500 data-[state=active]:text-white gap-2"
            >
              <Settings2 className="h-4 w-4" />
              CONFIGS
            </TabsTrigger>
            {isOwnProfile && (
              <TabsTrigger 
                value="saved" 
                className="data-[state=active]:bg-purple-500 data-[state=active]:text-white gap-2"
              >
                <Bookmark className="h-4 w-4" />
                SAUVEGARDÉES
              </TabsTrigger>
            )}
            <TabsTrigger 
              value="motos" 
              className="data-[state=active]:bg-purple-500 data-[state=active]:text-white gap-2"
            >
              <Bike className="h-4 w-4" />
              MOTOS
            </TabsTrigger>
          </TabsList>

          {/* Configs Tab */}
          <TabsContent value="configs" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-purple-400" />
                CONFIGS PUBLIQUES
              </h2>
              <span className="text-sm text-zinc-500">
                {configs?.length || 0} config{(configs?.length || 0) > 1 ? "s" : ""}
              </span>
            </div>

            {configs === undefined ? (
              <div className="text-center py-12 text-zinc-500">Chargement...</div>
            ) : configs.length === 0 ? (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="py-12 text-center">
                  <Settings2 className="h-12 w-12 mx-auto text-zinc-700 mb-4" />
                  <p className="text-zinc-500">Aucune config publique</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {configs.map((config) => (
                  <ConfigCard 
                    key={config._id} 
                    config={config}
                    showUser={false}
                    showFollowButton={false}
                    showLikeButton={true}
                    showSaveButton={false}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Saved Configs Tab - only for own profile */}
          {isOwnProfile && (
            <TabsContent value="saved" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Bookmark className="h-5 w-5 text-purple-400" />
                  CONFIGS SAUVEGARDÉES
                </h2>
                <span className="text-sm text-zinc-500">
                  {savedConfigs?.length || 0} config{(savedConfigs?.length || 0) > 1 ? "s" : ""}
                </span>
              </div>

              {savedConfigs === undefined ? (
                <div className="text-center py-12 text-zinc-500">Chargement...</div>
              ) : savedConfigs.length === 0 ? (
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardContent className="py-12 text-center">
                    <Bookmark className="h-12 w-12 mx-auto text-zinc-700 mb-4" />
                    <p className="text-zinc-500">Aucune config sauvegardée</p>
                    <p className="text-xs text-zinc-600 mt-2">Sauvegardez des configs depuis la communauté pour les retrouver ici</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {savedConfigs.map((config) => (
                    <ConfigCard 
                      key={config._id} 
                      config={config}
                      showUser={true}
                      showFollowButton={false}
                      showLikeButton={true}
                      showSaveButton={false}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          )}

          {isOwnProfile && (
            <TabsContent value="profile" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <User className="h-5 w-5 text-purple-400" />
                  MON PROFIL
                </h2>
                <span className="text-sm text-zinc-500">Infos utilisées par l&apos;IA</span>
              </div>

              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-zinc-400">Poids équipé (kg)</span>
                      <span className="text-lg font-bold text-purple-400">{profileWeight} kg</span>
                    </div>
                    <Slider
                      value={[profileWeight]}
                      onValueChange={(values) => setProfileWeight(values[0])}
                      min={40}
                      max={150}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-zinc-500">
                      <span>40 kg</span>
                      <span>150 kg</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-sm font-medium text-zinc-400">Niveau</span>
                    <div className="grid grid-cols-3 gap-3">
                      {LEVELS.map((level) => (
                        <button
                          key={level.value}
                          type="button"
                          onClick={() => setProfileLevel(level.value)}
                          className={`p-3 rounded-lg border transition-colors ${
                            profileLevel === level.value
                              ? level.value === "débutant"
                                ? "bg-emerald-500 border-transparent text-white"
                                : level.value === "intermédiaire"
                                  ? "bg-amber-500 border-transparent text-white"
                                  : "bg-rose-500 border-transparent text-white"
                              : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                          }`}
                        >
                          {level.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-sm font-medium text-zinc-400">Style de pilotage</span>
                    <div className="grid grid-cols-3 gap-3">
                      {STYLES.map((style) => (
                        <button
                          key={style.value}
                          type="button"
                          onClick={() => setProfileStyle(style.value)}
                          className={`p-3 rounded-lg border transition-colors ${
                            profileStyle === style.value
                              ? "bg-purple-500 border-transparent text-white"
                              : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                          }`}
                        >
                          {style.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-sm font-medium text-zinc-400">Objectif</span>
                    <div className="grid grid-cols-3 gap-3">
                      {OBJECTIVES.map((objective) => (
                        <button
                          key={objective.value}
                          type="button"
                          onClick={() => setProfileObjective(objective.value)}
                          className={`p-3 rounded-lg border transition-colors ${
                            profileObjective === objective.value
                              ? "bg-purple-500 border-transparent text-white"
                              : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                          }`}
                        >
                          {objective.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={handleSaveProfile}
                    disabled={!canEditProfile || isSavingProfile}
                    className="w-full bg-purple-500 hover:bg-purple-600 gap-2"
                  >
                    {isSavingProfile ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Sauvegarder mon profil
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Motos Tab */}
          <TabsContent value="motos" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Bike className="h-5 w-5 text-purple-400" />
                {isOwnProfile ? "MES MOTOS" : "MOTOS"}
              </h2>
              <span className="text-sm text-zinc-500">
                {publicMotos?.length || 0} moto{(publicMotos?.length || 0) > 1 ? "s" : ""}
              </span>
            </div>

            {publicMotos === undefined ? (
              <div className="text-center py-12 text-zinc-500">Chargement...</div>
            ) : publicMotos.length === 0 ? (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="py-12 text-center">
                  <Bike className="h-12 w-12 mx-auto text-zinc-700 mb-4" />
                  <p className="text-zinc-500">{isOwnProfile ? "Aucune moto" : "Aucune moto publique"}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {publicMotos.map((moto) => (
                  <div key={moto._id} className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-3 hover:border-zinc-700 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <BrandLogo brand={moto.brand} size="md" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white text-sm truncate">
                          {moto.brand} {moto.model}
                        </h3>
                        <p className="text-xs text-zinc-500">{moto.year}</p>
                      </div>
                      
                      {/* Visibility toggle - only for own profile */}
                      {isOwnProfile && onToggleMotoVisibility && (
                        <button
                          onClick={() => onToggleMotoVisibility(moto._id, moto.isPublic)}
                          className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-colors shrink-0 ${
                            moto.isPublic
                              ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                              : "bg-zinc-800 text-zinc-500 hover:bg-zinc-700"
                          }`}
                        >
                          {moto.isPublic ? (
                            <>
                              <Eye className="h-3 w-3" />
                              Public
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3 w-3" />
                              Privé
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    
                    {(moto.forkBrand || moto.shockBrand) && (
                      <div className="text-[10px] text-zinc-600 mt-2 pt-2 border-t border-zinc-800/50 flex flex-wrap gap-x-3 gap-y-0.5">
                        {moto.forkBrand && <span>Fourche: {moto.forkBrand}</span>}
                        {moto.shockBrand && <span>Amort: {moto.shockBrand}</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
