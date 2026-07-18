import "server-only";

import { desc, eq } from "drizzle-orm";

import { ensureDatabase } from "@/db/init";
import { db } from "@/db/client";
import {
  adaptiveProfileTable,
  followUpTriggersTable,
  futureEventsTable,
  initiationEventsTable,
  longTermMemoryTable,
  messagesTable,
  onboardingTable,
  sessionsTable,
  sessionSummariesTable,
  settingsTable,
  unresolvedThreadsTable,
  userProfileTable,
} from "@/db/schema";
import { evalScenarios } from "@/evals/scenarios";
import { createId } from "@/lib/ids";
import { formatTimestampLabel, nowIso } from "@/lib/time";
import type {
  AdaptivePersonalityProfile,
  AppSettings,
  BootstrapPayload,
  ChatMessage,
  FollowUpTrigger,
  FutureEventMemory,
  LongTermMemoryItem,
  OnboardingProfile,
  SelfInitiationDecision,
  SessionRecord,
  SessionSummary,
  UnresolvedThread,
  UserProfileMemory,
} from "@/types/companion";

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function toSettings(row: typeof settingsTable.$inferSelect): AppSettings {
  return {
    voiceEnabled: row.voiceEnabled,
    selfInitiationEnabled: row.selfInitiationEnabled,
    quietMode: row.quietMode,
    historicalReferencesEnabled: row.historicalReferencesEnabled,
    emotionalIntensity: row.emotionalIntensity,
    debugMode: row.debugMode,
  };
}

function toOnboarding(row: typeof onboardingTable.$inferSelect): OnboardingProfile {
  return {
    completed: row.completed,
    userName: row.userName ?? undefined,
    roughLocation: row.roughLocation ?? undefined,
    desiredRole: row.desiredRole ?? undefined,
    preferredStyleMix: parseJson<string[]>(row.preferredStyleMix, []),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toUserProfile(row: typeof userProfileTable.$inferSelect): UserProfileMemory {
  return {
    userName: row.userName ?? undefined,
    roughLocation: row.roughLocation ?? undefined,
    desiredAssistantRole: row.desiredAssistantRole ?? undefined,
    stylePreferences: parseJson<string[]>(row.stylePreferences, []),
    explicitBoundaries: parseJson<string[]>(row.explicitBoundaries, []),
    stablePreferences: parseJson<string[]>(row.stablePreferences, []),
    updatedAt: row.updatedAt,
  };
}

function toAdaptation(
  row: typeof adaptiveProfileTable.$inferSelect,
): AdaptivePersonalityProfile {
  return {
    warmth: row.warmth,
    humor: row.humor,
    directness: row.directness,
    reflectiveness: row.reflectiveness,
    challengeTolerance: row.challengeTolerance,
    emotionalOpenness: row.emotionalOpenness,
    pacing: row.pacing,
    lexicalComplexity: row.lexicalComplexity,
    bluntness: row.bluntness,
    adaptationStrength: row.adaptationStrength,
    updatedAt: row.updatedAt,
  };
}

function toMessage(row: typeof messagesTable.$inferSelect): ChatMessage {
  return {
    id: row.id,
    sessionId: row.sessionId,
    role: row.role as ChatMessage["role"],
    mode: row.mode as ChatMessage["mode"],
    content: row.content,
    createdAt: row.createdAt,
    timestampLabel: row.timestampLabel,
    emotion: row.emotion ? parseJson(row.emotion, undefined) : undefined,
    assistantTone: (row.assistantTone as ChatMessage["assistantTone"]) ?? undefined,
    isSelfInitiated: row.isSelfInitiated,
    followUpSourceId: row.followUpSourceId ?? undefined,
    historicalEntryIds: parseJson<string[]>(row.historicalEntryIds, []),
    voiceStyleId: row.voiceStyleId ?? undefined,
  };
}

function toSummary(
  row: typeof sessionSummariesTable.$inferSelect | undefined,
): SessionSummary | null {
  if (!row) return null;
  return {
    sessionId: row.sessionId,
    rollingSummary: row.rollingSummary,
    activeThemes: parseJson(row.activeThemes, []),
    currentEmotion: row.currentEmotion ? parseJson(row.currentEmotion, undefined) : undefined,
    unresolvedThreadIds: parseJson(row.unresolvedThreadIds, []),
    recentGoals: parseJson(row.recentGoals, []),
    recentFrictions: parseJson(row.recentFrictions, []),
    importantMentions: parseJson(row.importantMentions, []),
    updatedAt: row.updatedAt,
  };
}

function toLongTermMemory(row: typeof longTermMemoryTable.$inferSelect): LongTermMemoryItem {
  return {
    id: row.id,
    kind: row.kind as LongTermMemoryItem["kind"],
    summary: row.summary,
    detail: row.detail ?? undefined,
    salience: row.salience,
    confidence: row.confidence,
    firstSeenAt: row.firstSeenAt,
    lastSeenAt: row.lastSeenAt,
    status: row.status as LongTermMemoryItem["status"],
    tags: parseJson(row.tags, []),
  };
}

function toUnresolvedThread(
  row: typeof unresolvedThreadsTable.$inferSelect,
): UnresolvedThread {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    openedAt: row.openedAt,
    lastReferencedAt: row.lastReferencedAt,
    importance: row.importance,
    emotionalWeight: row.emotionalWeight,
    status: row.status as UnresolvedThread["status"],
  };
}

function toFutureEvent(row: typeof futureEventsTable.$inferSelect): FutureEventMemory {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    eventTime: row.eventTime ?? undefined,
    expectedWindow: row.expectedWindow ?? undefined,
    significance: row.significance,
    vulnerability: row.vulnerability,
    unresolved: row.unresolved,
    relationshipRelevance: row.relationshipRelevance,
    lastCheckedAt: row.lastCheckedAt ?? undefined,
    status: row.status as FutureEventMemory["status"],
  };
}

