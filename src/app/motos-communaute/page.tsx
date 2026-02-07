"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { useCurrentUser } from "@/hooks/use-current-user";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { ProfileSidebar } from "@/components/sidebar/profile-sidebar";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { FlaskConical, Bike, MessageSquareText } from "lucide-react";

export default function MotosCommunautePage() {
  const { user } = useCurrentUser();
  const [draftSatisfaction, setDraftSatisfaction] = useState<Record<string, number>>({});
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});
  const [submittingFeedbackId, setSubmittingFeedbackId] = useState<string | null>(null);

  const toTestConfigs = useQuery(
    api.configFeedbacks.getToTestByUser,
    user?._id ? { userId: user._id } : "skip"
  );

  const submitConfigFeedback = useMutation(api.configFeedbacks.submit);

  const getSatisfactionValue = (configId: string) => draftSatisfaction[configId] ?? 7;

  const handleSubmitFeedback = async (configId: Id<"configs">) => {
    if (!user?._id) return;
    const key = String(configId);
    setSubmittingFeedbackId(key);
    try {
      await submitConfigFeedback({
        userId: user._id,
        configId,
        satisfaction: getSatisfactionValue(key),
        note: draftNotes[key]?.trim() || undefined,
      });
      setDraftNotes((prev) => ({ ...prev, [key]: "" }));
    } finally {
      setSubmittingFeedbackId(null);
    }
  };

  return (
    <>
      <SignedOut>
        <div className="flex h-screen items-center justify-center bg-zinc-950">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-white">CONNECTE-TOI POUR TESTER DES CONFIGS</h1>
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
                <div className="max-w-5xl mx-auto space-y-6">
                  <div>
                    <h1 className="text-2xl font-bold text-white">MOTOS COMMUNAUTÉ</h1>
                    <p className="text-zinc-400 mt-1">Liste des configs à tester avec actions rapides.</p>
                  </div>

                  <div className="rounded-xl border border-zinc-800 overflow-hidden">
                    <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-zinc-900/80 text-xs text-zinc-400 uppercase tracking-wide">
                      <div className="col-span-5">Config</div>
                      <div className="col-span-2">Source</div>
                      <div className="col-span-2">Satisfaction</div>
                      <div className="col-span-3">Ressenti</div>
                    </div>

                    {toTestConfigs && toTestConfigs.length > 0 ? (
                      toTestConfigs.map((config) => {
                        const key = String(config._id);
                        return (
                          <div key={key} className="grid grid-cols-12 gap-3 px-4 py-4 border-t border-zinc-800 items-start bg-zinc-900/30">
                            <div className="col-span-5 space-y-1">
                              <p className="text-sm font-semibold text-white">{config.name}</p>
                              <p className="text-xs text-zinc-400 inline-flex items-center gap-1">
                                <Bike className="h-3 w-3" />
                                {config.moto ? `${config.moto.brand} ${config.moto.model} ${config.moto.year}` : "Moto non renseignée"}
                              </p>
                              {config.shareLink && (
                                <Link href={`/config/${config.shareLink}`} className="text-xs text-purple-400 hover:text-purple-300">
                                  Ouvrir la fiche config
                                </Link>
                              )}
                            </div>

                            <div className="col-span-2">
                              <span className={`text-xs px-2 py-1 rounded-full ${config.source === "communaute" ? "bg-blue-500/20 text-blue-300" : "bg-purple-500/20 text-purple-300"}`}>
                                {config.source === "communaute" ? "Communauté" : "IA"}
                              </span>
                            </div>

                            <div className="col-span-2 space-y-2">
                              <p className="text-xs text-zinc-400">{getSatisfactionValue(key)}/10</p>
                              <Slider
                                value={[getSatisfactionValue(key)]}
                                onValueChange={(value) =>
                                  setDraftSatisfaction((prev) => ({ ...prev, [key]: value[0] ?? 7 }))
                                }
                                min={1}
                                max={10}
                                step={1}
                              />
                            </div>

                            <div className="col-span-3 space-y-2">
                              <textarea
                                value={draftNotes[key] ?? ""}
                                onChange={(e) =>
                                  setDraftNotes((prev) => ({ ...prev, [key]: e.target.value }))
                                }
                                placeholder="Ressenti (optionnel)"
                                className="w-full min-h-16 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                              />
                              <Button
                                size="sm"
                                onClick={() => handleSubmitFeedback(config._id)}
                                disabled={submittingFeedbackId === key}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
                              >
                                {submittingFeedbackId === key ? "Enregistrement..." : "Marquer testée"}
                              </Button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="px-6 py-12 text-center text-zinc-400 space-y-2">
                        <FlaskConical className="h-10 w-10 mx-auto text-zinc-600" />
                        <p className="text-sm font-medium">Aucune config en attente</p>
                        <p className="text-xs text-zinc-500">Les configs IA et communautaires non testées apparaîtront ici.</p>
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-zinc-500 inline-flex items-center gap-1">
                    <MessageSquareText className="h-3.5 w-3.5" />
                    Les feedbacks sur les configs communautaires sont visibles par les autres riders.
                  </div>
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
