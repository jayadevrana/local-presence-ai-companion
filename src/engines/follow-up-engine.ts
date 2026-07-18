import type { FollowUpTrigger, FutureEventMemory } from "@/types/companion";
import { createId } from "@/lib/ids";
import { addSeconds, nowIso } from "@/lib/time";
import { clamp, normalizeText } from "@/lib/utils";

const dueHints: Array<{ pattern: RegExp; seconds: number; window: string }> = [
  { pattern: /\btomorrow\b/i, seconds: 60 * 60 * 20, window: "tomorrow" },
  { pattern: /\bnext week\b/i, seconds: 60 * 60 * 24 * 6, window: "next_week" },
  { pattern: /\bthis weekend\b/i, seconds: 60 * 60 * 48, window: "weekend" },
  { pattern: /\bsoon\b/i, seconds: 60 * 60 * 36, window: "soon" },
];

const futureEventPatterns = [
  /\bi (?:will|am going to|might)\s+(.+)/i,
  /\bi have\s+(.+?)\s+(tomorrow|next week|soon|this weekend)\b/i,
  /\btomorrow is\s+(.+)/i,
];

export function extractFutureEvents(text: string): FutureEventMemory[] {
  const input = text.trim();
  const lower = normalizeText(input);
  if (lower.length < 12) return [];

  const patternsHit = futureEventPatterns.find((pattern) => pattern.test(input));
  if (!patternsHit) return [];

  const title = deriveTitle(input);
  const dueHint = dueHints.find((hint) => hint.pattern.test(input));
  const significance = scoreSignificance(lower);
  const vulnerability = scoreVulnerability(lower);
  const relationshipRelevance = /father|mother|girlfriend|boyfriend|wife|husband|friend/i.test(
    input,
  )
    ? 0.82
    : 0.55;

  return [
    {
      id: createId("future"),
      title,
      description: input,
      eventTime: dueHint ? addSeconds(new Date(), dueHint.seconds) : undefined,
      expectedWindow: dueHint?.window,
      significance,
      vulnerability,
      unresolved: true,
      relationshipRelevance,
      status: "upcoming",
    },
  ];
}

export function buildFollowUpTriggers(
  events: FutureEventMemory[],
  now = nowIso(),
): FollowUpTrigger[] {
  return events.map((event) => ({
    id: createId("follow"),
    sourceMemoryId: event.id,
    triggerType: event.eventTime ? "time_based" : "session_open",
    priorityScore: calculateFollowUpPriority(event),
    rationale: buildRationale(event),
    eligibleAfter: event.eventTime ?? addSeconds(now, 30),
    cooldownUntil: addSeconds(now, 90),
  }));
}

export function calculateFollowUpPriority(event: FutureEventMemory) {
  return clamp(
    event.significance * 0.3 +
      event.vulnerability * 0.2 +
      event.relationshipRelevance * 0.15 +
      (event.unresolved ? 0.15 : 0) +
      (event.eventTime ? 0.1 : 0.06) +
      0.08,
    0,
    1,
  );
}

function scoreSignificance(lower: string) {
  if (/surgery|exam|proposal|quit my job|confront/i.test(lower)) return 0.9;
  if (/relationship|career|family|father|mother/i.test(lower)) return 0.8;
  return 0.6;
}

function scoreVulnerability(lower: string) {
  if (/surgery|father|mother|afraid|scared|confront|quit/i.test(lower)) return 0.82;
  if (/proposal|exam|interview/i.test(lower)) return 0.68;
  return 0.52;
}

function deriveTitle(text: string) {
  if (/proposal|propose/i.test(text)) return "Proposal";
  if (/exam/i.test(text)) return "Exam";
  if (/surgery/i.test(text)) return "Surgery";
  if (/quit my job/i.test(text)) return "Possible job change";
  if (/father|mother/i.test(text)) return "Family confrontation";
  return text.replace(/^i (?:will|am going to|might)\s+/i, "").slice(0, 48);
}

function buildRationale(event: FutureEventMemory) {
  if (event.significance > 0.85) return "High-stakes personal event with emotional consequence.";
  if (event.relationshipRelevance > 0.75) return "Relational event worth following up with warmth.";
  return "Timely unresolved event with conversational value.";
}