function toFollowUp(row: typeof followUpTriggersTable.$inferSelect): FollowUpTrigger {
  return {
    id: row.id,
    sourceMemoryId: row.sourceMemoryId,
    triggerType: row.triggerType as FollowUpTrigger["triggerType"],
    priorityScore: row.priorityScore,
    rationale: row.rationale,
    eligibleAfter: row.eligibleAfter,
    lastUsedAt: row.lastUsedAt ?? undefined,
    cooldownUntil: row.cooldownUntil ?? undefined,
  };
}

export async function ensureActiveSession() {
  await ensureDatabase();
  const latest = await db
    .select()
    .from(sessionsTable)
    .orderBy(desc(sessionsTable.updatedAt))
    .limit(1);
  if (latest[0]) return latest[0] as SessionRecord;

  const id = createId("session");
  const now = nowIso();
  await db.insert(sessionsTable).values({
    id,
    createdAt: now,
    updatedAt: now,
    status: "active",
  });

  return {
    id,
    createdAt: now,
    updatedAt: now,
    status: "active",
  } satisfies SessionRecord;
}

export async function getBootstrapPayload(): Promise<BootstrapPayload> {
  await ensureDatabase();

  const [settingsRow] = await db.select().from(settingsTable).where(eq(settingsTable.id, 1));
  const [onboardingRow] = await db
    .select()
    .from(onboardingTable)
    .where(eq(onboardingTable.id, 1));
  const [userProfileRow] = await db
    .select()
    .from(userProfileTable)
    .where(eq(userProfileTable.id, 1));
  const [adaptationRow] = await db
    .select()
    .from(adaptiveProfileTable)
    .where(eq(adaptiveProfileTable.id, 1));
  const session = onboardingRow?.completed ? await ensureActiveSession() : null;

  const messages = session
    ? await db
        .select()
        .from(messagesTable)
        .where(eq(messagesTable.sessionId, session.id))
        .orderBy(messagesTable.createdAt)
    : [];

  const [summaryRow] = session
    ? await db
        .select()
        .from(sessionSummariesTable)
        .where(eq(sessionSummariesTable.sessionId, session.id))
    : [undefined];

  const longTermMemory = await db
    .select()
    .from(longTermMemoryTable)
    .orderBy(desc(longTermMemoryTable.lastSeenAt))
    .limit(16);
  const futureEvents = await db
    .select()
    .from(futureEventsTable)
    .orderBy(desc(futureEventsTable.significance))
    .limit(12);
  const followUps = await db
    .select()
    .from(followUpTriggersTable)
    .orderBy(desc(followUpTriggersTable.priorityScore))
    .limit(12);
  const unresolvedThreads = await db
    .select()
    .from(unresolvedThreadsTable)
    .orderBy(desc(unresolvedThreadsTable.lastReferencedAt))
    .limit(12);
  const latestDecisionRows = await db
    .select()
    .from(initiationEventsTable)
    .orderBy(desc(initiationEventsTable.createdAt))
    .limit(1);

  return {
    session,
    onboarding: toOnboarding(onboardingRow),
    settings: toSettings(settingsRow),
    userProfile: toUserProfile(userProfileRow),
    summary: toSummary(summaryRow),
    messages: messages.map(toMessage),
    longTermMemory: longTermMemory.map(toLongTermMemory),
    futureEvents: futureEvents.map(toFutureEvent),
    followUps: followUps.map(toFollowUp),
    unresolvedThreads: unresolvedThreads.map(toUnresolvedThread),
    adaptation: toAdaptation(adaptationRow),
    latestDecision: latestDecisionRows[0]
      ? parseJson<SelfInitiationDecision | null>(latestDecisionRows[0].decision, null)
      : null,
    evalScenarios,
  };
}

