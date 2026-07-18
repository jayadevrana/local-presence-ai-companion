import type {
  LongTermMemoryItem,
  OnboardingSubmission,
  UnresolvedThread,
  UserProfileMemory,
} from "@/types/companion";
import { createId } from "@/lib/ids";
import { nowIso } from "@/lib/time";

export function extractLongTermMemories(message: string): LongTermMemoryItem[] {
  const lower = message.toLowerCase();
  const now = nowIso();
  const items: LongTermMemoryItem[] = [];

  if (/\bi prefer\b|\bi like\b|\bi don't like\b/.test(lower)) {
    items.push({
      id: createId("memory"),
      kind: "preference",
      summary: sentence(message),
      salience: 0.62,
      confidence: 0.7,
      firstSeenAt: now,
      lastSeenAt: now,
      status: "active",
      tags: ["preference"],
    });
  }

  if (/\bi want\b|\bi'm trying\b|\bmy goal\b/.test(lower)) {
    items.push({
      id: createId("memory"),
      kind: "ambition",
      summary: sentence(message),
      salience: 0.72,
      confidence: 0.68,
      firstSeenAt: now,
      lastSeenAt: now,
      status: "active",
      tags: ["goal"],
    });
  }

  if (/\bafraid\b|\bworried\b|\bscared\b/.test(lower)) {
    items.push({
      id: createId("memory"),
      kind: "fear",
      summary: sentence(message),
      salience: 0.76,
      confidence: 0.72,
      firstSeenAt: now,
      lastSeenAt: now,
      status: "active",
      tags: ["fear"],
    });
  }

  if (/\bstuck\b|\bfrustrated\b|\bcan't\b|\bcannot\b/.test(lower)) {
    items.push({
      id: createId("memory"),
      kind: "frustration",
      summary: sentence(message),
      salience: 0.71,
      confidence: 0.7,
      firstSeenAt: now,
      lastSeenAt: now,
      status: "active",
      tags: ["friction"],
    });
  }

  return items;
}

export function extractUnresolvedThreads(message: string): UnresolvedThread[] {
  const lower = message.toLowerCase();
  if (!/\bmaybe\b|\bmight\b|\bnot sure\b|\btorn\b|\bconfused\b|\bcan'?t decide\b/.test(lower)) {
    return [];
  }

  const now = nowIso();
  return [
    {
      id: createId("thread"),
      title: sentence(message).slice(0, 60),
      description: sentence(message),
      openedAt: now,
      lastReferencedAt: now,
      importance: /job|relationship|family|health|career/i.test(message) ? 0.82 : 0.62,
      emotionalWeight: /hurt|afraid|scared|sad|angry/i.test(message) ? 0.78 : 0.56,
      status: "open",
    },
  ];
}

export function applyOnboardingToProfile(
  previous: UserProfileMemory,
  onboarding: OnboardingSubmission,
): UserProfileMemory {
  return {
    ...previous,
    userName: onboarding.userName,
    roughLocation: onboarding.roughLocation,
    desiredAssistantRole: onboarding.desiredRole,
    stylePreferences: onboarding.preferredStyleMix,
    updatedAt: nowIso(),
  };
}

function sentence(value: string) {
  return value.trim().replace(/\s+/g, " ").slice(0, 220);
}
