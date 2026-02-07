"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { ProfileSidebar } from "@/components/sidebar/profile-sidebar";
import { ChatStepsEnhanced } from "@/components/chat/chat-steps-enhanced";
import { ChatMessage } from "@/components/chat/chat-message";
import { ChatInput } from "@/components/chat/chat-input";
import { Loader2, Sparkles } from "lucide-react";
import { Id } from "../../../../convex/_generated/dataModel";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

interface ConfigData {
  name?: string;
  description?: string;
  forkCompression?: number;
  forkRebound?: number;
  forkPreload?: string;
  shockCompressionLow?: number;
  shockCompressionHigh?: number;
  shockRebound?: number;
  shockPreload?: string;
  staticSag?: number;
  dynamicSag?: number;
  tirePressureFront?: number;
  tirePressureRear?: number;
  sportType?: string;
  terrainType?: string;
  conditions?: string;
}

type ChatMode = "reglage_direct" | "pas_a_pas";

type IntakeData = {
  mode?: ChatMode;
  sportType?: string;
  terrainType?: string;
  riderWeight?: number;
  riderLevel?: string;
  riderStyle?: string;
  riderObjective?: string;
  symptoms?: string;
  confirmation?: boolean;
};

type ChatMessageRow = {
  role: string;
  content: string;
  metadata?: {
    config?: ConfigData;
    protocol?: {
      mode?: ChatMode;
      step: "collecte" | "verification" | "proposition" | "test";
      status: "missing_info" | "ready_for_config" | "config_generated";
      missing?: string[];
      note?: string;
    };
  };
};

const SPORT_KEYWORDS: Record<string, string[]> = {
  enduro: ["enduro", "hard enduro"],
  motocross: ["motocross", "cross", "mx"],
  supermoto: ["supermoto"],
  trail: ["trail", "balade"],
  rally: ["rally", "rallye"],
};

const TERRAIN_KEYWORDS: Record<string, string[]> = {
  sable: ["sable", "sablonneux", "dune"],
  boue: ["boue", "boueux", "humide"],
  dur: ["dur", "sec", "compact"],
  rocailleux: ["rocailleux", "cailloux", "pierres", "rochers"],
  neige: ["neige", "enneige", "snow", "glace", "verglas"],
  mixte: ["mixte", "variable"],
};

const DEFAULT_DIRECT_PROFILE = {
  riderWeight: 75,
  riderLevel: "intermediaire",
  riderStyle: "neutre",
  riderObjective: "mixte",
} as const;

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function parseStructuredFields(text: string) {
  const fields: Record<string, string> = {};
  const lines = text.split(/\n|;/).map((line) => line.trim()).filter(Boolean);
  for (const line of lines) {
    const match = line.match(/^([a-zA-Z0-9_ -]+)\s*:\s*(.+)$/);
    if (!match) continue;
    const key = normalizeText(match[1]).replace(/\s+/g, "_");
    fields[key] = match[2].trim();
  }
  return fields;
}

function parseMode(text: string) {
  const normalized = normalizeText(text);
  if (normalized.includes("reglage_direct") || normalized.includes("reglage direct") || normalized.includes("direct")) {
    return "reglage_direct" as const;
  }
  if (normalized.includes("pas_a_pas") || normalized.includes("pas a pas") || normalized.includes("pas-a-pas")) {
    return "pas_a_pas" as const;
  }
  return undefined;
}

function findByKeywords(text: string, map: Record<string, string[]>) {
  const normalized = normalizeText(text);
  for (const [key, keywords] of Object.entries(map)) {
    if (keywords.some((keyword) => normalized.includes(normalizeText(keyword)))) {
      return key;
    }
  }
  return undefined;
}

function parseWeight(text: string) {
  const match = text.match(/(\d{2,3})\s?(kg|kilos?|kilogrammes?)/i);
  if (!match) return undefined;
  const value = Number(match[1]);
  if (value < 40 || value > 180) return undefined;
  return value;
}

function parseLevel(text: string) {
  const normalized = normalizeText(text);
  if (normalized.includes("debutant")) return "debutant";
  if (normalized.includes("intermediaire")) return "intermediaire";
  if (normalized.includes("confirme")) return "confirme";
  if (normalized.includes("expert")) return "expert";
  return undefined;
}

function parseStyle(text: string) {
  const normalized = normalizeText(text);
  if (normalized.includes("agressif")) return "agressif";
  if (normalized.includes("souple")) return "souple";
  if (normalized.includes("neutre")) return "neutre";
  return undefined;
}

function parseObjective(text: string) {
  const normalized = normalizeText(text);
  if (normalized.includes("confort")) return "confort";
  if (normalized.includes("performance")) return "performance";
  if (normalized.includes("mixte")) return "mixte";
  return undefined;
}

function parseSymptoms(text: string) {
  const normalized = normalizeText(text);
  const symptomWords = [
    "plonge",
    "talonne",
    "rebondit",
    "tape",
    "guidonne",
    "traction",
    "instable",
    "dur",
    "mou",
  ];
  if (!symptomWords.some((word) => normalized.includes(word))) return undefined;
  return text.trim();
}

