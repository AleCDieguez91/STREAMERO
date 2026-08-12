import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Award, CheckCircle2, Info, Rocket, Target, Users } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "./components/ui/radio-group";
import {
  scaleOutcomeByReach,
  type ContractEvaluation,
  type StreamerAffinityProfile,
  type StreamerType,
} from "./game/contract-algorithm";
import { calculateChannelAffinity, getAffinityOfferWeight, getAffinityReachModifier, getChannelAffinity } from "./game/channel-affinities";
import algaLogo from "../../assets/logos/alga.png";
import assLogo from "../../assets/logos/ass.png";
import caranchoLogo from "../../assets/logos/carancho.png";
import queratinaLogo from "../../assets/logos/queratina.png";
import futupopLogo from "../../assets/logos/futupop.png";
import orterixLogo from "../../assets/logos/orterix.png";
import renderLogo from "../../assets/logos/render.png";
import ruzuLogo from "../../assets/logos/ruzu.png";
import verifiedLogo from "../../assets/logos/verificado.png";
import algaEventsMd from "../../assets/docs/EVENTS/ALGA.md?raw";
import orterixEventsMd from "../../assets/docs/EVENTS/ORTERIX.md?raw";
import renderEventsMd from "../../assets/docs/EVENTS/RENDER.md?raw";
import ruzuEventsMd from "../../assets/docs/EVENTS/RUZU.md?raw";
import premiosMd from "../../assets/docs/LISTS/PREMIOS.md?raw";

// ─── Types ────────────────────────────────────────────────────────────────────

interface GamePrize {
  id: string;
  name: string;
  type: "AUTOMATICO" | "ANUAL" | "ESPECIAL";
  icon: string;
  requirement?: string;
  accumulable?: boolean;
  followersRequirement?: number;
}

interface AwardedPrize {
  id: string;
  name: string;
  icon: string;
  channel: Channel;
  requirement?: string;
  count: number;
}

function normalizePrizeToken(value: string): string {
  return value.replace(/\\/g, "").trim();
}

function parseRequirementThreshold(requirement?: string): number | undefined {
  if (!requirement) return undefined;
  const match = requirement.match(/(\d+(?:[.,]\d+)?)\s*(k|m)?/i);
  if (!match) return undefined;

  let value = Number.parseFloat((match[1] ?? "0").replace(",", "."));
  const suffix = (match[2] ?? "").toLowerCase();
  if (suffix === "k") value *= 1000;
  if (suffix === "m") value *= 1000000;
  return Math.round(value);
}

function parsePrizesFromMarkdown(markdown: string): GamePrize[] {
  const sections = markdown.split(/(?=^ID:|^PREMIO:)/mi).map((section) => section.trim()).filter(Boolean);

  return sections.flatMap((section) => {
    const lines = section.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const idLine = lines.find((line) => /^ID:|^PREMIO:/i.test(line));
    const nameLine = lines.find((line) => /^NOMBRE:/i.test(line));
    const typeLine = lines.find((line) => /^TIPO:/i.test(line));
    const iconLine = lines.find((line) => /^ICONO:/i.test(line));
    const accumulableLine = lines.find((line) => /^ACUMULABLE:/i.test(line));
    const requirementLine = lines.find((line) => /^REQUISITO:/i.test(line));

    const id = normalizePrizeToken((idLine ?? "").replace(/^ID:\s*|^PREMIO:\s*/i, ""));
    const name = (nameLine ?? "").replace(/^NOMBRE:\s*/i, "").trim();
    const rawType = (typeLine ?? "").replace(/^TIPO:\s*/i, "").trim().toUpperCase();
    const icon = normalizePrizeToken((iconLine ?? "").replace(/^ICONO:\s*/i, ""));
    const accumulable = /^(SI|S[IÍ]|YES|TRUE)$/i.test((accumulableLine ?? "").replace(/^ACUMULABLE:\s*/i, "").trim());
    const requirement = (requirementLine ?? "").replace(/^REQUISITO:\s*/i, "").trim();

    const normalizedType = rawType === "AUTOMATICO" || rawType === "ANUAL" || rawType === "ESPECIAL" ? rawType : undefined;

    if (!id || !name || !normalizedType || !icon) return [];

    return [{
      id,
      name,
      type: normalizedType,
      icon,
      accumulable,
      ...(requirement ? { requirement } : {}),
      followersRequirement: parseRequirementThreshold(requirement),
    }];
  });
}

const DOC_PREMIOS: GamePrize[] = parsePrizesFromMarkdown(premiosMd);
const PRIZE_ASSET_IMPORTS = import.meta.glob("../../assets/premios/*.png", { eager: true, import: "default" }) as Record<string, string>;
const AWARDS_SEASON_PRIZE_IDS = ["MARTIN_FIERRO_DIGITAL", "PREMIOS_IDOLO", "COSCU_ARMY_AWARDS"] as const;
type AwardsSeasonPrizeId = typeof AWARDS_SEASON_PRIZE_IDS[number];
const VERIFIED_FOLLOWERS = 200_000;
// Reemplazar por la ruta/import del PNG definitivo cuando esté disponible.

function getPrizeAssetSrc(icon: string): string | undefined {
  return PRIZE_ASSET_IMPORTS[`../../assets/premios/${icon}`];
}

function awardAutomaticPrizes(
  followers: number,
  currentAwards: AwardedPrize[] = [],
  channel: Channel,
): AwardedPrize[] {
  let awards = [...currentAwards];

  for (const prize of DOC_PREMIOS) {
    if (prize.type !== "AUTOMATICO") continue;
    if (prize.followersRequirement === undefined) continue;
    if (followers < prize.followersRequirement) continue;

    awards = awardPrize(awards, prize, channel);
  }

  return awards;
}

function awardPrize(
  currentAwards: AwardedPrize[],
  prize: GamePrize,
  channel: Channel,
  options: { forceAccumulable?: boolean } = {},
): AwardedPrize[] {
  const existing = currentAwards.find((entry) => entry.id === prize.id);

  if (existing) {
    if (!prize.accumulable && !options.forceAccumulable) return currentAwards;
    return currentAwards.map((entry) => entry.id === prize.id ? { ...entry, count: entry.count + 1 } : entry);
  }

  return [...currentAwards, {
    id: prize.id,
    name: prize.name,
    icon: prize.icon,
    channel,
    requirement: prize.requirement,
    count: 1,
  }];
}

function getAwardIncrements(previousAwards: AwardedPrize[], nextAwards: AwardedPrize[]): AwardedPrize[] {
  return nextAwards.flatMap((prize) => {
    const previousCount = previousAwards.find((entry) => entry.id === prize.id)?.count ?? 0;
    const incrementCount = prize.count - previousCount;
    return incrementCount > 0
      ? Array.from({ length: incrementCount }, (_, index) => ({ ...prize, count: previousCount + index + 1 }))
      : [];
  });
}

function awardSpecialPrizesForSuccessfulEvent(
  eventId: string | undefined,
  currentAwards: AwardedPrize[],
  channel: Channel,
): AwardedPrize[] {
  if (!eventId) return currentAwards;

  return DOC_PREMIOS
    .filter((prize) => prize.type === "ESPECIAL" && prize.accumulable && normalizePrizeToken(prize.requirement ?? "").includes(eventId))
    .reduce((awards, prize) => awardPrize(awards, prize, channel), currentAwards);
}

type Phase =
  | "intro"
  | "naming"
  | "transferMarket"
  | "event"
  | "eventResult"
  | "seasonSummary"
  | "awardsSeason"
  | "gameOver";

type AvatarChoice = "avatar-a" | "avatar-b";
type Personality = "PICANTE" | "CHILL" | "CARISMATICO" | "SESEUDO";

const PERSONALITIES: Record<Personality, { emoji: string; label: string }> = {
  PICANTE: { emoji: "🔥", label: "Picante" },
  CHILL: { emoji: "😎", label: "Chill" },
  CARISMATICO: { emoji: "😂", label: "Carismático" },
  SESEUDO: { emoji: "🧠", label: "Sesudo" },
};

interface StreamerProfile {
  streamerType: StreamerType;
  personality: Personality;
  avatar: AvatarChoice;
}

type Channel =
  | "ORTERIX"
  | "ALGA"
  | "ASS"
  | "RUZU TV"
  | "RENDER"
  | "CARANCHO"
  | "QUERATINA"
  | "FUTUPOP";

interface StatDelta {
  followers: number;
  reputation?: number;
  reputation?: number;
  message: string;
  specialOutcome?: "forcedTransfer";
}

interface EventOption {
  text: string;
  detail: string;
  successChance: number;
  success: StatDelta;
  failure: StatDelta;
}

interface GameEvent {
  id?: string;
  title: string;
  description: string;
  options?: EventOption[];
  type?: "normal" | "automatic";
  consequences?: StatDelta[];
  appearance?: "UNA_VEZ";
  forceAsLast?: boolean;
}

interface CareerEntry {
  channel: Channel;
  seasons: number;
}

interface LastResult {
  eventTitle: string;
  optionText: string;
  wasSuccess: boolean;
  delta: StatDelta;
}

interface GameState {
  phase: Phase;
  streamerName: string;
  streamerProfile: StreamerProfile | null;
  season: number;
  eventIndex: number;
  currentChannel: Channel;
  followers: number;
  reputation: number;
  careerHistory: CareerEntry[];
  currentEvents: GameEvent[];
  lastResult: LastResult | null;
  seasonAccum: { followers: number };
  seasonRepercussionFollowers: number | null;
  seasonRepercussionAwardedFor: number | null;
  isFirstMarket: boolean;
  renderSold: boolean;
  usedFajenseRivals: string[];
  usedEventKeys: string[];
  excludedChannels: Channel[];
  isVerified: boolean;
  pendingVerificationUnlock: boolean;
  awardedAutomaticPrizes: AwardedPrize[];
  pendingPrizeUnlocks: AwardedPrize[];
  awardsSeasonBoard: (AwardsSeasonPrizeId | null)[];
  awardsSeasonRevealed: number[];
  awardsSeasonCompleted: boolean;
  awardsSeasonEndedByEmpty: boolean;
  recentPerformance: number;
  contractPerformanceTotal: number;
  contractPerformancePeriods: number;
  currentChannelAffinity: number;
}

const EVENTS_PER_SEASON = 4;
const SEASONS = 10;

// ─── Channel Config ───────────────────────────────────────────────────────────

interface ChannelInfo {
  name: Channel;
  shortName: string;
  logo?: string;
  tagline: string;
  description: string;
  figure: string;
  remuneration: number;
  reach: number;
  demand: "Baja" | "Media" | "Alta";
  passiveMoney: number;
  color: string;
  glow: string;
  accent: string;
}

const CHANNELS: Record<Channel, ChannelInfo> = {
  ORTERIX: {
    name: "ORTERIX",
    shortName: "ORTERIX",
    logo: orterixLogo,
    tagline: "Entre recitales, deportes y humor. Su programa estrella es \"Bajen un cambio\"",
    description: "El canal más irreverente. Humor ácido, rock en vivo y deportes sin protocolo. Azuquita Rodrigues es la estrella.",
    figure: "Azuquita Rodrigues",
    remuneration: 3, reach: 4, demand: "Media",
    passiveMoney: 12,
    color: "#7c3aed", glow: "rgba(124,58,237,0.35)", accent: "#a78bfa",
  },
  ALGA: {
    name: "ALGA",
    shortName: "ALGA",
    logo: algaLogo,
    tagline: "El canal más relajado del streaming argentino. Nadie sabe exactamente qué va a pasar cuando comienza un programa. Programa estrella: \"Flashee que flotaba\"",
    description: "Improvisación al máximo nivel. Migue Granate convirtió el caos en un formato. Todo puede pasar en vivo.",
    figure: "Migue Granate",
    remuneration: 4, reach: 4, demand: "Media",
    passiveMoney: 18,
    color: "#fe0144", glow: "rgba(254,1,68,0.35)", accent: "#ff3d7a",
  },
  ASS: {
    name: "ASS",
    shortName: "ASS",
    logo: assLogo,
    tagline: "Si rueda una pelota, ASS está ahí. Programa estrella: \"No podemos vender\"",
    description: "Sin distracciones. Solo fútbol. Fabio Assado y su equipo son los referentes del análisis futbolístico en streaming.",
    figure: "Fabio Assado",
    remuneration: 2, reach: 3, demand: "Baja",
    passiveMoney: 7,
    color: "#0284c7", glow: "rgba(2,132,199,0.35)", accent: "#38bdf8",
  },
  "RUZU TV": {
    name: "RUZU TV",
    shortName: "RUZU TV",
    logo: ruzuLogo,
    tagline: "Un canal donde cualquier conversación puede terminar siendo viral. Programa estrella: \"Nadie habla\"",
    description: "Humor subido de tono, charlas banales de primeras citas y actualidad sin filtro. Nico Bognato al frente de todo.",
    figure: "Nico Bognato",
    remuneration: 3, reach: 3, demand: "Baja",
    passiveMoney: 10,
    color: "#db2777", glow: "rgba(219,39,119,0.35)", accent: "#f472b6",
  },
  RENDER: {
    name: "RENDER",
    shortName: "RENDER",
    logo: renderLogo,
    tagline: "La actualidad nunca descansa. Su programa estrella es \"Hubo algo acá\".",
    description: "Periodismo de fondo. Tomás Report lleva el análisis político al streaming. Cuidado: el canal puede cambiar de manos.",
    figure: "Tomás Report",
    remuneration: 4, reach: 4, demand: "Alta",
    passiveMoney: 14,
    color: "#9f1239", glow: "rgba(159,18,57,0.35)", accent: "#fb7185",
  },
  CARANCHO: {
    name: "CARANCHO",
    shortName: "CARANCHO",
    logo: caranchoLogo,
    tagline: "El canal más alineado con el oficialismo. Programa estrella: \"La Visa\"",
    description: "Plataforma de propaganda del movimiento libertario. El Gordo Pan es la voz del canal. Mismo dueño que RENDER.",
    figure: "El Gordo Pan",
    remuneration: 4, reach: 3, demand: "Alta",
    passiveMoney: 16,
    color: "#67bed9", glow: "rgba(103,190,217,0.35)", accent: "#67bed9",
  },
  QUERATINA: {
    name: "QUERATINA",
    shortName: "QUERATINA",
    logo: queratinaLogo,
    tagline: "Política, entrevistas y cultura. Programa estrella: \"Industria Popular\"", 
    description: "Debates largos, análisis y entrevistas profundas. Es un canal donde las conversaciones suelen ocupar toda la transmisión. Programa estrella: \"Industria Popular\".",
    figure: "Pepe Racinclub",
    remuneration: 3, reach: 4, demand: "Media",
    passiveMoney: 13,
    color: "#1d4ed8", glow: "rgba(29,78,216,0.35)", accent: "#93c5fd",
  },
  FUTUPOP: {
    name: "FUTUPOP",
    shortName: "FUTUPOP",
    logo: futupopLogo,
    tagline: "Donde la cultura también es protagonista. Programa estrella: \"Mira a quien traje\"",
    description: "Donde la cultura también es protagonista. Programa estrella: \"Mira a quien traje\"",
    figure: "Furia Mentolini",
    remuneration: 2, reach: 3, demand: "Baja",
    passiveMoney: 6,
    color: "#047857", glow: "rgba(4,120,87,0.35)", accent: "#34d399",
  },
};

const ALL_CHANNELS: Channel[] = [
  "ORTERIX", "ALGA", "ASS", "RUZU TV", "RENDER", "CARANCHO", "QUERATINA", "FUTUPOP",
];

const FALLBACK_CHANNEL = CHANNELS["ORTERIX"];
function ch(name: Channel): ChannelInfo {
  return CHANNELS[name] ?? FALLBACK_CHANNEL;
}

function toStreamerAffinity(profile: StreamerProfile | null): StreamerAffinityProfile {
  // El perfil nulo solo puede aparecer antes de completar la creación del jugador.
  // El valor neutral mantiene seguras las vistas de desarrollo y los estados antiguos.
  if (!profile) {
    return {
      streamerType: "Reacción",
    };
  }

  return {
    streamerType: profile.streamerType,
  };
}

function getContractEvaluation(gs: GameState, channel: Channel): ContractEvaluation {
  const affinity = channel === gs.currentChannel
    ? gs.currentChannelAffinity
    : gs.streamerProfile
      ? getChannelAffinity(channel, gs.streamerProfile.streamerType, gs.streamerProfile.personality).score
      : 0;
  const personalizedReach = (CHANNELS[channel] ?? FALLBACK_CHANNEL).reach * 20 * (1 + getAffinityReachModifier(affinity));
  return {
    compatibility: { streamerType: null, total: affinity },
    personalizedReach,
    reachPips: Math.max(1, Math.min(5, Math.round(personalizedReach / 20))),
    exposureMultiplier: 0.6 + 0.8 * (Math.max(0, Math.min(100, personalizedReach)) / 100),
  };
}

function updateRecentPerformance(gs: GameState, periodScore: number) {
  const contractPerformanceTotal = (gs.contractPerformanceTotal ?? 0) + periodScore;
  const contractPerformancePeriods = (gs.contractPerformancePeriods ?? 0) + 1;

  return {
    contractPerformanceTotal,
    contractPerformancePeriods,
    recentPerformance: Math.round(contractPerformanceTotal / contractPerformancePeriods),
  };
}

function calculateSeasonRepercussionFollowers(seasonFollowers: number): number {
  return Math.max(0, Math.round(seasonFollowers * 0.25));
}

// ─── Events ───────────────────────────────────────────────────────────────────

function parseConsequenceText(text: string): StatDelta[] {
  return Array.from(text.matchAll(/([+-]?\d+(?:[.,]\d+)?)([kK])?(?:\s*([A-Za-zÁÉÍÓÚáéíóú]+))?/g))
    .map((match) => {
      const rawValue = match[1].replace(",", ".");
      let value = Number.parseFloat(rawValue);
      const kSuffix = Boolean(match[2]);
      const unit = (match[3] ?? "").toLowerCase();
      if (kSuffix) value = value * 1000;
      if (unit.includes("reput")) return { followers: 0, reputation: value, message: "" };
      return { followers: value, reputation: 0, message: "" };
    });
}

function combineConsequences(parts: StatDelta[]): StatDelta {
  return parts.reduce((acc, part) => ({
    followers: acc.followers + (part.followers ?? 0),
    reputation: acc.reputation + (part.reputation ?? 0),
    message: acc.message,
  }), { followers: 0, reputation: 0, message: "" });
}

function extractOutcomeData(block: string, outcomeLabel: "SALE BIEN" | "SALE MAL") {
  const lines = block.split(/\r?\n/).map((line) => line.trim());
  const headerIndex = lines.findIndex((line) => new RegExp(`^${outcomeLabel}:`, "i").test(line));
  if (headerIndex < 0) {
    return { message: "", consequences: { followers: 0, reputation: 0, message: "" } };
  }

  const headerText = lines[headerIndex].replace(new RegExp(`^${outcomeLabel}:\\s*`, "i"), "").trim();
  const narrativeLines: string[] = [];
  const consequenceLines: string[] = [];
  let inConsequences = false;

  for (let index = headerIndex + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line) continue;
    if (/^CONSECUENCIAS:/i.test(line)) {
      inConsequences = true;
      const rest = line.replace(/^CONSECUENCIAS:\s*/i, "").trim();
      if (rest) consequenceLines.push(rest);
      continue;
    }
    if (/^SALE (BIEN|MAL):/i.test(line)) break;
    if (inConsequences) consequenceLines.push(line);
    else narrativeLines.push(line);
  }

  const message = [headerText, ...narrativeLines].filter(Boolean).join(" ").trim();
  const consequenceText = consequenceLines.join("\n");
  const consequences = {
    ...combineConsequences(parseConsequenceText(consequenceText)),
    ...( /DIRECTO\s+A\s+MERCADO\s+DE\s+PASES/i.test(consequenceText)
      ? { specialOutcome: "forcedTransfer" as const }
      : {}),
  };
  return { message, consequences };
}

function normalizeOptionText(text: string): string {
  return text.trim().replace(/^[A-Z]\s*[:.\-–—]\s*/i, "").trim();
}