export async function appendMessage(
  message: Omit<ChatMessage, "id" | "createdAt" | "timestampLabel"> & {
    id?: string;
    createdAt?: string;
  },
) {
  await ensureDatabase();
  const createdAt = message.createdAt ?? nowIso();
  const id = message.id ?? createId("msg");

  await db.insert(messagesTable).values({
    id,
    sessionId: message.sessionId,
    role: message.role,
    mode: message.mode,
    content: message.content,
    createdAt,
    timestampLabel: formatTimestampLabel(createdAt),
    emotion: message.emotion ? JSON.stringify(message.emotion) : null,
    assistantTone: message.assistantTone ?? null,
    isSelfInitiated: message.isSelfInitiated,
    followUpSourceId: message.followUpSourceId ?? null,
    historicalEntryIds: JSON.stringify(message.historicalEntryIds),
    voiceStyleId: message.voiceStyleId ?? null,
  });

  await db
    .update(sessionsTable)
    .set({ updatedAt: createdAt })
    .where(eq(sessionsTable.id, message.sessionId));

  return {
    ...message,
    id,
    createdAt,
    timestampLabel: formatTimestampLabel(createdAt),
  } satisfies ChatMessage;
}

export async function saveOnboardingProfile(values: OnboardingProfile) {
  await ensureDatabase();
  await db
    .update(onboardingTable)
    .set({
      completed: values.completed,
      userName: values.userName ?? null,
      roughLocation: values.roughLocation ?? null,
      desiredRole: values.desiredRole ?? null,
      preferredStyleMix: JSON.stringify(values.preferredStyleMix),
      updatedAt: values.updatedAt,
    })
    .where(eq(onboardingTable.id, 1));
}

export async function saveUserProfile(profile: UserProfileMemory) {
  await ensureDatabase();
  await db
    .update(userProfileTable)
    .set({
      userName: profile.userName ?? null,
      roughLocation: profile.roughLocation ?? null,
      desiredAssistantRole: profile.desiredAssistantRole ?? null,
      stylePreferences: JSON.stringify(profile.stylePreferences),
      explicitBoundaries: JSON.stringify(profile.explicitBoundaries),
      stablePreferences: JSON.stringify(profile.stablePreferences),
      updatedAt: profile.updatedAt,
    })
    .where(eq(userProfileTable.id, 1));
}

export async function saveSettings(settings: AppSettings) {
  await ensureDatabase();
  await db
    .update(settingsTable)
    .set({
      ...settings,
      updatedAt: nowIso(),
    })
    .where(eq(settingsTable.id, 1));
}

export async function saveAdaptiveProfile(profile: AdaptivePersonalityProfile) {
  await ensureDatabase();
  await db
    .update(adaptiveProfileTable)
    .set(profile)
    .where(eq(adaptiveProfileTable.id, 1));
}

export async function saveSessionSummary(summary: SessionSummary) {
  await ensureDatabase();
  await db
    .insert(sessionSummariesTable)
    .values({
      sessionId: summary.sessionId,
      rollingSummary: summary.rollingSummary,
      activeThemes: JSON.stringify(summary.activeThemes),
      currentEmotion: summary.currentEmotion ? JSON.stringify(summary.currentEmotion) : null,
      unresolvedThreadIds: JSON.stringify(summary.unresolvedThreadIds),
      recentGoals: JSON.stringify(summary.recentGoals),
      recentFrictions: JSON.stringify(summary.recentFrictions),
      importantMentions: JSON.stringify(summary.importantMentions),
      updatedAt: summary.updatedAt,
    })
    .onConflictDoUpdate({
      target: sessionSummariesTable.sessionId,
      set: {
        rollingSummary: summary.rollingSummary,
        activeThemes: JSON.stringify(summary.activeThemes),
        currentEmotion: summary.currentEmotion ? JSON.stringify(summary.currentEmotion) : null,
        unresolvedThreadIds: JSON.stringify(summary.unresolvedThreadIds),
        recentGoals: JSON.stringify(summary.recentGoals),
        recentFrictions: JSON.stringify(summary.recentFrictions),
        importantMentions: JSON.stringify(summary.importantMentions),
        updatedAt: summary.updatedAt,
      },
    });
}