function extractIntakeFromMessages(
  history: ChatMessageRow[],
  defaults: IntakeData
): IntakeData {
  let intake: IntakeData = { ...defaults };

  for (const message of history) {
    if (message.role !== "user") continue;
    const text = message.content;
    const fields = parseStructuredFields(text);
    const modeFromStructured = fields.mode ? parseMode(fields.mode) : undefined;
    const sportFromStructured = fields.sport || fields.sport_type;
    const terrainFromStructured = fields.terrain || fields.terrain_type;
    const weightFromStructured = fields.poids ? parseWeight(`${fields.poids} kg`) ?? parseWeight(fields.poids) : undefined;
    const levelFromStructured = fields.niveau ? parseLevel(fields.niveau) : undefined;
    const styleFromStructured = fields.style ? parseStyle(fields.style) : undefined;
    const objectiveFromStructured = fields.objectif ? parseObjective(fields.objectif) : undefined;
    const confirmationFromStructured = fields.confirmation
      ? ["oui", "ok", "valide", "confirme"].some((value) =>
          normalizeText(fields.confirmation || "").includes(value)
        )
      : undefined;

    intake = {
      ...intake,
      mode: modeFromStructured ?? parseMode(text) ?? intake.mode,
      sportType:
        (sportFromStructured ? findByKeywords(sportFromStructured, SPORT_KEYWORDS) : undefined) ??
        findByKeywords(text, SPORT_KEYWORDS) ??
        intake.sportType,
      terrainType:
        (terrainFromStructured ? findByKeywords(terrainFromStructured, TERRAIN_KEYWORDS) : undefined) ??
        findByKeywords(text, TERRAIN_KEYWORDS) ??
        intake.terrainType,
      riderWeight: weightFromStructured ?? parseWeight(text) ?? intake.riderWeight,
      riderLevel: levelFromStructured ?? parseLevel(text) ?? intake.riderLevel,
      riderStyle: styleFromStructured ?? parseStyle(text) ?? intake.riderStyle,
      riderObjective: objectiveFromStructured ?? parseObjective(text) ?? intake.riderObjective,
      symptoms: parseSymptoms(text) ?? intake.symptoms,
      confirmation:
        confirmationFromStructured ??
        (normalizeText(text).includes("je confirme") || normalizeText(text).includes("oui je confirme"))
          ? true
          : intake.confirmation,
    };
  }

  return intake;
}

