import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import algaLogo from "../../assets/logos/alga.png";
import assLogo from "../../assets/logos/ass.png";
import caranchoLogo from "../../assets/logos/carancho.png";
import queratinaLogo from "../../assets/logos/queratina.png";
import futupopLogo from "../../assets/logos/futupop.png";
import orterixLogo from "../../assets/logos/orterix.png";
import renderLogo from "../../assets/logos/render.png";
import ruzuLogo from "../../assets/logos/ruzu.png";
import algaEventsMd from "../../assets/docs/EVENTS/ALGA.md?raw";
import orterixEventsMd from "../../assets/docs/EVENTS/ORTERIX.md?raw";
import renderEventsMd from "../../assets/docs/EVENTS/RENDER.md?raw";
import ruzuEventsMd from "../../assets/docs/EVENTS/RUZU.md?raw";
import premiosMd from "../../assets/docs/LISTS/PREMIOS.md?raw";

// ─── Types ────────────────────────────────────────────────────────────────────

interface GamePrize {
  id: string;
  name: string;
  type: "AUTOMATICO" | "ANUAL";
  icon: string;
  requirement?: string;
  followersRequirement?: number;
}

interface AwardedPrize {
  id: string;
  name: string;
  icon: string;
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
    const requirementLine = lines.find((line) => /^REQUISITO:/i.test(line));

    const id = normalizePrizeToken((idLine ?? "").replace(/^ID:\s*|^PREMIO:\s*/i, ""));
    const name = (nameLine ?? "").replace(/^NOMBRE:\s*/i, "").trim();
    const rawType = (typeLine ?? "").replace(/^TIPO:\s*/i, "").trim().toUpperCase();
    const icon = normalizePrizeToken((iconLine ?? "").replace(/^ICONO:\s*/i, ""));
    const requirement = (requirementLine ?? "").replace(/^REQUISITO:\s*/i, "").trim();

    const normalizedType = rawType === "AUTOMATICO" || rawType === "ANUAL" ? rawType : undefined;

    if (!id || !name || !normalizedType || !icon) return [];

    return [{
      id,
      name,
      type: normalizedType,
      icon,
      ...(requirement ? { requirement } : {}),
      followersRequirement: parseRequirementThreshold(requirement),
    }];
  });
}

const DOC_PREMIOS: GamePrize[] = parsePrizesFromMarkdown(premiosMd);

function awardAutomaticPrizes(followers: number, currentAwards: AwardedPrize[] = []): AwardedPrize[] {
  const awards = [...currentAwards];

  for (const prize of DOC_PREMIOS) {
    if (prize.type !== "AUTOMATICO") continue;
    if (prize.followersRequirement === undefined) continue;
    if (awards.some((entry) => entry.id === prize.id)) continue;
    if (followers < prize.followersRequirement) continue;

    awards.push({
      id: prize.id,
      name: prize.name,
      icon: prize.icon,
      requirement: prize.requirement,
      count: 1,
    });
  }

  return awards;
}

type Phase =
  | "intro"
  | "naming"
  | "transferMarket"
  | "event"
  | "eventResult"
  | "seasonSummary"
  | "gameOver";

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
  money?: number;
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
  season: number;
  eventIndex: number;
  currentChannel: Channel;
  followers: number;
  reputation: number;
  careerHistory: CareerEntry[];
  currentEvents: GameEvent[];
  lastResult: LastResult | null;
  seasonAccum: { followers: number };
  isFirstMarket: boolean;
  renderSold: boolean;
  usedFajenseRivals: string[];
  usedEventKeys: string[];
  excludedChannel?: Channel | null;
  awardedAutomaticPrizes: AwardedPrize[];
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
  const consequences = combineConsequences(parseConsequenceText(consequenceLines.join("\n")));
  return { message, consequences };
}

function normalizeOptionText(text: string): string {
  return text.trim().replace(/^[A-Z]\s*[:.\-–—]\s*/i, "").trim();
}

function parseAutomaticEventsFromMarkdown(markdown: string): GameEvent[] {
  const sections = markdown.split(/\n\s*EVENTO:/i).filter(Boolean);
  return sections.flatMap((section) => {
    const normalized = section.trim();
    if (!normalized) return [];
    const lines = normalized.split(/\r?\n/).map((line) => line.trim());
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

    return [{ title, description, type: "automatic", consequences, appearance }];
  });
}