function parseAutomaticEventsFromMarkdown(markdown: string): GameEvent[] {
  const sections = markdown.split(/(?=^\s*EVENTO:)/mi).filter((section) => /^\s*EVENTO:/mi.test(section));
  return sections.flatMap((section) => {
    const normalized = section.trim();
    if (!normalized) return [];
    const lines = normalized.split(/\r?\n/).map((line) => line.trim());
    const id = lines.find((line) => /^EVENTO:/i.test(line))?.replace(/^EVENTO:\s*/i, "").trim();
    const typeLine = lines.find((line) => /^TIPO:/i.test(line));
    if (!typeLine || !/AUTOMATICO/i.test(typeLine)) return [];

    const title = lines.find((line) => /^T[ÍI]TULO:/i.test(line))?.replace(/^T[ÍI]TULO:\s*/i, "") ?? "Evento Automático";
    const description = lines.find((line) => /^DESCRIPCIÓN:/i.test(line) || /^DESCRIPCION:/i.test(line))
      ?.replace(/^DESCRIPCIÓN:\s*/i, "")
      ?.replace(/^DESCRIPCION:\s*/i, "") ?? "";
    const appearanceLine = lines.find((line) => /^APARICION:/i.test(line));
    const appearance = appearanceLine?.replace(/^APARICION:\s*/i, "").trim().toUpperCase() === "UNA_VEZ"
      ? "UNA_VEZ"
      : undefined;

    const consequenceLines: string[] = [];
    let inConsequences = false;
    for (const line of lines) {
      if (!inConsequences && /^CONSECUENCIAS:/i.test(line)) {
        inConsequences = true;
        continue;
      }
      if (!inConsequences) continue;
      if (/^(EVENTO:|TIPO:|T[ÍI]TULO:|DESCRIPCIÓN:|DESCRIPCION:|CANAL:|RAREZA:|OPCIÓN|OPCION)/i.test(line)) break;
      if (!line || line === "…") continue;
      consequenceLines.push(line);
    }

    const consequences = consequenceLines
      .map((line) => line.match(/([+-]?\d+(?:[.,]\d+)?)([kK])?(?:\s*([A-Za-zÁÉÍÓÚáéíóú]+))?/))
      .filter((match): match is RegExpMatchArray => Boolean(match))
      .map((match) => {
        const rawValue = match[1].replace(",", ".");
        let value = Number.parseFloat(rawValue);
        const kSuffix = Boolean(match[2]);
        const unit = (match[3] ?? "").toLowerCase();
        if (kSuffix) value = value * 1000;
        if (unit.includes("reput")) return { followers: 0, reputation: value, message: "" };
        // default to followers when unit is ambiguous or 'seguidores'
        return { followers: value, reputation: 0, message: "" };
      });

    return [{ id, title, description, type: "automatic", consequences, appearance }];
  });
}

function parseEventsFromMarkdown(markdown: string): GameEvent[] {
  const sections = markdown.split(/(?=^\s*EVENTO:)/mi).filter((section) => /^\s*EVENTO:/mi.test(section));
  return sections.flatMap((section) => {
    const normalized = section.trim();
    if (!normalized) return [];
    const lines = normalized.split(/\r?\n/).map((l) => l.trim());
    const id = lines.find((line) => /^EVENTO:/i.test(line))?.replace(/^EVENTO:\s*/i, "").trim();

    const title = lines.find((line) => /^T[ÍI]TULO:/i.test(line))?.replace(/^T[ÍI]TULO:\s*/i, "")?.trim() ?? "Evento";
    const description = lines.find((line) => /^DESCRIPCI(?:ÓN|ON):/i.test(line))
      ?.replace(/^DESCRIPCI(?:ÓN|ON):\s*/i, "") ?? "";

    const appearanceLine = lines.find((line) => /^APARICION:/i.test(line));
    const appearance = appearanceLine?.replace(/^APARICION:\s*/i, "").trim().toUpperCase() === "UNA_VEZ"
      ? "UNA_VEZ"
      : undefined;

    const typeLine = lines.find((line) => /^TIPO:/i.test(line));
    const type = typeLine ? (/(AUTOMATICO)/i.test(typeLine) ? "automatic" : undefined) : undefined;

    // Parse options (OPCIÓN A / OPCION B / OPCIÓN C ...)
    const optionBlocks: string[] = [];
    let currentOpt: string[] | null = null;
    for (const line of lines) {
      if (/^OPCI(?:ÓN|ON)\s+[A-Z]/i.test(line)) {
        if (currentOpt) optionBlocks.push(currentOpt.join('\n'));
        currentOpt = [line];
        continue;
      }
      if (currentOpt) currentOpt.push(line);
    }
    if (currentOpt) optionBlocks.push(currentOpt.join('\n'));

    const options: EventOption[] = optionBlocks.map((block) => {
      const bLines = block.split(/\r?\n/).map((l) => l.trim());
      const header = bLines[0] ?? "";
      const rawText = header.replace(/^OPCI(?:ÓN|ON):?/i, "").trim();
      const text = normalizeOptionText(rawText) || "Opción";
      const subtitle = (bLines.find((l) => /^SUBT[ÍI]TULO:/i.test(l)) ?? "").replace(/^SUBT[ÍI]TULO:\s*/i, "").trim();
      const probLine = bLines.find((l) => /^PROBABILIDAD:/i.test(l));
      const prob = probLine ? Number((probLine.replace(/^PROBABILIDAD:\s*/i, "").replace(/%/g, "").trim())) / 100 : 0.5;

      const successOutcome = extractOutcomeData(block, "SALE BIEN");
      const failureOutcome = extractOutcomeData(block, "SALE MAL");

      const successObj = {
        ...successOutcome.consequences,
        message: successOutcome.message,
      };
      const failureObj = {
        ...failureOutcome.consequences,
        message: failureOutcome.message,
      };

      return {
        text: text,
        detail: subtitle,
        successChance: isNaN(prob) ? 0.5 : prob,
        success: successObj,
        failure: failureObj,
      } as EventOption;
    });

    // Parse consequences for automatic events (if any)
    const consequenceLines: string[] = [];
    let inConsequences = false;
    for (const line of lines) {
      if (!inConsequences && /^CONSECUENCIAS:/i.test(line)) {
        inConsequences = true;
        continue;
      }
      if (!inConsequences) continue;
      if (/^(EVENTO:|TIPO:|T[ÍI]TULO:|DESCRIPCIÓN:|DESCRIPCION:|CANAL:|RAREZA:|OPCIÓN|OPCION)/i.test(line)) break;
      if (!line || line === '…') continue;
      consequenceLines.push(line);
    }

    const consequences = consequenceLines
      .map((line) => line.match(/([+-]?\d+(?:[.,]\d+)?)([kK])?(?:\s*([A-Za-zÁÉÍÓÚáéíóú]+))?/))
      .filter((match): match is RegExpMatchArray => Boolean(match))
      .map((match) => {
        const rawValue = match[1].replace(",", ".");
        let value = Number.parseFloat(rawValue);
        const kSuffix = Boolean(match[2]);
        const unit = (match[3] ?? "").toLowerCase();
        if (kSuffix) value = value * 1000;
        if (unit.includes("reput")) return { followers: 0, reputation: value, message: "" };
        return { followers: value, reputation: 0, message: "" };
      });

    const ev: GameEvent = {
      id,
      title,
      description,
      type,
      options: options.length ? options : undefined,
      consequences: consequences.length ? consequences : undefined,
      appearance,
    };

    return [ev];
  });
}

const DOC_EVENTS: Partial<Record<Channel, GameEvent[]>> = {
  ALGA: parseAutomaticEventsFromMarkdown(algaEventsMd),
  ORTERIX: parseEventsFromMarkdown(orterixEventsMd).filter((event) => event.id === "ORTERIX_002"),
  RENDER: parseAutomaticEventsFromMarkdown(renderEventsMd),
  "RUZU TV": parseEventsFromMarkdown(ruzuEventsMd),
};

// Reload markdown-based automatic events at runtime by fetching the raw
// files and reparsing them. We do an in-place update of `DOC_EVENTS` so
// existing selection logic that reads `DOC_EVENTS` does not need to be
// changed.
async function refreshDocEvents() {
  const mapping: Record<string, string> = {
    ALGA: "../../assets/docs/EVENTS/ALGA.md",
    ORTERIX: "../../assets/docs/EVENTS/ORTERIX.md",
    RENDER: "../../assets/docs/EVENTS/RENDER.md",
    "RUZU TV": "../../assets/docs/EVENTS/RUZU.md",
  };

  for (const [channel, relPath] of Object.entries(mapping)) {
    try {
      const url = new URL(relPath, import.meta.url).href;
      const res = await fetch(url);
      if (!res.ok) continue;
      const text = await res.text();
      const parsed = channel === "RUZU TV"
        ? parseEventsFromMarkdown(text)
        : channel === "ORTERIX"
          ? parseEventsFromMarkdown(text).filter((event) => event.id === "ORTERIX_002")
          : parseAutomaticEventsFromMarkdown(text);
      // mutate DOC_EVENTS in-place so pickEvents and other logic see updates
      (DOC_EVENTS as any)[channel] = parsed;
    } catch (err) {
      // keep silent in production but log for debugging
      // eslint-disable-next-line no-console
      console.error("refreshDocEvents failed for", channel, err);
    }
  }
}

const QUERATINA_SONG_TITLE = "La Canción de la Estrella de Mar";