export async function upsertLongTermMemory(items: LongTermMemoryItem[]) {
  await ensureDatabase();
  for (const item of items) {
    const existing = await db
      .select()
      .from(longTermMemoryTable)
      .where(eq(longTermMemoryTable.summary, item.summary))
      .limit(1);
    if (existing[0]) {
      await db
        .update(longTermMemoryTable)
        .set({
          lastSeenAt: item.lastSeenAt,
          salience: Math.max(existing[0].salience, item.salience),
          confidence: Math.max(existing[0].confidence, item.confidence),
          tags: JSON.stringify(
            Array.from(new Set([...parseJson<string[]>(existing[0].tags, []), ...item.tags])),
          ),
        })
        .where(eq(longTermMemoryTable.id, existing[0].id));
    } else {
      await db.insert(longTermMemoryTable).values({
        ...item,
        detail: item.detail ?? null,
        tags: JSON.stringify(item.tags),
      });
    }
  }
}

export async function upsertUnresolvedThreads(items: UnresolvedThread[]) {
  await ensureDatabase();
  for (const item of items) {
    const existing = await db
      .select()
      .from(unresolvedThreadsTable)
      .where(eq(unresolvedThreadsTable.title, item.title))
      .limit(1);
    if (existing[0]) {
      await db
        .update(unresolvedThreadsTable)
        .set({
          description: item.description,
          lastReferencedAt: item.lastReferencedAt,
          importance: Math.max(existing[0].importance, item.importance),
          emotionalWeight: Math.max(existing[0].emotionalWeight, item.emotionalWeight),
          status: "open",
        })
        .where(eq(unresolvedThreadsTable.id, existing[0].id));
    } else {
      await db.insert(unresolvedThreadsTable).values(item);
    }
  }
}

export async function upsertFutureEvents(items: FutureEventMemory[]) {
  await ensureDatabase();
  for (const item of items) {
    const existing = await db
      .select()
      .from(futureEventsTable)
      .where(eq(futureEventsTable.title, item.title))
      .limit(1);
    if (existing[0]) {
      await db
        .update(futureEventsTable)
        .set({
          description: item.description,
          eventTime: item.eventTime ?? existing[0].eventTime,
          expectedWindow: item.expectedWindow ?? existing[0].expectedWindow,
          significance: Math.max(existing[0].significance, item.significance),
          vulnerability: Math.max(existing[0].vulnerability, item.vulnerability),
          unresolved: item.unresolved,
          relationshipRelevance: Math.max(
            existing[0].relationshipRelevance,
            item.relationshipRelevance,
          ),
          status: item.status,
        })
        .where(eq(futureEventsTable.id, existing[0].id));
    } else {
      await db.insert(futureEventsTable).values({
        ...item,
        eventTime: item.eventTime ?? null,
        expectedWindow: item.expectedWindow ?? null,
        lastCheckedAt: item.lastCheckedAt ?? null,
      });
    }
  }
}

export async function replaceFollowUpTriggers(items: FollowUpTrigger[]) {
  await ensureDatabase();
  await db.delete(followUpTriggersTable);
  if (items.length === 0) return;
  await db.insert(followUpTriggersTable).values(
    items.map((item) => ({
      ...item,
      lastUsedAt: item.lastUsedAt ?? null,
      cooldownUntil: item.cooldownUntil ?? null,
    })),
  );
}

export async function recordDecision(decision: SelfInitiationDecision) {
  await ensureDatabase();
  await db.insert(initiationEventsTable).values({
    id: createId("decision"),
    decision: JSON.stringify(decision),
    createdAt: nowIso(),
  });
}

export async function clearConversationData() {
  await ensureDatabase();
  await db.delete(messagesTable);
  await db.delete(sessionSummariesTable);
  await db.delete(longTermMemoryTable);
  await db.delete(unresolvedThreadsTable);
  await db.delete(futureEventsTable);
  await db.delete(followUpTriggersTable);
  await db.delete(initiationEventsTable);
  await db.delete(sessionsTable);

  const now = nowIso();
  await db
    .update(adaptiveProfileTable)
    .set({
      warmth: 0.7,
      humor: 0.35,
      directness: 0.55,
      reflectiveness: 0.7,
      challengeTolerance: 0.45,
      emotionalOpenness: 0.55,
      pacing: 0.55,
      lexicalComplexity: 0.6,
      bluntness: 0.35,
      adaptationStrength: 0.45,
      updatedAt: now,
    })
    .where(eq(adaptiveProfileTable.id, 1));
}
