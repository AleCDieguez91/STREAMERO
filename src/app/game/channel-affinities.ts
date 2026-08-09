import {
  evaluateContract,
  type ChannelAffinityProfile,
  type ContractEvaluation,
  type StreamerAffinityProfile,
} from "./contract-algorithm";

export type ChannelAffinityId =
  | "ORTERIX" | "ALGA" | "ASS" | "RUZU TV"
  | "RENDER" | "CARANCHO" | "QUERATINA" | "FUTUPOP";

// Configuración de alcance y tipo de streamer preferido de cada canal.
export const CHANNEL_AFFINITIES: Record<ChannelAffinityId, ChannelAffinityProfile> = {
  ORTERIX: { baseReach: 80, preferredStreamerTypes: ["Reacción", "Gamer"] },
  ALGA: { baseReach: 80, preferredStreamerTypes: ["Reacción"] },
  ASS: { baseReach: 60, preferredStreamerTypes: ["Reacción", "Gamer"] },
  "RUZU TV": { baseReach: 60, preferredStreamerTypes: ["Reacción"] },
  RENDER: { baseReach: 80, preferredStreamerTypes: ["Opinión Política"] },
  CARANCHO: { baseReach: 60, preferredStreamerTypes: ["Opinión Política"] },
  QUERATINA: { baseReach: 80, preferredStreamerTypes: ["Opinión Política"] },
  FUTUPOP: { baseReach: 60, preferredStreamerTypes: ["Reacción"] },
};

export function evaluateChannelForStreamer(
  streamer: StreamerAffinityProfile,
  channel: ChannelAffinityId,
): ContractEvaluation {
  return evaluateContract(streamer, CHANNEL_AFFINITIES[channel]);
}