const EVENTS: Record<Channel, GameEvent[]> = {
  ORTERIX: [
    {
      title: "El Recital de la Década",
      description: "ORTERIX cubre en vivo el festival de rock más grande del año. Azuquita Rodrigues te nomina para la transmisión principal.",
      options: [
        { text: "Tomar la conducción del stream completo", detail: "Protagonismo total, riesgo total.", successChance: 0.52,
          success: { followers: 11000, reputation: 5, message: "Robaste el show. La transmisión fue lo más visto del festival." },
          failure: { followers: -1000, reputation: 0, message: "Los nervios se notaron demasiado. La audiencia no perdonó." } },
        { text: "Cubrir el backstage con entrevistas", detail: "Contenido cercano, menos presión.", successChance: 0.74,
          success: { followers: 6000, reputation: 3, message: "Entrevistas espontáneas que se convirtieron en los clips de la noche." },
          failure: { followers: 800, reputation: 1, message: "Cobertura correcta pero sin momentos que se recuerden." } },
      ],
    },
    {
      title: "El Bit de Humor que Nadie Esperaba",
      description: "Azuquita Rodrigues lanza un desafío de humor en vivo y te menciona por nombre. Millones miran.",
      options: [
        { text: "Sumarte sin pensarlo", detail: "Pura reacción, sin calcular.", successChance: 0.5,
          success: { followers: 13000, reputation: 3, message: "La reacción genuina hizo explotar el chat. Clips por todos lados." },
          failure: { followers: -1000, reputation: 0, message: "No era tu momento. La comparación con Azuquita fue cruel." } },
        { text: "Responder con tu propio bit preparado", detail: "Controlás la situación.", successChance: 0.63,
          success: { followers: 8000, reputation: 2, message: "Sorprendiste a todos con un bit propio. Ganaste terreno en ORTERIX." },
          failure: { followers: -2000, reputation: 0, message: "El bit preparado se notó demasiado. Se rieron de vos, no con vos." } },
      ],
    },
    {
      title: "Hot Take Deportivo",
      description: "ORTERIX organiza un panel donde cada uno dice su opinión más polémica sobre deporte. Todos miran.",
      options: [
        { text: "El hot take más arriesgado que tenés", detail: "Decir lo que nadie se anima.", successChance: 0.44,
          success: { followers: 5000, reputation: 4, message: "Tu opinión explotó en redes. Mitad te odia, mitad te adora. Ambos te siguen." },
          failure: { followers: -2000, reputation: 0, message: "La opinión cayó fatal. Trending topic por las razones equivocadas." } },
        { text: "Opinión fuerte pero con respaldo", detail: "Polémica con argumentos.", successChance: 0.67,
          success: { followers: 1000, reputation: 2, message: "Posición sólida. La audiencia te tomó en serio y siguió el debate." },
          failure: { followers: -2000, reputation: 0, message: "Quedó como una opinión a medias. No convenció a nadie." } },
      ],
    },
    {
      title: "Collab Oficial con Azuquita",
      description: "El streamer estrella de ORTERIX te propone hacer un stream conjunto. Es un salto enorme de visibilidad.",
      options: [
        { text: "Aceptar y cederle el protagonismo", detail: "Venir a sumar, no a competir.", successChance: 0.68,
          success: { followers: 4000, reputation: 4, message: "El stream fue un éxito. La comunidad de Azuquita te adoptó." },
          failure: { followers: -300, reputation: 0, message: "Quedaste opacado. La audiencia ni te registró al lado suyo." } },
        { text: "Proponer un formato donde los dos brillen", detail: "Negociar los términos creativos.", successChance: 0.48,
          success: { followers: 6000, reputation: 6, message: "El formato fue brillante. Ambos crecieron. Hablan de ustedes como dupla." },
          failure: { followers: -600, reputation: 0, message: "La negociación enfrió la idea. La collab salió sin la energía del principio." } },
      ],
    },
    {
      title: "Maratón Gaming 12 Horas",
      description: "ORTERIX organiza su maratón anual y te quieren como uno de los protagonistas. 12 horas en vivo.",
      options: [
        { text: "Estar las 12 horas sin parar", detail: "Compromiso total con el evento.", successChance: 0.46,
          success: { followers: 14000, reputation: 5, message: "Llegaste al final. El chat enloqueció en la hora 12. Histórico." },
          failure: { followers: 2000, reputation: 1, message: "Te quedaste dormido en hora 9. El clip se viralizó, pero no como querías." } },
        { text: "Hacer los horarios pico y descansar", detail: "Calidad sobre cantidad.", successChance: 0.74,
          success: { followers: 7000, reputation: 2, message: "Cada aparición fue de alto nivel. El canal quedó muy conforme." },
          failure: { followers: 1000, reputation: 1, message: "Tu ausencia en horas clave fue notada. No causaste impacto." } },
      ],
    },
    {
      id: "ORTERIX_001",
      title: "Fajense de Manos",
      description: "Azuquita Rodrigues organiza en el Luna Park un evento de boxeo con streamers e influencers. Este año tu rival será {RIVAL}.",
      forceAsLast: true,
      options: [
        { text: "Entrenar a fondo", detail: "A darlo todo", successChance: 0.50,
          success: { followers: 2000, reputation: 0, message: "Noqueas a {RIVAL} en el primer Round. Alzas el cinto con orgullo" },
          failure: { followers: -5000, reputation: -5, message: "Te pasaste un poco y {RIVAL} termina internado.\nEn redes te llaman \"Asesino\". El cinturón se lo dan a tu rival para fomentar el Fair Play." } },
        { text: "Apenas entrenas", detail: "Total es todo show", successChance: 0.50,
          success: { followers: 2000, reputation: 0, message: "Ninguno de los 2 emboca una piña pero el público se caga de risa. Ganás por puntos." },
          failure: { followers: -1000, reputation: 0, message: "Te quedás sin aire al minuto de pelea, {RIVAL} no perdona y te noquea. Te boludean en twitter por semanas" } },
      ],
    },
  ],

  ALGA: [
    {
      title: "Panel de Improvisación con Migue",
      description: "Migue Granate te invita a su segmento estrella de improvisación. El caos es el formato y las reglas no existen.",
      options: [
        { text: "Soltar todo, puro instinto", detail: "Sin preparación, sin freno.", successChance: 0.48,
          success: { followers: 17000, reputation: 5, message: "Fue el segmento más visto del mes. Migue te abrazó al terminar." },
          failure: { followers: -500, reputation: -1, message: "Te bloqueaste en vivo. El silencio fue incómodo para todos." } },
        { text: "Preparar algunos bits de antemano", detail: "Improvisación con estructura.", successChance: 0.70,
          success: { followers: 9000, reputation: 3, message: "La preparación se notó de buena manera. Sólido y entretenido." },
          failure: { followers: -200, reputation: -1, message: "Los bits preparados chocaron con el caos de Migue. No fluyó." } },
      ],
    },
    {
      title: "Un nene habla de política en vivo",
      description: "Trajiste a la estrella infantil Jota a tu programa y el estudio se lleno de niños, le acercás el micrófono a uno de ellos. El nene grita \"TODOS ACÁ ODIAMOS AL PRESIDENTE\".",
      options: [
        { text: "Le sacás el micrófono y cambias de tema", detail: "No querés quilombo.", successChance: 0.60,
          success: { followers: 1000, reputation: 0, message: "Fuiste rápido y nadie se dio cuenta. La entrevista siguió su curso." },
          failure: { followers: -5000, reputation: 0, message: "En el arrebato le pegás al nene sin querer y este llora. Las redes te matan." } },
        { text: "Te reís de la ocurrencia", detail: "Confiemos en el caos.", successChance: 0.40,
          success: { followers: 2000, reputation: 0, message: "Tu risa contagia al resto del equipo. Queda como un clip gracioso." },
          failure: { followers: -2000, reputation: 0, message: "En las redes te tildan de golpista. El presidente comparte el clip y comenta \"Asi operan los zurdos\"." } },
      ],
    },
    {
      title: "Sketch polémico",
      description: "En una lluvia de ideas dijiste que querías hacer una parodia del pesebre. Lo llevaste a cabo, te pusiste un pañal y fingiste ser Jesús pero a la gente no le gustó.",
      options: [
        { text: "Pedís disculpas al día siguiente", detail: "Con eso no se jode", successChance: 0.70,
          success: { followers: 500, reputation: 0, message: "La mayoría te perdona y pasas página rápido" },
          failure: { followers: -5000, reputation: 0, message: "No lograste sonar convincente y te reíste de los nervios. Peor." } },
        { text: "Defendés el sketch", detail: "El humor sana", successChance: 0.30,
          success: { followers: 8000, reputation: 0, message: "Das un discurso sobre la doble moral y sobre el humor. Te los metiste a todos en el bolsillo" },
          failure: { followers: 0, reputation: 0, message: "Granate te llama en privado y te echa.", specialOutcome: "forcedTransfer" } },
      ],
    },
    {
      title: "Golpe de Nostalgia",
      description: "Traes a todo el elenco de RadioMatch, un programa de los '90 querido y odiado por igual. ¿Cómo encarás el programa?",
      options: [
        { text: "Homenajear a RadioMatch al 100%", detail: "El humor no caduca", successChance: 0.50,
          success: { followers: 3000, reputation: 0, message: "Producción ríe, el chat ríe, las redes también. Tu niño interior esta feliz" },
          failure: { followers: -3000, reputation: 0, message: "Al 3er chiste de suegras las visitas caen. El humor evolucionó, vos no." } },
        { text: "Entrevista íntima", detail: "Querés escuchar a las personas y no a los personajes", successChance: 0.50,
          success: { followers: 5000, reputation: 0, message: "Los invitados se abren con vos y cuentan secretos del programa. En las redes te felicitan por tus preguntas." },
          failure: { followers: -4000, reputation: 0, message: "La gente te putea porque querían escuchar los chistes de Yuyo y Escorpión." } },
      ],
    },
    {
      title: "Nueva incorporación",
      description: "Granate se roba una figura de Ruzu y te conduzcas un programa con ella para justificar el sueldo. Vos no te la bancás.",
      options: [
        { text: "Aceptás", detail: "El jefe es el jefe", successChance: 0.50,
          success: { followers: 4000, reputation: 0, message: "Contra todo prejuicio tenés una gran química con ella. El programa la rompe." },
          failure: { followers: -2000, reputation: 0, message: "No te sigue los chistes y la falta de química se nota. El programa dura menos de 1 mes." } },
        { text: "Respetuosamente te negás", detail: "La honestidad es tu estandarte", successChance: 0.50,
          success: { followers: 200, reputation: 0, message: "Migue Granate lo entiende y va rotando a la piba por varios programas. Al final se da cuenta que no sirve y la echa." },
          failure: { followers: 0, reputation: 0, message: "Migue Granate te tilda de mal compañero y mala leche." } },
      ],
    },
    {
      title: "La guerra de los bots",
      description: "Un canal rival insinúa en redes que ALGA está inflando artificialmente su audiencia. El tema domina las tendencias y todos esperan una respuesta.",
      options: [
        { text: "Responder públicamente", detail: "Vamos a defender nuestra credibilidad", successChance: 0.60,
          success: { followers: 3000, reputation: 0, message: "Hablas seriamente mirando a cámara y desmentís las acusaciones con datos. El público respalda el canal" },
          failure: { followers: -1500, reputation: 0, message: "La discusión escala y varios medios siguen hablando del tema." } },
        { text: "Ignorar la polémica", detail: "Ladran Sancho", successChance: 0.85,
          success: { followers: 1000, reputation: 0, message: "La noticia muere a los pocos días." },
          failure: { followers: -3000, reputation: 0, message: "Muchos interpretan el silencio como una admisión." } },
      ],
    },
    {
      title: "Entrevista en Modo Caos",
      description: "ALGA consigue una figura famosa. El formato: preguntas sin filtro, respuestas sin edición. Migue te da la silla.",
      options: [
        { text: "Ir al caos total sin ningún límite", detail: "El show sobre todo.", successChance: 0.40,
          success: { followers: 22000, reputation: 7, message: "La entrevista más comentada del año. El invitado se convirtió en meme." },
          failure: { followers: -1000, reputation: -2, message: "El invitado se fue al corte. ALGA tuvo que pedir disculpas públicas." } },
        { text: "Caos controlado: gracioso pero respetuoso", detail: "Equilibrio entre show y forma.", successChance: 0.73,
          success: { followers: 12000, reputation: 4, message: "Entrevista memorable. El invitado quedó bien y vos quedaste mejor." },
          failure: { followers: -1000, reputation: -1, message: "El equilibrio no se encontró. Ni caos ni entrevista real." } },
      ],
    },
    {
      title: "El Clip Viral de Migue te Involucra",
      description: "Un momento de Migue se viraliza masivamente y te mencionó por nombre. Las redes arden y todos te buscan.",
      options: [
        { text: "Publicar contenido propio de inmediato", detail: "Surfear la ola antes de que baje.", successChance: 0.56,
          success: { followers: 15000, reputation: 4, message: "El timing fue perfecto. Tu contenido llegó cuando todos te buscaban." },
          failure: { followers: -600, reputation: 0, message: "El contenido que publicaste no estuvo a la altura del momento." } },
        { text: "Hacer un live conjunto con Migue", detail: "Aprovechar su base directamente.", successChance: 0.67,
          success: { followers: 11000, reputation: 3, message: "El live conjunto fue el cierre perfecto del momento viral." },
          failure: { followers: -1000, reputation: 0, message: "La coordinación falló. El live salió tarde y el momento ya había pasado." } },
      ],
    },
    {
      title: "Programa Especial de Entrevistas",
      description: "ALGA hace una maratón de entrevistas. Te asignan el invitado más difícil de manejar de toda la grilla.",
      options: [
        { text: "Abrazar la dificultad, hacer algo diferente", detail: "El riesgo como estrategia creativa.", successChance: 0.42,
          success: { followers: 24000, reputation: 8, message: "Lo imposible se volvió el segmento más comentado. Leyenda." },
          failure: { followers: -10000, reputation: 0, message: "El invitado te dominó en vivo. La diferencia fue demasiado visible." } },
        { text: "Entrevista clásica con humor estratégico", detail: "Jugar sobre seguro con estilo.", successChance: 0.71,
          success: { followers: 13000, reputation: 4, message: "Entrevista fluida y con momentos de humor que la hicieron especial." },
          failure: { followers: -2000, reputation: 0, message: "El invitado difícil pudo con vos. Resultado plano." } },
      ],
    },
    {
      title: "Debate Espontáneo en Vivo",
      description: "En el medio de un stream, Migue lanza un debate no planeado y te da la palabra sin aviso previo.",
      options: [
        { text: "Tomar el debate y llevarlo al extremo", detail: "Improvisación pura.", successChance: 0.47,
          success: { followers: 19000, reputation: 5, message: "El debate explotó. Tu posición fue la más discutida de la noche." },
          failure: { followers: -7000, reputation: 0, message: "No tenías argumentos listos. Quedaste sin respuestas convincentes." } },
        { text: "Aportar desde un lugar más tranquilo", detail: "No todo tiene que ser extremo.", successChance: 0.68,
          success: { followers: 8000, reputation: 2, message: "La calma contrastó bien con el caos. Tu voz se diferenció." },
          failure: { followers: -1000, reputation: 0, message: "Quedaste opacado entre las voces más fuertes del panel." } },
      ],
    },
    {
      title: "Entrevista con el 10",
      description: "Migue Granate consiguió una entrevista con el Capitán de la Selección en Miami, te quiere llevar como co-conductor pero temás cagarla.",
      options: [
        { text: "Aceptar", detail: "Ir a Miami y tomar el lugar de co-conductor.", successChance: 0.60,
          success: { followers: 40000, reputation: 0, message: "La nota salió genial, tiraste 2 chistazos que hicieron reír al 10. Ahora el Capitán te sigue en Instagram." },
          failure: { followers: -50000, reputation: 0, message: "Tiraste un chiste de Twitter y lo llamaste 'Hormonita'. Granate te fulmina con la mirada, volviste solo a Buenos Aires.", specialOutcome: "forcedTransfer" } },
        { text: "Quedarte en estudios", detail: "No salir del estudio y seguir el evento desde ahí.", successChance: 1.00,
          success: { followers: 5000, reputation: 0, message: "Te quedaste en el estudio reaccionando a la nota. Migue Granate te trae una camiseta firmada por el 10." },
          failure: { followers: 0, reputation: 0, message: "" } },
      ],
    },
    {
      title: "Día homenaje a Pito Faez",
      description: "ALGA organiza un homenaje especial a Pito Faez en el teatro. En pleno show, Migue Granate te pasa el micrófono y te ofrece cantar un tema del artista en vivo.",
      options: [
        { text: "Cantás, total esto es ALGA.", detail: "Tomar el micrófono y cantar en vivo.", successChance: 0.60,
          success: { followers: 10000, reputation: 0, message: "Cantaste afinadamente 'Libélula Multicolor' y la rompiste. El teatro te aplaude." },
          failure: { followers: -5000, reputation: 0, message: "No embocaste una nota, nadie supo cómo remar el mal momento. Te hacés viral... para mal." } },
        { text: "No es lo tuyo.", detail: "Rechazar la invitación a cantar.", successChance: 0.60,
          success: { followers: 0, reputation: 0, message: "El homenaje fue épico igual. Tu negativa fue honesta y te ganaste el respeto del canal." },
          failure: { followers: 0, reputation: 0, message: "Para cerrar el show, todos los del canal suben a cantar mientras vos lo mirás desde abajo. Al otro día no charlan de otra cosa, te sentís dejado de lado." } },
      ],
    },
  ],

  ASS: [
    {
      title: "Clásico Argentino en Vivo",
      description: "ASS cubre el partido más importante del año. Fabio Assado te ofrece un lugar en la transmisión principal.",
      options: [
        { text: "Análisis técnico en tiempo real", detail: "Datos, contexto, profundidad.", successChance: 0.62,
          success: { followers: 10000, reputation: 3, message: "Precisión quirúrgica. Los hinchas te aceptaron como voz autorizada." },
          failure: { followers: -2000, reputation: 1, message: "Errores en los análisis durante momentos clave. Las críticas dolieron." } },
        { text: "Panel de debate post-partido", detail: "El fútbol como disparador.", successChance: 0.55,
          success: { followers: 12000, reputation: 3, message: "Debate encendido. Los clips circularon toda la noche en redes." },
          failure: { followers: -3000, reputation: 0, message: "El debate se descontroló. ASS quedó expuesto negativamente." } },
      ],
    },
    {
      title: "Entrevista Exclusiva con Figura del Fútbol",
      description: "ASS tiene acceso a una de las grandes figuras del fútbol argentino. Fabio Assado te confía la entrevista.",
      options: [
        { text: "Las preguntas que nadie se anima", detail: "Periodismo que incomoda.", successChance: 0.38,
          success: { followers: 23000, reputation: 7, message: "Preguntaste lo que todos querían saber. Entrevista histórica del canal." },
          failure: { followers: -5000, reputation: 0, message: "El jugador se cerró en banda. Un desastre en vivo frente a todos." } },
        { text: "Entrevista cálida y sin presión", detail: "Que el entrevistado se abra solo.", successChance: 0.74,
          success: { followers: 11000, reputation: 3, message: "El jugador se abrió y dijo cosas que nunca había dicho. Oro puro." },
          failure: { followers: 1000, reputation: 1, message: "Correcta pero previsible. Sin momentos propios que la distingan." } },
      ],
    },
    {
      title: "Debate de Fichajes Polémico",
      description: "Una transferencia importante sacude al fútbol argentino. ASS quiere voces fuertes y sin filtro.",
      options: [
        { text: "Opinión contundente y sin filtros", detail: "Decir lo que se piensa.", successChance: 0.44,
          success: { followers: 17000, reputation: 4, message: "Análisis valiente y fundamentado. Trending topic de la noche." },
          failure: { followers: -9000, reputation: 0, message: "Opinión que cayó fatal entre los hinchas más numerosos. Crisis." } },
        { text: "Presentar todos los ángulos", detail: "Ecuanimidad como ventaja.", successChance: 0.72,
          success: { followers: 6000, reputation: 2, message: "Análisis serio y equilibrado. ASS valoró el profesionalismo." },
          failure: { followers: -1000, reputation: 1, message: "Te vieron sin posición propia. Nadie quedó conforme." } },
      ],
    },
    {
      title: "Ciclo de Debate Semanal de Fabio",
      description: "Fabio Assado propone un ciclo semanal y te quiere como panelista fijo. Es un compromiso largo.",
      options: [
        { text: "Ser el conductor, no el panelista", detail: "Tomar las riendas completamente.", successChance: 0.55,
          success: { followers: 14000, reputation: 6, message: "El ciclo se convirtió en referencia del debate futbolístico argentino." },
          failure: { followers: -4000, reputation: 1, message: "El formato no cuajó. Los números no convencieron a Fabio ni al canal." } },
        { text: "Aceptar el rol de panelista destacado", detail: "Menos exposición, menos riesgo.", successChance: 0.74,
          success: { followers: 5000, reputation: 3, message: "Tus intervenciones fueron siempre las más citadas del programa." },
          failure: { followers: -1000, reputation: 2, message: "Buen panelista, pero sin momentos propios que te distingan del resto." } },
      ],
    },
    {
      title: "Cobertura del Mundial Sub-20",
      description: "ASS tiene los derechos. El torneo dura semanas y Fabio Assado quiere que seas la cara de la cobertura.",
      options: [
        { text: "Cobertura total, partido a partido", detail: "La voz del torneo completo.", successChance: 0.55,
          success: { followers: 14000, reputation: 5, message: "Fuiste la voz del torneo. Completo, apasionado, omnipresente." },
          failure: { followers: -2000, reputation: 2, message: "El desgaste se notó. Los últimos partidos fueron de baja calidad." } },
        { text: "Solo los partidos de mayor impacto", detail: "Calidad sobre presencia.", successChance: 0.68,
          success: { followers: 7000, reputation: 3, message: "Cobertura selectiva de alta calidad. El canal quedó más que conforme." },
          failure: { followers: -1000, reputation: 2, message: "Algunos fans sintieron que no estuviste cuando más se te necesitaba." } },
      ],
    },
  ],

  "RUZU TV": [
    {
      title: "Panel de Primeras Citas en Vivo",
      description: "RUZU hace su segmento estrella: comentar primeras citas reales en tiempo real. Nico Bognato te pone al frente.",
      options: [
        { text: "Ser el más irreverente del panel", detail: "Sin autocensura, todo vale.", successChance: 0.52,
          success: { followers: 12000, reputation: 3, message: "Tus comentarios fueron los más citados. El segmento explotó por vos." },
          failure: { followers: -6000, reputation: 0, message: "Pasaste el límite. Las personas en pantalla se ofendieron en vivo." } },
        { text: "El que da los consejos inesperadamente buenos", detail: "Contraste inesperado.", successChance: 0.70,
          success: { followers: 7000, reputation: 2, message: "El contraste entre el caos y tus consejos fue el momento del programa." },
          failure: { followers: -1000, reputation: 0, message: "Los consejos serios no pegaron en un formato tan caótico." } },
      ],
    },
    {
      title: "Desafío de Humor Sin Filtros de Nico",
      description: "Nico Bognato lanza el desafío más famoso de RUZU: el chiste más arriesgado posible. Millones esperando.",
      options: [
        { text: "Ir sin límites, sin autocensura", detail: "Todo o nada.", successChance: 0.40,
          success: { followers: 17000, reputation: 4, message: "El chiste se convirtió en leyenda del canal. Nico te aplaudió de pie." },
          failure: { followers: -10000, reputation: 0, message: "Cruzaste una línea que no se debía cruzar. Crisis mediática." } },
        { text: "Arriesgado pero con criterio propio", detail: "Límite elegido, no impuesto.", successChance: 0.66,
          success: { followers: 9000, reputation: 3, message: "El chiste funcionó y quedaste bien parado. Raro y difícil lograrlo en RUZU." },
          failure: { followers: -3000, reputation: 0, message: "Nico consideró que faltó valentía. La audiencia de RUZU lo notó." } },
      ],
    },
    {
      title: "Cobertura de Actualidad al Estilo RUZU",
      description: "Un tema serio del día, pero RUZU lo quiere con su filtro único: caótico, directo y sin protocolo.",
      options: [
        { text: "Sumarte al caos sin pensar demasiado", detail: "Fluir con el formato.", successChance: 0.56,
          success: { followers: 11000, reputation: 2, message: "Fue lo que RUZU necesitaba. Natural, caótico y muy visto." },
          failure: { followers: -4000, reputation: 0, message: "Sin control ni estructura, el segmento fue un quilombo sin gracia." } },
        { text: "Aportar algo de análisis entre las risas", detail: "Contenido entre el ruido.", successChance: 0.67,
          success: { followers: 7000, reputation: 3, message: "El contraste te diferenció. Te vieron como una voz distinta en RUZU." },
          failure: { followers: -1000, reputation: 0, message: "El análisis serio mató el ritmo del segmento. No encajó." } },
      ],
    },
    {
      title: "Collab Picante con Nico Bognato",
      description: "Nico propone un stream de dos horas solo con vos. El formato explícito: sin temas prohibidos.",
      options: [
        { text: "Aceptar sin condiciones", detail: "Total apertura al formato.", successChance: 0.50,
          success: { followers: 15000, reputation: 4, message: "Dos horas de contenido que el canal jamás olvidará. Histórico para RUZU." },
          failure: { followers: -7000, reputation: 0, message: "El stream se fue a un lugar del que ninguno pudo salir bien parado." } },
        { text: "Establecer un límite claro antes", detail: "Tus reglas en el juego de Nico.", successChance: 0.63,
          success: { followers: 8000, reputation: 2, message: "La tensión entre tus límites y el estilo de Nico fue el mejor contenido." },
          failure: { followers: -2000, reputation: 0, message: "Nico se aburrió rápido. El límite le quitó la gracia al formato." } },
      ],
    },
    {
      title: "Debate Banal que se Pone Serio",
      description: "Empieza como un debate sobre comida o música y termina tocando un nervio real. Nico te da la palabra.",
      options: [
        { text: "Llevarlo al nivel serio sin avergonzarte", detail: "El fondo emerge naturalmente.", successChance: 0.57,
          success: { followers: 10000, reputation: 3, message: "El viraje fue el mejor momento del programa. Nadie lo vio venir." },
          failure: { followers: -3000, reputation: 0, message: "El tono serio mató el humor y el nuevo tema tampoco cuajó." } },
        { text: "Mantenerlo liviano y bajar la tensión", detail: "Humor como herramienta.", successChance: 0.71,
          success: { followers: 6000, reputation: 2, message: "Salvaste el momento. El segmento terminó bien y todos quedaron cómodos." },
          failure: { followers: 0, reputation: 0, message: "Ni un lado ni el otro. El programa terminó sin pena ni gloria." } },
      ],
    },
  ],

  RENDER: [
    {
      type: "automatic",
      title: "Brote de Tuberculosis en el Canal",
      description: "Un brote de tuberculosis en el estudio se expande sin control. Te contagiás. Perdés un mes de programa, tus números tardan en recuperarse y varios invitados que tenías planeados se dan de baja por tu ausencia.",
      consequences: [
        { followers: -500, reputation: -1, message: "Tu salud y la del canal se resienten. El estudio queda en pausa y varios planes se cancelan." },
      ],
    },
    {
      title: "Entrevista a Político Polémico",
      description: "RENDER consiguió al político más debatido del momento. Tomás Report te confía la entrevista.",
      options: [
        { text: "Las preguntas que nadie se anima a hacer", detail: "Periodismo sin concesiones.", successChance: 0.40,
          success: { followers: 21000, reputation: 6, message: "Preguntaste lo que todo el país quería escuchar. Clip millonario." },
          failure: { followers: -8000, reputation: 0, message: "El político se enojó y cortó la entrevista. Escándalo para RENDER." } },
        { text: "Entrevista equilibrada y periodísticamente sólida", detail: "Forma sobre show.", successChance: 0.74,
          success: { followers: 11000, reputation: 4, message: "Entrevista rigurosa. Ganaste credibilidad en el ambiente político." },
          failure: { followers: -2000, reputation: 0, message: "El político manejó la entrevista a su favor. Quedaste por debajo." } },
      ],
    },
    {
      title: "Debate de Actualidad en Vivo",
      description: "Hay una noticia urgente. Tomás Report te manda al aire en diez minutos. Sin tiempo de preparar nada.",
      options: [
        { text: "Improvisar con lo que sabés", detail: "Confiar en el conocimiento acumulado.", successChance: 0.50,
          success: { followers: 13000, reputation: 3, message: "La improvisación fue sólida. Te reconocieron como alguien que sabe." },
          failure: { followers: -5000, reputation: 0, message: "Los errores factuales en vivo destruyeron la credibilidad del segmento." } },
        { text: "Pedir diez minutos para informarte bien", detail: "La preparación como responsabilidad.", successChance: 0.67,
          success: { followers: 8000, reputation: 3, message: "La espera valió la pena. El análisis fue de los mejores del canal." },
          failure: { followers: -2000, reputation: 0, message: "Para cuando saliste, la noticia ya la habían cubierto todos los demás." } },
      ],
    },
    {
      title: "Investigación Periodística Propia",
      description: "Tomás Report te propone llevar una investigación propia al aire. El tema es sensible y el impacto puede ser enorme.",
      options: [
        { text: "Publicar ahora, el tiempo es clave", detail: "El primero en llegar gana.", successChance: 0.38,
          success: { followers: 26000, reputation: 8, message: "La investigación fue el tema del año. RENDER es la fuente de todos." },
          failure: { followers: -12000, reputation: 0, message: "Datos sin verificar. La desmentida fue peor que la nota original." } },
        { text: "Verificar cada dato antes de salir", detail: "La credibilidad se construye despacio.", successChance: 0.76,
          success: { followers: 15000, reputation: 5, message: "Investigación impecable. Nadie pudo impugnar un solo dato." },
          failure: { followers: -1000, reputation: 0, message: "La verificación tardó demasiado. Otro medio publicó primero." } },
      ],
    },
    {
      title: "Cobertura de Crisis Política",
      description: "Estalla una crisis de gobierno. RENDER entra en modo 24/7 y te proponen como cara visible de la cobertura.",
      options: [
        { text: "Estar al aire las 24 horas", detail: "El canal antes que todo.", successChance: 0.47,
          success: { followers: 19000, reputation: 6, message: "Fuiste la referencia de la crisis. El país entero miraba RENDER y a vos." },
          failure: { followers: -4000, reputation: 0, message: "El agotamiento se vio. En hora 18 ya no había análisis, solo errores." } },
        { text: "Coberturas de 4 horas con análisis profundo", detail: "Sostenible y de calidad.", successChance: 0.69,
          success: { followers: 12000, reputation: 4, message: "Cobertura de alta calidad. Te diferenciaste del ruido de los demás medios." },
          failure: { followers: -1000, reputation: 0, message: "La audiencia quería continuidad. Tus ausencias entre bloques los alejaron." } },
      ],
    },
    {
      title: "Tensión en Costra Team",
      description: "En plena transmisión, Quique Quinoa se entera de que va a ser despedido. Explota en el aire: insulta al canal, a los dueños, a todos. Las redes arden. Vos estás ahí al lado.",
      options: [
        { text: "No decís nada, dejas que pase.", detail: "No intervenir y dejar que el descontrol ocurra.", successChance: 0.60,
          success: { followers: 1000, reputation: 0, message: "Echan al conductor y no a vos. RENDER te ve como alguien que sabe mantener la calma." },
          failure: { followers: -1000, reputation: 0, message: "Te tildan de tibio en las redes." } },
        { text: "Metés chistes para aliviar la tensión.", detail: "Intentar distender la situación con humor.", successChance: 0.50,
          success: { followers: 0, reputation: 0, message: "Quique se relaja y termina el programa. El dueño a la salida te felicita por cómo manejaste todo." },
          failure: { followers: 0, reputation: -3, message: "Quique es echado y a vos te bajan el sueldo. 'A ver si con esto se te va lo payaso' dice el dueño." } },
      ],
    },
    {
      title: "Cobertura Mundial",
      description: "Durante el programa en vivo te enterás que el canal mandará a Mosquita Fart para la cobertura del Mundial. A la piba le tirás una pelota y le saca los gajos.",
      options: [
        { text: "Miras a cámara con cara de 'Daaaale'.", detail: "Responder al momento con una cara de complicidad.", successChance: 0.60,
          success: { followers: 1000, reputation: 2, message: "Todos lo leyeron como un chiste. Tu cara se viralizó y el canal, en lugar de enojarse, te subió el sueldo para calmarte." },
          failure: { followers: 6000, reputation: 0, message: "Tenés menos tiempo en pantalla pero la gente te ama." } },
        { text: "Te quejas por redes.", detail: "Expresar el enojo públicamente.", successChance: 0.50,
          success: { followers: 0, reputation: 0, message: "Los fans te aman y tu posteo se hace viral pero los dueños te tienen entre ceja y ceja. El ambiente interno se pone tenso." },
          failure: { followers: 0, reputation: 0, message: "Los dueños no perdonan la queja pública. Te llaman y te dicen que tu contrato no se renueva. Salís a buscar canal.", specialOutcome: "forcedTransfer" } },
      ],
    },
    {
      // SPECIAL EVENT — forced transfer
      title: "⚡ RENDER FUE VENDIDO",
      description: "A mitad de temporada, RENDER anuncia que fue adquirido por un nuevo grupo mediático. Todos los contratos del staff quedan rescindidos de inmediato. No hay apelación posible.",
      options: [
        { text: "Intentar quedarte en el canal reformado", detail: "Quizás el nuevo dueño te renueve.", successChance: 0.05,
          success: { followers: 3000, reputation: 0, message: "El nuevo dueño decidió renovarte por una sola temporada más... rarísimo.", specialOutcome: "forcedTransfer" },
          failure: { followers: -5000, reputation: 0, message: "El nuevo dueño no renovó ningún contrato. Te quedás sin trabajo de un día para el otro.", specialOutcome: "forcedTransfer" } },
        { text: "Agarrar las cosas y salir antes de que te echen", detail: "Salir con dignidad.", successChance: 0.95,
          success: { followers: 1000, reputation: 3, message: "Saliste con dignidad. En el ambiente todos saben lo que pasó y te respetan por eso.", specialOutcome: "forcedTransfer" },
          failure: { followers: -2000, reputation: 0, message: "La salida se hizo pública de mala manera. Igual te fuiste, pero sin la mejor imagen.", specialOutcome: "forcedTransfer" } },
      ],
    },
  ],

  CARANCHO: [
    {
      title: "Propaganda en Horario Central",
      description: "El Gordo Pan quiere que defiendas la posición del gobierno en vivo durante el horario de mayor audiencia. Sin matices.",
      options: [
        { text: "Defender al 100%, sin fisuras", detail: "La línea del canal, completa.", successChance: 0.67,
          success: { followers: 9000, reputation: 5, message: "El Gordo Pan te felicitó en vivo. El canal quedó muy satisfecho." },
          failure: { followers: -5000, reputation: 0, message: "Hubo un momento donde no tenías respuesta. El canal lo notó." } },
        { text: "Matizar el mensaje sutilmente", detail: "Un gramo de honestidad propia.", successChance: 0.38,
          success: { followers: 16000, reputation: 3, message: "El matiz generó debate y paradójicamente aumentó la audiencia." },
          failure: { followers: -8000, reputation: 0, message: "CARANCHO no tolera matices. El Gordo Pan lo tomó como una traición." } },
      ],
    },
    {
      title: "Entrevista a Funcionario Oficialista",
      description: "El Gordo Pan consiguió un ministro. El formato es claro: preguntas amigables, ninguna incomodidad.",
      options: [
        { text: "Seguir el guión del canal al pie de la letra", detail: "La entrevista que el canal quiere.", successChance: 0.72,
          success: { followers: 7000, reputation: 5, message: "El funcionario quedó contento. El canal también. El trabajo, hecho." },
          failure: { followers: -3000, reputation: 0, message: "Incluso siguiendo el guión, algo salió mal. El funcionario se molestó." } },
        { text: "Lanzar una pregunta incómoda de rebote", detail: "Un momento de periodismo real.", successChance: 0.33,
          success: { followers: 19000, reputation: 6, message: "La pregunta incómoda se viralizó. Inesperadamente, incluso CARANCHO la celebró." },
          failure: { followers: -10000, reputation: 0, message: "El Gordo Pan cortó tu micrófono en vivo. Crisis interna sin precedentes." } },
      ],
    },
    {
      title: "Evento de Campaña en Vivo",
      description: "CARANCHO organiza un evento político masivo. El Gordo Pan quiere que seas el streamer estrella de la cobertura.",
      options: [
        { text: "Cobertura con entusiasmo total", detail: "Comprometerte con el evento.", successChance: 0.63,
          success: { followers: 11000, reputation: 5, message: "Tu energía contagió. El evento fue un éxito y vos fuiste parte de eso." },
          failure: { followers: -2000, reputation: 0, message: "El evento tuvo problemas técnicos. Tu cobertura los amplificó." } },
        { text: "Cobertura neutral, sin tomar partido", detail: "El periodismo por sobre la política.", successChance: 0.42,
          success: { followers: 7000, reputation: 2, message: "La neutralidad en CARANCHO fue vista como valentía. Inusual y efectiva." },
          failure: { followers: -9000, reputation: 0, message: "CARANCHO no contrató a alguien neutral. Te dejaron fuera del evento principal." } },
      ],
    },
    {
      title: "Te Piden Atacar a un Canal Rival",
      description: "La dirección del canal te manda un mensaje claro: tenés que ir contra un canal rival en vivo.",
      options: [
        { text: "Hacerlo: seguir la línea del canal", detail: "Prioridad al contrato.", successChance: 0.57,
          success: { followers: 9000, reputation: 4, message: "El ataque fue efectivo según los estándares de CARANCHO. El canal quedó conforme." },
          failure: { followers: -5000, reputation: 0, message: "El canal rival te sacó a pasear. Humillado totalmente." } },
        { text: "Negarte a atacar sin razón", detail: "Tu integridad primero.", successChance: 0.48,
          success: { followers: 13000, reputation: 3, message: "La negativa se viralizó. Paradójicamente, ganaste seguidores fuera de CARANCHO." },
          failure: { followers: -10000, reputation: 0, message: "CARANCHO no negocia la línea editorial. Tu posición dentro del canal peligra." } },
      ],
    },
    {
      title: "El Escándalo: CARANCHO y RENDER, el Mismo Dueño",
      description: "Sale a la luz (de nuevo) que CARANCHO y RENDER tienen el mismo propietario. El escándalo mediático es monumental y te piden que lo manejés.",
      options: [
        { text: "Defender la situación en nombre del canal", detail: "El canal te pide que salgas a aclarar.", successChance: 0.45,
          success: { followers: 6000, reputation: 6, message: "Lograste bajar la temperatura. El canal te lo agradeció con un bono." },
          failure: { followers: -12000, reputation: 0, message: "La defensa fue insostenible. Te convirtieron en el blanco de todas las críticas." } },
        { text: "Salir del tema con humor y esquivar", detail: "No querer saber nada.", successChance: 0.64,
          success: { followers: 7000, reputation: 2, message: "El humor desactivó el momento. El canal respiró aliviado." },
          failure: { followers: -4000, reputation: -5, message: "Las redes te tildan de pelotudo. Peor el remedio que la enfermedad." } },
      ],
    },
  ],

  QUERATINA: [
    {
      title: "Panel Peronista de Alto Voltaje",
      description: "QUERATINA arma un panel con dirigentes, militantes y periodistas del palo. El tema: la interna del movimiento. Pepe Racinclub te pone a moderar.",
      options: [
        { text: "Moderar con mano firme sin tomar partido", detail: "Periodismo por sobre la militancia.", successChance: 0.55,
          success: { followers: 9000, reputation: 3, message: "Panel intenso pero ordenado. Te ganaste el respeto de los distintos sectores del movimiento." },
          failure: { followers: -4000, reputation: 0, message: "Los panelistas te pasaron por encima. Perdiste el control y el canal quedó expuesto." } },
        { text: "Sumarte al debate y tomar posición", detail: "Bancar la línea del canal.", successChance: 0.48,
          success: { followers: 14000, reputation: 4, message: "Tu posición fue clara y contundente. La militancia te adoptó. El panel fue trending." },
          failure: { followers: -7000, reputation: 0, message: "La interna del movimiento te comió. Quedaste en el medio de un fuego cruzado del que no pudiste salir." } },
      ],
    },
    {
      title: "Entrevista a un Referente del Movimiento",
      description: "QUERATINA consiguió a una figura histórica del peronismo. Pepe Racinclub te confía la entrevista. La audiencia del canal la espera hace semanas.",
      options: [
        { text: "Preguntas críticas, periodismo sin concesiones", detail: "La figura lo merece.", successChance: 0.42,
          success: { followers: 19000, reputation: 5, message: "Preguntaste lo que nadie se animaba a preguntar. La entrevista fue histórica para el canal." },
          failure: { followers: -8000, reputation: 0, message: "El referente se cerró y la entrevista murió antes de empezar. QUERATINA no te lo perdonó fácil." } },
        { text: "Entrevista respetuosa y de fondo", detail: "Que el entrevistado se abra solo.", successChance: 0.72,
          success: { followers: 11000, reputation: 3, message: "La figura habló como nunca. Momento emotivo que el canal usó durante semanas." },
          failure: { followers: -2000, reputation: 0, message: "Correcta pero sin momentos propios. La audiencia dice que sos tibio." } },
      ],
    },
    {
      title: "Cobertura del Festival de Cine Nacional",
      description: "QUERATINA cubre el festival de cine argentino más importante del año. Te mandan a vos a la alfombra roja y a las funciones.",
      options: [
        { text: "Análisis cinematográfico serio, película por película", detail: "El cine merece respeto.", successChance: 0.60,
          success: { followers: 8000, reputation: 3, message: "Tu cobertura fue la más completa del festival. El ambiente cinéfilo te empezó a seguir." },
          failure: { followers: -2000, reputation: 0, message: "El análisis fue demasiado técnico para la audiencia habitual del canal. Los números no acompañaron." } },
        { text: "Entrevistas al paso en la alfombra roja", detail: "El espectáculo por sobre el análisis.", successChance: 0.65,
          success: { followers: 12000, reputation: 4, message: "Los clips de las entrevistas circularon en todos lados. Momento espontáneo que hizo quedar bien al canal." },
          failure: { followers: -3000, reputation: 0, message: "Un director conocido te cortó la entrevista en vivo porque no te sabía el nombre. Viral, pero no del bueno." } },
      ],
    },
    {
      title: "Escándalo Político en Vivo",
      description: "Un dirigente cercano al canal protagoniza un escándalo en plena jornada. QUERATINA quiere reacción inmediata al aire.",
      options: [
        { text: "Cubrirlo con datos y contexto, sin apasionamiento", detail: "Periodismo antes que militancia.", successChance: 0.58,
          success: { followers: 10000, reputation: 3, message: "Tu cobertura fue seria y equilibrada. Te diferenciaste del ruido general." },
          failure: { followers: -3000, reputation: 0, message: "El canal esperaba más compromiso con la línea editorial. Quedaste como tibio." } },
        { text: "Opinar fuerte desde la línea del canal", detail: "Bancar la posición sin dudar.", successChance: 0.46,
          success: { followers: 16000, reputation: 4, message: "La posición fue contundente. La audiencia fiel de QUERATINA te aplaudió de pie." },
          failure: { followers: -9000, reputation: 0, message: "El escándalo terminó siendo un fiasco y vos quedaste defendiendo lo indefendible en vivo." } },
      ],
    },
    {
      title: QUERATINA_SONG_TITLE,
      description: "Un seguidor compuso una canción dedicada a una estrella de mar con un culo pronunciado. Sin que nadie lo planificara, el tema te involucra y te hacés viral en TikTok durante toda la semana.",
      options: [
        { text: "Te montás en el viral. Lo compartís, lo bailás, lo hacés tuyo.", detail: "Si ya sos meme, mejor serlo con dignidad.", successChance: 0.58,
          success: { followers: 22000, reputation: 0, message: "El momento fue glorioso. Millones de vistas, apareciste en todos los medios y la canción sonó en un programa de TV. Pepe Racinclub no entendió nada pero festejó igual." },
          failure: { followers: -5000, reputation: 0, message: "El intento de montarte en el viral quedó forzado. Las redes lo sintieron artificial y el chiste se convirtió en otro chiste, pero sobre vos." } },
        { text: "Lo ignorás. QUERATINA es un canal serio.", detail: "La imagen política primero.", successChance: 0.52,
          success: { followers: 3000, reputation: 0, message: "La decisión de no comentarlo fue leída como madurez. El viral pasó solo y tu imagen dentro del canal quedó intacta." },
          failure: { followers: -8000, reputation: 0, message: "Ignorarlo fue un error. Todo el mundo hablaba del tema y tu silencio hizo que parecieras molesto. Las redes te hicieron meme igual, pero sin que pudieras controlar el relato." } },
      ],
    },
  ],

  FUTUPOP: [
    {
      title: "Festival Nacional de Cumbia",
      description: "FUTUPOP cubre el festival de cumbia más convocante del año. La conducción del stream es tuya si la querés.",
      options: [
        { text: "Conducir el evento de principio a fin", detail: "La noche entera en tus manos.", successChance: 0.57,
          success: { followers: 13000, reputation: 5, message: "La noche fue increíble. El ambiente de la cumbia te adoptó como uno de los suyos." },
          failure: { followers: -4000, reputation: 0, message: "El ritmo del festival era mucho para manejarlo solo. La conducción quedó desprolija." } },
        { text: "Hacer entrevistas desde el piso", detail: "Más espontáneo y cercano.", successChance: 0.73,
          success: { followers: 7000, reputation: 3, message: "Las entrevistas espontáneas fueron los mejores clips de la noche." },
          failure: { followers: 800, reputation: 1, message: "El piso estaba muy caótico. Poco de lo que grabaste salió bien." } },
      ],
    },
    {
      title: "Entrevista a Artista Emergente",
      description: "El canal descubrió a una artista nueva que puede ser la próxima grande de la cumbia. La entrevista te la ofrecen a vos.",
      options: [
        { text: "Entrevista profunda, emotiva, sin apuro", detail: "Dejar que la historia se cuente sola.", successChance: 0.67,
          success: { followers: 9000, reputation: 3, message: "La artista lloró en cámara. El clip circuló en todos lados. Momento real." },
          failure: { followers: -2000, reputation: 0, message: "La artista se cerró. No lograste que se abriera en ningún momento." } },
        { text: "Liviano, divertido, con mucha energía", detail: "El tono del canal, respetado.", successChance: 0.71,
          success: { followers: 6000, reputation: 2, message: "La artista se fue sonriendo y el canal quedó contento. Trabajo limpio." },
          failure: { followers: -1000, reputation: 0, message: "El tono liviano no conectó con la artista. La entrevista no tuvo chispa." } },
      ],
    },
    {
      title: "Debate: ¿La Cumbia Llegó a la Alta Cultura?",
      description: "FUTUPOP organiza un debate que nadie esperaba: ¿la cumbia merece ser tomada en serio culturalmente?",
      options: [
        { text: "Defender la cumbia con todo lo que tenés", detail: "El género como expresión legítima.", successChance: 0.62,
          success: { followers: 11000, reputation: 2, message: "Tu defensa fue apasionada y argumentada. La audiencia te aplaudió de pie." },
          failure: { followers: -3000, reputation: 0, message: "Los argumentos no convencieron y quedaste como alguien sin criterio." } },
        { text: "Análisis más equilibrado con contexto histórico", detail: "El conocimiento como diferencial.", successChance: 0.57,
          success: { followers: 7000, reputation: 3, message: "Sorprendiste con datos y contexto. Nadie esperaba ese nivel de análisis acá." },
          failure: { followers: -4000, reputation: 0, message: "El análisis serio no pegó en un canal que vive del estilo de FUTUPOP." } },
      ],
    },
    {
      title: "Lanzamiento de Álbum en Exclusiva",
      description: "Un artista importante lanza su álbum y el canal tiene la exclusiva. Vos sos el presentador del evento.",
      options: [
        { text: "Improvisación total, al ritmo del artista", detail: "Fluir con la energía del momento.", successChance: 0.56,
          success: { followers: 12000, reputation: 4, message: "La energía del evento se transmitió a través de la pantalla. Magia en vivo." },
          failure: { followers: -5000, reputation: 0, message: "La improvisación generó momentos incómodos que el artista no olvidó." } },
        { text: "Presentación cuidada con datos y contexto", detail: "Darle peso al lanzamiento.", successChance: 0.70,
          success: { followers: 7000, reputation: 3, message: "El artista quedó impresionado. El lanzamiento tuvo la seriedad que merecía." },
          failure: { followers: -1000, reputation: 1, message: "Demasiado formal para el espíritu del canal. La audiencia prefería el estilo de FUTUPOP." } },
      ],
    },
    {
      title: "Escándalo en el Ambiente Cumbiero",
      description: "Dos artistas del género tienen una pelea pública y explosiva. FUTUPOP te manda a cubrir el drama.",
      options: [
        { text: "Cubrir el drama sin filtros ni moderación", detail: "El estilo puro y sin vergüenza.", successChance: 0.54,
          success: { followers: 15000, reputation: 3, message: "El drama fue masivo y vos estuviste en el centro de todo. Pico de audiencia." },
          failure: { followers: -6000, reputation: 0, message: "Los dos artistas se enojaron con el canal. Crisis con los dos lados." } },
        { text: "Nota equilibrada con los dos lados de la historia", detail: "Periodismo del estilo de FUTUPOP.", successChance: 0.68,
          success: { followers: 8000, reputation: 2, message: "Tu equilibrio contrastó con el caos y te diferenciaste. Inesperado en FUTUPOP." },
          failure: { followers: -2000, reputation: 0, message: "La audiencia del canal quería drama puro. El equilibrio los aburrió." } },
      ],
    },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const FAJENSE_DE_MANOS_RIVALS = [
  "PuerroXeneize",
  "Gosku",
  "Falito",
  "Mumu",
  "ShinjiBostero",
  "Esprin",
  "Juan Tuffo",
  "La Paga",
  "Rulomgod",
  "Chupa Ramirez",
  "HagovCascote",
];

function pickRandomFajenseRival(usedRivals: string[]) {
  const available = FAJENSE_DE_MANOS_RIVALS.filter((r) => !usedRivals.includes(r));
  const pool = available.length ? available : FAJENSE_DE_MANOS_RIVALS;
  const rival = pool[Math.floor(Math.random() * pool.length)];
  return {
    rival,
    usedRivals: available.length ? [...usedRivals, rival] : [rival],
  };
}

function substituteEventPlaceholders(ev: GameEvent, vars: Record<string, string>): GameEvent {
  const replace = (value: string) => value.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`);
  return {
    ...ev,
    title: replace(ev.title),
    description: replace(ev.description),
    options: (ev.options ?? []).map((opt) => ({
      ...opt,
      text: replace(opt.text),
      detail: replace(opt.detail),
      success: { ...opt.success, message: replace(opt.success.message) },
      failure: { ...opt.failure, message: replace(opt.failure.message) },
    })),
    consequences: (ev.consequences ?? []).map((delta) => ({
      ...delta,
      message: replace(delta.message),
    })),
  };
}

function applyEventVariables(events: GameEvent[], usedRivals: string[]) {
  let nextUsed = [...usedRivals];
  const resolved = events.map((ev) => {
    if (!ev.title.includes("{RIVAL}") && !ev.description.includes("{RIVAL}")) return ev;
    const { rival, usedRivals: updated } = pickRandomFajenseRival(nextUsed);
    nextUsed = updated;
    return substituteEventPlaceholders(ev, { RIVAL: rival });
  });
  return { events: resolved, usedRivals: nextUsed };
}

const RENDER_SOLD_TITLE = "⚡ RENDER FUE VENDIDO";

function buildEventKey(channel: Channel, event: GameEvent) {
  return `${channel}::${event.title}::${event.description}`;
}

function pickEvents(channel: Channel, count: number, renderSold = false, usedEventKeys: string[] = []): GameEvent[] {
  const docPool = (DOC_EVENTS[channel] ?? []).filter(
    (ev) => !(renderSold && ev.title === RENDER_SOLD_TITLE)
  );
  const basePool = (EVENTS[channel] ?? []).filter(
    (ev) => !(renderSold && ev.title === RENDER_SOLD_TITLE)
  );
  const pool = [...docPool, ...basePool].filter((ev) => {
    if (ev.appearance !== "UNA_VEZ") return true;
    return !usedEventKeys.includes(buildEventKey(channel, ev));
  });
  const forcedLastEvent = pool.find((ev) => ev.forceAsLast);
  if (!forcedLastEvent) {
    return shuffle(pool).slice(0, count);
  }

  const selectable = pool.filter((ev) => ev !== forcedLastEvent);
  const selected = shuffle(selectable).slice(0, Math.max(0, count - 1));
  return [...selected, forcedLastEvent];
}

function pickWeightedChannels(channels: Channel[], profile: StreamerProfile | null, count: number): Channel[] {
  const pool = [...channels];
  const picked: Channel[] = [];
  while (pool.length && picked.length < count) {
    const weights = pool.map((channel) => getAffinityOfferWeight(profile ? getChannelAffinity(channel, profile.streamerType, profile.personality).score : 0));
    let cursor = Math.random() * weights.reduce((total, weight) => total + weight, 0);
    const index = weights.findIndex((weight) => (cursor -= weight) <= 0);
    picked.push(pool.splice(index < 0 ? pool.length - 1 : index, 1)[0]);
  }
  return picked;
}

function buildOffers(current: Channel, isFirst: boolean, profile: StreamerProfile | null, renderSold = false, excludedChannels: Channel[] = []): Channel[] {
  const availableChannels = ALL_CHANNELS.filter((channel) => !(renderSold && channel === "RENDER") && !excludedChannels.includes(channel));
  if (isFirst) return pickWeightedChannels(availableChannels, profile, 4);
  return [current, ...pickWeightedChannels(availableChannels.filter((channel) => channel !== current), profile, 3)]
    .filter((channel) => availableChannels.includes(channel));
}

function getFinalRating(followers: number) {
  const score = followers / 1000;
  if (score >= 350) return { label: "Figura Histórica", color: "#f59e0b", emoji: "🏆" };
  if (score >= 230) return { label: "Gran Carrera",      color: "#a78bfa", emoji: "🌟" };
  if (score >= 140) return { label: "Buena Carrera",     color: "#4ade80", emoji: "👏" };
  if (score >= 70)  return { label: "Carrera Discreta",  color: "#38bdf8", emoji: "🙂" };
  return               { label: "Carrera Olvidable",  color: "#6b7280", emoji: "😶" };
}

function fmt(n: number): string {
  const v = Math.abs(n);
  if (v >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}


// ─── Initial State ────────────────────────────────────────────────────────────

const INIT: GameState = {
  phase: "intro",
  streamerName: "",
  streamerProfile: null,
  season: 1,
  eventIndex: 0,
  currentChannel: "ORTERIX",
  followers: 5200,
  reputation: 50,
  careerHistory: [],
  currentEvents: [],
  lastResult: null,
  seasonAccum: { followers: 0 },
  seasonRepercussionFollowers: null,
  seasonRepercussionAwardedFor: null,
  isFirstMarket: true,
  renderSold: false,
  usedFajenseRivals: [],
  usedEventKeys: [],
  excludedChannels: [],
  isVerified: false,
  pendingVerificationUnlock: false,
  awardedAutomaticPrizes: [],
  pendingPrizeUnlocks: [],
  awardsSeasonBoard: [],
  awardsSeasonRevealed: [],
  awardsSeasonCompleted: false,
  awardsSeasonEndedByEmpty: false,
  recentPerformance: 50,
  contractPerformanceTotal: 0,
  contractPerformancePeriods: 0,
  currentChannelAffinity: 0,
};

// ─── UI Primitives ────────────────────────────────────────────────────────────

function Delta({ v, suffix = "" }: { v: number; suffix?: string }) {
  if (v === 0) return <span className="font-mono" style={{ color: "#4b5563", fontSize: "1.05rem", fontWeight: 700 }}>—</span>;
  return (
    <span className="font-mono" style={{ color: v > 0 ? "#4ade80" : "#f87171", fontSize: "1.05rem", fontWeight: 700 }}>
      {v > 0 ? "+" : ""}{fmt(v)}{suffix}
    </span>
  );
}

// ─── Screens ──────────────────────────────────────────────────────────────────

function ScreenIntro({ onNext }: { onNext: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 65%)" }} />
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: "linear-gradient(#7c3aed 1px, transparent 1px), linear-gradient(90deg, #7c3aed 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-md w-full text-center flex flex-col items-center gap-8 relative z-10">
        <div>
          <p className="font-mono text-xs tracking-[0.35em] mb-3" style={{ color: "#7070a0" }}>STREAMING ARGENTINO · MODO CARRERA</p>
          <h1 className="font-black leading-none tracking-widest"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(4rem, 14vw, 7rem)",
              background: "linear-gradient(135deg, #eaeaff 0%, #a78bfa 50%, #7c3aed 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            STREAMERO
          </h1>
          <div className="h-px w-24 mx-auto mt-3"
            style={{ background: "linear-gradient(90deg, transparent, #7c3aed, transparent)" }} />
        </div>

        <div className="text-left space-y-3.5 text-sm leading-relaxed" style={{ color: "#9090c0" }}>
           <p>Durante años transmitiste desde tu casa por simple diversión.</p>
          <p>Con el tiempo empezaste a formar una pequeña comunidad. No eras el streamer más grande, pero quienes te seguían siempre estaban ahí.</p>
          <p>Un par de clips comenzaron a circular y tu nombre empezó a sonar.</p>
          <p className="font-semibold" style={{ color: "#c4c4e8" }}>Ese crecimiento llamó la atención de varios canales de streaming.</p>
          <p className="font-bold text-base" style={{ color: "#eaeaff" }}>Hoy recibiste tus primeras propuestas.</p>
          <p className="font-bold" style={{ color: "#a78bfa" }}>Tu carrera profesional está a punto de comenzar.</p>
        </div>

        <motion.button onClick={onNext} whileHover={{ scale: 1.04, boxShadow: "0 0 40px rgba(124,58,237,0.6)" }} whileTap={{ scale: 0.97 }}
          className="w-full py-4 rounded-xl font-black text-lg tracking-widest uppercase text-white"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", background: "linear-gradient(135deg, #7c3aed, #a855f7)", boxShadow: "0 0 28px rgba(124,58,237,0.45)" }}>
          Comenzar Carrera →
        </motion.button>
      </motion.div>
    </div>
  );
}

function PixelAvatarPlaceholder({ variant }: { variant: AvatarChoice }) {
  // Estos patrones son marcadores temporales dibujados como una cuadrícula de píxeles.
  // Cuando estén disponibles los avatares definitivos, este componente se puede reemplazar
  // por una etiqueta <img> sin modificar la selección ni los datos guardados en la partida.
  const patterns: Record<AvatarChoice, string[]> = {
    "avatar-a": [
      "....BBBB....",
      "...BBBBBB...",
      "...BSSSSB...",
      "...SSSSSS...",
      "...S.SS.S...",
      "...SSSSSS...",
      "....SSSS....",
      "...RRRRRR...",
      "..RRRRRRRR..",
      "..RRRRRRRR..",
    ],
    "avatar-b": [
      "....PPPP....",
      "...PPPPPP...",
      "...PSSSSP...",
      "..PPSSSSPP..",
      "..P.SSSS.P..",
      "..PSSSSSSP..",
      "...PSSSSP...",
      "...CCCCCC...",
      "..CCCCCCCC..",
      "..CCCCCCCC..",
    ],
  };
  const colors: Record<string, string> = {
    B: "#38bdf8",
    P: "#f472b6",
    S: "#f1b98a",
    R: "#7c3aed",
    C: "#db2777",
  };

  return (
    <div
      aria-hidden="true"
      className="grid h-28 w-32 overflow-hidden rounded-xl p-3"
      style={{
        gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
        gridTemplateRows: "repeat(10, minmax(0, 1fr))",
        background: "linear-gradient(145deg, rgba(124,58,237,0.18), rgba(7,7,14,0.8))",
        imageRendering: "pixelated",
      }}
    >
      {patterns[variant].flatMap((row, rowIndex) =>
        row.split("").map((token, columnIndex) => (
          <span
            key={`${rowIndex}-${columnIndex}`}
            style={{ background: colors[token] ?? "transparent" }}
          />
        )),
      )}
    </div>
  );
}

function ScreenNaming({ onConfirm }: { onConfirm: (name: string, profile: StreamerProfile) => void }) {
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<AvatarChoice | null>(null);
  const [streamerType, setStreamerType] = useState<StreamerType | null>(null);
  const [personality, setPersonality] = useState<Personality | null>(null);

  const isComplete = Boolean(name.trim() && avatar && streamerType && personality);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isComplete || !avatar || !streamerType || !personality) return;
    onConfirm(name.trim(), {
      streamerType,
      personality,
      avatar,
    });
  };

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:py-12 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/3 h-[620px] w-[900px] -translate-x-1/2 rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.13) 0%, transparent 68%)" }} />
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: "linear-gradient(#7c3aed 1px, transparent 1px), linear-gradient(90deg, #7c3aed 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
      </div>

      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-6"
      >
        <header className="text-center sm:text-left">
          <p className="mb-2 font-mono text-xs tracking-[0.3em]" style={{ color: "#a78bfa" }}>CREÁ TU PERFIL</p>
          <h2 className="font-black leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(2.6rem, 7vw, 4.5rem)" }}>
            ¿QUIÉN SOS EN STREAM?
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed" style={{ color: "#8080a8" }}>
            Estos datos van a definir tu perfil de jugador y quedarán guardados durante toda la carrera.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-2xl p-5 sm:p-6"
            style={{ background: "rgba(15,15,30,0.86)", border: "1px solid rgba(124,58,237,0.28)", boxShadow: "0 18px 60px rgba(0,0,0,0.28)" }}>
            <p className="mb-5 font-mono text-xs tracking-[0.24em]" style={{ color: "#a78bfa" }}>IDENTIDAD</p>

            <div className="space-y-5">
              <div>
                <label htmlFor="streamer-name" className="mb-2 block font-mono text-xs uppercase tracking-[0.16em]" style={{ color: "#a0a0d0" }}>Nombre</label>
                <input
                  id="streamer-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoFocus
                  maxLength={24}
                  placeholder="Tu nombre de streamer"
                  className="w-full rounded-xl px-4 py-3.5 font-bold outline-none transition-all duration-200"
                  style={{ background: "#0a0a16", border: name.trim() ? "1px solid #7c3aed" : "1px solid rgba(255,255,255,0.08)", color: "#eaeaff" }}
                />
              </div>

              <div>
                <p className="mb-3 font-mono text-xs uppercase tracking-[0.16em]" style={{ color: "#a0a0d0" }}>Elegí tu avatar</p>
                <RadioGroup
                  value={avatar ?? ""}
                  onValueChange={(value) => setAvatar(value as AvatarChoice)}
                  className="grid grid-cols-2 gap-3"
                  aria-label="Elegí una apariencia para tu streamer"
                >
                  {(["avatar-a", "avatar-b"] as AvatarChoice[]).map((choice) => (
                    <label key={choice} htmlFor={choice} className="cursor-pointer">
                      <RadioGroupItem id={choice} value={choice} className="peer sr-only" />
                      <div className="flex min-h-40 items-center justify-center rounded-2xl p-3 transition-all duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-purple-400 peer-data-[state=checked]:border-purple-400"
                        style={{ background: "rgba(7,7,14,0.56)", border: avatar === choice ? "2px solid #c084fc" : "1px solid rgba(255,255,255,0.08)", boxShadow: avatar === choice ? "0 0 24px rgba(192,132,252,0.22)" : "none" }}>
                        <PixelAvatarPlaceholder variant={choice} />
                      </div>
                    </label>
                  ))}
                </RadioGroup>
              </div>
            </div>
          </section>

          <section className="rounded-2xl p-5 sm:p-6"
            style={{ background: "rgba(15,15,30,0.86)", border: "1px solid rgba(124,58,237,0.28)", boxShadow: "0 18px 60px rgba(0,0,0,0.28)" }}>
            <p className="mb-5 font-mono text-xs tracking-[0.24em]" style={{ color: "#a78bfa" }}>PERFIL DE STREAMER</p>

            <div className="space-y-5">
              <div>
                <p className="mb-3 font-mono text-xs uppercase tracking-[0.16em]" style={{ color: "#a0a0d0" }}>Tipo de streamer</p>
                <RadioGroup
                  value={streamerType ?? ""}
                  onValueChange={(value) => setStreamerType(value as StreamerType)}
                  className="grid gap-2 sm:grid-cols-6"
                  aria-label="Tipo de streamer"
                >
                  {(["Reacción", "Gamer", "Política", "Comediante", "Deportes"] as StreamerType[]).map((type, index) => {
                    const id = `streamer-type-${type.replace(/\s/g, "-").toLowerCase()}`;
                    return (
                      <label key={type} htmlFor={id} className={`cursor-pointer ${index < 3 ? "sm:col-span-2" : "sm:col-span-3"}`}>
                        <RadioGroupItem id={id} value={type} className="peer sr-only" />
                        <div className="rounded-xl px-3 py-3 text-center text-sm font-semibold transition-all duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-purple-400"
                          style={{ background: streamerType === type ? "rgba(124,58,237,0.24)" : "rgba(7,7,14,0.56)", border: streamerType === type ? "1px solid #a78bfa" : "1px solid rgba(255,255,255,0.08)", color: streamerType === type ? "#e9d5ff" : "#8585ad" }}>
                          {type}
                        </div>
                      </label>
                    );
                  })}
                </RadioGroup>
              </div>

              <div>
                <p className="font-mono text-xs uppercase tracking-[0.16em]" style={{ color: "#a0a0d0" }}>Personalidad</p>
                <p className="mt-2 text-sm" style={{ color: "#9090bc" }}>¿Cómo sos al aire?</p>
                <RadioGroup
                  value={personality ?? ""}
                  onValueChange={(value) => setPersonality(value as Personality)}
                  className="mt-3 grid grid-cols-2 gap-2"
                  aria-label="Personalidad al aire"
                >
                  {(Object.keys(PERSONALITIES) as Personality[]).map((id) => {
                    const option = PERSONALITIES[id];
                    return (
                      <label key={id} htmlFor={`personality-${id}`} className="cursor-pointer">
                        <RadioGroupItem id={`personality-${id}`} value={id} className="peer sr-only" />
                        <div className="rounded-xl px-3 py-3 text-center text-sm font-semibold transition-all duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-purple-400"
                          style={{ background: personality === id ? "rgba(124,58,237,0.24)" : "rgba(7,7,14,0.56)", border: personality === id ? "1px solid #a78bfa" : "1px solid rgba(255,255,255,0.08)", color: personality === id ? "#e9d5ff" : "#b5b5cc" }}>
                          <span className="mr-1.5">{option.emoji}</span>{option.label}
                        </div>
                      </label>
                    );
                  })}
                </RadioGroup>
              </div>
            </div>
          </section>
        </div>

        <motion.button
          type="submit"
          disabled={!isComplete}
          whileHover={isComplete ? { scale: 1.015, boxShadow: "0 0 36px rgba(124,58,237,0.48)" } : {}}
          whileTap={isComplete ? { scale: 0.985 } : {}}
          className="w-full rounded-xl py-4 font-black uppercase tracking-[0.16em] transition-all duration-200 disabled:cursor-not-allowed"
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            background: isComplete ? "linear-gradient(135deg, #7c3aed, #a855f7)" : "#181830",
            color: isComplete ? "#ffffff" : "#505070",
            boxShadow: isComplete ? "0 0 24px rgba(124,58,237,0.34)" : "none",
          }}
        >
          Crear perfil y continuar →
        </motion.button>
      </motion.form>
    </div>
  );
}

function ContractPips({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex gap-1" aria-label={`${value} de 5`}>
      {Array.from({ length: 5 }, (_, index) => (
        <span
          key={index}
          className="h-3 flex-1 rounded-[3px]"
          style={{
            background: index < value ? color : "rgba(255,255,255,0.08)",
            boxShadow: index < value ? `0 0 8px ${color}55` : "none",
          }}
        />
      ))}
    </div>
  );
}

function PrizeUnlockVisual({ prize }: { prize: AwardedPrize }) {
  const source = getPrizeAssetSrc(prize.icon);

  if (source) {
    return <img src={source} alt={prize.name} className="h-48 w-72 object-contain sm:h-56 sm:w-80" />;
  }

  return <PrizeIcon prize={prize} className="h-48 w-72 sm:h-56 sm:w-80" />;
}

function getPrizeCelebrationMessage(prize: AwardedPrize): string {
  const definition = DOC_PREMIOS.find((entry) => entry.id === prize.id);
  if (definition?.type === "AUTOMATICO" && definition.followersRequirement !== undefined) {
    return `¡Llegaste a los ${new Intl.NumberFormat("es-AR").format(definition.followersRequirement)} seguidores!`;
  }
  return `¡Ganaste ${prize.name}!`;
}

interface UnlockModalContent {
  visual: React.ReactNode;
  headline: string;
  detail: string;
}

function PrizeUnlockModal({ content, onContinue }: { content: UnlockModalContent; onContinue: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#03040c]/80 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="prize-unlock-title"
    >
      <motion.section
        initial={{ opacity: 0, y: 24, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.96 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="relative w-full max-w-md overflow-hidden rounded-3xl p-6 text-center sm:p-8"
        style={{ background: "radial-gradient(circle at 50% 5%, rgba(192,132,252,0.28), transparent 42%), linear-gradient(160deg, #17142b, #080a17 64%)", border: "1px solid rgba(192,132,252,0.52)", boxShadow: "0 0 60px rgba(124,58,237,0.36)" }}
      >
        {["12%", "28%", "72%", "87%", "48%"].map((left, index) => (
          <motion.span
            key={left}
            aria-hidden="true"
            className="absolute top-4 h-1.5 w-1.5 rounded-full"
            style={{ left, background: index % 2 ? "#22d3ee" : "#fbbf24", boxShadow: "0 0 10px currentColor" }}
            animate={{ y: [0, 10, 0], opacity: [0.35, 1, 0.35] }}
            transition={{ duration: 2.2 + index * 0.16, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}

        <p id="prize-unlock-title" className="relative font-mono text-sm font-bold uppercase tracking-[0.24em]" style={{ color: "#e9d5ff" }}>
          ¡Felicidades!
        </p>
        <motion.div
          className="relative mx-auto mt-6 w-fit"
          initial={{ opacity: 0, scale: 0.72, rotate: -4 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ delay: 0.18, type: "spring", stiffness: 230, damping: 15 }}
        >
          {content.visual}
        </motion.div>
        <h2 className="relative mt-6 font-black uppercase leading-none text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(2rem, 7vw, 3rem)" }}>
          {content.headline}
        </h2>
        <p className="relative mt-3 text-sm" style={{ color: "#acaec6" }}>{content.detail}</p>
        <motion.button
          type="button"
          onClick={onContinue}
          whileHover={{ scale: 1.025 }}
          whileTap={{ scale: 0.98 }}
          className="relative mt-7 w-full rounded-xl py-3.5 font-black uppercase tracking-[0.15em]"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.2rem", background: "linear-gradient(135deg, #7c3aed, #a855f7)", color: "#fff", boxShadow: "0 0 22px rgba(124,58,237,0.42)" }}
        >
          Continuar →
        </motion.button>
      </motion.section>
    </motion.div>
  );
}

function getPrizeUnlockContent(prize: AwardedPrize): UnlockModalContent {
  return {
    visual: <PrizeUnlockVisual prize={prize} />,
    headline: getPrizeCelebrationMessage(prize),
    detail: `${prize.name} desbloqueada · x${prize.count}`,
  };
}

const VERIFIED_UNLOCK_CONTENT: UnlockModalContent = {
  visual: <img src={verifiedLogo} alt="Verificado" className="h-48 w-72 object-contain sm:h-56 sm:w-80" />,
  headline: "CONSEGUISTE EL VERIFICADO",
  detail: "Tu cuenta ahora está verificada permanentemente.",
};

function AwardsSeasonResultModal({ prizes, onContinue }: { prizes: GamePrize[]; onContinue: () => void }) {
  const hasPrizes = prizes.length > 0;
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#03040c]/80 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="awards-season-result-title"
    >
      <motion.section
        initial={{ opacity: 0, y: 24, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.96 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="w-full max-w-md overflow-hidden rounded-3xl p-6 text-center sm:p-8"
        style={{ background: "radial-gradient(circle at 50% 5%, rgba(251,191,36,0.2), transparent 42%), linear-gradient(160deg, #17142b, #080a17 64%)", border: "1px solid rgba(251,191,36,0.48)", boxShadow: "0 0 60px rgba(245,158,11,0.3)" }}
      >
        <Award className="mx-auto" size={54} style={{ color: "#fbbf24" }} />
        <p className="mt-6 font-mono text-xs font-bold uppercase tracking-[0.22em]" style={{ color: "#fde68a" }}>Temporada de premios</p>
        <h2 id="awards-season-result-title" className="mt-4 font-black uppercase leading-none text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(2.2rem, 7vw, 3.4rem)" }}>
          {hasPrizes ? "Premios obtenidos" : "No ganaste ningún premio"}
        </h2>
        {hasPrizes ? (
          <div className="mt-6 space-y-2 text-left">
            {prizes.map((prize) => (
              <div key={prize.id} className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)" }}>
                {getPrizeAssetSrc(prize.icon) ? <img src={getPrizeAssetSrc(prize.icon)} alt="" className="h-9 w-9 object-contain" /> : <Award size={28} style={{ color: "#fbbf24" }} />}
                <span className="font-semibold text-white">{prize.name}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-5 text-base leading-7" style={{ color: "#c9c9d7" }}>El primer panel estaba vacío. Esta vez la vitrina queda igual.</p>
        )}
        <motion.button
          type="button"
          onClick={onContinue}
          whileHover={{ scale: 1.025 }}
          whileTap={{ scale: 0.98 }}
          className="mt-7 w-full rounded-xl py-3.5 font-black uppercase tracking-[0.15em]"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.2rem", background: "linear-gradient(135deg, #7c3aed, #a855f7)", color: "#fff", boxShadow: "0 0 22px rgba(124,58,237,0.42)" }}
        >
          Ir al Mercado de Pases →
        </motion.button>
      </motion.section>
    </motion.div>
  );
}

function PrizeIcon({ prize, className = "h-7 w-7" }: { prize: AwardedPrize; className?: string }) {
  const source = getPrizeAssetSrc(prize.icon);

  if (source) {
    return <img src={source} alt={prize.name} className={`${className} shrink-0 object-contain`} title={prize.name} />;
  }

  return (
    <span
      aria-label={prize.name}
      title={`${prize.name} (imagen pendiente)`}
      className={`${className} shrink-0 rounded-md`}
      style={{ background: "linear-gradient(145deg, rgba(251,191,36,0.36), rgba(124,58,237,0.42))", border: "1px solid rgba(255,255,255,0.32)", boxShadow: "inset 0 0 8px rgba(255,255,255,0.18)" }}
    />
  );
}

function StreamerName({ name, isVerified }: { name: string; isVerified: boolean }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5">
      <span className="truncate">{name}</span>
      {isVerified && <img src={verifiedLogo} alt="Verificado" title="Cuenta verificada" className="h-5 w-5 shrink-0 object-contain" />}
    </span>
  );
}

function CareerSidebar({ gs }: { gs: GameState }) {
  const profile = gs.streamerProfile;
  const streamerTypeColor = profile?.streamerType === "Gamer"
    ? "#38bdf8"
    : profile?.streamerType === "Política"
      ? "#fb2c68"
      : "#c084fc";

  return (
    <aside className="rounded-[22px] p-4 lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:overflow-y-auto"
      style={{ background: "linear-gradient(180deg, rgba(8,10,23,0.98), rgba(5,8,18,0.96))", border: "1px solid rgba(124,58,237,0.24)", boxShadow: "inset -1px 0 rgba(255,255,255,0.02)" }}>
      <h1 className="px-2 py-2 font-black italic tracking-wider"
        style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "2rem", color: "#ffffff", textShadow: "0 0 14px #7c3aed, 0 0 28px #7c3aed" }}>
        STREAMERO
      </h1>

      <div className="mt-1 rounded-2xl p-3 text-center" style={{ border: "1px solid rgba(167,139,250,0.24)", background: "rgba(9,11,26,0.82)" }}>
        <div className="mx-auto flex w-fit items-center justify-center rounded-2xl p-1"
          style={{ border: "1px solid #ec4899", boxShadow: "0 0 16px rgba(236,72,153,0.26)" }}>
          <PixelAvatarPlaceholder variant={profile?.avatar ?? "avatar-a"} />
        </div>
        <p className="mt-2 truncate text-2xl font-semibold text-white"><StreamerName name={gs.streamerName} isVerified={gs.isVerified} /></p>

        <div className="mt-3 grid grid-cols-2 gap-2 border-t pt-3" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-2 rounded-xl px-2 py-2 text-left" style={{ background: "rgba(124,58,237,0.08)" }}>
            <Users size={25} style={{ color: "#a78bfa" }} />
            <div>
              <p className="font-mono text-2xl font-black leading-none text-white">{fmt(gs.followers)}</p>
              <p className="mt-1 text-xs" style={{ color: "#aaaac5" }}>Seguidores</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl px-2 py-2 text-left" style={{ background: "rgba(245,158,11,0.07)" }}>
            <Award size={25} style={{ color: "#f59e0b" }} />
            <div>
              <p className="font-mono text-2xl font-black leading-none text-white">{gs.reputation}%</p>
              <p className="mt-1 text-xs" style={{ color: "#aaaac5" }}>Popularidad</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 overflow-hidden rounded-2xl" style={{ border: "1px solid rgba(124,58,237,0.2)", background: "rgba(9,11,26,0.82)" }}>
        <p className="px-4 py-3 font-mono text-sm uppercase tracking-[0.14em]" style={{ color: "#c084fc", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          Perfil de jugador
        </p>
        <div className="divide-y text-sm" style={{ color: "#e2e2f0" }}>
          <div className="flex items-center justify-between gap-3 px-4 py-3" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            <span style={{ color: "#77779c" }}>Tipo de streamer</span>
            <strong className="text-right" style={{ color: streamerTypeColor }}>{profile?.streamerType ?? "—"}</strong>
          </div>
          <div className="flex items-center justify-between gap-3 px-4 py-3" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            <span style={{ color: "#77779c" }}>Personalidad</span>
            <strong className="text-right" style={{ color: "#c084fc" }}>
              {profile ? `${PERSONALITIES[profile.personality].emoji} ${PERSONALITIES[profile.personality].label}` : "—"}
            </strong>
          </div>
        </div>
      </div>

      <div className="mt-3 overflow-hidden rounded-2xl" style={{ border: "1px solid rgba(124,58,237,0.2)", background: "rgba(9,11,26,0.82)" }}>
        <p className="px-4 py-3 font-mono text-sm uppercase tracking-[0.14em]" style={{ color: "#c084fc", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          Vitrina de premios
        </p>
        {gs.awardedAutomaticPrizes.length === 0 ? (
          <div className="flex min-h-16 items-center justify-center p-3 text-center">
            <p className="text-sm leading-6" style={{ color: "#777797" }}>Todavía no ganaste ningún premio.</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3 p-4">
            {gs.awardedAutomaticPrizes.map((prize) => (
              <div key={prize.id} className="flex min-w-0 items-center gap-2" title={prize.name}>
                <PrizeIcon prize={prize} className="h-10 w-10" />
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-white">{prize.name}</p>
                  <p className="font-mono text-xs" style={{ color: "#c084fc" }}>x{prize.count}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

function CareerScreenFrame({
  gs,
  progressCurrent,
  progressTotal,
  progressLabel,
  accent = "#a855f7",
  children,
}: {
  gs: GameState;
  progressCurrent: number;
  progressTotal: number;
  progressLabel: string;
  accent?: string;
  children: React.ReactNode;
}) {
  // Este marco concentra el lateral, el fondo, los bordes y el indicador superior que
  // comparten las pantallas de carrera. Mantenerlos en un único componente evita que
  // resultados, mercados y resúmenes vuelvan a separarse visualmente con el tiempo.
  return (
    <div className="min-h-screen p-2 sm:p-3" style={{ background: "#02040c" }}>
      <div className="mx-auto grid max-w-[1600px] gap-2 lg:grid-cols-[260px_minmax(0,1fr)]">
        <CareerSidebar gs={gs} />
        <main className="overflow-hidden rounded-[22px]"
          style={{ background: "radial-gradient(circle at 48% 20%, rgba(28,31,62,0.42), transparent 37%), linear-gradient(180deg, #050814, #030611)", border: "1px solid rgba(124,58,237,0.2)" }}>
          <div className="flex flex-col items-center border-b px-5 py-3" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-2">
              {Array.from({ length: progressTotal }, (_, index) => {
                const position = index + 1;
                const isCurrent = position === progressCurrent;
                const isComplete = position < progressCurrent;
                return (
                  <span key={index} className="rounded-full transition-all duration-300"
                    style={{
                      width: isCurrent ? 15 : 9,
                      height: isCurrent ? 15 : 9,
                      background: isComplete ? "#7c3aed" : isCurrent ? accent : "#292d3f",
                      border: isCurrent ? `3px solid ${accent}` : "none",
                      boxShadow: isCurrent ? `0 0 12px ${accent}` : "none",
                    }} />
                );
              })}
              <span className="ml-3 font-mono text-base" style={{ color: accent }}>{progressCurrent}/{progressTotal}</span>
            </div>
            <p className="mt-1 text-sm" style={{ color: "#d5d5e2" }}>{progressLabel}</p>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}

function FirstContractCard({
  gs,
  channel,
  selected,
  onSelect,
}: {
  gs: GameState;
  channel: Channel;
  selected: boolean;
  onSelect: () => void;
}) {
  const info = CHANNELS[channel] ?? FALLBACK_CHANNEL;
  const evaluation = getContractEvaluation(gs, channel);
  const affinity = getChannelAffinity(channel, gs.streamerProfile?.streamerType ?? "", gs.streamerProfile?.personality ?? "");
  const metricColor = channel === "RENDER" ? "#ffffff" : info.accent;
  const affinityStars = affinity.score >= 35 ? 5 : affinity.score >= 20 ? 4 : affinity.score >= 0 ? 3 : affinity.score >= -20 ? 2 : 1;

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.985 }}
      className="relative flex min-h-[390px] h-full flex-col overflow-hidden rounded-2xl p-5 text-left transition-all duration-200"
      style={{
        background: `linear-gradient(155deg, ${info.color}18 0%, rgba(7,9,21,0.96) 42%, rgba(5,7,17,0.98) 100%)`,
        border: selected ? `2px solid ${info.accent}` : `1px solid ${info.color}80`,
        boxShadow: selected ? `0 0 24px ${info.glow}, inset 0 0 20px ${info.color}0d` : `inset 0 0 18px ${info.color}08`,
      }}
    >
      {selected && (
        <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-xs uppercase"
          style={{ background: info.accent, color: "#080812" }}>
          Seleccionado <CheckCircle2 size={13} />
        </span>
      )}

      <div className="flex min-h-14 items-center gap-2.5 pr-2">
        {info.logo ? <img src={info.logo} alt={`Logo de ${info.shortName}`} className="h-12 w-14 shrink-0 object-contain" /> : null}
        <h3 className="font-black uppercase tracking-wide" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(1.75rem, 2.2vw, 2.35rem)", color: metricColor }}>
          {info.shortName}
        </h3>
      </div>

      <p className="mt-4 text-base leading-6" style={{ color: "#c8c8da" }}>{info.tagline}</p>
      <p className="mt-4 text-base">
        <span style={{ color: metricColor }}>Figura:</span>{" "}
        <strong className="font-medium text-white">{info.figure}</strong>
      </p>
      <div className="mt-auto grid grid-cols-2 gap-2 border-t pt-4" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
        <div>
          <div className="mb-2 text-xs font-medium" style={{ color: "#c8c8da" }}>Afinidad</div>
          <ContractPips value={affinityStars} color={metricColor} />
        </div>
        <div>
          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium" style={{ color: "#c8c8da" }}><Target size={15} /> Alcance</div>
          <ContractPips value={evaluation.reachPips} color={metricColor} />
          <p className="mt-1.5 font-mono text-xs font-bold" style={{ color: metricColor }}>{Math.round(evaluation.personalizedReach)}%</p>
        </div>
      </div>
    </motion.button>
  );
}

function ScreenFirstContract({ gs, offers, onChoose }: { gs: GameState; offers: Channel[]; onChoose: (ch: Channel) => void }) {
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const selectedInfo = selectedChannel ? CHANNELS[selectedChannel] : null;

  return (
    <div className="min-h-screen p-2 sm:p-3" style={{ background: "#02040c" }}>
      <div className="mx-auto grid max-w-[1600px] gap-2 lg:grid-cols-[260px_minmax(0,1fr)]">
        <CareerSidebar gs={gs} />

        <main className="overflow-hidden rounded-[22px]"
          style={{ background: "radial-gradient(circle at 48% 20%, rgba(28,31,62,0.42), transparent 37%), linear-gradient(180deg, #050814, #030611)", border: "1px solid rgba(124,58,237,0.2)" }}>
          <div className="flex flex-col items-center border-b px-5 py-3" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-2">
              {Array.from({ length: SEASONS }, (_, index) => (
                <span key={index} className="rounded-full transition-all"
                  style={{
                    width: index === 0 ? 15 : 9,
                    height: index === 0 ? 15 : 9,
                    background: index === 0 ? "#a855f7" : "#292d3f",
                    border: index === 0 ? "3px solid #d8b4fe" : "none",
                    boxShadow: index === 0 ? "0 0 12px #a855f7" : "none",
                  }} />
              ))}
              <span className="ml-3 font-mono text-base" style={{ color: "#d8b4fe" }}>1/{SEASONS}</span>
            </div>
            <p className="mt-1 text-sm" style={{ color: "#d5d5e2" }}>Progreso de carrera</p>
          </div>

          <div className="p-4 sm:p-5 xl:p-6">
            <header>
              <p className="font-mono text-xs uppercase tracking-[0.24em]" style={{ color: "#f59e0b" }}>Primera propuesta ✦</p>
              <h2 className="mt-2 font-black uppercase leading-none text-white"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(2.6rem, 5vw, 4.2rem)" }}>
                Tu primer contrato
              </h2>
              <p className="mt-2 text-lg" style={{ color: "#c1c1d0" }}>
                Cuatro canales, cuatro estilos. Elegí bien: cada decisión define tu camino.
              </p>
            </header>

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {offers.map((channel) => (
                <FirstContractCard
                  key={channel}
                  gs={gs}
                  channel={channel}
                  selected={selectedChannel === channel}
                  onSelect={() => setSelectedChannel(channel)}
                />
              ))}
            </div>

            <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_340px]">
              <section className="rounded-2xl p-4" style={{ background: "rgba(9,13,29,0.78)", border: "1px solid rgba(124,58,237,0.24)" }}>
                <div className="flex items-center gap-2">
                  <h3 className="font-mono text-base font-bold uppercase tracking-[0.12em]" style={{ color: "#c084fc" }}>¿Cómo funcionan los contratos?</h3>
                  <Info size={19} style={{ color: "#a78bfa" }} />
                </div>
                <p className="mt-3 text-sm leading-6" style={{ color: "#c7c7d8" }}>
                  La afinidad se calcula según tu tipo de streamer. El alcance muestra el público potencial de cada propuesta.
                </p>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="flex gap-2.5"><Info className="shrink-0" size={20} style={{ color: "#a78bfa" }} /><p className="text-sm leading-5" style={{ color: "#b9b9cd" }}>La personalidad queda guardada en tu perfil, sin bonificaciones ni penalizaciones por ahora.</p></div>
                  <div className="flex gap-2.5"><Target className="shrink-0" size={20} style={{ color: "#f59e0b" }} /><p className="text-sm leading-5" style={{ color: "#b9b9cd" }}>Alcance indica el público potencial del canal.</p></div>
                </div>
              </section>

              <section className="flex flex-col justify-between rounded-2xl p-4" style={{ background: "rgba(9,13,29,0.86)", border: "1px solid rgba(124,58,237,0.24)" }}>
                <div className="flex gap-3">
                  <Rocket className="shrink-0" size={28} style={{ color: selectedInfo?.accent ?? "#fb2c68" }} />
                  <p className="text-base leading-6" style={{ color: "#d0d0df" }}>
                    {selectedInfo
                      ? `Elegiste ${selectedInfo.shortName}. Confirmá para comenzar tu carrera en el canal.`
                      : "Elegí el contrato que mejor acompañe tu estilo para comenzar tu carrera."}
                  </p>
                </div>
                <motion.button
                  type="button"
                  disabled={!selectedChannel}
                  onClick={() => selectedChannel && onChoose(selectedChannel)}
                  whileHover={selectedChannel ? { scale: 1.02 } : {}}
                  whileTap={selectedChannel ? { scale: 0.98 } : {}}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-4 font-black uppercase tracking-wide transition-all disabled:cursor-not-allowed"
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: "1.35rem",
                    background: selectedChannel ? "linear-gradient(135deg, #fb2c68, #f43f5e)" : "#181b2b",
                    color: selectedChannel ? "#ffffff" : "#53576c",
                    border: selectedChannel ? "1px solid #fb7185" : "1px solid rgba(255,255,255,0.06)",
                    boxShadow: selectedChannel ? "0 0 24px rgba(251,44,104,0.34)" : "none",
                  }}
                >
                  <Rocket size={20} /> Elegir contrato
                </motion.button>
                <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-sm leading-5" style={{ color: "#9294ad" }}>
                  <Info size={13} /> La contratación comienza únicamente después de confirmar.
                </p>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function ScreenNoTransferOffers({ gs, onContinue }: { gs: GameState; onContinue: () => void }) {
  return (
    <CareerScreenFrame gs={gs} progressCurrent={gs.season} progressTotal={SEASONS} progressLabel="Progreso de carrera" accent="#f59e0b">
      <div className="p-4 sm:p-5 xl:p-6">
        <section className="rounded-2xl p-6 text-center" style={{ background: "rgba(9,13,29,0.86)", border: "1px solid rgba(245,158,11,0.3)" }}>
          <Info className="mx-auto" size={32} style={{ color: "#f59e0b" }} />
          <h2 className="mt-4 font-black uppercase leading-none text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(2.2rem, 5vw, 3.5rem)" }}>
            No quedan contratos disponibles
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6" style={{ color: "#c7c7d8" }}>
            Todos los canales elegibles ya quedaron fuera de la carrera. Tu trayectoria finaliza de forma segura.
          </p>
          <motion.button type="button" onClick={onContinue} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="mt-6 w-full rounded-xl py-4 font-black uppercase tracking-wide sm:w-auto sm:px-10"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.3rem", background: "linear-gradient(135deg, #f59e0b, #f97316)", color: "#fff", boxShadow: "0 0 24px rgba(245,158,11,0.28)" }}>
            Ver resumen de carrera <Rocket className="ml-2 inline" size={20} />
          </motion.button>
        </section>
      </div>
    </CareerScreenFrame>
  );
}

function ScreenStandardTransferMarket({ gs, onChoose, onNoOffers }: { gs: GameState; onChoose: (ch: Channel) => void; onNoOffers: () => void }) {
  const [offers] = useState<Channel[]>(() => buildOffers(gs.currentChannel, gs.isFirstMarket, gs.streamerProfile, gs.renderSold, gs.excludedChannels));
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const selectedInfo = selectedChannel ? CHANNELS[selectedChannel] ?? FALLBACK_CHANNEL : null;
  const isRenewal = selectedChannel === gs.currentChannel;

  if (offers.length === 0) return <ScreenNoTransferOffers gs={gs} onContinue={onNoOffers} />;

  return (
    <CareerScreenFrame gs={gs} progressCurrent={gs.season} progressTotal={SEASONS} progressLabel="Progreso de carrera" accent="#f59e0b">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="p-4 sm:p-5 xl:p-6">
        <header>
          <p className="font-mono text-xs uppercase tracking-[0.24em]" style={{ color: "#f59e0b" }}>Mercado de pases · Temporada {gs.season}</p>
          <h2 className="mt-2 font-black uppercase leading-none text-white"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(2.6rem, 5vw, 4.2rem)" }}>
            Elegí tu próximo contrato
          </h2>
          <p className="mt-2 text-lg" style={{ color: "#c1c1d0" }}>Las propuestas ya consideran tu perfil, popularidad, seguidores y rendimiento reciente.</p>
        </header>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {offers.map((channel) => (
            <div key={channel} className="relative">
              {channel === gs.currentChannel && (
                <span className="pointer-events-none absolute left-3 top-3 z-10 rounded-full px-2.5 py-1 font-mono text-xs font-bold uppercase"
                  style={{ background: "#f59e0b", color: "#090b16" }}>Renovación</span>
              )}
              <FirstContractCard gs={gs} channel={channel} selected={selectedChannel === channel} onSelect={() => setSelectedChannel(channel)} />
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_340px]">
          <section className="rounded-2xl p-4" style={{ background: "rgba(9,13,29,0.78)", border: "1px solid rgba(124,58,237,0.24)" }}>
            <div className="flex items-center gap-2">
              <Info size={19} style={{ color: "#a78bfa" }} />
              <h3 className="font-mono text-base font-bold uppercase tracking-[0.12em]" style={{ color: "#c084fc" }}>Tu carrera ya pesa en las ofertas</h3>
            </div>
            <p className="mt-3 text-sm leading-6" style={{ color: "#c7c7d8" }}>
              Un canal afín ofrece mejor alcance. Tu popularidad, seguidores y desempeño determinan además qué canales están dispuestos a contratarte.
            </p>
          </section>

          <section className="flex flex-col justify-between rounded-2xl p-4" style={{ background: "rgba(9,13,29,0.86)", border: "1px solid rgba(124,58,237,0.24)" }}>
            <p className="text-base leading-6" style={{ color: "#d0d0df" }}>
              {selectedInfo
                ? isRenewal
                  ? `Vas a renovar con ${selectedInfo.shortName}.`
                  : `Vas a continuar tu carrera en ${selectedInfo.shortName}.`
                : "Seleccioná una propuesta para ver y confirmar tu próximo paso."}
            </p>
            <motion.button type="button" disabled={!selectedChannel} onClick={() => selectedChannel && onChoose(selectedChannel)}
              whileHover={selectedChannel ? { scale: 1.02 } : {}} whileTap={selectedChannel ? { scale: 0.98 } : {}}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-4 font-black uppercase tracking-wide disabled:cursor-not-allowed"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.3rem", background: selectedChannel ? "linear-gradient(135deg, #f59e0b, #f97316)" : "#181b2b", color: selectedChannel ? "#fff" : "#53576c", boxShadow: selectedChannel ? "0 0 24px rgba(245,158,11,0.28)" : "none" }}>
              <Rocket size={20} /> {isRenewal ? "Renovar contrato" : "Confirmar contrato"}
            </motion.button>
          </section>
        </div>
      </motion.div>
    </CareerScreenFrame>
  );
}

function ScreenTransferMarket({ gs, onChoose, onNoOffers }: { gs: GameState; onChoose: (ch: Channel) => void; onNoOffers: () => void }) {
  // Lfunction ScreenTransferMarketa primera contratación conserva sus textos de introducción. Los mercados siguientes
  // usan las mismas tarjetas y confirmación, pero reciben ofertas calculadas con la carrera.
  const [firstOffers] = useState<Channel[]>(() => buildOffers(gs.currentChannel, gs.isFirstMarket, gs.streamerProfile, gs.renderSold, gs.excludedChannels));

  if (gs.isFirstMarket) {
    return <ScreenFirstContract gs={gs} offers={firstOffers} onChoose={onChoose} />;
  }

  return <ScreenStandardTransferMarket gs={gs} onChoose={onChoose} onNoOffers={onNoOffers} />;
}

function ScreenEvent({ gs, onChoose, onContinueAutomatic }: { gs: GameState; onChoose: (idx: number) => void; onContinueAutomatic: () => void }) {
  const ev = gs.currentEvents[gs.eventIndex];
  const ch = CHANNELS[gs.currentChannel] ?? FALLBACK_CHANNEL;
  const evaluation = getContractEvaluation(gs, gs.currentChannel);
  const isSpecial = ev.title.startsWith("⚡");
  const isAutomatic = ev.type === "automatic";

  // La pantalla comparte deliberadamente el armazón visual del mercado inicial. De esta
  // manera el jugador conserva el contexto de su perfil, el contrato y el avance del
  // período sin depender del HUD flotante ni abandonar la identidad visual de la carrera.
  return (
    <div className="min-h-screen p-2 sm:p-3" style={{ background: "#02040c" }}>
      <div className="mx-auto grid max-w-[1600px] gap-2 lg:grid-cols-[260px_minmax(0,1fr)]">
        <CareerSidebar gs={gs} />

        <main className="overflow-hidden rounded-[22px]"
          style={{
            background: `radial-gradient(circle at 82% 16%, ${ch.color}1f, transparent 30%), radial-gradient(circle at 44% 24%, rgba(28,31,62,0.42), transparent 38%), linear-gradient(180deg, #050814, #030611)`,
            border: "1px solid rgba(124,58,237,0.2)",
          }}>
          <div className="flex flex-col items-center border-b px-5 py-3" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-2">
              {Array.from({ length: EVENTS_PER_SEASON }, (_, index) => (
                <span key={index} className="rounded-full transition-all duration-300"
                  style={{
                    width: index === gs.eventIndex ? 15 : 9,
                    height: index === gs.eventIndex ? 15 : 9,
                    background: index < gs.eventIndex ? ch.color : index === gs.eventIndex ? ch.accent : "#292d3f",
                    border: index === gs.eventIndex ? `3px solid ${ch.accent}` : "none",
                    boxShadow: index === gs.eventIndex ? `0 0 12px ${ch.accent}` : "none",
                  }} />
              ))}
              <span className="ml-3 font-mono text-base" style={{ color: ch.accent }}>
                {gs.eventIndex + 1}/{EVENTS_PER_SEASON}
              </span>
            </div>
            <p className="mt-1 text-sm" style={{ color: "#d5d5e2" }}>Progreso del contrato</p>
          </div>

          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}
            className="p-4 sm:p-5 xl:p-6">
            <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-4xl">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-mono text-xs uppercase tracking-[0.24em]" style={{ color: "#f59e0b" }}>
                    Temporada {gs.season} · Período {gs.eventIndex + 1}
                  </p>
                  {isSpecial && (
                    <span className="rounded-full px-2.5 py-1 font-mono text-xs font-bold uppercase"
                      style={{ background: "rgba(251,44,104,0.12)", border: "1px solid rgba(251,44,104,0.42)", color: "#fb7185" }}>
                      Evento especial
                    </span>
                  )}
                </div>
                <h2 className="mt-2 font-black uppercase leading-[0.95] text-white"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(2.6rem, 5vw, 4.2rem)" }}>
                  {ev.title.replace("⚡ ", "")}
                </h2>
                <p className="mt-3 max-w-4xl text-lg leading-7" style={{ color: "#c1c1d0" }}>{ev.description}</p>
              </div>

              <div className="flex min-w-fit items-center gap-3 rounded-2xl px-4 py-3"
                style={{ background: `${ch.color}12`, border: `1px solid ${ch.color}60` }}>
                {ch.logo ? <img src={ch.logo} alt={`Logo de ${ch.shortName}`} className="h-12 w-14 object-contain" /> : null}
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.16em]" style={{ color: "#8787a5" }}>Contrato actual</p>
                  <p className="font-black uppercase tracking-wide" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.65rem", color: ch.accent }}>
                    {ch.shortName}
                  </p>
                </div>
              </div>
            </header>

            <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
              <section className="rounded-2xl p-4 sm:p-5"
                style={{ background: "rgba(9,13,29,0.8)", border: isSpecial ? "1px solid rgba(251,44,104,0.4)" : "1px solid rgba(124,58,237,0.24)" }}>
                {isAutomatic ? (
                  <div className="flex h-full flex-col">
                    <p className="font-mono text-sm font-bold uppercase tracking-[0.16em]" style={{ color: "#c084fc" }}>Consecuencias del período</p>
                    {(ev.consequences ?? []).length > 0 ? (
                      <div className="mt-4 rounded-2xl p-5" style={{ background: "rgba(5,8,20,0.82)", border: `1px solid ${ch.color}52` }}>
                        <p className="text-base leading-7" style={{ color: "#d0d0df" }}>
                          {(ev.consequences ?? []).find((delta) => delta.message)?.message || "El contrato avanzó automáticamente."}
                        </p>
                        <div className="mt-5 flex flex-wrap items-center gap-5">
                          {(ev.consequences ?? []).flatMap((delta, deltaIndex) => {
                            const items: Array<{ key: string; label: string; value: number; suffix?: string }> = [];
                            if (delta.followers !== undefined) items.push({ key: `followers-${deltaIndex}`, label: "Seguidores", value: delta.followers });
                            if (delta.reputation !== undefined) items.push({ key: `reputation-${deltaIndex}`, label: "Popularidad", value: delta.reputation, suffix: "%" });
                            return items;
                          }).map((item) => (
                            <div key={item.key} className="rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.035)" }}>
                              <p className="text-xs uppercase tracking-wide" style={{ color: "#85859f" }}>{item.label}</p>
                              <p className="mt-1 font-mono text-xl font-black"><Delta v={item.value} suffix={item.suffix} /></p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    <motion.button onClick={onContinueAutomatic} whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.98 }}
                      className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl py-4 font-black uppercase tracking-wide"
                      style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.3rem", background: `linear-gradient(135deg, ${ch.color}, ${ch.accent})`, color: "#fff", boxShadow: `0 0 24px ${ch.glow}` }}>
                      Continuar <Rocket size={20} />
                    </motion.button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-mono text-sm font-bold uppercase tracking-[0.16em]" style={{ color: "#c084fc" }}>¿Qué decidís?</p>
                        <p className="mt-1 text-sm" style={{ color: "#9191aa" }}>Elegí la respuesta que defina tu paso por el canal.</p>
                      </div>
                      <Target size={27} style={{ color: ch.accent }} />
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {(ev.options ?? []).map((opt, index) => (
                        <motion.button key={index} onClick={() => onChoose(index)}
                          whileHover={{ y: -3 }} whileTap={{ scale: 0.985 }}
                          className="group min-h-[138px] rounded-2xl p-4 text-left transition-all duration-200"
                          style={{ background: `linear-gradient(145deg, ${ch.color}12, rgba(5,8,20,0.92) 48%)`, border: `1px solid ${ch.color}65`, boxShadow: `inset 0 0 16px ${ch.color}0a` }}>
                          <div className="flex h-full items-start gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-mono text-base font-black"
                              style={{ background: `${ch.color}28`, border: `1px solid ${ch.color}72`, color: ch.accent }}>
                              {String.fromCharCode(65 + index)}
                            </span>
                            <div className="flex h-full min-w-0 flex-col">
                              <p className="text-base font-bold leading-6 text-white">{normalizeOptionText(opt.text)}</p>
                              <p className="mt-2 text-sm leading-5" style={{ color: "#9292ab" }}>{opt.detail}</p>
                              <p className="mt-auto pt-3 font-mono text-xs uppercase tracking-[0.12em] opacity-0 transition-opacity group-hover:opacity-100" style={{ color: ch.accent }}>
                                Elegir esta opción →
                              </p>
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </>
                )}
              </section>

              <aside className="flex flex-col gap-3">
                <section className="rounded-2xl p-4" style={{ background: "rgba(9,13,29,0.86)", border: "1px solid rgba(124,58,237,0.24)" }}>
                  <div className="flex items-center gap-2">
                    <Info size={19} style={{ color: "#a78bfa" }} />
                    <h3 className="font-mono text-sm font-bold uppercase tracking-[0.12em]" style={{ color: "#c084fc" }}>Tu decisión importa</h3>
                  </div>
                  <p className="mt-3 text-sm leading-6" style={{ color: "#c0c0d2" }}>
                    Cada período puede modificar tus seguidores y tu popularidad.
                  </p>
                  <p className="mt-3 text-sm leading-6" style={{ color: "#85859f" }}>
                    Las probabilidades permanecen ocultas: elegí según la identidad que querés construir.
                  </p>
                </section>

                <section className="rounded-2xl p-4" style={{ background: `${ch.color}0d`, border: `1px solid ${ch.color}55` }}>
                  <p className="font-mono text-xs uppercase tracking-[0.16em]" style={{ color: "#9292aa" }}>Alcance de este contrato</p>
                  <div className="mt-3 flex items-end justify-between gap-3">
                    <p className="font-mono text-4xl font-black text-white">{Math.round(evaluation.personalizedReach)}%</p>
                    <Target size={30} style={{ color: ch.accent }} />
                  </div>
                  <div className="mt-3"><ContractPips value={evaluation.reachPips} color={ch.accent} /></div>
                  <p className="mt-3 text-sm leading-5" style={{ color: "#9292aa" }}>Este valor amplifica tanto los buenos resultados como los errores.</p>
                </section>
              </aside>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}

function ScreenEventResult({ gs, onContinue }: { gs: GameState; onContinue: () => void }) {
  const r = gs.lastResult!;
  const ch = CHANNELS[gs.currentChannel] ?? FALLBACK_CHANNEL;
  const ok = r.wasSuccess;
  const isForced = r.delta.specialOutcome === "forcedTransfer";
  const isChannelSold = isForced && r.eventTitle.includes("RENDER FUE VENDIDO");
  const statusColor = isForced ? "#fb2c68" : ok ? "#22c55e" : "#f87171";
  const statusLabel = isForced
    ? (isChannelSold ? "Canal vendido" : "Contrato terminado")
    : ok
      ? "Decisión exitosa"
      : "La decisión salió mal";
  const consequences = [
    { label: "Seguidores", value: r.delta.followers, suffix: "" },
    ...(r.delta.reputation ? [{ label: "Popularidad", value: r.delta.reputation, suffix: "%" }] : []),
  ];

  return (
    <CareerScreenFrame gs={gs} progressCurrent={gs.eventIndex + 1} progressTotal={EVENTS_PER_SEASON} progressLabel="Progreso del contrato" accent={statusColor}>
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.42 }} className="p-4 sm:p-5 xl:p-6">
        <header>
          <p className="font-mono text-xs uppercase tracking-[0.24em]" style={{ color: statusColor }}>Resultado del período</p>
          <h2 className="mt-2 font-black uppercase leading-none text-white"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(2.6rem, 5vw, 4.2rem)" }}>
            {r.eventTitle.replace("⚡ ", "")}
          </h2>
          <p className="mt-2 text-base" style={{ color: "#aaaac0" }}>Elegiste: <strong className="text-white">“{normalizeOptionText(r.optionText)}”</strong></p>
        </header>

        <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <section className="rounded-2xl p-5 sm:p-6"
            style={{ background: `linear-gradient(145deg, ${statusColor}12, rgba(9,13,29,0.9) 46%)`, border: `1px solid ${statusColor}66`, boxShadow: `inset 0 0 28px ${statusColor}0b` }}>
            <div className="flex flex-wrap items-center gap-3">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 22 }}
                className="flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{ background: `${statusColor}20`, border: `1px solid ${statusColor}70`, color: statusColor }}>
                {ok && !isForced ? <CheckCircle2 size={31} /> : <Info size={31} />}
              </motion.div>
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.18em]" style={{ color: "#8d8da7" }}>Consecuencia</p>
                <h3 className="mt-1 font-black uppercase" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "2rem", color: statusColor }}>{statusLabel}</h3>
              </div>
            </div>

            {r.delta.message ? <p className="mt-5 text-lg leading-8" style={{ color: "#d0d0df" }}>{r.delta.message}</p> : null}

            {isForced && (
              <div className="mt-5 rounded-xl px-4 py-3 text-sm leading-6"
                style={{ background: "rgba(159,18,57,0.14)", border: "1px solid rgba(251,44,104,0.35)", color: "#fda4af" }}>
                Tu contrato terminó. Vas al Mercado de Pases de inmediato para encontrar un nuevo canal.
              </div>
            )}

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {consequences.map(({ label, value, suffix }) => (
                <div key={label} className="rounded-2xl p-4" style={{ background: "rgba(4,7,17,0.72)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="flex items-center gap-2" style={{ color: label === "Seguidores" ? "#a78bfa" : "#f59e0b" }}>
                    {label === "Seguidores" ? <Users size={23} /> : <Award size={23} />}
                    <p className="text-sm font-semibold">{label}</p>
                  </div>
                  <div className="mt-3 font-mono text-3xl font-black"><Delta v={value} suffix={suffix} /></div>
                </div>
              ))}
            </div>
          </section>

          <aside className="flex flex-col gap-3">
            <section className="rounded-2xl p-4" style={{ background: "rgba(9,13,29,0.86)", border: `1px solid ${ch.color}55` }}>
              <p className="font-mono text-xs uppercase tracking-[0.16em]" style={{ color: "#8f8fa8" }}>Contrato actual</p>
              <div className="mt-3 flex items-center gap-3">
                {ch.logo ? <img src={ch.logo} alt={`Logo de ${ch.shortName}`} className="h-14 w-16 object-contain" /> : null}
                <p className="font-black uppercase" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "2rem", color: ch.accent }}>{ch.shortName}</p>
              </div>
              <p className="mt-3 text-sm leading-6" style={{ color: "#9292aa" }}>
                {isForced ? "Este vínculo ya no continúa." : `Todavía quedan ${Math.max(0, EVENTS_PER_SEASON - gs.eventIndex - 1)} períodos en esta temporada.`}
              </p>
            </section>

            <motion.button onClick={onContinue} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl py-4 font-black uppercase tracking-wide"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.3rem", background: `linear-gradient(135deg, ${isForced ? "#9f1239" : ch.color}, ${isForced ? "#fb2c68" : ch.accent})`, color: "#fff", boxShadow: `0 0 24px ${statusColor}35` }}>
              {isForced ? "Ir al Mercado de Pases" : "Continuar"} <Rocket size={20} />
            </motion.button>
          </aside>
        </div>
      </motion.div>
    </CareerScreenFrame>
  );
}