function parseEventsFromMarkdown(markdown: string): GameEvent[] {
  const sections = markdown.split(/\n\s*EVENTO:/i).filter(Boolean);
  return sections.flatMap((section) => {
    const normalized = section.trim();
    if (!normalized) return [];
    const lines = normalized.split(/\r?\n/).map((l) => l.trim());

    const title = lines.find((line) => /^T[ÍI]TULO:/i.test(line))?.replace(/^T[ÍI]TULO:\s*/i, "")?.trim() ?? "Evento";
    const description = lines.find((line) => /^DESCRIPCI.|^DESCRIPCIÓN:/i.test(line))
      ?.replace(/^DESCRIPCI.:\s*/i, "")
      ?.replace(/^DESCRIPCIÓN:\s*/i, "") ?? "";

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
  ORTERIX: parseAutomaticEventsFromMarkdown(orterixEventsMd),
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
      const parsed = channel === "RUZU TV" ? parseEventsFromMarkdown(text) : parseAutomaticEventsFromMarkdown(text);
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
          success: { followers: 11000, money: 5, message: "Robaste el show. La transmisión fue lo más visto del festival." },
          failure: { followers: -4000, money: 0, message: "Los nervios se notaron demasiado. La audiencia no perdonó." } },
        { text: "Cubrir el backstage con entrevistas", detail: "Contenido cercano, menos presión.", successChance: 0.74,
          success: { followers: 6000, money: 3, message: "Entrevistas espontáneas que se convirtieron en los clips de la noche." },
          failure: { followers: 800, money: 1, message: "Cobertura correcta pero sin momentos que se recuerden." } },
      ],
    },
    {
      title: "El Bit de Humor que Nadie Esperaba",
      description: "Azuquita Rodrigues lanza un desafío de humor en vivo y te menciona por nombre. Millones miran.",
      options: [
        { text: "Sumarte sin pensarlo", detail: "Pura reacción, sin calcular.", successChance: 0.5,
          success: { followers: 13000, money: 3, message: "La reacción genuina hizo explotar el chat. Clips por todos lados." },
          failure: { followers: -5000, money: 0, message: "No era tu momento. La comparación con Azuquita fue cruel." } },
        { text: "Responder con tu propio bit preparado", detail: "Controlás la situación.", successChance: 0.63,
          success: { followers: 8000, money: 2, message: "Sorprendiste a todos con un bit propio. Ganaste terreno en ORTERIX." },
          failure: { followers: -2000, money: 0, message: "El bit preparado se notó demasiado. Se rieron de vos, no con vos." } },
      ],
    },
    {
      title: "Hot Take Deportivo",
      description: "ORTERIX organiza un panel donde cada uno dice su opinión más polémica sobre deporte. Todos miran.",
      options: [
        { text: "El hot take más arriesgado que tenés", detail: "Decir lo que nadie se anima.", successChance: 0.44,
          success: { followers: 5000, money: 4, message: "Tu opinión explotó en redes. Mitad te odia, mitad te adora. Ambos te siguen." },
          failure: { followers: -8000, money: 0, message: "La opinión cayó fatal. Trending topic por las razones equivocadas." } },
        { text: "Opinión fuerte pero con respaldo", detail: "Polémica con argumentos.", successChance: 0.67,
          success: { followers: 1000, money: 2, message: "Posición sólida. La audiencia te tomó en serio y siguió el debate." },
          failure: { followers: -2000, money: 0, message: "Quedó como una opinión a medias. No convenció a nadie." } },
      ],
    },
    {
      title: "Collab Oficial con Azuquita",
      description: "El streamer estrella de ORTERIX te propone hacer un stream conjunto. Es un salto enorme de visibilidad.",
      options: [
        { text: "Aceptar y cederle el protagonismo", detail: "Venir a sumar, no a competir.", successChance: 0.68,
          success: { followers: 4000, money: 4, message: "El stream fue un éxito. La comunidad de Azuquita te adoptó." },
          failure: { followers: -300, money: 0, message: "Quedaste opacado. La audiencia ni te registró al lado suyo." } },
        { text: "Proponer un formato donde los dos brillen", detail: "Negociar los términos creativos.", successChance: 0.48,
          success: { followers: 6000, money: 6, message: "El formato fue brillante. Ambos crecieron. Hablan de ustedes como dupla." },
          failure: { followers: -600, money: 0, message: "La negociación enfrió la idea. La collab salió sin la energía del principio." } },
      ],
    },
    {
      title: "Maratón Gaming 12 Horas",
      description: "ORTERIX organiza su maratón anual y te quieren como uno de los protagonistas. 12 horas en vivo.",
      options: [
        { text: "Estar las 12 horas sin parar", detail: "Compromiso total con el evento.", successChance: 0.46,
          success: { followers: 14000, money: 5, message: "Llegaste al final. El chat enloqueció en la hora 12. Histórico." },
          failure: { followers: 2000, money: 1, message: "Te quedaste dormido en hora 9. El clip se viralizó, pero no como querías." } },
        { text: "Hacer los horarios pico y descansar", detail: "Calidad sobre cantidad.", successChance: 0.74,
          success: { followers: 7000, money: 2, message: "Cada aparición fue de alto nivel. El canal quedó muy conforme." },
          failure: { followers: 1000, money: 1, message: "Tu ausencia en horas clave fue notada. No causaste impacto." } },
      ],
    },
    {
      title: "Fajense de Manos",
      description: "Azuquita Rodrigues organiza en el Luna Park un evento de boxeo con streamers e influencers. Este año tu rival será {RIVAL}.",
      forceAsLast: true,
      options: [
        { text: "Entrenar a fondo", detail: "A darlo todo", successChance: 0.50,
          success: { followers: 2000, money: 0, message: "Noqueas a {RIVAL} en el primer Round. Alzas el cinto con orgullo" },
          failure: { followers: -6000, money: 0, message: "Te pasaste un poco y {RIVAL} termina internado. En las redes te llaman \"Asesino\", el cinto te lo mandan por correo 10 días después." } },
        { text: "Apenas entrenas", detail: "Total es todo show", successChance: 0.50,
          success: { followers: 2000, money: 0, message: "Ninguno de los 2 emboca una piña pero el público se caga de risa. Ganás por puntos." },
          failure: { followers: -1000, money: 0, message: "Te quedás sin aire al minuto de pelea, {RIVAL} no perdona y te noquea. Te boludean en twitter por semanas" } },
      ],
    },
  ],

  ALGA: [
    {
      title: "Panel de Improvisación con Migue",
      description: "Migue Granate te invita a su segmento estrella de improvisación. El caos es el formato y las reglas no existen.",
      options: [
        { text: "Soltar todo, puro instinto", detail: "Sin preparación, sin freno.", successChance: 0.48,
          success: { followers: 17000, money: 5, message: "Fue el segmento más visto del mes. Migue te abrazó al terminar." },
          failure: { followers: -8000, money: 0, message: "Te bloqueaste en vivo. El silencio fue incómodo para todos." } },
        { text: "Preparar algunos bits de antemano", detail: "Improvisación con estructura.", successChance: 0.70,
          success: { followers: 9000, money: 3, message: "La preparación se notó de buena manera. Sólido y entretenido." },
          failure: { followers: -2000, money: 0, message: "Los bits preparados chocaron con el caos de Migue. No fluyó." } },
      ],
    },
    {
      title: "Un nene habla de política en vivo",
      description: "Trajiste a la estrella infantil Jota a tu programa y el estudio se lleno de niños, le acercás el micrófono a uno de ellos. El nene grita \"TODOS ACÁ ODIAMOS AL PRESIDENTE\".",
      options: [
        { text: "Le sacás el micrófono y cambias de tema", detail: "No querés quilombo.", successChance: 0.60,
          success: { followers: 1000, money: 0, message: "Fuiste rápido y nadie se dio cuenta. La entrevista siguió su curso." },
          failure: { followers: -5000, money: 0, message: "En el arrebato le pegás al nene sin querer y este llora. Las redes te matan." } },
        { text: "Te reís de la ocurrencia", detail: "Confiemos en el caos.", successChance: 0.40,
          success: { followers: 2000, money: 0, message: "Tu risa contagia al resto del equipo. Queda como un clip gracioso." },
          failure: { followers: -2000, money: 0, message: "En las redes te tildan de golpista. El presidente comparte el clip y comenta \"Asi operan los zurdos\"." } },
      ],
    },
    {
      title: "Sketch polémico",
      description: "En una lluvia de ideas dijiste que querías hacer una parodia del pesebre. Lo llevaste a cabo, te pusiste un pañal y fingiste ser Jesús pero a la gente no le gustó.",
      options: [
        { text: "Pedís disculpas al día siguiente", detail: "Con eso no se jode", successChance: 0.70,
          success: { followers: 500, money: 0, message: "La mayoría te perdona y pasas página rápido" },
          failure: { followers: -5000, money: 0, message: "No lograste sonar convincente y te reíste de los nervios. Peor." } },
        { text: "Defendés el sketch", detail: "El humor sana", successChance: 0.30,
          success: { followers: 8000, money: 0, message: "Das un discurso sobre la doble moral y sobre el humor. Te los metiste a todos en el bolsillo" },
          failure: { followers: 0, money: 0, message: "Granate te llama en privado y te echa.", specialOutcome: "forcedTransfer" } },
      ],
    },
    {
      title: "Golpe de Nostalgia",
      description: "Traes a todo el elenco de RadioMatch, un programa de los '90 querido y odiado por igual. ¿Cómo encarás el programa?",
      options: [
        { text: "Homenajear a RadioMatch al 100%", detail: "El humor no caduca", successChance: 0.50,
          success: { followers: 3000, money: 0, message: "Producción ríe, el chat ríe, las redes también. Tu niño interior esta feliz" },
          failure: { followers: -3000, money: 0, message: "Al 3er chiste de suegras las visitas caen. El humor evolucionó, vos no." } },
        { text: "Entrevista íntima", detail: "Querés escuchar a las personas y no a los personajes", successChance: 0.50,
          success: { followers: 5000, money: 0, message: "Los invitados se abren con vos y cuentan secretos del programa. En las redes te felicitan por tus preguntas." },
          failure: { followers: -4000, money: 0, message: "La gente te putea porque querían escuchar los chistes de Yuyo y Escorpión." } },
      ],
    },
    {
      title: "Nueva incorporación",
      description: "Granate se roba una figura de Ruzu y te conduzcas un programa con ella para justificar el sueldo. Vos no te la bancás.",
      options: [
        { text: "Aceptás", detail: "El jefe es el jefe", successChance: 0.50,
          success: { followers: 4000, money: 0, message: "Contra todo prejuicio tenés una gran química con ella. El programa la rompe." },
          failure: { followers: -2000, money: 0, message: "No te sigue los chistes y la falta de química se nota. El programa dura menos de 1 mes." } },
        { text: "Respetuosamente te negás", detail: "La honestidad es tu estandarte", successChance: 0.50,
          success: { followers: 200, money: 0, message: "Migue Granate lo entiende y va rotando a la piba por varios programas. Al final se da cuenta que no sirve y la echa." },
          failure: { followers: 0, money: 0, message: "Migue Granate te tilda de mal compañero y mala leche." } },
      ],
    },
    {
      title: "La guerra de los bots",
      description: "Un canal rival insinúa en redes que ALGA está inflando artificialmente su audiencia. El tema domina las tendencias y todos esperan una respuesta.",
      options: [
        { text: "Responder públicamente", detail: "Vamos a defender nuestra credibilidad", successChance: 0.60,
          success: { followers: 3000, money: 0, message: "Hablas seriamente mirando a cámara y desmentís las acusaciones con datos. El público respalda el canal" },
          failure: { followers: -1500, money: 0, message: "La discusión escala y varios medios siguen hablando del tema." } },
        { text: "Ignorar la polémica", detail: "Ladran Sancho", successChance: 0.85,
          success: { followers: 1000, money: 0, message: "La noticia muere a los pocos días." },
          failure: { followers: -3000, money: 0, message: "Muchos interpretan el silencio como una admisión." } },
      ],
    },
    {
      title: "Entrevista en Modo Caos",
      description: "ALGA consigue una figura famosa. El formato: preguntas sin filtro, respuestas sin edición. Migue te da la silla.",
      options: [
        { text: "Ir al caos total sin ningún límite", detail: "El show sobre todo.", successChance: 0.40,
          success: { followers: 22000, money: 7, message: "La entrevista más comentada del año. El invitado se convirtió en meme." },
          failure: { followers: -9000, money: 0, message: "El invitado se fue al corte. ALGA tuvo que pedir disculpas públicas." } },
        { text: "Caos controlado: gracioso pero respetuoso", detail: "Equilibrio entre show y forma.", successChance: 0.73,
          success: { followers: 12000, money: 4, message: "Entrevista memorable. El invitado quedó bien y vos quedaste mejor." },
          failure: { followers: -3000, money: 0, message: "El equilibrio no se encontró. Ni caos ni entrevista real." } },
      ],
    },
    {
      title: "El Clip Viral de Migue te Involucra",
      description: "Un momento de Migue se viraliza masivamente y te mencionó por nombre. Las redes arden y todos te buscan.",
      options: [
        { text: "Publicar contenido propio de inmediato", detail: "Surfear la ola antes de que baje.", successChance: 0.56,
          success: { followers: 15000, money: 4, message: "El timing fue perfecto. Tu contenido llegó cuando todos te buscaban." },
          failure: { followers: -5000, money: 0, message: "El contenido que publicaste no estuvo a la altura del momento." } },
        { text: "Hacer un live conjunto con Migue", detail: "Aprovechar su base directamente.", successChance: 0.67,
          success: { followers: 11000, money: 3, message: "El live conjunto fue el cierre perfecto del momento viral." },
          failure: { followers: -1000, money: 0, message: "La coordinación falló. El live salió tarde y el momento ya había pasado." } },
      ],
    },
    {
      title: "Programa Especial de Entrevistas",
      description: "ALGA hace una maratón de entrevistas. Te asignan el invitado más difícil de manejar de toda la grilla.",
      options: [
        { text: "Abrazar la dificultad, hacer algo diferente", detail: "El riesgo como estrategia creativa.", successChance: 0.42,
          success: { followers: 24000, money: 8, message: "Lo imposible se volvió el segmento más comentado. Leyenda." },
          failure: { followers: -10000, money: 0, message: "El invitado te dominó en vivo. La diferencia fue demasiado visible." } },
        { text: "Entrevista clásica con humor estratégico", detail: "Jugar sobre seguro con estilo.", successChance: 0.71,
          success: { followers: 13000, money: 4, message: "Entrevista fluida y con momentos de humor que la hicieron especial." },
          failure: { followers: -2000, money: 0, message: "El invitado difícil pudo con vos. Resultado plano." } },
      ],
    },
    {
      title: "Debate Espontáneo en Vivo",
      description: "En el medio de un stream, Migue lanza un debate no planeado y te da la palabra sin aviso previo.",
      options: [
        { text: "Tomar el debate y llevarlo al extremo", detail: "Improvisación pura.", successChance: 0.47,
          success: { followers: 19000, money: 5, message: "El debate explotó. Tu posición fue la más discutida de la noche." },
          failure: { followers: -7000, money: 0, message: "No tenías argumentos listos. Quedaste sin respuestas convincentes." } },
        { text: "Aportar desde un lugar más tranquilo", detail: "No todo tiene que ser extremo.", successChance: 0.68,
          success: { followers: 8000, money: 2, message: "La calma contrastó bien con el caos. Tu voz se diferenció." },
          failure: { followers: -1000, money: 0, message: "Quedaste opacado entre las voces más fuertes del panel." } },
      ],
    },
    {
      title: "Entrevista con el 10",
      description: "Migue Granate consiguió una entrevista con el Capitán de la Selección en Miami, te quiere llevar como co-conductor pero temás cagarla.",
      options: [
        { text: "Aceptar", detail: "Ir a Miami y tomar el lugar de co-conductor.", successChance: 0.60,
          success: { followers: 40000, money: 0, message: "La nota salió genial, tiraste 2 chistazos que hicieron reír al 10. Ahora el Capitán te sigue en Instagram." },
          failure: { followers: -50000, money: 0, message: "Tiraste un chiste de Twitter y lo llamaste 'Hormonita'. Granate te fulmina con la mirada, volviste solo a Buenos Aires.", specialOutcome: "forcedTransfer" } },
        { text: "Quedarte en estudios", detail: "No salir del estudio y seguir el evento desde ahí.", successChance: 1.00,
          success: { followers: 5000, money: 0, message: "Te quedaste en el estudio reaccionando a la nota. Migue Granate te trae una camiseta firmada por el 10." },
          failure: { followers: 0, money: 0, message: "" } },
      ],
    },
    {
      title: "Día homenaje a Pito Faez",
      description: "ALGA organiza un homenaje especial a Pito Faez en el teatro. En pleno show, Migue Granate te pasa el micrófono y te ofrece cantar un tema del artista en vivo.",
      options: [
        { text: "Cantás, total esto es ALGA.", detail: "Tomar el micrófono y cantar en vivo.", successChance: 0.60,
          success: { followers: 10000, money: 0, message: "Cantaste afinadamente 'Libélula Multicolor' y la rompiste. El teatro te aplaude." },
          failure: { followers: -5000, money: 0, message: "No embocaste una nota, nadie supo cómo remar el mal momento. Te hacés viral... para mal." } },
        { text: "No es lo tuyo.", detail: "Rechazar la invitación a cantar.", successChance: 0.60,
          success: { followers: 0, money: 0, message: "El homenaje fue épico igual. Tu negativa fue honesta y te ganaste el respeto del canal." },
          failure: { followers: 0, money: 0, message: "Para cerrar el show, todos los del canal suben a cantar mientras vos lo mirás desde abajo. Al otro día no charlan de otra cosa, te sentís dejado de lado." } },
      ],
    },
  ],

  ASS: [
    {
      title: "Clásico Argentino en Vivo",
      description: "ASS cubre el partido más importante del año. Fabio Assado te ofrece un lugar en la transmisión principal.",
      options: [
        { text: "Análisis técnico en tiempo real", detail: "Datos, contexto, profundidad.", successChance: 0.62,
          success: { followers: 10000, money: 3, message: "Precisión quirúrgica. Los hinchas te aceptaron como voz autorizada." },
          failure: { followers: -2000, money: 1, message: "Errores en los análisis durante momentos clave. Las críticas dolieron." } },
        { text: "Panel de debate post-partido", detail: "El fútbol como disparador.", successChance: 0.55,
          success: { followers: 12000, money: 3, message: "Debate encendido. Los clips circularon toda la noche en redes." },
          failure: { followers: -3000, money: 0, message: "El debate se descontroló. ASS quedó expuesto negativamente." } },
      ],
    },
    {
      title: "Entrevista Exclusiva con Figura del Fútbol",
      description: "ASS tiene acceso a una de las grandes figuras del fútbol argentino. Fabio Assado te confía la entrevista.",
      options: [
        { text: "Las preguntas que nadie se anima", detail: "Periodismo que incomoda.", successChance: 0.38,
          success: { followers: 23000, money: 7, message: "Preguntaste lo que todos querían saber. Entrevista histórica del canal." },
          failure: { followers: -5000, money: 0, message: "El jugador se cerró en banda. Un desastre en vivo frente a todos." } },
        { text: "Entrevista cálida y sin presión", detail: "Que el entrevistado se abra solo.", successChance: 0.74,
          success: { followers: 11000, money: 3, message: "El jugador se abrió y dijo cosas que nunca había dicho. Oro puro." },
          failure: { followers: 1000, money: 1, message: "Correcta pero previsible. Sin momentos propios que la distingan." } },
      ],
    },
    {
      title: "Debate de Fichajes Polémico",
      description: "Una transferencia importante sacude al fútbol argentino. ASS quiere voces fuertes y sin filtro.",
      options: [
        { text: "Opinión contundente y sin filtros", detail: "Decir lo que se piensa.", successChance: 0.44,
          success: { followers: 17000, money: 4, message: "Análisis valiente y fundamentado. Trending topic de la noche." },
          failure: { followers: -9000, money: 0, message: "Opinión que cayó fatal entre los hinchas más numerosos. Crisis." } },
        { text: "Presentar todos los ángulos", detail: "Ecuanimidad como ventaja.", successChance: 0.72,
          success: { followers: 6000, money: 2, message: "Análisis serio y equilibrado. ASS valoró el profesionalismo." },
          failure: { followers: -1000, money: 1, message: "Te vieron sin posición propia. Nadie quedó conforme." } },
      ],
    },
    {
      title: "Ciclo de Debate Semanal de Fabio",
      description: "Fabio Assado propone un ciclo semanal y te quiere como panelista fijo. Es un compromiso largo.",
      options: [
        { text: "Ser el conductor, no el panelista", detail: "Tomar las riendas completamente.", successChance: 0.55,
          success: { followers: 14000, money: 6, message: "El ciclo se convirtió en referencia del debate futbolístico argentino." },
          failure: { followers: -4000, money: 1, message: "El formato no cuajó. Los números no convencieron a Fabio ni al canal." } },
        { text: "Aceptar el rol de panelista destacado", detail: "Menos exposición, menos riesgo.", successChance: 0.74,
          success: { followers: 5000, money: 3, message: "Tus intervenciones fueron siempre las más citadas del programa." },
          failure: { followers: -1000, money: 2, message: "Buen panelista, pero sin momentos propios que te distingan del resto." } },
      ],
    },
    {
      title: "Cobertura del Mundial Sub-20",
      description: "ASS tiene los derechos. El torneo dura semanas y Fabio Assado quiere que seas la cara de la cobertura.",
      options: [
        { text: "Cobertura total, partido a partido", detail: "La voz del torneo completo.", successChance: 0.55,
          success: { followers: 14000, money: 5, message: "Fuiste la voz del torneo. Completo, apasionado, omnipresente." },
          failure: { followers: -2000, money: 2, message: "El desgaste se notó. Los últimos partidos fueron de baja calidad." } },
        { text: "Solo los partidos de mayor impacto", detail: "Calidad sobre presencia.", successChance: 0.68,
          success: { followers: 7000, money: 3, message: "Cobertura selectiva de alta calidad. El canal quedó más que conforme." },
          failure: { followers: -1000, money: 2, message: "Algunos fans sintieron que no estuviste cuando más se te necesitaba." } },
      ],
    },
  ],

  "RUZU TV": [
    {
      title: "Panel de Primeras Citas en Vivo",
      description: "RUZU hace su segmento estrella: comentar primeras citas reales en tiempo real. Nico Bognato te pone al frente.",
      options: [
        { text: "Ser el más irreverente del panel", detail: "Sin autocensura, todo vale.", successChance: 0.52,
          success: { followers: 12000, money: 3, message: "Tus comentarios fueron los más citados. El segmento explotó por vos." },
          failure: { followers: -6000, money: 0, message: "Pasaste el límite. Las personas en pantalla se ofendieron en vivo." } },
        { text: "El que da los consejos inesperadamente buenos", detail: "Contraste inesperado.", successChance: 0.70,
          success: { followers: 7000, money: 2, message: "El contraste entre el caos y tus consejos fue el momento del programa." },
          failure: { followers: -1000, money: 0, message: "Los consejos serios no pegaron en un formato tan caótico." } },
      ],
    },
    {
      title: "Desafío de Humor Sin Filtros de Nico",
      description: "Nico Bognato lanza el desafío más famoso de RUZU: el chiste más arriesgado posible. Millones esperando.",
      options: [
        { text: "Ir sin límites, sin autocensura", detail: "Todo o nada.", successChance: 0.40,
          success: { followers: 17000, money: 4, message: "El chiste se convirtió en leyenda del canal. Nico te aplaudió de pie." },
          failure: { followers: -10000, money: 0, message: "Cruzaste una línea que no se debía cruzar. Crisis mediática." } },
        { text: "Arriesgado pero con criterio propio", detail: "Límite elegido, no impuesto.", successChance: 0.66,
          success: { followers: 9000, money: 3, message: "El chiste funcionó y quedaste bien parado. Raro y difícil lograrlo en RUZU." },
          failure: { followers: -3000, money: 0, message: "Nico consideró que faltó valentía. La audiencia de RUZU lo notó." } },
      ],
    },
    {
      title: "Cobertura de Actualidad al Estilo RUZU",
      description: "Un tema serio del día, pero RUZU lo quiere con su filtro único: caótico, directo y sin protocolo.",
      options: [
        { text: "Sumarte al caos sin pensar demasiado", detail: "Fluir con el formato.", successChance: 0.56,
          success: { followers: 11000, money: 2, message: "Fue lo que RUZU necesitaba. Natural, caótico y muy visto." },
          failure: { followers: -4000, money: 0, message: "Sin control ni estructura, el segmento fue un quilombo sin gracia." } },
        { text: "Aportar algo de análisis entre las risas", detail: "Contenido entre el ruido.", successChance: 0.67,
          success: { followers: 7000, money: 3, message: "El contraste te diferenció. Te vieron como una voz distinta en RUZU." },
          failure: { followers: -1000, money: 0, message: "El análisis serio mató el ritmo del segmento. No encajó." } },
      ],
    },
    {
      title: "Collab Picante con Nico Bognato",
      description: "Nico propone un stream de dos horas solo con vos. El formato explícito: sin temas prohibidos.",
      options: [
        { text: "Aceptar sin condiciones", detail: "Total apertura al formato.", successChance: 0.50,
          success: { followers: 15000, money: 4, message: "Dos horas de contenido que el canal jamás olvidará. Histórico para RUZU." },
          failure: { followers: -7000, money: 0, message: "El stream se fue a un lugar del que ninguno pudo salir bien parado." } },
        { text: "Establecer un límite claro antes", detail: "Tus reglas en el juego de Nico.", successChance: 0.63,
          success: { followers: 8000, money: 2, message: "La tensión entre tus límites y el estilo de Nico fue el mejor contenido." },
          failure: { followers: -2000, money: 0, message: "Nico se aburrió rápido. El límite le quitó la gracia al formato." } },
      ],
    },
    {
      title: "Debate Banal que se Pone Serio",
      description: "Empieza como un debate sobre comida o música y termina tocando un nervio real. Nico te da la palabra.",
      options: [
        { text: "Llevarlo al nivel serio sin avergonzarte", detail: "El fondo emerge naturalmente.", successChance: 0.57,
          success: { followers: 10000, money: 3, message: "El viraje fue el mejor momento del programa. Nadie lo vio venir." },
          failure: { followers: -3000, money: 0, message: "El tono serio mató el humor y el nuevo tema tampoco cuajó." } },
        { text: "Mantenerlo liviano y bajar la tensión", detail: "Humor como herramienta.", successChance: 0.71,
          success: { followers: 6000, money: 2, message: "Salvaste el momento. El segmento terminó bien y todos quedaron cómodos." },
          failure: { followers: 0, money: 0, message: "Ni un lado ni el otro. El programa terminó sin pena ni gloria." } },
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
          success: { followers: 21000, money: 6, message: "Preguntaste lo que todo el país quería escuchar. Clip millonario." },
          failure: { followers: -8000, money: 0, message: "El político se enojó y cortó la entrevista. Escándalo para RENDER." } },
        { text: "Entrevista equilibrada y periodísticamente sólida", detail: "Forma sobre show.", successChance: 0.74,
          success: { followers: 11000, money: 4, message: "Entrevista rigurosa. Ganaste credibilidad en el ambiente político." },
          failure: { followers: -2000, money: 0, message: "El político manejó la entrevista a su favor. Quedaste por debajo." } },
      ],
    },
    {
      title: "Debate de Actualidad en Vivo",
      description: "Hay una noticia urgente. Tomás Report te manda al aire en diez minutos. Sin tiempo de preparar nada.",
      options: [
        { text: "Improvisar con lo que sabés", detail: "Confiar en el conocimiento acumulado.", successChance: 0.50,
          success: { followers: 13000, money: 3, message: "La improvisación fue sólida. Te reconocieron como alguien que sabe." },
          failure: { followers: -5000, money: 0, message: "Los errores factuales en vivo destruyeron la credibilidad del segmento." } },
        { text: "Pedir diez minutos para informarte bien", detail: "La preparación como responsabilidad.", successChance: 0.67,
          success: { followers: 8000, money: 3, message: "La espera valió la pena. El análisis fue de los mejores del canal." },
          failure: { followers: -2000, money: 0, message: "Para cuando saliste, la noticia ya la habían cubierto todos los demás." } },
      ],
    },
    {
      title: "Investigación Periodística Propia",
      description: "Tomás Report te propone llevar una investigación propia al aire. El tema es sensible y el impacto puede ser enorme.",
      options: [
        { text: "Publicar ahora, el tiempo es clave", detail: "El primero en llegar gana.", successChance: 0.38,
          success: { followers: 26000, money: 8, message: "La investigación fue el tema del año. RENDER es la fuente de todos." },
          failure: { followers: -12000, money: 0, message: "Datos sin verificar. La desmentida fue peor que la nota original." } },
        { text: "Verificar cada dato antes de salir", detail: "La credibilidad se construye despacio.", successChance: 0.76,
          success: { followers: 15000, money: 5, message: "Investigación impecable. Nadie pudo impugnar un solo dato." },
          failure: { followers: -1000, money: 0, message: "La verificación tardó demasiado. Otro medio publicó primero." } },
      ],
    },
    {
      title: "Cobertura de Crisis Política",
      description: "Estalla una crisis de gobierno. RENDER entra en modo 24/7 y te proponen como cara visible de la cobertura.",
      options: [
        { text: "Estar al aire las 24 horas", detail: "El canal antes que todo.", successChance: 0.47,
          success: { followers: 19000, money: 6, message: "Fuiste la referencia de la crisis. El país entero miraba RENDER y a vos." },
          failure: { followers: -4000, money: 0, message: "El agotamiento se vio. En hora 18 ya no había análisis, solo errores." } },
        { text: "Coberturas de 4 horas con análisis profundo", detail: "Sostenible y de calidad.", successChance: 0.69,
          success: { followers: 12000, money: 4, message: "Cobertura de alta calidad. Te diferenciaste del ruido de los demás medios." },
          failure: { followers: -1000, money: 0, message: "La audiencia quería continuidad. Tus ausencias entre bloques los alejaron." } },
      ],
    },
    {
      title: "Tensión en Costra Team",
      description: "En plena transmisión, Quique Quinoa se entera de que va a ser despedido. Explota en el aire: insulta al canal, a los dueños, a todos. Las redes arden. Vos estás ahí al lado.",
      options: [
        { text: "No decís nada, dejas que pase.", detail: "No intervenir y dejar que el descontrol ocurra.", successChance: 0.60,
          success: { followers: 1000, money: 0, message: "Echan al conductor y no a vos. RENDER te ve como alguien que sabe mantener la calma." },
          failure: { followers: -1000, money: 0, message: "Te tildan de tibio en las redes." } },
        { text: "Metés chistes para aliviar la tensión.", detail: "Intentar distender la situación con humor.", successChance: 0.50,
          success: { followers: 0, money: 0, message: "Quique se relaja y termina el programa. El dueño a la salida te felicita por cómo manejaste todo." },
          failure: { followers: 0, money: -3, message: "Quique es echado y a vos te bajan el sueldo. 'A ver si con esto se te va lo payaso' dice el dueño." } },
      ],
    },
    {
      title: "Cobertura Mundial",
      description: "Durante el programa en vivo te enterás que el canal mandará a Mosquita Fart para la cobertura del Mundial. A la piba le tirás una pelota y le saca los gajos.",
      options: [
        { text: "Miras a cámara con cara de 'Daaaale'.", detail: "Responder al momento con una cara de complicidad.", successChance: 0.60,
          success: { followers: 1000, money: 2, message: "Todos lo leyeron como un chiste. Tu cara se viralizó y el canal, en lugar de enojarse, te subió el sueldo para calmarte." },
          failure: { followers: 6000, money: 0, message: "Tenés menos tiempo en pantalla pero la gente te ama." } },
        { text: "Te quejas por redes.", detail: "Expresar el enojo públicamente.", successChance: 0.50,
          success: { followers: 0, money: 0, message: "Los fans te aman y tu posteo se hace viral pero los dueños te tienen entre ceja y ceja. El ambiente interno se pone tenso." },
          failure: { followers: 0, money: 0, message: "Los dueños no perdonan la queja pública. Te llaman y te dicen que tu contrato no se renueva. Salís a buscar canal.", specialOutcome: "forcedTransfer" } },
      ],
    },
    {
      // SPECIAL EVENT — forced transfer
      title: "⚡ RENDER FUE VENDIDO",
      description: "A mitad de temporada, RENDER anuncia que fue adquirido por un nuevo grupo mediático. Todos los contratos del staff quedan rescindidos de inmediato. No hay apelación posible.",
      options: [
        { text: "Intentar quedarte en el canal reformado", detail: "Quizás el nuevo dueño te renueve.", successChance: 0.05,
          success: { followers: 3000, money: 0, message: "El nuevo dueño decidió renovarte por una sola temporada más... rarísimo.", specialOutcome: "forcedTransfer" },
          failure: { followers: -5000, money: 0, message: "El nuevo dueño no renovó ningún contrato. Te quedás sin trabajo de un día para el otro.", specialOutcome: "forcedTransfer" } },
        { text: "Agarrar las cosas y salir antes de que te echen", detail: "Salir con dignidad.", successChance: 0.95,
          success: { followers: 1000, money: 3, message: "Saliste con dignidad. En el ambiente todos saben lo que pasó y te respetan por eso.", specialOutcome: "forcedTransfer" },
          failure: { followers: -2000, money: 0, message: "La salida se hizo pública de mala manera. Igual te fuiste, pero sin la mejor imagen.", specialOutcome: "forcedTransfer" } },
      ],
    },
  ],

  CARANCHO: [
    {
      title: "Propaganda en Horario Central",
      description: "El Gordo Pan quiere que defiendas la posición del gobierno en vivo durante el horario de mayor audiencia. Sin matices.",
      options: [
        { text: "Defender al 100%, sin fisuras", detail: "La línea del canal, completa.", successChance: 0.67,
          success: { followers: 9000, money: 5, message: "El Gordo Pan te felicitó en vivo. El canal quedó muy satisfecho." },
          failure: { followers: -5000, money: 0, message: "Hubo un momento donde no tenías respuesta. El canal lo notó." } },
        { text: "Matizar el mensaje sutilmente", detail: "Un gramo de honestidad propia.", successChance: 0.38,
          success: { followers: 16000, money: 3, message: "El matiz generó debate y paradójicamente aumentó la audiencia." },
          failure: { followers: -8000, money: 0, message: "CARANCHO no tolera matices. El Gordo Pan lo tomó como una traición." } },
      ],
    },
    {
      title: "Entrevista a Funcionario Oficialista",
      description: "El Gordo Pan consiguió un ministro. El formato es claro: preguntas amigables, ninguna incomodidad.",
      options: [
        { text: "Seguir el guión del canal al pie de la letra", detail: "La entrevista que el canal quiere.", successChance: 0.72,
          success: { followers: 7000, money: 5, message: "El funcionario quedó contento. El canal también. El trabajo, hecho." },
          failure: { followers: -3000, money: 0, message: "Incluso siguiendo el guión, algo salió mal. El funcionario se molestó." } },
        { text: "Lanzar una pregunta incómoda de rebote", detail: "Un momento de periodismo real.", successChance: 0.33,
          success: { followers: 19000, money: 6, message: "La pregunta incómoda se viralizó. Inesperadamente, incluso CARANCHO la celebró." },
          failure: { followers: -10000, money: 0, message: "El Gordo Pan cortó tu micrófono en vivo. Crisis interna sin precedentes." } },
      ],
    },
    {
      title: "Evento de Campaña en Vivo",
      description: "CARANCHO organiza un evento político masivo. El Gordo Pan quiere que seas el streamer estrella de la cobertura.",
      options: [
        { text: "Cobertura con entusiasmo total", detail: "Comprometerte con el evento.", successChance: 0.63,
          success: { followers: 11000, money: 5, message: "Tu energía contagió. El evento fue un éxito y vos fuiste parte de eso." },
          failure: { followers: -2000, money: 0, message: "El evento tuvo problemas técnicos. Tu cobertura los amplificó." } },
        { text: "Cobertura neutral, sin tomar partido", detail: "El periodismo por sobre la política.", successChance: 0.42,
          success: { followers: 7000, money: 2, message: "La neutralidad en CARANCHO fue vista como valentía. Inusual y efectiva." },
          failure: { followers: -9000, money: 0, message: "CARANCHO no contrató a alguien neutral. Te dejaron fuera del evento principal." } },
      ],
    },
    {
      title: "Te Piden Atacar a un Canal Rival",
      description: "La dirección del canal te manda un mensaje claro: tenés que ir contra un canal rival en vivo.",
      options: [
        { text: "Hacerlo: seguir la línea del canal", detail: "Prioridad al contrato.", successChance: 0.57,
          success: { followers: 9000, money: 4, message: "El ataque fue efectivo según los estándares de CARANCHO. El canal quedó conforme." },
          failure: { followers: -5000, money: 0, message: "El canal rival te sacó a pasear. Humillado totalmente." } },
        { text: "Negarte a atacar sin razón", detail: "Tu integridad primero.", successChance: 0.48,
          success: { followers: 13000, money: 3, message: "La negativa se viralizó. Paradójicamente, ganaste seguidores fuera de CARANCHO." },
          failure: { followers: -10000, money: 0, message: "CARANCHO no negocia la línea editorial. Tu posición dentro del canal peligra." } },
      ],
    },
    {
      title: "El Escándalo: CARANCHO y RENDER, el Mismo Dueño",
      description: "Sale a la luz (de nuevo) que CARANCHO y RENDER tienen el mismo propietario. El escándalo mediático es monumental y te piden que lo manejés.",
      options: [
        { text: "Defender la situación en nombre del canal", detail: "El canal te pide que salgas a aclarar.", successChance: 0.45,
          success: { followers: 6000, money: 6, message: "Lograste bajar la temperatura. El canal te lo agradeció con un bono." },
          failure: { followers: -12000, money: 0, message: "La defensa fue insostenible. Te convirtieron en el blanco de todas las críticas." } },
        { text: "Salir del tema con humor y esquivar", detail: "No querer saber nada.", successChance: 0.64,
          success: { followers: 7000, money: 2, message: "El humor desactivó el momento. El canal respiró aliviado." },
          failure: { followers: -4000, money: -5, message: "Las redes te tildan de pelotudo. Peor el remedio que la enfermedad." } },
      ],
    },
  ],

  QUERATINA: [
    {
      title: "Panel Peronista de Alto Voltaje",
      description: "QUERATINA arma un panel con dirigentes, militantes y periodistas del palo. El tema: la interna del movimiento. Pepe Racinclub te pone a moderar.",
      options: [
        { text: "Moderar con mano firme sin tomar partido", detail: "Periodismo por sobre la militancia.", successChance: 0.55,
          success: { followers: 9000, money: 3, message: "Panel intenso pero ordenado. Te ganaste el respeto de los distintos sectores del movimiento." },
          failure: { followers: -4000, money: 0, message: "Los panelistas te pasaron por encima. Perdiste el control y el canal quedó expuesto." } },
        { text: "Sumarte al debate y tomar posición", detail: "Bancar la línea del canal.", successChance: 0.48,
          success: { followers: 14000, money: 4, message: "Tu posición fue clara y contundente. La militancia te adoptó. El panel fue trending." },
          failure: { followers: -7000, money: 0, message: "La interna del movimiento te comió. Quedaste en el medio de un fuego cruzado del que no pudiste salir." } },
      ],
    },
    {
      title: "Entrevista a un Referente del Movimiento",
      description: "QUERATINA consiguió a una figura histórica del peronismo. Pepe Racinclub te confía la entrevista. La audiencia del canal la espera hace semanas.",
      options: [
        { text: "Preguntas críticas, periodismo sin concesiones", detail: "La figura lo merece.", successChance: 0.42,
          success: { followers: 19000, money: 5, message: "Preguntaste lo que nadie se animaba a preguntar. La entrevista fue histórica para el canal." },
          failure: { followers: -8000, money: 0, message: "El referente se cerró y la entrevista murió antes de empezar. QUERATINA no te lo perdonó fácil." } },
        { text: "Entrevista respetuosa y de fondo", detail: "Que el entrevistado se abra solo.", successChance: 0.72,
          success: { followers: 11000, money: 3, message: "La figura habló como nunca. Momento emotivo que el canal usó durante semanas." },
          failure: { followers: -2000, money: 0, message: "Correcta pero sin momentos propios. La audiencia dice que sos tibio." } },
      ],
    },
    {
      title: "Cobertura del Festival de Cine Nacional",
      description: "QUERATINA cubre el festival de cine argentino más importante del año. Te mandan a vos a la alfombra roja y a las funciones.",
      options: [
        { text: "Análisis cinematográfico serio, película por película", detail: "El cine merece respeto.", successChance: 0.60,
          success: { followers: 8000, money: 3, message: "Tu cobertura fue la más completa del festival. El ambiente cinéfilo te empezó a seguir." },
          failure: { followers: -2000, money: 0, message: "El análisis fue demasiado técnico para la audiencia habitual del canal. Los números no acompañaron." } },
        { text: "Entrevistas al paso en la alfombra roja", detail: "El espectáculo por sobre el análisis.", successChance: 0.65,
          success: { followers: 12000, money: 4, message: "Los clips de las entrevistas circularon en todos lados. Momento espontáneo que hizo quedar bien al canal." },
          failure: { followers: -3000, money: 0, message: "Un director conocido te cortó la entrevista en vivo porque no te sabía el nombre. Viral, pero no del bueno." } },
      ],
    },
    {
      title: "Escándalo Político en Vivo",
      description: "Un dirigente cercano al canal protagoniza un escándalo en plena jornada. QUERATINA quiere reacción inmediata al aire.",
      options: [
        { text: "Cubrirlo con datos y contexto, sin apasionamiento", detail: "Periodismo antes que militancia.", successChance: 0.58,
          success: { followers: 10000, money: 3, message: "Tu cobertura fue seria y equilibrada. Te diferenciaste del ruido general." },
          failure: { followers: -3000, money: 0, message: "El canal esperaba más compromiso con la línea editorial. Quedaste como tibio." } },
        { text: "Opinar fuerte desde la línea del canal", detail: "Bancar la posición sin dudar.", successChance: 0.46,
          success: { followers: 16000, money: 4, message: "La posición fue contundente. La audiencia fiel de QUERATINA te aplaudió de pie." },
          failure: { followers: -9000, money: 0, message: "El escándalo terminó siendo un fiasco y vos quedaste defendiendo lo indefendible en vivo." } },
      ],
    },
    {
      title: QUERATINA_SONG_TITLE,
      description: "Un seguidor compuso una canción dedicada a una estrella de mar con un culo pronunciado. Sin que nadie lo planificara, el tema te involucra y te hacés viral en TikTok durante toda la semana.",
      options: [
        { text: "Te montás en el viral. Lo compartís, lo bailás, lo hacés tuyo.", detail: "Si ya sos meme, mejor serlo con dignidad.", successChance: 0.58,
          success: { followers: 22000, money: 0, message: "El momento fue glorioso. Millones de vistas, apareciste en todos los medios y la canción sonó en un programa de TV. Pepe Racinclub no entendió nada pero festejó igual." },
          failure: { followers: -5000, money: 0, message: "El intento de montarte en el viral quedó forzado. Las redes lo sintieron artificial y el chiste se convirtió en otro chiste, pero sobre vos." } },
        { text: "Lo ignorás. QUERATINA es un canal serio.", detail: "La imagen política primero.", successChance: 0.52,
          success: { followers: 3000, money: 0, message: "La decisión de no comentarlo fue leída como madurez. El viral pasó solo y tu imagen dentro del canal quedó intacta." },
          failure: { followers: -8000, money: 0, message: "Ignorarlo fue un error. Todo el mundo hablaba del tema y tu silencio hizo que parecieras molesto. Las redes te hicieron meme igual, pero sin que pudieras controlar el relato." } },
      ],
    },
  ],

  FUTUPOP: [
    {
      title: "Festival Nacional de Cumbia",
      description: "FUTUPOP cubre el festival de cumbia más convocante del año. La conducción del stream es tuya si la querés.",
      options: [
        { text: "Conducir el evento de principio a fin", detail: "La noche entera en tus manos.", successChance: 0.57,
          success: { followers: 13000, money: 5, message: "La noche fue increíble. El ambiente de la cumbia te adoptó como uno de los suyos." },
          failure: { followers: -4000, money: 0, message: "El ritmo del festival era mucho para manejarlo solo. La conducción quedó desprolija." } },
        { text: "Hacer entrevistas desde el piso", detail: "Más espontáneo y cercano.", successChance: 0.73,
          success: { followers: 7000, money: 3, message: "Las entrevistas espontáneas fueron los mejores clips de la noche." },
          failure: { followers: 800, money: 1, message: "El piso estaba muy caótico. Poco de lo que grabaste salió bien." } },
      ],
    },
    {
      title: "Entrevista a Artista Emergente",
      description: "El canal descubrió a una artista nueva que puede ser la próxima grande de la cumbia. La entrevista te la ofrecen a vos.",
      options: [
        { text: "Entrevista profunda, emotiva, sin apuro", detail: "Dejar que la historia se cuente sola.", successChance: 0.67,
          success: { followers: 9000, money: 3, message: "La artista lloró en cámara. El clip circuló en todos lados. Momento real." },
          failure: { followers: -2000, money: 0, message: "La artista se cerró. No lograste que se abriera en ningún momento." } },
        { text: "Liviano, divertido, con mucha energía", detail: "El tono del canal, respetado.", successChance: 0.71,
          success: { followers: 6000, money: 2, message: "La artista se fue sonriendo y el canal quedó contento. Trabajo limpio." },
          failure: { followers: -1000, money: 0, message: "El tono liviano no conectó con la artista. La entrevista no tuvo chispa." } },
      ],
    },
    {
      title: "Debate: ¿La Cumbia Llegó a la Alta Cultura?",
      description: "FUTUPOP organiza un debate que nadie esperaba: ¿la cumbia merece ser tomada en serio culturalmente?",
      options: [
        { text: "Defender la cumbia con todo lo que tenés", detail: "El género como expresión legítima.", successChance: 0.62,
          success: { followers: 11000, money: 2, message: "Tu defensa fue apasionada y argumentada. La audiencia te aplaudió de pie." },
          failure: { followers: -3000, money: 0, message: "Los argumentos no convencieron y quedaste como alguien sin criterio." } },
        { text: "Análisis más equilibrado con contexto histórico", detail: "El conocimiento como diferencial.", successChance: 0.57,
          success: { followers: 7000, money: 3, message: "Sorprendiste con datos y contexto. Nadie esperaba ese nivel de análisis acá." },
          failure: { followers: -4000, money: 0, message: "El análisis serio no pegó en un canal que vive del estilo de FUTUPOP." } },
      ],
    },
    {
      title: "Lanzamiento de Álbum en Exclusiva",
      description: "Un artista importante lanza su álbum y el canal tiene la exclusiva. Vos sos el presentador del evento.",
      options: [
        { text: "Improvisación total, al ritmo del artista", detail: "Fluir con la energía del momento.", successChance: 0.56,
          success: { followers: 12000, money: 4, message: "La energía del evento se transmitió a través de la pantalla. Magia en vivo." },
          failure: { followers: -5000, money: 0, message: "La improvisación generó momentos incómodos que el artista no olvidó." } },
        { text: "Presentación cuidada con datos y contexto", detail: "Darle peso al lanzamiento.", successChance: 0.70,
          success: { followers: 7000, money: 3, message: "El artista quedó impresionado. El lanzamiento tuvo la seriedad que merecía." },
          failure: { followers: -1000, money: 1, message: "Demasiado formal para el espíritu del canal. La audiencia prefería el estilo de FUTUPOP." } },
      ],
    },
    {
      title: "Escándalo en el Ambiente Cumbiero",
      description: "Dos artistas del género tienen una pelea pública y explosiva. FUTUPOP te manda a cubrir el drama.",
      options: [
        { text: "Cubrir el drama sin filtros ni moderación", detail: "El estilo puro y sin vergüenza.", successChance: 0.54,
          success: { followers: 15000, money: 3, message: "El drama fue masivo y vos estuviste en el centro de todo. Pico de audiencia." },
          failure: { followers: -6000, money: 0, message: "Los dos artistas se enojaron con el canal. Crisis con los dos lados." } },
        { text: "Nota equilibrada con los dos lados de la historia", detail: "Periodismo del estilo de FUTUPOP.", successChance: 0.68,
          success: { followers: 8000, money: 2, message: "Tu equilibrio contrastó con el caos y te diferenciaste. Inesperado en FUTUPOP." },
          failure: { followers: -2000, money: 0, message: "La audiencia del canal quería drama puro. El equilibrio los aburrió." } },
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

function buildOffers(current: Channel, isFirst: boolean, renderSold = false, excludedChannel: Channel | null = null): Channel[] {
  if (isFirst) {
    return shuffle([...ALL_CHANNELS]).slice(0, 4);
  }

  const availableChannels = ALL_CHANNELS.filter((c) => !(renderSold && c === "RENDER") && c !== excludedChannel);
  const others = shuffle(availableChannels.filter((c) => c !== current));
  // Ensure the current channel is always included as a renewal option even
  // if it matches `excludedChannel` (excludedChannel should only prevent
  // offering that channel to *new* candidates, not the renewal of the
  // player's current contract).
  const candidates = [current, ...others.slice(0, 3)];
  return candidates.filter((c) => !(renderSold && c === "RENDER") && (c !== excludedChannel || c === current));
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
  season: 1,
  eventIndex: 0,
  currentChannel: "ORTERIX",
  followers: 5200,
  reputation: 50,
  careerHistory: [],
  currentEvents: [],
  lastResult: null,
  seasonAccum: { followers: 0 },
  isFirstMarket: true,
  renderSold: false,
  usedFajenseRivals: [],
  usedEventKeys: [],
  excludedChannel: null,
  awardedAutomaticPrizes: [],
};

// ─── UI Primitives ────────────────────────────────────────────────────────────

function Delta({ v }: { v: number }) {
  if (v === 0) return <span className="font-mono" style={{ color: "#4b5563", fontSize: "1.05rem", fontWeight: 700 }}>—</span>;
  return (
    <span className="font-mono" style={{ color: v > 0 ? "#4ade80" : "#f87171", fontSize: "1.05rem", fontWeight: 700 }}>
      {v > 0 ? "+" : "-"}{fmt(v)}
    </span>
  );
}

function Pips({ n, max, color }: { n: number; max: number; color: string }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: i < n ? color : "rgba(255,255,255,0.1)" }} />
      ))}
    </div>
  );
}

