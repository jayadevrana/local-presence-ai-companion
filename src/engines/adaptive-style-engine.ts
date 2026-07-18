import type { AdaptivePersonalityProfile, ChatMessage } from "@/types/companion";
import { clamp } from "@/lib/utils";
import { nowIso } from "@/lib/time";

export function updateAdaptiveProfile(
  profile: AdaptivePersonalityProfile,
  message: string,
): AdaptivePersonalityProfile {
  const length = message.trim().length;
  const lower = message.toLowerCase();
  const exclamations = (message.match(/!/g) ?? []).length;
  const questions = (message.match(/\?/g) ?? []).length;
  const profanity = /(fuck|shit|damn|hell)\b/.test(lower);
  const humorCue = /(haha|lol|lmao|funny)\b/.test(lower);
  const softCue = /(please|gently|carefully|softly)\b/.test(lower);
  const challengeCue = /(push me|be blunt|tell me straight|challenge me)\b/.test(lower);
  const reflectiveCue = /(why|meaning|pattern|feel|understand)\b/.test(lower);

  return {
    ...profile,
    warmth: clamp(profile.warmth + (softCue ? 0.03 : 0)),
    humor: clamp(profile.humor + (humorCue ? 0.05 : -0.01)),
    directness: clamp(profile.directness + (challengeCue || profanity ? 0.04 : 0)),
    reflectiveness: clamp(profile.reflectiveness + (reflectiveCue ? 0.03 : -0.01)),
    challengeTolerance: clamp(profile.challengeTolerance + (challengeCue ? 0.06 : 0)),
    emotionalOpenness: clamp(
      profile.emotionalOpenness + (/(feel|afraid|hurt|love|grief|anxious)\b/.test(lower) ? 0.04 : 0),
    ),
    pacing: clamp(profile.pacing + (length < 80 ? -0.01 : 0.02)),
    lexicalComplexity: clamp(profile.lexicalComplexity + (length > 220 ? 0.03 : 0)),
    bluntness: clamp(profile.bluntness + (profanity ? 0.05 : -0.005)),
    adaptationStrength: clamp(profile.adaptationStrength + 0.002, 0.2, 0.7),
    updatedAt: nowIso(),
  };
}

export function deriveStyleGuidance(
  profile: AdaptivePersonalityProfile,
  messages: ChatMessage[],
) {
  const recentAssistantRatio =
    messages.filter((message) => message.role === "assistant").length /
    Math.max(messages.length, 1);

  const pace =
    profile.pacing < 0.45 ? "keep replies lean and crisp" : "allow measured reflection";
  const directness =
    profile.directness > 0.62
      ? "be candid when it matters"
      : "prefer gentle precision over bluntness";
  const challenge =
    profile.challengeTolerance > 0.6
      ? "offer occasional challenge if it is useful"
      : "do not push hard unless invited";

  return [
    pace,
    directness,
    challenge,
    profile.humor > 0.55 ? "a trace of dry humor is acceptable" : "keep humor restrained",
    recentAssistantRatio > 0.55 ? "keep space for the user; do not overfill silence" : null,
  ]
    .filter(Boolean)
    .join("; ");
}