function ScreenSeasonSummary({ gs, onContinue }: { gs: GameState; onContinue: () => void }) {
  const ch = CHANNELS[gs.currentChannel] ?? FALLBACK_CHANNEL;
  const repercussionFollowers = gs.seasonRepercussionFollowers ?? 0;
  const isLast = gs.season === SEASONS;
  const isMarket = !isLast;
  const nextLabel = isLast ? "Ver resumen final" : "Ir al Mercado de Pases";

  return (
    <CareerScreenFrame gs={gs} progressCurrent={gs.season} progressTotal={SEASONS} progressLabel="Progreso de carrera" accent={ch.accent}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="p-4 sm:p-5 xl:p-6">
        <header>
          <p className="font-mono text-xs uppercase tracking-[0.24em]" style={{ color: "#f59e0b" }}>Contrato completado</p>
          <h2 className="mt-2 font-black uppercase leading-none text-white"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(2.8rem, 5vw, 4.4rem)" }}>
            Resumen de temporada {gs.season}
          </h2>
          <p className="mt-2 text-lg" style={{ color: "#c1c1d0" }}>Así terminó tu paso anual por <strong style={{ color: ch.accent }}>{ch.shortName}</strong>.</p>
        </header>

        <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <section className="rounded-2xl p-5" style={{ background: "rgba(9,13,29,0.8)", border: "1px solid rgba(124,58,237,0.24)" }}>
            <p className="font-mono text-sm font-bold uppercase tracking-[0.14em]" style={{ color: "#c084fc" }}>Balance de la temporada</p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl p-5" style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.22)" }}>
                <Users size={29} style={{ color: "#a78bfa" }} />
                <p className="mt-5 font-mono text-3xl font-black text-white"><Delta v={gs.seasonAccum.followers} /></p>
                <p className="mt-2 text-sm" style={{ color: "#aaaac0" }}>Seguidores durante la temporada</p>
              </div>
              <div className="rounded-2xl p-5" style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)" }}>
                <Award size={29} style={{ color: "#f59e0b" }} />
                <p className="mt-5 font-mono text-3xl font-black text-white">{gs.reputation}%</p>
                <p className="mt-2 text-sm" style={{ color: "#aaaac0" }}>Popularidad al cierre</p>
              </div>
              <div className="rounded-2xl p-5" style={{ background: `${ch.color}10`, border: `1px solid ${ch.color}44` }}>
                <Rocket size={29} style={{ color: ch.accent }} />
                <p className="mt-5 font-mono text-3xl font-black text-white"><Delta v={repercussionFollowers} /></p>
                <p className="mt-2 text-sm" style={{ color: "#aaaac0" }}>🔥 Seguidores por repercusión</p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-4 rounded-2xl p-4" style={{ background: `${ch.color}0d`, border: `1px solid ${ch.color}42` }}>
              {ch.logo ? <img src={ch.logo} alt={`Logo de ${ch.shortName}`} className="h-16 w-20 object-contain" /> : null}
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.16em]" style={{ color: "#8e8ea7" }}>Canal de la temporada</p>
                <p className="mt-1 font-black uppercase" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "2rem", color: ch.accent }}>{ch.shortName}</p>
              </div>
            </div>
          </section>

          <aside className="flex flex-col gap-3">
            <section className="rounded-2xl p-4" style={{ background: "rgba(9,13,29,0.86)", border: "1px solid rgba(124,58,237,0.24)" }}>
              <div className="flex items-center gap-2"><Info size={19} style={{ color: "#a78bfa" }} /><p className="font-mono text-sm font-bold uppercase tracking-[0.12em]" style={{ color: "#c084fc" }}>Próximo paso</p></div>
              <p className="mt-3 text-base leading-6" style={{ color: "#c8c8d7" }}>
                {isMarket ? "Se abre el Mercado de Pases. Podés renovar tu contrato o cambiar de canal según las ofertas disponibles." : "Completaste la última temporada. Ya podés revisar el balance completo de tu carrera."}
              </p>
            </section>
            <motion.button onClick={onContinue} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl py-4 font-black uppercase tracking-wide"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.3rem", background: `linear-gradient(135deg, ${ch.color}, ${ch.accent})`, color: "#fff", boxShadow: `0 0 24px ${ch.glow}` }}>
              {nextLabel} <Rocket size={20} />
            </motion.button>
          </aside>
        </div>
      </motion.div>
    </CareerScreenFrame>
  );
}

