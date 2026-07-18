import type {
  ChatMessage,
  EmotionalState,
  SessionSummary,
  Theme,
  UnresolvedThread,
} from "@/types/companion";
import { classifyEmotion } from "@/engines/emotion-engine";
import { createId } from "@/lib/ids";
import { dedupe } from "@/lib/utils";
import { nowIso } from "@/lib/time";

const themeDictionary: Array<{ label: string; patterns: RegExp[] }> = [
  { label: "relationships", patterns: [/\bpartner\b/i, /\bgirlfriend\b/i, /\bfather\b/i, /\bfamily\b/i] },
  { label: "career", patterns: [/\bjob\b/i, /\bcareer\b/i, /\bwork\b/i, /\bbusiness\b/i] },
  { label: "health", patterns: [/\bsurgery\b/i, /\bhealth\b/i, /\bpanic\b/i, /\btired\b/i] },
  { label: "ambition", patterns: [/\bbuild\b/i, /\bgoal\b/i, /\bwin\b/i, /\bplan\b/i] },
  { label: "identity", patterns: [/\bwho i am\b/i, /\bself\b/i, /\bmeaning\b/i] },
];

export function buildSessionSummary(args: {
  sessionId: string;
  messages: ChatMessage[];
  unresolvedThreads: UnresolvedThread[];
}): SessionSummary {
  const recentUserMessages = args.messages
    .filter((message) => message.role === "user")
    .slice(-6)
    .map((message) => message.content);
  const recentText = recentUserMessages.join(" ");

  const themes = themeDictionary
    .map((theme) => ({
      label: theme.label,
      weight: theme.patterns.reduce(
        (count, pattern) => count + (pattern.test(recentText) ? 1 : 0),
        0,
      ),
    }))
    .filter((theme) => theme.weight > 0)
    .sort((left, right) => right.weight - left.weight)
    .slice(0, 4)
    .map<Theme>((theme) => ({
      id: createId("theme"),
      label: theme.label,
      weight: Math.min(1, theme.weight / 2),
      source: "session",
      updatedAt: nowIso(),
    }));

  const recentGoals = recentUserMessages
    .filter((message) => /\bi want\b|\bi'm trying\b|\bmy goal\b/i.test(message))
    .slice(-3);
  const recentFrictions = recentUserMessages
    .filter((message) => /\bstuck\b|\bfrustrated\b|\bcan't\b|\bworried\b/i.test(message))
    .slice(-3);
  const importantMentions = dedupe(
    recentUserMessages
      .filter((message) => /\bproposal\b|\bexam\b|\bsurgery\b|\bquit\b|\bfather\b|\bmother\b/i.test(message))
      .slice(-4),
  );

  return {
    sessionId: args.sessionId,
    rollingSummary: buildSummaryText(recentUserMessages, themes),
    activeThemes: themes,
    currentEmotion: recentText ? classifyEmotion(recentText) : undefined,
    unresolvedThreadIds: args.unresolvedThreads
      .filter((thread) => thread.status === "open")
      .map((thread) => thread.id),
    recentGoals,
    recentFrictions,
    importantMentions,
    updatedAt: nowIso(),
  };
}

function buildSummaryText(messages: string[], themes: Theme[]) {
  if (messages.length === 0) {
    return "The conversation has not started yet.";
  }

  const first = messages[messages.length - 1];
  const themeText =
    themes.length > 0 ? `Active themes: ${themes.map((theme) => theme.label).join(", ")}.` : "";
  return `Recent focus: ${first.slice(0, 180)}. ${themeText}`.trim();
}