function clampValue(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function clampConfigToKit(config: ConfigData, kit: {
  maxForkCompression?: number;
  maxForkRebound?: number;
  maxShockCompressionLow?: number;
  maxShockCompressionHigh?: number;
  maxShockRebound?: number;
}): ConfigData {
  const updated = { ...config };
  if (typeof updated.forkCompression === "number") {
    updated.forkCompression = clampValue(
      updated.forkCompression,
      0,
      kit.maxForkCompression ?? 25
    );
  }
  if (typeof updated.forkRebound === "number") {
    updated.forkRebound = clampValue(
      updated.forkRebound,
      0,
      kit.maxForkRebound ?? 25
    );
  }
  if (typeof updated.shockCompressionLow === "number") {
    updated.shockCompressionLow = clampValue(
      updated.shockCompressionLow,
      0,
      kit.maxShockCompressionLow ?? 25
    );
  }
  if (typeof updated.shockCompressionHigh === "number") {
    updated.shockCompressionHigh = Number(
      clampValue(
        updated.shockCompressionHigh,
        0,
        kit.maxShockCompressionHigh ?? 4
      ).toFixed(1)
    );
  }
  if (typeof updated.shockRebound === "number") {
    updated.shockRebound = clampValue(
      updated.shockRebound,
      0,
      kit.maxShockRebound ?? 25
    );
  }
  return updated;
}

function buildDeterministicConfig(
  intake: IntakeData,
  selectedKit: {
    name: string;
    baseForkCompression?: number;
    baseForkRebound?: number;
    baseShockCompressionLow?: number;
    baseShockCompressionHigh?: number;
    baseShockRebound?: number;
    forkCompression?: number;
    forkRebound?: number;
    shockCompressionLow?: number;
    shockCompressionHigh?: number;
    shockRebound?: number;
    maxForkCompression?: number;
    maxForkRebound?: number;
    maxShockCompressionLow?: number;
    maxShockCompressionHigh?: number;
    maxShockRebound?: number;
  }
): ConfigData {
  const sportType = intake.sportType || "enduro";
  const terrainType = intake.terrainType || "mixte";
  const baseForkCompression =
    selectedKit.baseForkCompression ?? selectedKit.forkCompression ?? 12;
  const baseForkRebound =
    selectedKit.baseForkRebound ?? selectedKit.forkRebound ?? 12;
  const baseShockCompressionLow =
    selectedKit.baseShockCompressionLow ?? selectedKit.shockCompressionLow ?? 12;
  const baseShockCompressionHigh =
    selectedKit.baseShockCompressionHigh ?? selectedKit.shockCompressionHigh ?? 1.5;
  const baseShockRebound =
    selectedKit.baseShockRebound ?? selectedKit.shockRebound ?? 12;

  let forkCompression = baseForkCompression;
  let forkRebound = baseForkRebound;
  let shockCompressionLow = baseShockCompressionLow;
  let shockCompressionHigh = baseShockCompressionHigh;
  let shockRebound = baseShockRebound;

  const terrainAdjustments: Record<
    string,
    Partial<Record<"forkCompression" | "forkRebound" | "shockCompressionLow" | "shockCompressionHigh" | "shockRebound", number>>
  > = {
    sable: { forkCompression: -2, forkRebound: -1, shockCompressionLow: -2, shockCompressionHigh: -0.5, shockRebound: -1 },
    boue: { forkCompression: -1, forkRebound: 0, shockCompressionLow: -1, shockCompressionHigh: -0.5, shockRebound: 0 },
    dur: { forkCompression: 1, forkRebound: 1, shockCompressionLow: 1, shockCompressionHigh: 0.5, shockRebound: 1 },
    rocailleux: { forkCompression: -1, forkRebound: 1, shockCompressionLow: -1, shockCompressionHigh: 0, shockRebound: 1 },
    neige: { forkCompression: -2, forkRebound: -1, shockCompressionLow: -2, shockCompressionHigh: -0.5, shockRebound: -1 },
    mixte: {},
  };

  const terrainDelta = terrainAdjustments[terrainType] || {};
  forkCompression += terrainDelta.forkCompression ?? 0;
  forkRebound += terrainDelta.forkRebound ?? 0;
  shockCompressionLow += terrainDelta.shockCompressionLow ?? 0;
  shockCompressionHigh += terrainDelta.shockCompressionHigh ?? 0;
  shockRebound += terrainDelta.shockRebound ?? 0;

  if (intake.riderWeight !== undefined) {
    if (intake.riderWeight >= 95) {
      forkCompression += 1;
      shockCompressionLow += 1;
    } else if (intake.riderWeight <= 65) {
      forkCompression -= 1;
      shockCompressionLow -= 1;
    }
  }

  if (intake.riderObjective === "confort") {
    forkCompression -= 1;
    shockCompressionLow -= 1;
  } else if (intake.riderObjective === "performance") {
    forkCompression += 1;
    shockCompressionLow += 1;
    forkRebound += 1;
    shockRebound += 1;
  }

  if (intake.riderStyle === "agressif") {
    forkCompression += 1;
    shockCompressionHigh += 0.5;
  } else if (intake.riderStyle === "souple") {
    forkCompression -= 1;
    shockCompressionLow -= 1;
  }

  const maxForkCompression = selectedKit.maxForkCompression ?? 25;
  const maxForkRebound = selectedKit.maxForkRebound ?? 25;
  const maxShockCompressionLow = selectedKit.maxShockCompressionLow ?? 25;
  const maxShockCompressionHigh = selectedKit.maxShockCompressionHigh ?? 4;
  const maxShockRebound = selectedKit.maxShockRebound ?? 25;

  const staticSag = sportType === "motocross" ? 33 : 35;
  const dynamicSag = sportType === "motocross" ? 102 : 105;
  const tirePressureFront =
    terrainType === "sable" ? 0.8 : terrainType === "boue" ? 0.85 : terrainType === "neige" ? 0.75 : 0.95;
  const tirePressureRear =
    terrainType === "sable" ? 0.75 : terrainType === "boue" ? 0.8 : terrainType === "neige" ? 0.7 : 0.9;
  const forkPreload = sportType === "motocross" ? "+2mm" : "standard";
  const shockPreload = sportType === "motocross" ? "+2 tours" : "standard";

  return {
    name: `Config ${sportType} ${terrainType}`,
    description: `Configuration préparée pour ${sportType} sur terrain ${terrainType}.`,
    sportType,
    terrainType,
    forkCompression: clampValue(Math.round(forkCompression), 0, maxForkCompression),
    forkRebound: clampValue(Math.round(forkRebound), 0, maxForkRebound),
    forkPreload,
    shockCompressionLow: clampValue(Math.round(shockCompressionLow), 0, maxShockCompressionLow),
    shockCompressionHigh: Number(clampValue(Number(shockCompressionHigh.toFixed(1)), 0, maxShockCompressionHigh).toFixed(1)),
    shockRebound: clampValue(Math.round(shockRebound), 0, maxShockRebound),
    shockPreload,
    staticSag,
    dynamicSag,
    tirePressureFront,
    tirePressureRear,
    conditions:
      terrainType === "boue" ? "boueux" : terrainType === "neige" ? "neigeux" : terrainType === "sable" ? "sec" : "sec",
  };
}

function applyFeedbackAdjustments(config: ConfigData, message: string): ConfigData {
  const normalized = normalizeText(message);
  const updated = { ...config };

  if (normalized.includes("plonge")) {
    updated.forkCompression = (updated.forkCompression ?? 12) + 1;
  }
  if (normalized.includes("talonne")) {
    updated.shockCompressionLow = (updated.shockCompressionLow ?? 12) + 1;
    updated.shockCompressionHigh = Number(((updated.shockCompressionHigh ?? 1.5) + 0.5).toFixed(1));
  }
  if (normalized.includes("rebond") || normalized.includes("instable")) {
    updated.shockRebound = (updated.shockRebound ?? 12) + 1;
    updated.forkRebound = (updated.forkRebound ?? 12) + 1;
  }
  if (normalized.includes("dur") || normalized.includes("tape")) {
    updated.forkCompression = (updated.forkCompression ?? 12) - 1;
    updated.shockCompressionLow = (updated.shockCompressionLow ?? 12) - 1;
  }
  if (normalized.includes("mou") || normalized.includes("manque de maintien")) {
    updated.forkCompression = (updated.forkCompression ?? 12) + 1;
    updated.shockCompressionLow = (updated.shockCompressionLow ?? 12) + 1;
  }

  return updated;
}

function getMissingFieldQuestion(
  missingField:
    | "moto"
    | "kit"
    | "mode"
    | "sportType"
    | "terrainType"
    | "riderWeight"
    | "riderLevel"
    | "riderStyle"
    | "riderObjective"
    | "confirmation",
  mode?: ChatMode
) {
  const prompts: Record<typeof missingField, string> = {
    moto: "Choisis d'abord une moto dans le sélecteur en bas.",
    kit: "Choisis d'abord un kit dans le sélecteur en bas.",
    mode: "Choisis ton mode de préparation.",
    sportType: "Quel est ton usage principal ?",
    terrainType: "Quel est ton terrain principal ?",
    riderWeight: "Quel est ton poids équipé (en kg) ?",
    riderLevel: "Quel est ton niveau ?",
    riderStyle: "Quel est ton style de pilotage ?",
    riderObjective: "Quel est ton objectif principal ?",
    confirmation: "Confirme les données pour générer la config.",
  };

  if (missingField === "confirmation" && mode === "reglage_direct") {
    return "Mode réglage direct prêt. Confirme pour générer la config.";
  }

  return prompts[missingField];
}

function getFieldButtons(field: "mode" | "sportType" | "terrainType" | "riderLevel" | "riderStyle" | "riderObjective" | "confirmation") {
  switch (field) {
    case "mode":
      return [
        "[BUTTON:Réglage direct|Rapide pour pilotes expérimentés:reglage_direct]",
        "[BUTTON:Pas à pas|Guide détaillé pour moins expérimentés:pas_a_pas]",
      ].join("\n");
    case "sportType":
      return [
        "[BUTTON:Enduro:enduro]",
        "[BUTTON:Motocross:motocross]",
        "[BUTTON:Supermoto:supermoto]",
        "[BUTTON:Trail:trail]",
      ].join("\n");
    case "terrainType":
      return [
        "[BUTTON:Sable:sable]",
        "[BUTTON:Boue:boue]",
        "[BUTTON:Dur:dur]",
        "[BUTTON:Rocailleux:rocailleux]",
        "[BUTTON:Neige:neige]",
        "[BUTTON:Mixte:mixte]",
      ].join("\n");
    case "riderLevel":
      return [
        "[BUTTON:Debutant:debutant]",
        "[BUTTON:Intermediaire:intermediaire]",
        "[BUTTON:Confirme:confirme]",
        "[BUTTON:Expert:expert]",
      ].join("\n");
    case "riderStyle":
      return [
        "[BUTTON:Neutre:neutre]",
        "[BUTTON:Agressif:agressif]",
        "[BUTTON:Souple:souple]",
      ].join("\n");
    case "riderObjective":
      return [
        "[BUTTON:Confort:confort]",
        "[BUTTON:Performance:performance]",
        "[BUTTON:Mixte:mixte]",
      ].join("\n");
    case "confirmation":
      return "[BUTTON:Confirmer les données|Générer la config:confirmation_oui]";
  }
}

const FIELDS_WITH_BUTTONS = new Set([
  "mode",
  "sportType",
  "terrainType",
  "riderLevel",
  "riderStyle",
  "riderObjective",
  "confirmation",
] as const);

function hasButtonsForField(
  field:
    | "moto"
    | "kit"
    | "mode"
    | "sportType"
    | "terrainType"
    | "riderWeight"
    | "riderLevel"
    | "riderStyle"
    | "riderObjective"
    | "confirmation"
): field is "mode" | "sportType" | "terrainType" | "riderLevel" | "riderStyle" | "riderObjective" | "confirmation" {
  return FIELDS_WITH_BUTTONS.has(
    field as
      | "mode"
      | "sportType"
      | "terrainType"
      | "riderLevel"
      | "riderStyle"
      | "riderObjective"
      | "confirmation"
  );
}

function buildProtocolMetadata(params: {
  mode?: ChatMode;
  step: "collecte" | "verification" | "proposition" | "test";
  status: "missing_info" | "ready_for_config" | "config_generated";
  missing?: string[];
  note?: string;
}) {
  return {
    mode: params.mode,
    step: params.step,
    status: params.status,
    missing: params.missing,
    note: params.note,
  };
}

function appendSagCtasIfNeeded(content: string) {
  const normalized = normalizeText(content);
  const asksSag =
    normalized.includes("sag") &&
    (normalized.includes("mesure") ||
      normalized.includes("mesurer") ||
      normalized.includes("peux tu mesurer") ||
      normalized.includes("as-tu") ||
      normalized.includes("as tu"));

  if (!asksSag) return content;

  const ctas = [
    "[BUTTON:J'ai la mesure du SAG|Je peux te donner les valeurs:sag_has_measure]",
    "[BUTTON:Je ne peux pas mesurer maintenant|Utilise une valeur moyenne:sag_use_average]",
  ].join("\n");

  return [content, "", ctas].join("\n");
}

function formatAiMessage(content: string) {
  const lines = content.split("\n");
  const cleanedLines = lines.filter((line) => {
    const trimmed = line.trim();
    if (!trimmed) return true;
    if (trimmed.startsWith("|") && trimmed.includes("|")) return false;
    if (trimmed.startsWith("|---") || trimmed.startsWith("---|")) return false;
    return true;
  });

  return cleanedLines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/^•\s*/gm, "- ")
    .trim();
}