// ─── HUD ──────────────────────────────────────────────────────────────────────

function HUD({ gs }: { gs: GameState }) {
  const ch = CHANNELS[gs.currentChannel] ?? FALLBACK_CHANNEL;
  return (
    <div className="fixed top-0 left-0 right-0 z-50"
      style={{ background: "rgba(7,7,14,0.9)", borderBottom: "1px solid rgba(124,58,237,0.2)", backdropFilter: "blur(16px)" }}>
      <div className="max-w-3xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4 flex-wrap">
        {/* Brand + channel */}
        <div className="flex items-center gap-3 min-w-0 shrink-0">
          <span className="font-black text-sm tracking-widest" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#7c3aed" }}>
            STREAMERO
          </span>
          {!gs.isFirstMarket && (
            <>
              <span style={{ color: "#2a2a40" }}>|</span>
              <span className="font-bold text-xs tracking-widest truncate max-w-[120px]"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", color: ch.accent }}>
                {ch.shortName}
              </span>
            </>
          )}
          {gs.streamerName && (
            <>
              <span style={{ color: "#2a2a40" }}>|</span>
              <span className="text-xs font-mono truncate max-w-[80px]" style={{ color: "#7070a0" }}>{gs.streamerName}</span>
            </>
          )}
        </div>

        {/* Season dots */}
        <div className="flex items-center gap-1 shrink-0">
          {Array.from({ length: SEASONS }, (_, i) => (
            <div key={i} className="rounded-full transition-all duration-300"
              style={{
                width: i === gs.season - 1 ? 8 : 5,
                height: i === gs.season - 1 ? 8 : 5,
                background: i < gs.season - 1 ? "#7c3aed" : i === gs.season - 1 ? ch.accent : "#1e1e3a",
                border: i === gs.season - 1 ? `1px solid ${ch.color}` : "none",
              }} />
          ))}
          <span className="ml-1 font-mono text-xs" style={{ color: "#5050a0" }}>T{gs.season}/{SEASONS}</span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-5 shrink-0">
          <div className="text-center">
            <p className="font-mono text-xs" style={{ color: "#7070a0" }}>👥 {fmt(gs.followers)}</p>
          </div>
          <div className="text-center">
            <p className="font-mono text-xs" style={{ color: "#7070a0" }}>🏅 {gs.reputation}</p>
          </div>
        </div>
      </div>
    </div>
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
          <p className="font-semibold" style={{ color: "#c4c4e8" }}>Ese crecimiento llamó la atención de un canal de streaming.</p>
          <p className="font-bold text-base" style={{ color: "#eaeaff" }}>Hoy recibiste tu primera propuesta.</p>
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

function ScreenNaming({ onConfirm }: { onConfirm: (name: string) => void }) {
  const [val, setVal] = useState("");
  const submit = () => { if (val.trim()) onConfirm(val.trim()); };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        className="max-w-sm w-full flex flex-col gap-8 items-center text-center">
        <div>
          <p className="font-mono text-xs tracking-[0.3em] mb-2" style={{ color: "#7070a0" }}>ANTES DE EMPEZAR</p>
          <h2 className="font-black text-4xl" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>¿Cómo te llaman?</h2>
          <p className="text-sm mt-2" style={{ color: "#7070a0" }}>Tu nombre de streamer. Con ese nombre vas a construir toda tu carrera.</p>
        </div>
        <div className="w-full flex flex-col gap-3">
          <input value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()}
            autoFocus maxLength={24} placeholder="xXTuNombreXx"
            className="w-full px-5 py-4 rounded-xl font-bold text-xl text-center outline-none transition-all duration-200"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", background: "#181830",
              border: val.trim() ? "1px solid #7c3aed" : "1px solid rgba(124,58,237,0.2)", color: "#eaeaff", letterSpacing: "0.08em" }} />
          <motion.button onClick={submit} disabled={!val.trim()} whileHover={val.trim() ? { scale: 1.03 } : {}} whileTap={val.trim() ? { scale: 0.97 } : {}}
            className="w-full py-4 rounded-xl font-black text-base tracking-widest uppercase transition-all duration-200"
            style={{ fontFamily: "'Barlow Condensed', sans-serif",
              background: val.trim() ? "linear-gradient(135deg, #7c3aed, #a855f7)" : "#181830",
              color: val.trim() ? "#fff" : "#4b5563",
              boxShadow: val.trim() ? "0 0 24px rgba(124,58,237,0.4)" : "none" }}>
            Confirmar nombre
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

