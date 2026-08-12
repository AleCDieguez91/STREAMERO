import channelsMarkdown from "../../../assets/docs/CHANNELS.md?raw";

export type ChannelAffinityId =
  | "ORTERIX" | "ALGA" | "ASS" | "RUZU TV"
  | "RENDER" | "CARANCHO" | "QUERATINA" | "FUTUPOP";

export type AffinityMatch = "favored" | "neutral" | "disfavored";

export interface ChannelAffinityProfile {
  favoredTypes: string[];
  disfavoredTypes: string[];
  favoredPersonalities: string[];
  disfavoredPersonalities: string[];
}

export interface ChannelAffinityResult {
  score: number;
  typeMatch: AffinityMatch;
  personalityMatch: AffinityMatch;
}

function readList(section: string, property: string): string[] {
  const line = section.match(new RegExp(`^${property}:\\s*(.+)$`, "mi"));
  return line ? line[1].split(",").map((value) => value.trim()).filter(Boolean) : [];
}

/** Lee las afinidades declaradas en CHANNELS.md, sin duplicarlas en TypeScript. */
export function parseChannelAffinities(markdown: string): Partial<Record<ChannelAffinityId, ChannelAffinityProfile>> {
  const sections = markdown.split(/(?=^# )/m);

  return sections.reduce<Partial<Record<ChannelAffinityId, ChannelAffinityProfile>>>((channels, section) => {
    const name = section.match(/^#\s+(.+)$/m)?.[1].trim() as ChannelAffinityId | undefined;
    if (!name || !["ORTERIX", "ALGA", "ASS", "RUZU TV", "RENDER", "CARANCHO", "QUERATINA", "FUTUPOP"].includes(name)) return channels;

    channels[name] = {
      favoredTypes: readList(section, "TIPO_FAVORECIDO"),
      disfavoredTypes: readList(section, "TIPO_DESFAVORECIDO"),
      favoredPersonalities: readList(section, "PERSONALIDAD_FAVORECIDA"),
      disfavoredPersonalities: readList(section, "PERSONALIDAD_DESFAVORECIDA"),
    };
    return channels;
  }, {});
}

export const CHANNEL_AFFINITIES = parseChannelAffinities(channelsMarkdown);

function normalize(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, "").replace("opinionpolitica", "politica");
}

function getMatch(value: string, favored: string[], disfavored: string[]): AffinityMatch {
  const normalizedValue = normalize(value);
  if (favored.some((candidate) => normalize(candidate) === normalizedValue)) return "favored";
  if (disfavored.some((candidate) => normalize(candidate) === normalizedValue)) return "disfavored";
  return "neutral";
}

export function calculateChannelAffinity(
  channel: ChannelAffinityProfile | undefined,
  streamerType: string,
  personality: string,
): ChannelAffinityResult {
  const typeMatch = getMatch(streamerType, channel?.favoredTypes ?? [], channel?.disfavoredTypes ?? []);
  const personalityMatch = getMatch(personality, channel?.favoredPersonalities ?? [], channel?.disfavoredPersonalities ?? []);
  const typeScore = typeMatch === "favored" ? 25 : typeMatch === "disfavored" ? -25 : 0;
  const personalityScore = personalityMatch === "favored" ? 25 : personalityMatch === "disfavored" ? -25 : 0;
  const score = Math.max(0, Math.min(100, 50 + typeScore + personalityScore));

  return { score, typeMatch, personalityMatch };
}

export function getChannelAffinity(channel: ChannelAffinityId, streamerType: string, personality: string): ChannelAffinityResult {
  return calculateChannelAffinity(CHANNEL_AFFINITIES[channel], streamerType, personality);
}

export function getAffinityOfferWeight(score: number): number {
  if (score >= 95) return 8;
  if (score >= 75) return 5;
  if (score >= 60) return 3;
  if (score <= 5) return 0.25;
  if (score <= 25) return 0.5;
  if (score <= 40) return 1;
  return 2;
}
