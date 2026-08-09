export type StreamerType = "Reacción" | "Gamer" | "Opinión Política";

export interface StreamerAffinityProfile {
  streamerType: StreamerType;
}

export interface ChannelAffinityProfile {
  baseReach: number;
  preferredStreamerTypes?: StreamerType[];
}

export interface CompatibilityBreakdown {
  streamerType: number | null;
  total: number;
}

export interface ContractEvaluation {
  compatibility: CompatibilityBreakdown;
  personalizedReach: number;
  reachPips: number;
  exposureMultiplier: number;
}

export interface ReachScaledOutcome {
  followers: number;
  popularity: number;
  multiplier: number;
}

export interface ChannelInterestInput {
  compatibility: number;
  popularity: number;
  followers: number;
  recentPerformance: number;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function roundOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

/** Los tipos cercanos conservan compatibilidad parcial. */
export function calculateStreamerTypeCompatibility(
  streamerType: StreamerType,
  preferredTypes?: StreamerType[],
): number | null {
  if (!preferredTypes?.length) return null;
  if (preferredTypes.includes(streamerType)) return 100;

  return Math.max(...preferredTypes.map((preferredType) => {
    const pair = new Set<StreamerType>([streamerType, preferredType]);
    if (pair.has("Reacción") && pair.has("Gamer")) return 60;
    if (pair.has("Reacción") && pair.has("Opinión Política")) return 35;
    return 10;
  }));
}

/**
 * La afinidad de contrato depende solamente del tipo de streamer. La personalidad
 * se guarda en el perfil, pero todavía no modifica ningún cálculo.
 */
export function calculateCompatibility(
  streamer: StreamerAffinityProfile,
  channel: ChannelAffinityProfile,
): CompatibilityBreakdown {
  const streamerType = calculateStreamerTypeCompatibility(streamer.streamerType, channel.preferredStreamerTypes);

  return {
    streamerType,
    total: streamerType ?? 100,
  };
}

export function reachToPips(reach: number): number {
  return clamp(Math.round(clamp(reach, 0, 100) / 20), 1, 5);
}

export function calculateExposureMultiplier(reach: number): number {
  return roundOneDecimal(0.6 + 0.8 * (clamp(reach, 0, 100) / 100));
}

export function evaluateContract(
  streamer: StreamerAffinityProfile,
  channel: ChannelAffinityProfile,
): ContractEvaluation {
  const compatibility = calculateCompatibility(streamer, channel);
  const baseReach = clamp(channel.baseReach, 0, 100);
  const personalizedReach = roundOneDecimal(
    baseReach * (0.25 + 0.75 * (compatibility.total / 100)),
  );

  return {
    compatibility,
    personalizedReach,
    reachPips: reachToPips(personalizedReach),
    exposureMultiplier: calculateExposureMultiplier(personalizedReach),
  };
}

export function scaleOutcomeByReach(
  followers: number,
  popularity: number | undefined,
  reach: number,
): ReachScaledOutcome {
  const multiplier = calculateExposureMultiplier(reach);
  const scaledFollowers = Math.round(followers * multiplier);
  const derivedPopularity = followers === 0
    ? 0
    : Math.sign(followers) * Math.max(1, Math.round(1 + 2 * (clamp(reach, 0, 100) / 100)));
  const scaledPopularity = popularity === undefined
    ? derivedPopularity
    : Math.round(popularity * multiplier);

  return { followers: scaledFollowers, popularity: scaledPopularity, multiplier };
}

export function calculateFollowerScore(followers: number): number {
  const safeFollowers = Math.max(0, followers);
  const maximumReference = Math.log10(1 + 1_000_000 / 5_000);
  const score = (Math.log10(1 + safeFollowers / 5_000) / maximumReference) * 100;
  return roundOneDecimal(clamp(score, 0, 100));
}

export function calculateChannelInterest(input: ChannelInterestInput): number {
  const followerScore = calculateFollowerScore(input.followers);
  const score = clamp(input.compatibility, 0, 100) * 0.45
    + clamp(input.popularity, 0, 100) * 0.25
    + followerScore * 0.2
    + clamp(input.recentPerformance, 0, 100) * 0.1;

  return roundOneDecimal(score);
}

export function getInterestThreshold(demand: "Baja" | "Media" | "Alta"): number {
  if (demand === "Alta") return 65;
  if (demand === "Media") return 50;
  return 35;
}
