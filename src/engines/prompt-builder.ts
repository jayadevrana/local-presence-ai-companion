import { deriveStyleGuidance } from "@/engines/adaptive-style-engine";
import type { HistoricalEntry, PromptContext, PromptMode } from "@/types/companion";

export function buildPromptEnvelope(args: {
  mode: PromptMode;
  context: PromptContext;
  input: string;
  matchedHistory: HistoricalEntry[];
}) {
  const { context, input, matchedHistory } = args;
  const recentMessages = context.recentMessages
    .slice(-8)
    .map((message) => `${message.role}: ${message.content}`)
    .join("\n");
  const followUps = context.followUps
    .slice(0, 4)
    .map((item) => `${item.priorityScore.toFixed(2)} ${item.rationale}`)
    .join("\n");
  const futureEvents = context.futureEvents
    .slice(0, 4)
    .map((item) => `${item.title} (${item.status}) ${item.description}`)
    .join("\n");
  const historyText = matchedHistory
    .map((entry) => `${entry.name}: ${entry.practicalLesson}`)
    .join("\n");

  return `
User profile
- name: ${context.userProfile.userName ?? "unknown"}
- location: ${context.userProfile.roughLocation ?? "unknown"}
- desired assistant role: ${context.userProfile.desiredAssistantRole ?? "not set"}
- style preferences: ${context.userProfile.stylePreferences.join(", ") || "not set"}

Adaptive guidance
- ${deriveStyleGuidance(context.adaptation, context.recentMessages)}

Session summary
- ${context.sessionSummary?.rollingSummary ?? "No session summary yet."}
- active themes: ${context.sessionSummary?.activeThemes.map((theme) => theme.label).join(", ") || "none"}

Unresolved threads
- ${context.unresolvedThreads.map((thread) => thread.title).join(", ") || "none"}

Future events
${futureEvents || "none"}

Follow-up queue
${followUps || "none"}

Matched history
${historyText || "none"}

Recent messages
${recentMessages || "none"}

Latest input
${input}
  `.trim();
}