export default function ChatPage() {
  const params = useParams();
  const conversationId = params.conversationId as Id<"conversations">;
  const { user, clerkUser } = useCurrentUser();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMotoId, setSelectedMotoId] = useState<Id<"motos"> | undefined>();
  const [selectedKitId, setSelectedKitId] = useState<Id<"suspensionKits"> | undefined>();
  const [savedConfigId, setSavedConfigId] = useState<string | undefined>();
  const [pendingGeneratedConfig, setPendingGeneratedConfig] = useState<ConfigData | undefined>();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const conversation = useQuery(api.conversations.getById, {
    conversationId,
  });

  const messages = useQuery(api.messages.getByConversation, {
    conversationId,
  });

  const motos = useQuery(
    api.motos.getByUser,
    user?._id ? { userId: user._id } : "skip"
  );

  const selectedMoto = motos?.find((m) => m._id === selectedMotoId);
  const selectedKit = selectedMoto?.kits?.find((k) => k._id === selectedKitId);

  const createMessage = useMutation(api.messages.create);
  const updateStep = useMutation(api.conversations.updateStep);
  const createConfig = useMutation(api.configs.create);
  const updateConfigField = useMutation(api.configs.updateField);

  const buildMotoContext = (
    moto: typeof selectedMoto,
    kit: typeof selectedKit,
    currentConfig?: ConfigData
  ) => {
    const lines: string[] = [];
    if (moto) {
      lines.push(`Moto: ${moto.brand} ${moto.model} ${moto.year}`);
    }
    if (kit) {
      lines.push(`Kit: ${kit.name}`);
      if (kit.isStockSuspension !== undefined) {
        lines.push(`Type: ${kit.isStockSuspension ? "origine" : "aftermarket"}`);
      }
      if (kit.forkBrand || kit.forkModel) {
        lines.push(`Fourche: ${[kit.forkBrand, kit.forkModel].filter(Boolean).join(" ")}`);
      }
      if (kit.shockBrand || kit.shockModel) {
        lines.push(`Amortisseur: ${[kit.shockBrand, kit.shockModel].filter(Boolean).join(" ")}`);
      }
      if (kit.forkSpringRate) lines.push(`Ressort fourche: ${kit.forkSpringRate}`);
      if (kit.shockSpringRate) lines.push(`Ressort amortisseur: ${kit.shockSpringRate}`);
      if (kit.forkOilWeight || kit.forkOilLevel) {
        lines.push(
          `Huile fourche: ${[kit.forkOilWeight, kit.forkOilLevel].filter(Boolean).join(" / ")}`
        );
      }
      if (kit.valvingNotes) lines.push(`Notes valving: ${kit.valvingNotes}`);
      if (kit.otherMods) lines.push(`Autres mods: ${kit.otherMods}`);
      if (kit.sportType) lines.push(`Sport: ${kit.sportType}`);
      if (kit.terrainType) lines.push(`Terrain: ${kit.terrainType}`);
      if (kit.country) lines.push(`Pays: ${kit.country}`);
      if (kit.maxForkCompression || kit.maxForkRebound || kit.maxShockCompressionLow || kit.maxShockCompressionHigh || kit.maxShockRebound) {
        lines.push(
          `Plages max: fourche C ${kit.maxForkCompression ?? "?"} / R ${kit.maxForkRebound ?? "?"}, amortisseur C BV ${kit.maxShockCompressionLow ?? "?"} / C HV ${kit.maxShockCompressionHigh ?? "?"} / R ${kit.maxShockRebound ?? "?"}`
        );
      }
    }
    if (currentConfig) {
      lines.push("Config actuelle:");
      lines.push(
        `- Fourche C ${currentConfig.forkCompression ?? "?"} / R ${currentConfig.forkRebound ?? "?"}, Amortisseur C BV ${currentConfig.shockCompressionLow ?? "?"} / C HV ${currentConfig.shockCompressionHigh ?? "?"} / R ${currentConfig.shockRebound ?? "?"}`
      );
      if (currentConfig.staticSag || currentConfig.dynamicSag) {
        lines.push(`- SAG statique ${currentConfig.staticSag ?? "?"} / dynamique ${currentConfig.dynamicSag ?? "?"}`);
      }
      if (currentConfig.tirePressureFront || currentConfig.tirePressureRear) {
        lines.push(
          `- Pressions pneus AV ${currentConfig.tirePressureFront ?? "?"} / AR ${currentConfig.tirePressureRear ?? "?"}`
        );
      }
    }
    return lines.join("\n");
  };

  const requestAiConfig = async (params: {
    userMessage: string;
    history: ChatMessageRow[];
    motoContext: string;
    userProfile: {
      weight?: number;
      level?: string;
      style?: string;
      objective?: string;
    };
  }) => {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: params.userMessage }],
        conversationHistory: params.history.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        motoContext: params.motoContext,
        userProfile: params.userProfile,
      }),
    });

    if (!response.ok) {
      let details = "";
      try {
        const err = await response.json();
        details = err?.details ? ` (${err.details})` : err?.error ? ` (${err.error})` : "";
      } catch {
        details = "";
      }
      throw new Error(`IA indisponible${details}`);
    }

    const data = await response.json();
    return {
      responseText: (data?.response || "").trim(),
      config: data?.config as ConfigData | null,
    };
  };

  // Sélectionner la première moto par défaut si aucune n'est sélectionnée
  useEffect(() => {
    if (motos && motos.length > 0 && !selectedMotoId) {
      setSelectedMotoId(motos[0]._id);
    }
  }, [motos, selectedMotoId]);

  // Sélectionner le kit par défaut quand une moto est sélectionnée
  useEffect(() => {
    if (selectedMoto && selectedMoto.kits && selectedMoto.kits.length > 0 && !selectedKitId) {
      // Trouver le kit par défaut, sinon prendre le premier
      const defaultKit = selectedMoto.kits.find(k => k.isDefault) || selectedMoto.kits[0];
      if (defaultKit) {
        setSelectedKitId(defaultKit._id);
      }
    }
  }, [selectedMoto, selectedKitId]);

  // Auto-scroll vers le dernier message
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Message de bienvenue initial
  useEffect(() => {
    if (conversation && messages?.length === 0) {
      const welcomeMessage = [
        "Je suis ton préparateur config.",
        "Deux parcours possibles :",
        "- reglage_direct: rapide pour pilotes expérimentés",
        "- pas_a_pas: guide complet pour pilotes moins expérimentés",
        "",
        "[BUTTON:Réglage direct|Rapide pour pilotes expérimentés:reglage_direct]",
        "[BUTTON:Pas à pas|Guide détaillé pour moins expérimentés:pas_a_pas]",
      ].join("\n");

      createMessage({
        conversationId,
        role: "assistant",
        content: welcomeMessage,
      });
    }
  }, [conversation, messages, conversationId, createMessage]);

  const handleSendMessage = async (content: string) => {
    if (!user?._id || !conversationId) return;

    setIsLoading(true);

    // Créer le message utilisateur
    await createMessage({
      conversationId,
      role: "user",
      content,
    });

    try {
      const history: ChatMessageRow[] = [
        ...((messages || []) as ChatMessageRow[]),
        { role: "user", content },
      ];

      const defaults: IntakeData = {
        sportType: selectedKit?.sportType,
        terrainType: selectedKit?.terrainType,
        riderWeight: user.weight,
        riderLevel: user.level,
        riderStyle: user.style,
        riderObjective: user.objective,
      };

      const intake = extractIntakeFromMessages(history, defaults);
      if (intake.mode === "reglage_direct") {
        intake.riderWeight = intake.riderWeight ?? user.weight ?? DEFAULT_DIRECT_PROFILE.riderWeight;
        intake.riderLevel = intake.riderLevel ?? user.level ?? DEFAULT_DIRECT_PROFILE.riderLevel;
        intake.riderStyle = intake.riderStyle ?? user.style ?? DEFAULT_DIRECT_PROFILE.riderStyle;
        intake.riderObjective = intake.riderObjective ?? user.objective ?? DEFAULT_DIRECT_PROFILE.riderObjective;
      }
      const lastConfigMessage = [...history]
        .reverse()
        .find((message) => message.role === "assistant" && message.metadata?.config);
      const hasExistingConfig = Boolean(lastConfigMessage?.metadata?.config);
      const isAdjustmentIntent = /ajuste|modifier|modifie|plus|moins|plonge|talonne|rebond|instable|dur|mou|tape|guidonne|traction/i.test(
        content
      );
      const useExistingConfigLoop = hasExistingConfig && (conversation?.step === "test" || conversation?.step === "proposition");

      if (useExistingConfigLoop && isAdjustmentIntent) {
        const baseConfig = lastConfigMessage?.metadata?.config as ConfigData | undefined;
        const motoContext = buildMotoContext(selectedMoto, selectedKit, baseConfig);
        const aiResult = await requestAiConfig({
          userMessage: content,
          history: history.slice(0, -1),
          motoContext,
          userProfile: {
            weight: user.weight,
            level: user.level,
            style: user.style,
            objective: user.objective,
          },
        });

        if (!aiResult.config) {
          await createMessage({
            conversationId,
            role: "assistant",
            content:
              aiResult.responseText ||
              "Je n'ai pas pu générer d'ajustement. Peux-tu préciser tes symptômes terrain ?",
          });
          return;
        }

        const adjustedConfig = clampConfigToKit(
          aiResult.config,
          selectedKit || {}
        );
        adjustedConfig.name = `${adjustedConfig.name || "Config"} - Ajustement`;
        setPendingGeneratedConfig(adjustedConfig);

        await updateStep({ conversationId, step: "proposition" });
        await createMessage({
          conversationId,
          role: "assistant",
          content: [
            appendSagCtasIfNeeded(
              formatAiMessage(
                aiResult.responseText || "Ajustement appliqué sur la config actuelle."
              )
            ),
            "",
            "[BUTTON:Sauvegarder la config|Enregistrer cette config dans la base:save_generated_config]",
            "[BUTTON:Continuer le test|Donner un nouveau ressenti:tester_config]",
            "[BUTTON:Generer une autre config|Relancer avec d'autres parametres:restart_config]",
          ].join("\n"),
          metadata: {
            config: adjustedConfig,
            protocol: buildProtocolMetadata({
              mode: intake.mode,
              step: "proposition",
              status: "config_generated",
              note: "Config ajustée prête. Sauvegarde ou poursuite du test.",
            }),
          },
        });
        return;
      }

      if (useExistingConfigLoop && !isAdjustmentIntent) {
        await updateStep({ conversationId, step: "test" });
        await createMessage({
          conversationId,
          role: "assistant",
          content:
            "La config est déjà préparée. Donne ton ressenti terrain (ex: fourche plonge, arrière talonne, manque de traction) pour ajuster.",
          metadata: {
            protocol: buildProtocolMetadata({
              mode: intake.mode,
              step: "test",
              status: "ready_for_config",
              note: "Ajustement en cours d'essai terrain.",
            }),
          },
        });
        return;
      }

      const missingFields: Array<
        | "moto"
        | "kit"
        | "mode"
        | "sportType"
        | "terrainType"
        | "riderWeight"
        | "riderLevel"
        | "riderStyle"
        | "riderObjective"
        | "confirmation"
      > = [];

      if (!selectedMoto) missingFields.push("moto");
      if (!selectedKit) missingFields.push("kit");
      if (!intake.mode) missingFields.push("mode");
      if (!intake.sportType) missingFields.push("sportType");
      if (!intake.terrainType) missingFields.push("terrainType");
      if (intake.mode === "pas_a_pas") {
        if (!intake.riderWeight) missingFields.push("riderWeight");
        if (!intake.riderLevel) missingFields.push("riderLevel");
        if (!intake.riderStyle) missingFields.push("riderStyle");
        if (!intake.riderObjective) missingFields.push("riderObjective");
      }

      if (intake.mode) {
        await updateStep({
          conversationId,
          step: "collecte",
          configMode: intake.mode,
        });
      }

      if (missingFields.length > 0) {
        await updateStep({ conversationId, step: "collecte" });
        const firstMissing = missingFields[0];
        await createMessage({
          conversationId,
          role: "assistant",
          content: [
            getMissingFieldQuestion(firstMissing, intake.mode),
            "",
            hasButtonsForField(firstMissing)
              ? getFieldButtons(firstMissing)
              : "",
          ].join("\n"),
          metadata: {
            protocol: buildProtocolMetadata({
              mode: intake.mode,
              step: "collecte",
              status: "missing_info",
              missing: missingFields,
              note: "Une reponse utilisateur est attendue.",
            }),
          },
        });
        return;
      }

      const motoForConfig = selectedMoto;
      const kitForConfig = selectedKit;
      if (!motoForConfig || !kitForConfig) {
        await createMessage({
          conversationId,
          role: "assistant",
          content: "Je n'ai pas de moto/kit actif pour continuer. Sélectionne-les puis renvoie ton message.",
        });
        return;
      }

      await updateStep({ conversationId, step: "verification" });

      if (!intake.confirmation) {
        await createMessage({
          conversationId,
          role: "assistant",
          content: [
            "Vérification terminée. Confirme pour générer la config.",
            "",
            getFieldButtons("confirmation"),
          ].join("\n"),
          metadata: {
            protocol: buildProtocolMetadata({
              mode: intake.mode,
              step: "verification",
              status: "ready_for_config",
              note: "Validation explicite requise avant génération.",
            }),
          },
        });
        return;
      }

      const verificationSummary = [
        "Vérification",
        `Moto: ${motoForConfig.brand} ${motoForConfig.model} ${motoForConfig.year}`,
        `Kit: ${kitForConfig.name}`,
        `Poids équipé: ${intake.riderWeight} kg`,
        `Niveau: ${intake.riderLevel}`,
        `Objectif: ${intake.riderObjective}`,
        `Sport/Terrain: ${intake.sportType} / ${intake.terrainType}`,
      ].join("\n");

      await createMessage({
        conversationId,
        role: "assistant",
        content: verificationSummary,
        metadata: {
          protocol: buildProtocolMetadata({
            mode: intake.mode,
            step: "verification",
            status: "ready_for_config",
            note: "Generation de config en cours.",
          }),
        },
      });

      const motoContext = buildMotoContext(motoForConfig, kitForConfig);
      const aiResult = await requestAiConfig({
        userMessage: content,
        history: history.slice(0, -1),
        motoContext,
        userProfile: {
          weight: intake.riderWeight ?? user.weight,
          level: intake.riderLevel ?? user.level,
          style: intake.riderStyle ?? user.style,
          objective: intake.riderObjective ?? user.objective,
        },
      });

      if (!aiResult.config) {
        await createMessage({
          conversationId,
          role: "assistant",
          content:
            aiResult.responseText ||
            "Je n'ai pas pu générer la config. Peux-tu préciser ton terrain et tes symptômes ?",
        });
        return;
      }

      const config = clampConfigToKit(aiResult.config, kitForConfig || {});
      setPendingGeneratedConfig(config);

      await updateStep({ conversationId, step: "proposition" });
      await createMessage({
        conversationId,
        role: "assistant",
        content:
          [
            appendSagCtasIfNeeded(
              formatAiMessage(
                aiResult.responseText || "Config générée et enregistrée."
              )
            ),
            "",
            "[BUTTON:Sauvegarder la config|Enregistrer cette config dans la base:save_generated_config]",
            "[BUTTON:Generer une autre config|Relancer avec d'autres parametres:restart_config]",
          ].join("\n"),
        metadata: {
          config,
          protocol: buildProtocolMetadata({
            mode: intake.mode,
            step: "proposition",
            status: "config_generated",
            note: "Config prête. Sauvegarde ou génère une nouvelle config.",
          }),
        },
      });
    } catch (error) {
      console.error("Erreur:", error);
      await createMessage({
        conversationId,
        role: "assistant",
        content:
          "Désolé, j'ai rencontré une erreur. Peux-tu reformuler ta question ?",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleButtonClick = async (action: string, buttonText?: string) => {
    if (!user?._id || !conversationId) return;

    if (action === "save_generated_config") {
      const latestConfig =
        pendingGeneratedConfig ||
        [...(messages || [])]
          .reverse()
          .find((m) => m.role === "assistant" && m.metadata?.config)?.metadata?.config;

      if (!latestConfig) {
        await createMessage({
          conversationId,
          role: "assistant",
          content: "Aucune config en attente à sauvegarder.",
        });
        return;
      }

      await handleSaveConfig(latestConfig);
      setPendingGeneratedConfig(undefined);
      await updateStep({ conversationId, step: "test" });
      await createMessage({
        conversationId,
        role: "assistant",
        content: [
          "Config sauvegardée.",
          "[BUTTON:Tester sur terrain|Je vais rouler puis revenir avec un feedback:tester_config]",
          "[BUTTON:Générer une autre config|Je veux une variante:restart_config]",
        ].join("\n"),
      });
      return;
    }

    if (action === "restart_config") {
      setPendingGeneratedConfig(undefined);
      await updateStep({ conversationId, step: "collecte" });
      await createMessage({
        conversationId,
        role: "assistant",
        content: [
          "Parfait. On repart sur une nouvelle config.",
          "Commence par choisir ton terrain et ton objectif.",
          "",
          getFieldButtons("terrainType"),
          getFieldButtons("riderObjective"),
        ].join("\n"),
      });
      return;
    }

    // Mapper les actions vers des messages lisibles
    const actionMessages: Record<string, string> = {
      confirmation_oui: "Oui, je confirme ces informations. Tu peux générer la config.",
      tester_config: "Je vais tester cette config sur terrain et je reviens avec mon ressenti.",
      ajuster_config: "J'ai ce symptome: la fourche plonge au freinage.",
      enduro: "Mon usage principal est l'enduro.",
      motocross: "Mon usage principal est le motocross.",
      supermoto: "Mon usage principal est le supermoto.",
      trail: "Mon usage principal est le trail.",
      sable: "Je roule surtout sur terrain sable.",
      boue: "Je roule surtout sur terrain boue.",
      dur: "Je roule surtout sur terrain dur.",
      rocailleux: "Je roule surtout sur terrain rocailleux.",
      neige: "Je roule surtout sur terrain neige.",
      mixte: "Je roule surtout sur terrain mixte.",
      debutant: "Mon niveau est debutant.",
      intermediaire: "Mon niveau est intermediaire.",
      confirme: "Mon niveau est confirme.",
      expert: "Mon niveau est expert.",
      neutre: "Mon style de pilotage est neutre.",
      agressif: "Mon style de pilotage est agressif.",
      souple: "Mon style de pilotage est souple.",
      confort: "Mon objectif principal est le confort.",
      performance: "Mon objectif principal est la performance.",
      reglage_direct: "Je choisis le mode réglage direct.",
      pas_a_pas: "Je choisis le mode pas à pas.",
      next_step: "Je continue vers l'étape suivante.",
      confirm: "Je confirme ces informations.",
      rapide: "Je choisis la configuration rapide.",
      "pas-a-pas": "Je choisis le mode pas-à-pas.",
      continuer: "Je continue.",
      oui: "Oui, c'est correct.",
      non: "Non, je souhaite modifier.",
      valider: "Je valide.",
      modifier: "Je souhaite modifier.",
      tester: "Je vais tester ces réglages.",
      sauvegarder: "Je sauvegarde cette configuration.",
      sag_has_measure: "J'ai les mesures du SAG. Je peux te donner les valeurs statique et dynamique.",
      sag_use_average: "Je ne peux pas mesurer maintenant. Utilise des valeurs moyennes pour ce type de kit.",
    };

    // Use predefined mapping, or button text as fallback, or the action itself
    const userMessage = actionMessages[action.toLowerCase()] || actionMessages[action] || (buttonText ? `Je choisis : ${buttonText}` : action);

    scrollToBottom();
    await handleSendMessage(userMessage);
  };

  const handleSaveConfig = async (config: ConfigData | undefined) => {
    if (!config || !user?._id || !selectedMotoId) return;

    // Utiliser le nom de la config si fourni par l'IA, sinon générer un nom par défaut
    const configName = config.name || `Config ${selectedMoto?.brand || ""} ${selectedMoto?.model || ""} - ${new Date().toLocaleDateString("fr-FR")}`;

    const result = await createConfig({
      userId: user._id,
      motoId: selectedMotoId,
      suspensionKitId: selectedKitId,
      conversationId,
      name: configName,
      description: config.description,
      forkCompression: config.forkCompression,
      forkRebound: config.forkRebound,
      forkPreload: config.forkPreload,
      shockCompressionLow: config.shockCompressionLow,
      shockCompressionHigh: config.shockCompressionHigh,
      shockRebound: config.shockRebound,
      shockPreload: config.shockPreload,
      staticSag: config.staticSag,
      dynamicSag: config.dynamicSag,
      tirePressureFront: config.tirePressureFront,
      tirePressureRear: config.tirePressureRear,
      sportType: config.sportType,
      terrainType: config.terrainType,
      conditions: config.conditions,
      // Infos rider au moment de la création
      riderWeight: user.weight,
      riderLevel: user.level,
      riderStyle: user.style,
      riderObjective: user.objective,
      visibility: "private",
    });
    
    // Stocker l'ID pour les mises à jour avec +/-
    setSavedConfigId(result.configId);
    
    // SYNC FIX: Si selectedKitId était undefined, synchroniser avec le kit résolu par le backend
    if (!selectedKitId && result.effectiveKitId) {
      setSelectedKitId(result.effectiveKitId);
    }
  };

  const handleUpdateConfig = async (configId: string, field: string, value: number) => {
    await updateConfigField({
      configId: configId as Id<"configs">,
      field,
      value,
    });
  };

  return (
    <>
      <SignedOut>
        <div className="flex h-screen items-center justify-center bg-zinc-950">
          <div className="text-center space-y-4">
            <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-xl bg-purple-500">
              <span className="text-2xl font-bold text-white">MX</span>
            </div>
            <h1 className="text-2xl font-bold">
              <span className="text-purple-500">MX</span>
              <span className="text-white">Tune</span>
            </h1>
            <p className="text-zinc-400">Connecte-toi pour configurer ta moto</p>
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
              <div className="flex-1 flex flex-col min-h-0">
                {/* Process central entre la sidebar gauche et le panneau profil */}
                <div className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm shrink-0 py-4">
                  <ChatStepsEnhanced currentStep={conversation?.step || "collecte"} />
                </div>
                <div className="flex-1 overflow-y-auto">
                  <div className="max-w-3xl mx-auto px-4 pb-4">
                    {messages?.map((message) => (
                      <ChatMessage
                        key={message._id}
                        message={message}
                        userImage={clerkUser?.imageUrl}
                        onButtonClick={handleButtonClick}
                        onUpdateConfig={handleUpdateConfig}
                        savedConfigId={savedConfigId}
                        baseValues={selectedKit ? {
                          forkCompression: selectedKit.baseForkCompression,
                          forkRebound: selectedKit.baseForkRebound,
                          shockCompressionLow: selectedKit.baseShockCompressionLow,
                          shockCompressionHigh: selectedKit.baseShockCompressionHigh,
                          shockRebound: selectedKit.baseShockRebound,
                        } : undefined}
                      />
                    ))}

                    {isLoading && (
                      <div className="flex gap-4 p-6 bg-gradient-to-r from-purple-500/10 to-zinc-900/50 border-l-2 border-purple-500 animate-pulse">
                        <div className="relative h-10 w-10 rounded-full bg-purple-500 flex items-center justify-center">
                          <Loader2 className="h-5 w-5 animate-spin text-white" />
                          <span className="absolute inset-0 rounded-full bg-purple-500 animate-ping opacity-30" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-purple-400" />
                            MXTune analyse ta demande...
                          </p>
                          <p className="text-xs text-zinc-500 mt-1">Préparation des recommandations personnalisées</p>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                </div>

                <div className="shrink-0 max-w-3xl mx-auto w-full px-4 pb-4">
                  <ChatInput
                    onSend={handleSendMessage}
                    isLoading={isLoading}
                    selectedMotoId={selectedMotoId}
                    selectedKitId={selectedKitId}
                    onSelectMoto={(motoId, kitId) => {
                      setSelectedMotoId(motoId);
                      setSelectedKitId(kitId);
                    }}
                    showMotoSelector={true}
                  />
                </div>
              </div>

              <ProfileSidebar 
                conversationId={conversationId} 
                onSendMessage={handleSendMessage}
              />
            </div>
          </SidebarInset>
        </SidebarProvider>
      </SignedIn>
    </>
  );
}