function ScreenAwardsSeason({ gs, onChoose }: { gs: GameState; onChoose: (index: number) => void }) {
  const ch = CHANNELS[gs.currentChannel] ?? FALLBACK_CHANNEL;
  const foundCount = gs.awardsSeasonRevealed
    .filter((index) => gs.awardsSeasonBoard[index] !== null)
    .length;

  if (gs.awardsSeasonCompleted) {
    return (
      <CareerScreenFrame gs={gs} progressCurrent={gs.season} progressTotal={SEASONS} progressLabel="Progreso de carrera" accent="#fbbf24">
        <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} className="flex min-h-[520px] items-center justify-center p-5 text-center">
          <section className="w-full max-w-xl rounded-3xl p-8 sm:p-12" style={{ background: "radial-gradient(circle at 50% 5%, rgba(251,191,36,0.28), transparent 44%), linear-gradient(160deg, #17142b, #080a17 64%)", border: "1px solid rgba(251,191,36,0.55)", boxShadow: "0 0 60px rgba(245,158,11,0.28)" }}>
            <Award className="mx-auto" size={62} style={{ color: "#fbbf24" }} />
            <p className="mt-7 font-mono text-xs font-bold uppercase tracking-[0.25em]" style={{ color: "#fde68a" }}>Temporada de premios</p>
            <h2 className="mt-4 font-black uppercase leading-none text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(2.8rem, 8vw, 4.8rem)" }}>
              {gs.awardsSeasonEndedByEmpty ? "La gala terminó" : "¡Ganaste todos los premios!"}
            </h2>
            <p className="mt-5 text-base leading-7" style={{ color: "#d4d4e3" }}>{gs.awardsSeasonEndedByEmpty ? "Revisá el resultado de la temporada." : "La gala termina con los tres premios en tu vitrina."}</p>
          </section>
        </motion.div>
      </CareerScreenFrame>
    );
  }

  return (
    <CareerScreenFrame gs={gs} progressCurrent={gs.season} progressTotal={SEASONS} progressLabel="Progreso de carrera" accent={ch.accent}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="p-4 sm:p-5 xl:p-6">
        <header className="text-center">
          <p className="font-mono text-xs uppercase tracking-[0.24em]" style={{ color: "#fbbf24" }}>Reconocimientos de la temporada</p>
          <h2 className="mt-2 font-black uppercase leading-none text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(3rem, 7vw, 5.2rem)" }}>Temporada de premios</h2>
          <p className="mx-auto mt-3 max-w-xl text-base leading-7" style={{ color: "#c1c1d0" }}>Elegí un panel. Encontrá los premios y seguí buscando; un panel vacío termina la gala.</p>
        </header>

        <section className="mx-auto mt-7 max-w-2xl rounded-3xl p-4 sm:p-7" style={{ background: "radial-gradient(circle at 50% 0%, rgba(251,191,36,0.14), transparent 48%), rgba(9,13,29,0.88)", border: "1px solid rgba(251,191,36,0.28)" }}>
          <div className="mb-5 flex items-center justify-between gap-3 font-mono text-xs uppercase tracking-[0.14em]" style={{ color: "#d7d7e8" }}>
            <span>Premios encontrados</span><span style={{ color: "#fbbf24" }}>{foundCount}/3</span>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:gap-5">
            {gs.awardsSeasonBoard.map((prizeId, index) => {
              const revealed = gs.awardsSeasonRevealed.includes(index);
              const prize = prizeId ? DOC_PREMIOS.find((entry) => entry.id === prizeId) : undefined;
              const image = prize ? getPrizeAssetSrc(prize.icon) : undefined;
              return (
                <motion.button
                  key={index}
                  type="button"
                  disabled={revealed}
                  onClick={() => onChoose(index)}
                  whileHover={revealed ? {} : { scale: 1.035, y: -2 }}
                  whileTap={revealed ? {} : { scale: 0.96 }}
                  className="aspect-square overflow-hidden rounded-2xl p-2 transition-opacity disabled:cursor-default"
                  style={{
                    background: revealed ? (prize ? "linear-gradient(145deg, rgba(251,191,36,0.28), rgba(124,58,237,0.24))" : "rgba(71,85,105,0.34)") : "linear-gradient(145deg, #30215b, #12182d)",
                    border: revealed ? `1px solid ${prize ? "rgba(251,191,36,0.68)" : "rgba(148,163,184,0.36)"}` : "1px solid rgba(192,132,252,0.42)",
                    boxShadow: revealed ? "none" : "0 0 18px rgba(124,58,237,0.2)",
                  }}
                  aria-label={revealed ? (prize?.name ?? "Panel vacío") : `Panel ${index + 1}`}
                >
                  {revealed && prize ? (
                    image ? <img src={image} alt={prize.name} className="h-full w-full object-contain" /> : <Award className="mx-auto h-full w-full p-3" style={{ color: "#fbbf24" }} />
                  ) : revealed ? (
                    <span className="font-mono text-xs uppercase tracking-wider" style={{ color: "#94a3b8" }}>Vacío</span>
                  ) : (
                    <span className="font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(2.2rem, 7vw, 4rem)", color: "#e9d5ff" }}>?</span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </section>
      </motion.div>
    </CareerScreenFrame>
  );
}

function ScreenGameOver({ gs }: { gs: GameState }) {
  const rating = getFinalRating(gs.followers);
  const finalChannel = CHANNELS[gs.currentChannel] ?? FALLBACK_CHANNEL;
  return (
    <CareerScreenFrame gs={gs} progressCurrent={SEASONS} progressTotal={SEASONS} progressLabel="Carrera completada" accent={rating.color}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="p-4 sm:p-5 xl:p-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em]" style={{ color: rating.color }}>Fin de carrera · {SEASONS} temporadas</p>
            <h2 className="mt-2 font-black uppercase leading-none text-white"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(3rem, 6vw, 5rem)" }}>
              Tu carrera terminó
            </h2>
            <p className="mt-2 text-lg" style={{ color: "#c1c1d0" }}><StreamerName name={gs.streamerName} isVerified={gs.isVerified} />, este es el legado que construiste.</p>
          </div>
          <motion.div initial={{ scale: 0.84, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.22, type: "spring" }}
            className="inline-flex items-center gap-2 self-start rounded-2xl px-5 py-3 font-black uppercase tracking-wider lg:self-auto"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.35rem", background: `${rating.color}18`, border: `1px solid ${rating.color}60`, color: rating.color }}>
            <span>{rating.emoji}</span>{rating.label}
          </motion.div>
        </header>

        <div className="mt-5 grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-2xl p-5" style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.24)" }}>
              <Users size={31} style={{ color: "#a78bfa" }} />
              <p className="mt-5 font-mono text-4xl font-black text-white">{fmt(gs.followers)}</p>
              <p className="mt-2 text-sm" style={{ color: "#aaaac0" }}>Seguidores finales</p>
            </div>
            <div className="rounded-2xl p-5" style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.22)" }}>
              <Award size={31} style={{ color: "#f59e0b" }} />
              <p className="mt-5 font-mono text-4xl font-black text-white">{gs.reputation}%</p>
              <p className="mt-2 text-sm" style={{ color: "#aaaac0" }}>Popularidad final</p>
            </div>
          </section>

          <section className="rounded-2xl p-5" style={{ background: "rgba(9,13,29,0.82)", border: "1px solid rgba(124,58,237,0.24)" }}>
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-mono text-sm font-bold uppercase tracking-[0.14em]" style={{ color: "#c084fc" }}>Historial de canales</h3>
              <span className="text-xs" style={{ color: "#777790" }}>Terminaste en <strong style={{ color: finalChannel.accent }}>{finalChannel.shortName}</strong></span>
            </div>
            {gs.careerHistory.length === 0 ? (
              <p className="mt-5 text-sm" style={{ color: "#777790" }}>No hay contratos registrados.</p>
            ) : (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {gs.careerHistory.map((entry, index) => {
                  const info = CHANNELS[entry.channel] ?? FALLBACK_CHANNEL;
                  const channelPrizes = gs.awardedAutomaticPrizes.filter((prize) => prize.channel === entry.channel);
                  return (
                    <div key={`${entry.channel}-${index}`} className="flex items-center justify-between gap-3 rounded-2xl p-4"
                      style={{ background: `${info.color}0d`, border: `1px solid ${info.color}45` }}>
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        {info.logo ? <img src={info.logo} alt={`Logo de ${info.shortName}`} className="h-12 w-14 shrink-0 object-contain" /> : null}
                        <div className="flex min-w-0 items-center gap-2">
                          <p className="truncate font-black uppercase" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.5rem", color: info.accent }}>{info.shortName}</p>
                          {channelPrizes.length > 0 && (
                            <div className="flex shrink-0 items-center gap-1" aria-label={`Premios obtenidos en ${info.shortName}`}>
                              {channelPrizes.map((prize) => <PrizeIcon key={prize.id} prize={prize} />)}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full px-2.5 py-1 font-mono text-xs" style={{ background: `${info.color}22`, color: info.accent }}>{entry.seasons} temp.</span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <div className="mt-4 flex justify-end">
          <motion.button onClick={() => window.location.reload()} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="flex w-full items-center justify-center gap-2 rounded-xl px-8 py-4 font-black uppercase tracking-wide sm:w-auto"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.3rem", background: "linear-gradient(135deg, #7c3aed, #a855f7)", color: "#fff", boxShadow: "0 0 24px rgba(124,58,237,0.32)" }}>
            Nueva carrera <Rocket size={20} />
          </motion.button>
        </div>
      </motion.div>
    </CareerScreenFrame>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [gs, setGs] = useState<GameState>(INIT);

  // Re-read markdown event files at startup so newly added automatic
  // events become available without changing the parser or selection logic.
  useEffect(() => {
    // fire-and-forget; any errors are logged inside refreshDocEvents
    refreshDocEvents();
  }, []);

  

  const getEffectiveDelta = (delta: StatDelta, s: GameState): StatDelta => {
    const evaluation = getContractEvaluation(s, s.currentChannel);
    const scaled = scaleOutcomeByReach(
      delta.followers,
      delta.reputation === 0 ? undefined : delta.reputation,
      evaluation.personalizedReach,
    );

    return {
      ...delta,
      followers: scaled.followers,
      reputation: scaled.popularity,
    };
  };

  const applyEffectiveDelta = (delta: StatDelta, s: GameState) => {
    const nextFollowers = Math.max(0, s.followers + delta.followers);
    const verificationUnlocked = !s.isVerified && nextFollowers >= VERIFIED_FOLLOWERS;
    const nextAwards = awardAutomaticPrizes(nextFollowers, s.awardedAutomaticPrizes, s.currentChannel);
    const prizeUnlocks = getAwardIncrements(s.awardedAutomaticPrizes, nextAwards);
    return {
      followers: nextFollowers,
      reputation: Math.min(100, Math.max(0, s.reputation + (delta.reputation ?? 0))),
      seasonAccum: {
        followers: s.seasonAccum.followers + delta.followers,
      },
      isVerified: s.isVerified || verificationUnlocked,
      pendingVerificationUnlock: s.pendingVerificationUnlock || verificationUnlocked,
      awardedAutomaticPrizes: nextAwards,
      pendingPrizeUnlocks: [...s.pendingPrizeUnlocks, ...prizeUnlocks],
    };
  };

  const applySeasonRepercussion = (s: GameState): GameState => {
    if (s.seasonRepercussionAwardedFor === s.season) return s;

    const repercussionFollowers = calculateSeasonRepercussionFollowers(s.seasonAccum.followers);
    const rewardState = applyEffectiveDelta({ followers: repercussionFollowers, message: "" }, s);

    return {
      ...s,
      ...rewardState,
      // La repercusión se basa solo en el balance de eventos y no debe alterar ese balance.
      seasonAccum: s.seasonAccum,
      seasonRepercussionFollowers: repercussionFollowers,
      seasonRepercussionAwardedFor: s.season,
    };
  };

  const applyDeltas = (deltas: StatDelta[], s: GameState) => deltas.reduce((acc, delta) => {
    const effectiveDelta = getEffectiveDelta(delta, acc);
    return { ...acc, ...applyEffectiveDelta(effectiveDelta, acc) };
  }, s);

  const handleIntroNext = useCallback(() => setGs((s) => ({ ...s, phase: "naming" })), []);

  const handleNamingConfirm = useCallback((name: string, profile: StreamerProfile) => {
    // El nombre se conserva en su propiedad histórica para no alterar las pantallas
    // existentes; el resto de los datos viaja agrupado como un perfil extensible.
    setGs((s) => ({ ...s, streamerName: name, streamerProfile: profile, phase: "transferMarket" }));
  }, []);

  const handleChooseChannel = useCallback((channel: Channel) => {
    setGs((s) => {
      const pickedEvents = pickEvents(channel, EVENTS_PER_SEASON, s.renderSold, s.usedEventKeys);
      const { events, usedRivals } = applyEventVariables(pickedEvents, s.usedFajenseRivals);
      const nextUsedEventKeys = [...s.usedEventKeys];
      events.forEach((event) => {
        if (event.appearance === "UNA_VEZ") {
          const key = buildEventKey(channel, event);
          if (!nextUsedEventKeys.includes(key)) nextUsedEventKeys.push(key);
        }
      });
      const nextAwards = awardAutomaticPrizes(s.followers, s.awardedAutomaticPrizes, channel);
      return {
        ...s,
        currentChannel: channel,
        currentChannelAffinity: s.streamerProfile
          ? getChannelAffinity(channel, s.streamerProfile.streamerType, s.streamerProfile.personality).score
          : 0,
        phase: "event",
        eventIndex: 0,
        currentEvents: events,
        seasonAccum: { followers: 0 },
        seasonRepercussionFollowers: null,
        seasonRepercussionAwardedFor: null,
        isFirstMarket: false,
        usedFajenseRivals: usedRivals,
        usedEventKeys: nextUsedEventKeys,
        awardedAutomaticPrizes: nextAwards,
        pendingPrizeUnlocks: [...s.pendingPrizeUnlocks, ...getAwardIncrements(s.awardedAutomaticPrizes, nextAwards)],
        contractPerformanceTotal: 0,
        contractPerformancePeriods: 0,
      };
    });
  }, []);

  // Dev helper: allow forcing a channel selection from the browser console
  useEffect(() => {
    try {
      (window as any).forceSelectChannel = (channel: Channel) => handleChooseChannel(channel);
    } catch (e) {
      // ignore
    }
    return () => {
      try { delete (window as any).forceSelectChannel; } catch (e) {}
    };
  }, [handleChooseChannel]);

  const handleChooseOption = useCallback((idx: number) => {
    setGs((s) => {
      const ev = s.currentEvents[s.eventIndex];
      const opt = ev.options?.[idx];
      if (!opt) return s;
      const ok = Math.random() < opt.successChance;
      const delta = ok ? opt.success : opt.failure;
      const effectiveDelta = getEffectiveDelta(delta, s);
      const effectiveState = applyEffectiveDelta(effectiveDelta, s);
      const nextAwards = ok
        ? awardSpecialPrizesForSuccessfulEvent(ev.id, effectiveState.awardedAutomaticPrizes, s.currentChannel)
        : effectiveState.awardedAutomaticPrizes;
      return {
        ...s,
        ...effectiveState,
        awardedAutomaticPrizes: nextAwards,
        pendingPrizeUnlocks: [...effectiveState.pendingPrizeUnlocks, ...getAwardIncrements(effectiveState.awardedAutomaticPrizes, nextAwards)],
        ...updateRecentPerformance(s, ok ? 100 : 0),
        phase: "eventResult",
        lastResult: { eventTitle: ev.title, optionText: opt.text, wasSuccess: ok, delta: effectiveDelta },
      };
    });
  }, []);

  const handleAutomaticContinue = useCallback(() => {
    setGs((s) => {
      const ev = s.currentEvents[s.eventIndex];
      const nextState = applyDeltas(ev?.consequences ?? [], s);
      if (s.eventIndex < EVENTS_PER_SEASON - 1) return { ...nextState, phase: "event", eventIndex: s.eventIndex + 1 };
      return { ...applySeasonRepercussion(nextState), phase: "seasonSummary" };
    });
  }, []);

  const handleResultContinue = useCallback(() => {
    setGs((s) => {
      // Forced transfer (canal te echa y vas al Mercado de Pases)
      if (s.lastResult?.delta.specialOutcome === "forcedTransfer") {
        const hist = [...s.careerHistory];
        const idx = hist.findIndex((e) => e.channel === s.currentChannel);
        if (idx >= 0) hist[idx] = { ...hist[idx], seasons: hist[idx].seasons + 1 };
        else hist.push({ channel: s.currentChannel, seasons: 1 });
        const nextSeason = Math.min(s.season + 1, SEASONS + 1);
        // A channel that fires the player is never eligible again in this career.
        const excludedChannels = [...new Set([...s.excludedChannels, s.currentChannel])];
        const renderWasSold = s.lastResult.eventTitle.includes("RENDER FUE VENDIDO");
        if (s.season >= SEASONS) {
          return { ...s, careerHistory: hist, renderSold: s.renderSold || renderWasSold, excludedChannels, phase: "gameOver" };
        }
        return {
          ...s,
          season: nextSeason,
          careerHistory: hist,
          renderSold: s.renderSold || renderWasSold,
          excludedChannels,
          phase: "transferMarket",
          isFirstMarket: false,
        };
      }

      if (s.eventIndex < EVENTS_PER_SEASON - 1) return { ...s, phase: "event", eventIndex: s.eventIndex + 1 };
      return { ...applySeasonRepercussion(s), phase: "seasonSummary" };
    });
  }, []);

  const completeSeason = (s: GameState): GameState => {
      const hist = [...s.careerHistory];
      const idx = hist.findIndex((e) => e.channel === s.currentChannel);
      if (idx >= 0) hist[idx] = { ...hist[idx], seasons: hist[idx].seasons + 1 };
      else hist.push({ channel: s.currentChannel, seasons: 1 });

      const clearedAwardsSeason = {
        awardsSeasonBoard: [] as (AwardsSeasonPrizeId | null)[],
        awardsSeasonRevealed: [] as number[],
        awardsSeasonCompleted: false,
        awardsSeasonEndedByEmpty: false,
      };
      if (s.season >= SEASONS) return { ...s, ...clearedAwardsSeason, careerHistory: hist, phase: "gameOver" };

      const nextSeason = s.season + 1;
      return { ...s, ...clearedAwardsSeason, season: nextSeason, careerHistory: hist, phase: "transferMarket", isFirstMarket: false };
  };

  const handleSeasonContinue = useCallback(() => {
    setGs((s) => {
      if (s.reputation > 60) {
        const awardsSeasonBoard = shuffle<AwardsSeasonPrizeId | null>([
          ...AWARDS_SEASON_PRIZE_IDS,
          null, null, null, null, null, null,
        ]);
        return {
          ...s,
          phase: "awardsSeason",
          awardsSeasonBoard,
          awardsSeasonRevealed: [],
          awardsSeasonCompleted: false,
          awardsSeasonEndedByEmpty: false,
        };
      }
      return completeSeason(s);
    });
  }, []);

  const handleAwardsSeasonChoose = useCallback((index: number) => {
    setGs((s) => {
      if (s.phase !== "awardsSeason" || s.awardsSeasonCompleted || s.awardsSeasonRevealed.includes(index)) return s;
      const prizeId = s.awardsSeasonBoard[index];
      const awardsSeasonRevealed = [...s.awardsSeasonRevealed, index];

      if (!prizeId) return { ...s, awardsSeasonRevealed, awardsSeasonCompleted: true, awardsSeasonEndedByEmpty: true };

      const prize = DOC_PREMIOS.find((entry) => entry.id === prizeId);
      if (!prize) return s;
      const nextAwards = awardPrize(s.awardedAutomaticPrizes, prize, s.currentChannel, { forceAccumulable: true });
      const prizeUnlocks = getAwardIncrements(s.awardedAutomaticPrizes, nextAwards);
      const foundAllPrizes = AWARDS_SEASON_PRIZE_IDS.every((id) => awardsSeasonRevealed.some((revealedIndex) => s.awardsSeasonBoard[revealedIndex] === id));

      return {
        ...s,
        awardedAutomaticPrizes: nextAwards,
        pendingPrizeUnlocks: [...s.pendingPrizeUnlocks, ...prizeUnlocks],
        awardsSeasonRevealed,
        awardsSeasonCompleted: foundAllPrizes,
        awardsSeasonEndedByEmpty: false,
      };
    });
  }, []);

  const handleNoTransferOffers = useCallback(() => {
    setGs((s) => ({ ...s, phase: "gameOver" }));
  }, []);

  const handlePrizeUnlockContinue = useCallback(() => {
    setGs((s) => ({ ...s, pendingPrizeUnlocks: s.pendingPrizeUnlocks.slice(1) }));
  }, []);

  const handleVerificationUnlockContinue = useCallback(() => {
    setGs((s) => ({ ...s, pendingVerificationUnlock: false }));
  }, []);

  const handleAwardsSeasonResultContinue = useCallback(() => {
    setGs((s) => s.phase === "awardsSeason" && s.awardsSeasonEndedByEmpty ? completeSeason(s) : s);
  }, []);

  useEffect(() => {
    if (gs.phase !== "awardsSeason" || !gs.awardsSeasonCompleted || gs.awardsSeasonEndedByEmpty || gs.pendingPrizeUnlocks.length > 0) return;
    const timer = window.setTimeout(() => {
      setGs((s) => s.phase === "awardsSeason" && s.awardsSeasonCompleted && s.pendingPrizeUnlocks.length === 0 ? completeSeason(s) : s);
    }, 1600);
    return () => window.clearTimeout(timer);
  }, [gs.phase, gs.awardsSeasonCompleted, gs.awardsSeasonEndedByEmpty, gs.pendingPrizeUnlocks.length]);

  const awardsSeasonResultPrizes = gs.awardsSeasonRevealed.flatMap((index) => {
    const prizeId = gs.awardsSeasonBoard[index];
    const prize = prizeId ? DOC_PREMIOS.find((entry) => entry.id === prizeId) : undefined;
    return prize ? [prize] : [];
  });

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
      <AnimatePresence mode="wait">
        {gs.phase === "intro" && (
          <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <ScreenIntro onNext={handleIntroNext} />
          </motion.div>
        )}
        {gs.phase === "naming" && (
          <motion.div key="naming" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <ScreenNaming onConfirm={handleNamingConfirm} />
          </motion.div>
        )}
        {gs.phase === "transferMarket" && (
          <motion.div key={`mkt-${gs.season}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <ScreenTransferMarket gs={gs} onChoose={handleChooseChannel} onNoOffers={handleNoTransferOffers} />
          </motion.div>
        )}
        {gs.phase === "event" && gs.currentEvents[gs.eventIndex] && (
          <motion.div key={`ev-${gs.season}-${gs.eventIndex}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            <ScreenEvent gs={gs} onChoose={handleChooseOption} onContinueAutomatic={handleAutomaticContinue} />
          </motion.div>
        )}
        {gs.phase === "eventResult" && gs.lastResult && (
          <motion.div key={`res-${gs.season}-${gs.eventIndex}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            <ScreenEventResult gs={gs} onContinue={handleResultContinue} />
          </motion.div>
        )}
        {gs.phase === "seasonSummary" && (
          <motion.div key={`sum-${gs.season}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <ScreenSeasonSummary gs={gs} onContinue={handleSeasonContinue} />
          </motion.div>
        )}
        {gs.phase === "awardsSeason" && (
          <motion.div key={`awards-${gs.season}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <ScreenAwardsSeason gs={gs} onChoose={handleAwardsSeasonChoose} />
          </motion.div>
        )}
        {gs.phase === "gameOver" && (
          <motion.div key="gameover" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
            <ScreenGameOver gs={gs} />
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {gs.pendingVerificationUnlock ? (
          <PrizeUnlockModal content={VERIFIED_UNLOCK_CONTENT} onContinue={handleVerificationUnlockContinue} />
        ) : gs.pendingPrizeUnlocks[0] && (
          <PrizeUnlockModal content={getPrizeUnlockContent(gs.pendingPrizeUnlocks[0])} onContinue={handlePrizeUnlockContinue} />
        )}
        {gs.phase === "awardsSeason" && gs.awardsSeasonCompleted && gs.awardsSeasonEndedByEmpty && gs.pendingPrizeUnlocks.length === 0 && (
          <AwardsSeasonResultModal prizes={awardsSeasonResultPrizes} onContinue={handleAwardsSeasonResultContinue} />
        )}
      </AnimatePresence>
    </div>
  );
}
