import type {
  BootstrapPayload,
  HistoricalEntry,
  SelfInitiationDecision,
  SelfInitiationInput,
} from "@/types/companion";
import { matchHistoricalEntries } from "@/engines/historical-matching-engine";
import { addSeconds, nowIso } from "@/lib/time";

export function evaluateSelfInitiation(
  state: BootstrapPayload,
  input: SelfInitiationInput,
): {
  decision: SelfInitiationDecision;
  matchedHistory: HistoricalEntry[];
} {
  const nextEvaluationAt = addSeconds(nowIso(), randomWindow());
  const lastAssistantMessage = [...state.messages]
    .reverse()
    .find((message) => message.role === "assistant");
  const secondsSinceAssistant = lastAssistantMessage
    ? Math.round((Date.now() - new Date(lastAssistantMessage.createdAt).getTime()) / 1000)
    : 9999;

  if (!state.settings.selfInitiationEnabled || state.settings.quietMode) {
    return {
      decision: {
        shouldSpeak: false,
        utilityScore: 0,
        silenceReason: "Self-initiation disabled.",
        repetitionRisk: 0,
        cooldownRemainingMs: 0,
        nextEvaluationAt,
      },
      matchedHistory: [],
    };
  }

  if (input.isTyping || input.draft.trim().length > 0) {
    return {
      decision: {
        shouldSpeak: false,
        utilityScore: 0.08,
        silenceReason: "The user is typing.",
        repetitionRisk: 0,
        cooldownRemainingMs: 0,
        nextEvaluationAt,
      },
      matchedHistory: [],
    };
  }

  if (input.idleSeconds < 8) {
    return {
      decision: {
        shouldSpeak: false,
        utilityScore: 0.1,
        silenceReason: "The moment is still fresh.",
        repetitionRisk: 0.1,
        cooldownRemainingMs: 0,
        nextEvaluationAt,
      },
      matchedHistory: [],
    };
  }

  const followUp = [...state.followUps].sort(
    (left, right) => right.priorityScore - left.priorityScore,
  )[0];
  const unresolved = state.unresolvedThreads[0];
  const repetitionRisk =
    state.messages.slice(-3).filter((message) => message.isSelfInitiated).length * 0.24;
  const baseUtility =
    (followUp?.priorityScore ?? 0) * 0.7 +
    (unresolved ? unresolved.importance * 0.2 : 0) +
    Math.min(input.idleSeconds / 60, 0.2) -
    repetitionRisk -
    (secondsSinceAssistant < 20 ? 0.32 : 0);
  const matchedHistory = state.settings.historicalReferencesEnabled
    ? matchHistoricalEntries({
        text: `${state.summary?.rollingSummary ?? ""} ${unresolved?.description ?? ""}`,
        emotion: state.summary?.currentEmotion,
        limit: 1,
      }).map((item) => item.entry)
    : [];

  if (baseUtility < 0.4) {
    return {
      decision: {
        shouldSpeak: false,
        utilityScore: Math.max(baseUtility, 0),
        silenceReason: "Silence is more valuable than speaking right now.",
        repetitionRisk,
        cooldownRemainingMs: secondsSinceAssistant < 20 ? (20 - secondsSinceAssistant) * 1000 : 0,
        nextEvaluationAt,
      },
      matchedHistory,
    };
  }

  return {
    decision: {
      shouldSpeak: true,
      decisionType: followUp
        ? "follow_up"
        : unresolved
          ? "reflection"
          : matchedHistory.length > 0
            ? "historical"
            : "question",
      utilityScore: Math.min(baseUtility, 1),
      repetitionRisk,
      cooldownRemainingMs: 0,
      nextEvaluationAt,
    },
    matchedHistory,
  };
}

function randomWindow() {
  return Math.round(5 + Math.random() * 55);
}
