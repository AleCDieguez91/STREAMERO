export interface AffinityScaledOutcome {
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

export function scaleOutcomeByAffinity(
  followers: number,
  popularity: number | undefined,
  affinity: number,
): AffinityScaledOutcome {
  const safeAffinity = clamp(affinity, 0, 100);
  const multiplier = roundOneDecimal(0.6 + 0.8 * (safeAffinity / 100));
  const scaledFollowers = Math.round(followers * multiplier);
  const derivedPopularity = followers === 0
    ? 0
    : Math.sign(followers) * Math.max(1, Math.round(1 + 2 * (safeAffinity / 100)));
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