function ScreenTransferMarket({ gs, onChoose }: { gs: GameState; onChoose: (ch: Channel) => void }) {
  const offers = buildOffers(gs.currentChannel, gs.isFirstMarket, gs.renderSold, gs.excludedChannel ?? null);

  return (
    <div className="min-h-screen flex flex-col px-6 pt-24 pb-12 relative">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px]"
          style={{ background: "radial-gradient(ellipse, rgba(245,158,11,0.06) 0%, transparent 70%)" }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        className="max-w-2xl mx-auto w-full flex flex-col gap-6 relative z-10">
        <div>
          <p className="font-mono text-xs tracking-[0.3em] mb-1 uppercase" style={{ color: "#f59e0b" }}>
            {gs.isFirstMarket ? "PRIMERA PROPUESTA" : `MERCADO DE PASES · TRAS TEMPORADA ${gs.season - 1}`}
          </p>
          <h2 className="font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(2rem, 7vw, 3.5rem)" }}>
            {gs.isFirstMarket ? "TU PRIMER CONTRATO" : "MERCADO DE PASES"}
          </h2>
          <p className="text-sm mt-1.5" style={{ color: "#7070a0" }}>
            {gs.isFirstMarket
              ? "Los canales que llegaron a vos. Elegí bien."
              : "Las propuestas que llegaron esta ventana. El orden es al azar."}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {offers.map((channel) => {
            const info = CHANNELS[channel] ?? FALLBACK_CHANNEL;
            const isCurrent = !gs.isFirstMarket && channel === gs.currentChannel;
            return (
              <motion.button key={channel} onClick={() => onChoose(channel)}
                whileHover={{ scale: 1.02, y: -3 }} whileTap={{ scale: 0.98 }}
                className="text-left rounded-2xl p-5 flex flex-col gap-4 relative transition-all duration-200"
                style={{
                  background: `linear-gradient(140deg, ${info.color}14, ${info.accent}08)`,
                  border: isCurrent ? `2px solid ${info.color}` : `1px solid ${info.color}38`,
                  boxShadow: isCurrent ? `0 0 20px ${info.glow}` : "none",
                }}>
                {isCurrent && (
                  <span className="absolute top-3.5 right-3.5 text-xs font-mono px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: info.color, color: "#fff" }}>Renovar</span>
                )}
                <div>
                  <div className="flex items-center gap-2.5 mb-2">
                    {info.logo ? (
                      <img
                        src={info.logo}
                        alt={info.shortName}
                        className="h-12 w-12 sm:h-14 sm:w-14 object-contain shrink-0"
                      />
                    ) : null}
                    <h3 className="font-black text-3xl sm:text-[34px] leading-none tracking-wider"
                      style={{ fontFamily: "'Barlow Condensed', sans-serif", color: channel === "RENDER" ? "#ffffff" : info.accent, fontWeight: 900 }}>
                      {info.shortName}
                    </h3>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: "#6060a0" }}>{info.tagline}</p>
                  {info.figure !== "–" && (
                    <p className="text-xs mt-1 font-mono" style={{ color: channel === "RENDER" ? "#ffffff" : info.accent }}>
                      Figura: {info.figure}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  <div>
                    <p className="text-xs font-mono mb-1.5" style={{ color: "#6060a0" }}>Remuneración</p>
                    <Pips n={info.remuneration} max={5} color={channel === "RENDER" ? "#ffffff" : info.accent} />
                    <p className="text-xs font-mono mt-1" style={{ color: "#5050a0" }}>
                      {["", "Mínima", "Baja", "Media", "Alta", "Muy alta"][info.remuneration]}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-mono mb-1.5" style={{ color: "#6060a0" }}>Alcance</p>
                    <Pips n={info.reach} max={5} color={channel === "RENDER" ? "#ffffff" : info.accent} />
                    <p className="text-xs font-mono mt-1" style={{ color: "#5050a0" }}>
                      {["", "Mínimo", "Bajo", "Medio", "Alto", "Muy alto"][info.reach]}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-mono mb-1.5" style={{ color: "#6060a0" }}>Exigencia</p>
                    <p className="text-sm">{info.demand === "Baja" ? "🟢" : info.demand === "Media" ? "🟡" : "🔴"}</p>
                    <p className="text-xs font-mono mt-0.5" style={{ color: info.demand === "Alta" ? "#f87171" : info.demand === "Media" ? "#fbbf24" : "#4ade80" }}>
                      {info.demand}
                    </p>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

function PrizeShowcase({ prizes }: { prizes: AwardedPrize[] }) {
  if (prizes.length === 0) return null;

  const rows: AwardedPrize[][] = [];
  for (let index = 0; index < prizes.length; index += 1) {
    const rowIndex = Math.floor(index / 3);
    if (!rows[rowIndex]) rows[rowIndex] = [];
    rows[rowIndex].push(prizes[index]);
  }

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: "rgba(15,15,30,0.74)", border: "1px solid rgba(124,58,237,0.18)", boxShadow: "0 0 20px rgba(124,58,237,0.08)" }}>
      <div className="px-3 py-2 text-[10px] font-mono tracking-[0.24em] uppercase text-center"
        style={{ color: "#a0a0d0", background: "rgba(15,15,30,0.85)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        VITRINA DE PREMIOS
      </div>
      <div className="flex flex-col gap-3 p-3">
        {rows.map((row, rowIndex) => (
          <div key={`row-${rowIndex}`} className="grid grid-cols-3 gap-2">
            {row.map((prize) => (
              <motion.div
                key={prize.id}
                initial={{ opacity: 0, scale: 0.6, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col items-center justify-center gap-1.5 text-center min-w-0"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-lg"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <img src={`/assets/${prize.icon}`} alt={prize.name} className="h-8 w-8 object-contain" />
                </div>
                <span className="font-mono text-[10px] font-bold" style={{ color: "#d9d9f6" }}>x{prize.count}</span>
              </motion.div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function ScreenEvent({ gs, onChoose, onContinueAutomatic }: { gs: GameState; onChoose: (idx: number) => void; onContinueAutomatic: () => void }) {
  const ev = gs.currentEvents[gs.eventIndex];
  const ch = CHANNELS[gs.currentChannel] ?? FALLBACK_CHANNEL;
  const isSpecial = ev.title.startsWith("⚡");
  const isAutomatic = ev.type === "automatic";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 pt-20 pb-12 relative overflow-hidden">
      {isSpecial && (
        <div className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(159,18,57,0.12) 0%, transparent 60%)" }} />
      )}
      {ch.logo ? (
        <img
          src={ch.logo}
          alt=""
          className="pointer-events-none absolute -left-5 top-16 w-[260px] sm:w-[300px] md:w-[360px] lg:w-[420px] object-contain opacity-[0.12]"
          style={{ zIndex: 0 }}
        />
      ) : null}
      <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45 }}
        className="max-w-5xl w-full relative z-10">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
          <div className="flex flex-col gap-4 lg:pt-[54px]">
            <PrizeShowcase prizes={gs.awardedAutomaticPrizes} />
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-xs tracking-[0.25em] uppercase" style={{ color: "#7070a0" }}>
                  Temporada {gs.season} · Evento {gs.eventIndex + 1}/{EVENTS_PER_SEASON}
                </p>
                <div className="flex gap-1.5 mt-2">
                  {Array.from({ length: EVENTS_PER_SEASON }, (_, i) => (
                    <div key={i} className="h-1 rounded-full transition-all duration-300"
                      style={{ width: i === gs.eventIndex ? 28 : 16,
                        background: i < gs.eventIndex ? ch.color : i === gs.eventIndex ? ch.accent : "rgba(255,255,255,0.07)" }} />
                  ))}
                </div>
              </div>
              <span className="font-black text-sm tracking-widest px-3 py-1 rounded-lg"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", background: `${ch.color}20`, color: ch.accent, border: `1px solid ${ch.color}38` }}>
                {ch.shortName}
              </span>
            </div>

            <div className="rounded-2xl p-6"
              style={{ background: "rgba(15,15,30,0.8)",
                border: isSpecial ? "1px solid rgba(159,18,57,0.5)" : "1px solid rgba(124,58,237,0.15)",
                boxShadow: isSpecial ? "0 0 32px rgba(159,18,57,0.15)" : "none" }}>
              {isSpecial && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-3 text-xs font-mono font-semibold"
                  style={{ background: "rgba(159,18,57,0.2)", border: "1px solid rgba(159,18,57,0.4)", color: "#fb7185" }}>
                  EVENTO ESPECIAL
                </div>
              )}
              <h2 className="font-black text-3xl mb-3 leading-tight" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                {ev.title}
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: "#9090b8" }}>{ev.description}</p>
            </div>

            {isAutomatic ? (
              <div className="flex flex-col gap-3">
                <div className="rounded-2xl p-5"
                  style={{ background: "rgba(15,15,30,0.65)", border: "1px solid rgba(124,58,237,0.15)" }}>
                  <p className="text-xs font-mono tracking-widest uppercase mb-3" style={{ color: "#7070a0" }}>Consecuencias</p>
                  {(ev.consequences ?? []).length > 0 && (
                    <div className="flex flex-col gap-4">
                      <div className="text-sm leading-relaxed" style={{ color: "#c0c0e0" }}>
                        {(ev.consequences ?? []).find((delta) => delta.message)?.message || ""}
                      </div>
                      <div className="flex flex-wrap items-center gap-4">
                        {(ev.consequences ?? []).flatMap((delta, deltaIndex) => {
                          const items: Array<{ key: string; icon: string; value: number }> = [];
                          if (delta.followers !== undefined) {
                            items.push({ key: `followers-${deltaIndex}`, icon: "👥", value: delta.followers });
                          }
                          if (delta.reputation !== undefined) {
                            items.push({ key: `reputation-${deltaIndex}`, icon: "🏅", value: delta.reputation });
                          }
                          return items;
                        }).map((item) => (
                          <div key={item.key} className="flex items-center gap-2">
                            <span className="text-sm">{item.icon}</span>
                            <Delta v={item.value} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <motion.button onClick={onContinueAutomatic} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="w-full py-4 rounded-xl font-black text-base tracking-widest uppercase"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif", background: "linear-gradient(135deg, #7c3aed, #a855f7)", color: "#fff" }}>
                  CONTINUAR
                </motion.button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-xs font-mono tracking-widest uppercase" style={{ color: "#7070a0" }}>¿Qué decidís?</p>
                {(ev.options ?? []).map((opt, i) => (
                  <motion.button key={i} onClick={() => onChoose(i)}
                    whileHover={{ scale: 1.02, x: 5 }} whileTap={{ scale: 0.98 }}
                    className="text-left p-5 rounded-xl transition-all duration-200"
                    style={{ background: "rgba(15,15,30,0.6)", border: "1px solid rgba(124,58,237,0.15)" }}>
                    <div className="flex items-start gap-4">
                      <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5"
                        style={{ background: `${ch.color}28`, color: ch.accent, fontFamily: "'Barlow Condensed', sans-serif" }}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      <div>
                        <p className="font-semibold text-sm" style={{ color: "#eaeaff" }}>{normalizeOptionText(opt.text)}</p>
                        <p className="text-xs mt-0.5" style={{ color: "#7070a0" }}>{opt.detail}</p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function ScreenEventResult({ gs, onContinue }: { gs: GameState; onContinue: () => void }) {
  const r = gs.lastResult!;
  const ch = CHANNELS[gs.currentChannel] ?? FALLBACK_CHANNEL;
  const ok = r.wasSuccess;
  const isForced = r.delta.specialOutcome === "forcedTransfer";
  const consequences = [
    { icon: "👥", label: "Seguidores", value: r.delta.followers },
    ...(r.delta.reputation ? [{ icon: "🏅", label: "Reputación", value: r.delta.reputation }] : []),
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 pt-20 pb-12 relative">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
          style={{ background: `radial-gradient(circle, ${isForced ? "rgba(159,18,57,0.12)" : ok ? "rgba(34,197,94,0.09)" : "rgba(239,68,68,0.09)"} 0%, transparent 68%)` }} />
      </div>

      <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-md w-full flex flex-col items-center gap-7 relative z-10">
        <div className="text-center">
          <motion.div initial={{ scale: 0, rotate: -15 }} animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 22, delay: 0.1 }}
            className="text-6xl mb-3">
            {isForced ? "🏚️" : ok ? "🔥" : "💧"}
          </motion.div>
          <p className="font-mono text-xs tracking-[0.35em] uppercase mb-2"
            style={{ color: isForced ? "#fb7185" : ok ? "#4ade80" : "#f87171" }}>
            {isForced ? "Canal vendido" : ok ? "¡Éxito!" : "Fracaso"}
          </p>
          <h2 className="font-black text-3xl mb-1" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            {r.eventTitle.replace("⚡ ", "")}
          </h2>
          <p className="text-xs font-mono" style={{ color: "#7070a0" }}>"{r.optionText}"</p>
        </div>

        <div className="w-full rounded-2xl p-6 flex flex-col gap-5"
          style={{ background: "rgba(15,15,30,0.85)",
            border: `1px solid ${isForced ? "rgba(159,18,57,0.4)" : ok ? "rgba(74,222,128,0.25)" : "rgba(248,113,113,0.25)"}` }}>
          {r.delta.message ? (
            <p className="text-sm leading-relaxed text-center" style={{ color: "#c0c0e0" }}>{r.delta.message}</p>
          ) : null}

          {isForced && (
            <div className="px-4 py-3 rounded-xl text-xs font-mono text-center"
              style={{ background: "rgba(159,18,57,0.12)", border: "1px solid rgba(159,18,57,0.3)", color: "#fb7185" }}>
              ⚡ Vas al Mercado de Pases de inmediato. Tenés que encontrar nuevo canal.
            </div>
          )}

          <div className="h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
          <div className="grid w-full grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-6 px-2">
            {consequences.map(({ icon, label, value }) => (
              <div key={label} className="min-w-[110px] flex flex-col items-center text-center gap-2">
                <p className="font-mono mb-0 inline-flex items-center justify-center gap-1" style={{ color: "#7070a0", fontSize: "1.55rem", fontWeight: 700, marginTop: "-0.12rem" }}>
                  {icon} {label}
                </p>
                <Delta v={value} />
              </div>
            ))}
          </div>
        </div>

        <motion.button onClick={onContinue} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          className="w-full py-4 rounded-xl font-black text-base tracking-widest uppercase"
          style={{ fontFamily: "'Barlow Condensed', sans-serif",
            background: isForced
              ? "linear-gradient(135deg, #9f1239, #fb7185)"
              : ok
              ? "linear-gradient(135deg, #166534, #22c55e)"
              : `linear-gradient(135deg, ${ch.color}99, ${ch.color})`,
            color: "#fff" }}>
          {isForced ? "Ir al Mercado de Pases →" : "Continuar →"}
        </motion.button>
      </motion.div>
    </div>
  );
}

function ScreenSeasonSummary({ gs, onContinue }: { gs: GameState; onContinue: () => void }) {
  const ch = CHANNELS[gs.currentChannel] ?? FALLBACK_CHANNEL;
  const passive = ch.passiveMoney;
  const isLast = gs.season === SEASONS;
  const isMarket = !isLast;
  const nextLabel = isLast ? "Ver resumen final →" : "Ir al Mercado de Pases →";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 pt-20 pb-12">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        className="max-w-md w-full flex flex-col gap-7">
        <div className="text-center">
          <p className="font-mono text-xs tracking-[0.3em] mb-1 uppercase" style={{ color: "#7070a0" }}>Resumen</p>
          <h2 className="font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(2.4rem, 10vw, 4rem)" }}>
            TEMPORADA {gs.season}
          </h2>
          <p className="text-sm mt-1 font-mono" style={{ color: "#6060a0" }}>
            {gs.streamerName && <span className="text-muted-foreground">{gs.streamerName} · </span>}
            <span style={{ color: ch.accent }}>{ch.shortName}</span>
          </p>
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(124,58,237,0.18)" }}>
          <div className="px-5 py-2.5 text-xs font-mono tracking-widest uppercase"
            style={{ background: "rgba(15,15,30,0.7)", borderBottom: "1px solid rgba(255,255,255,0.04)", color: "#7070a0" }}>
            Movimientos de la temporada
          </div>
          {[{ icon: "👥", label: "Seguidores", v: gs.seasonAccum.followers }].map(({ icon, label, v }, i) => (
            <div key={label} className="flex items-center justify-between px-5 py-4"
              style={{ background: "rgba(15,15,30,0.45)", borderTop: i > 0 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
              <span className="text-sm font-mono flex gap-2" style={{ color: "#9090b8" }}><span>{icon}</span>{label}</span>
              <Delta v={v} />
            </div>
          ))}
          <div className="flex items-center justify-between px-5 py-4"
            style={{ background: "rgba(15,15,30,0.45)", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
            <span className="text-sm font-mono flex gap-2" style={{ color: "#9090b8" }}>
              <span>🏢</span>Contrato con {ch.shortName}
            </span>
            <span className="font-mono font-semibold text-sm" style={{ color: "#f59e0b" }}>+${passive}K</span>
          </div>
        </div>

        {isMarket && (
          <div className="rounded-xl px-4 py-3 text-xs font-mono text-center"
            style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)", color: "#f59e0b" }}>
            ⚡ Se abre el Mercado de Pases. Podés quedarte o cambiar de canal.
          </div>
        )}

        <motion.button onClick={onContinue} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          className="w-full py-4 rounded-xl font-black text-base tracking-widest uppercase"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", background: `linear-gradient(135deg, ${ch.color}, ${ch.accent})`, color: "#fff" }}>
          {nextLabel}
        </motion.button>
      </motion.div>
    </div>
  );
}

function ScreenGameOver({ gs }: { gs: GameState }) {
  const rating = getFinalRating(gs.followers);
  return (
    <div className="min-h-screen flex flex-col items-center justify-start px-6 py-12 overflow-y-auto relative">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: `radial-gradient(circle, ${rating.color}10 0%, transparent 65%)` }} />
        <div className="absolute inset-0 opacity-[0.022]"
          style={{ backgroundImage: "linear-gradient(#7c3aed 1px, transparent 1px), linear-gradient(90deg, #7c3aed 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
        className="max-w-lg w-full flex flex-col gap-7 relative z-10 mt-4">
        <div className="text-center">
          <p className="font-mono text-xs tracking-[0.3em] mb-2 uppercase" style={{ color: "#7070a0" }}>Fin de Carrera · {SEASONS} Temporadas</p>
          {gs.streamerName && (
            <p className="font-black text-2xl mb-1" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#8080b0" }}>
              {gs.streamerName.toUpperCase()}
            </p>
          )}
          <h2 className="font-black mb-4" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(2.5rem, 10vw, 4.5rem)" }}>
            TU CARRERA TERMINÓ
          </h2>
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3, type: "spring" }}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-lg tracking-widest"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", background: `${rating.color}18`, border: `1px solid ${rating.color}50`, color: rating.color }}>
            <span>{rating.emoji}</span>{rating.label.toUpperCase()}
          </motion.div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {[
            { icon: "👥", label: "Seguidores finales", val: fmt(gs.followers) },
          ].map(({ icon, label, val }) => (
            <div key={label} className="flex flex-col items-center gap-2 py-5 rounded-xl"
              style={{ background: "rgba(15,15,30,0.7)", border: "1px solid rgba(124,58,237,0.16)" }}>
              <span className="text-2xl">{icon}</span>
              <span className="font-mono font-bold" style={{ color: "#eaeaff" }}>{val}</span>
              <span className="text-xs font-mono text-center px-2" style={{ color: "#7070a0" }}>{label}</span>
            </div>
          ))}
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(124,58,237,0.18)" }}>
          <div className="px-5 py-2.5 text-xs font-mono tracking-widest uppercase"
            style={{ background: "rgba(15,15,30,0.7)", borderBottom: "1px solid rgba(255,255,255,0.04)", color: "#7070a0" }}>
            Historial de canales
          </div>
          {gs.careerHistory.length === 0 ? (
            <div className="px-5 py-4 text-sm" style={{ color: "#7070a0" }}>Sin historial.</div>
          ) : (
            gs.careerHistory.map((e, i) => {
              const info = CHANNELS[e.channel] ?? FALLBACK_CHANNEL;
              return (
                <div key={i} className="flex items-center justify-between px-5 py-4"
                  style={{ background: "rgba(15,15,30,0.5)", borderTop: i > 0 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: info.color }} />
                    <div className="min-w-0">
                      <span className="font-black text-sm tracking-wider block"
                        style={{ fontFamily: "'Barlow Condensed', sans-serif", color: info.accent }}>
                        {info.shortName}
                      </span>
                      {info.figure !== "–" && (
                        <span className="text-xs font-mono" style={{ color: "#5050a0" }}>Fig: {info.figure}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs font-mono flex-shrink-0" style={{ color: "#7070a0" }}>{e.seasons} temp.</span>
                </div>
              );
            })
          )}
          <div className="flex items-center justify-between px-5 py-4"
            style={{ background: "rgba(15,15,30,0.5)", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
            <span className="text-xs font-mono" style={{ color: "#7070a0" }}>Canal donde terminaste</span>
            <span className="font-black text-sm tracking-wider"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", color: (CHANNELS[gs.currentChannel] ?? FALLBACK_CHANNEL).accent }}>
              {(CHANNELS[gs.currentChannel] ?? FALLBACK_CHANNEL).shortName}
            </span>
          </div>
        </div>

        <motion.button onClick={() => window.location.reload()} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          className="w-full py-4 rounded-xl font-black text-base tracking-widest uppercase"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", background: "linear-gradient(135deg, #7c3aed, #a855f7)", color: "#fff", boxShadow: "0 0 20px rgba(124,58,237,0.35)" }}>
          Nueva Carrera
        </motion.button>
      </motion.div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [gs, setGs] = useState<GameState>(INIT);

  useEffect(() => {
    try {
      const ex = localStorage.getItem("streamero.excludedChannel");
      if (ex && ALL_CHANNELS.includes(ex as Channel)) {
        setGs((s) => ({ ...s, excludedChannel: ex as Channel }));
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Re-read markdown event files at startup so newly added automatic
  // events become available without changing the parser or selection logic.
  useEffect(() => {
    // fire-and-forget; any errors are logged inside refreshDocEvents
    refreshDocEvents();
  }, []);

  

  const applyDelta = (delta: StatDelta, s: GameState) => {
    const nextFollowers = Math.max(0, s.followers + delta.followers);
    const nextAwards = awardAutomaticPrizes(nextFollowers, s.awardedAutomaticPrizes);
    return {
      followers: nextFollowers,
      reputation: Math.min(100, Math.max(0, s.reputation + (delta.reputation ?? 0))),
      seasonAccum: {
        followers: s.seasonAccum.followers + delta.followers,
      },
      awardedAutomaticPrizes: nextAwards,
    };
  };

  const applyDeltas = (deltas: StatDelta[], s: GameState) => deltas.reduce((acc, delta) => ({ ...acc, ...applyDelta(delta, acc) }), s);

  const handleIntroNext = useCallback(() => setGs((s) => ({ ...s, phase: "naming" })), []);

  const handleNamingConfirm = useCallback((name: string) => {
    setGs((s) => ({ ...s, streamerName: name, phase: "transferMarket" }));
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
      return {
        ...s,
        currentChannel: channel,
        phase: "event",
        eventIndex: 0,
        currentEvents: events,
        seasonAccum: { followers: 0 },
        isFirstMarket: false,
        usedFajenseRivals: usedRivals,
        usedEventKeys: nextUsedEventKeys,
        awardedAutomaticPrizes: awardAutomaticPrizes(s.followers, s.awardedAutomaticPrizes),
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
      return { ...s, ...applyDelta(delta, s), phase: "eventResult",
        lastResult: { eventTitle: ev.title, optionText: opt.text, wasSuccess: ok, delta } };
    });
  }, []);

  const handleAutomaticContinue = useCallback(() => {
    setGs((s) => {
      const ev = s.currentEvents[s.eventIndex];
      const nextState = applyDeltas(ev?.consequences ?? [], s);
      if (s.eventIndex < EVENTS_PER_SEASON - 1) return { ...nextState, phase: "event", eventIndex: s.eventIndex + 1 };
      return { ...nextState, phase: "seasonSummary" };
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
        // Exclude the channel that just ejected the player from future market offers
        const excluded = s.currentChannel;
        if (s.season >= SEASONS) {
          try { localStorage.setItem("streamero.excludedChannel", excluded); } catch (e) {}
          return { ...s, careerHistory: hist, renderSold: true, excludedChannel: excluded, phase: "gameOver" };
        }
        try { localStorage.setItem("streamero.excludedChannel", excluded); } catch (e) {}
        return { ...s, season: nextSeason, careerHistory: hist, renderSold: true, excludedChannel: excluded, phase: "transferMarket", isFirstMarket: false };
      }

      if (s.eventIndex < EVENTS_PER_SEASON - 1) return { ...s, phase: "event", eventIndex: s.eventIndex + 1 };
      return { ...s, phase: "seasonSummary" };
    });
  }, []);

  const handleSeasonContinue = useCallback(() => {
    setGs((s) => {
      const hist = [...s.careerHistory];
      const idx = hist.findIndex((e) => e.channel === s.currentChannel);
      if (idx >= 0) hist[idx] = { ...hist[idx], seasons: hist[idx].seasons + 1 };
      else hist.push({ channel: s.currentChannel, seasons: 1 });

      if (s.season >= SEASONS) return { ...s, careerHistory: hist, phase: "gameOver" };

      const nextSeason = s.season + 1;
      return { ...s, season: nextSeason, careerHistory: hist, phase: "transferMarket", isFirstMarket: false };
    });
  }, []);

  const showHUD = gs.phase !== "intro" && gs.phase !== "naming" && gs.phase !== "gameOver";

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
      {showHUD && <HUD gs={gs} />}
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
            <ScreenTransferMarket gs={gs} onChoose={handleChooseChannel} />
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
        {gs.phase === "gameOver" && (
          <motion.div key="gameover" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
            <ScreenGameOver gs={gs} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
