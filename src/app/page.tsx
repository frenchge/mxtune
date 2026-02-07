"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Gauge, Users, Wrench, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const router = useRouter();
  const { user, isLoaded } = useCurrentUser();
  const createConversation = useMutation(api.conversations.create);
  const latestConversation = useQuery(
    api.conversations.getLatestOrEmpty,
    user?._id ? { userId: user._id } : "skip"
  );
  const hasRedirected = useRef(false);

  // Redirect to existing conversation or create a new one
  useEffect(() => {
    if (!isLoaded || !user?._id || hasRedirected.current) return;
    if (latestConversation === undefined) return; // Still loading

    const redirect = async () => {
      hasRedirected.current = true;
      
      if (latestConversation) {
        // Reuse existing conversation
        router.push(`/chat/${latestConversation.conversationId}`);
      } else {
        // No conversations at all, create a new one
        const conversationId = await createConversation({
          userId: user._id,
          title: "Nouvelle session",
        });
        router.push(`/chat/${conversationId}`);
      }
    };

    redirect();
  }, [user, isLoaded, latestConversation, createConversation, router]);

  return (
    <>
      <SignedOut>
        <div className="min-h-screen bg-zinc-950 relative overflow-hidden">
          {/* Background gradient effects */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-purple-500/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-700/5 rounded-full blur-[100px]" />
          </div>

          {/* Hero Section */}
          <div className="relative flex flex-col items-center justify-center px-6 pt-20 pb-16">
            <div className="max-w-lg mx-auto text-center space-y-8">
              <div className="animate-scale-in">
                <Image
                  src="/logo.png"
                  alt="MXTune Logo"
                  width={100}
                  height={100}
                  className="mx-auto rounded-2xl shadow-lg shadow-purple-500/20"
                  priority
                />
              </div>

              <div className="space-y-4 animate-slide-in-top">
                <h1 className="text-5xl font-extrabold tracking-tight">
                  <span className="text-purple-500">MX</span>
                  <span className="text-white">Tune</span>
                </h1>
                <p className="text-lg text-zinc-400 max-w-md mx-auto leading-relaxed">
                  Ton assistant IA pour configurer les suspensions de ta moto tout-terrain.
                  <span className="text-purple-400 font-medium"> Plus jamais de réglages au hasard.</span>
                </p>
              </div>

              <div className="flex flex-col gap-3 max-w-xs mx-auto animate-slide-in-bottom">
                <SignUpButton mode="modal">
                  <Button size="lg" className="w-full bg-purple-500 hover:bg-purple-600 font-bold italic text-base h-12 shadow-lg shadow-purple-500/25 transition-all hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98]">
                    <Sparkles className="h-5 w-5 mr-2" />
                    Commencer gratuitement
                  </Button>
                </SignUpButton>
                <SignInButton mode="modal">
                  <Button size="lg" variant="outline" className="w-full border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 h-12">
                    Se connecter
                  </Button>
                </SignInButton>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="relative max-w-4xl mx-auto px-6 pb-20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  icon: <MessageSquare className="h-5 w-5" />,
                  title: "Chat IA Expert",
                  description: "Décris tes symptômes, l'IA te propose des réglages adaptés à ta moto et ton niveau.",
                  color: "purple",
                },
                {
                  icon: <Gauge className="h-5 w-5" />,
                  title: "Clickers Visuels",
                  description: "Ajuste compression, détente et SAG avec un feedback visuel et des zones colorées.",
                  color: "blue",
                },
                {
                  icon: <Wrench className="h-5 w-5" />,
                  title: "Multi-Motos & Kits",
                  description: "Gère plusieurs motos, kits de suspensions et configs pour chaque terrain.",
                  color: "amber",
                },
                {
                  icon: <Users className="h-5 w-5" />,
                  title: "Communauté",
                  description: "Partage tes configs, découvre celles d'autres riders pour ta moto.",
                  color: "emerald",
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="group p-5 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-all duration-300 hover:bg-zinc-900/80 card-hover"
                >
                  <div className={cn(
                    "h-10 w-10 rounded-lg flex items-center justify-center mb-3",
                    feature.color === "purple" && "bg-purple-500/15 text-purple-400",
                    feature.color === "blue" && "bg-blue-500/15 text-blue-400",
                    feature.color === "amber" && "bg-amber-500/15 text-amber-400",
                    feature.color === "emerald" && "bg-emerald-500/15 text-emerald-400",
                  )}>
                    {feature.icon}
                  </div>
                  <h3 className="font-bold text-white mb-1">{feature.title}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>

            {/* Footer tagline */}
            <p className="text-center text-zinc-600 text-sm mt-12">
              Fait par des riders, pour des riders 🏍️
            </p>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          <p className="mt-4 text-zinc-400">Chargement...</p>
        </div>
      </SignedIn>
    </>
  );
}
