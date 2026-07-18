import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const settingsTable = sqliteTable("settings", {
  id: integer("id").primaryKey(),
  voiceEnabled: integer("voice_enabled", { mode: "boolean" }).notNull(),
  selfInitiationEnabled: integer("self_initiation_enabled", {
    mode: "boolean",
  }).notNull(),
  quietMode: integer("quiet_mode", { mode: "boolean" }).notNull(),
  historicalReferencesEnabled: integer("historical_references_enabled", {
    mode: "boolean",
  }).notNull(),
  emotionalIntensity: real("emotional_intensity").notNull(),
  debugMode: integer("debug_mode", { mode: "boolean" }).notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const onboardingTable = sqliteTable("onboarding_profile", {
  id: integer("id").primaryKey(),
  completed: integer("completed", { mode: "boolean" }).notNull(),
  userName: text("user_name"),
  roughLocation: text("rough_location"),
  desiredRole: text("desired_role"),
  preferredStyleMix: text("preferred_style_mix").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const userProfileTable = sqliteTable("user_profile", {
  id: integer("id").primaryKey(),
  userName: text("user_name"),
  roughLocation: text("rough_location"),
  desiredAssistantRole: text("desired_assistant_role"),
  stylePreferences: text("style_preferences").notNull(),
  explicitBoundaries: text("explicit_boundaries").notNull(),
  stablePreferences: text("stable_preferences").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const adaptiveProfileTable = sqliteTable("adaptive_profile", {
  id: integer("id").primaryKey(),
  warmth: real("warmth").notNull(),
  humor: real("humor").notNull(),
  directness: real("directness").notNull(),
  reflectiveness: real("reflectiveness").notNull(),
  challengeTolerance: real("challenge_tolerance").notNull(),
  emotionalOpenness: real("emotional_openness").notNull(),
  pacing: real("pacing").notNull(),
  lexicalComplexity: real("lexical_complexity").notNull(),
  bluntness: real("bluntness").notNull(),
  adaptationStrength: real("adaptation_strength").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const sessionsTable = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  status: text("status").$type<"active" | "archived">().notNull(),
});

export const messagesTable = sqliteTable("messages", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  role: text("role").notNull(),
  mode: text("mode").notNull(),
  content: text("content").notNull(),
  createdAt: text("created_at").notNull(),
  timestampLabel: text("timestamp_label").notNull(),
  emotion: text("emotion"),
  assistantTone: text("assistant_tone"),
  isSelfInitiated: integer("is_self_initiated", { mode: "boolean" }).notNull(),
  followUpSourceId: text("follow_up_source_id"),
  historicalEntryIds: text("historical_entry_ids").notNull(),
  voiceStyleId: text("voice_style_id"),
});

export const sessionSummariesTable = sqliteTable("session_summaries", {
  sessionId: text("session_id").primaryKey(),
  rollingSummary: text("rolling_summary").notNull(),
  activeThemes: text("active_themes").notNull(),
  currentEmotion: text("current_emotion"),
  unresolvedThreadIds: text("unresolved_thread_ids").notNull(),
  recentGoals: text("recent_goals").notNull(),
  recentFrictions: text("recent_frictions").notNull(),
  importantMentions: text("important_mentions").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const longTermMemoryTable = sqliteTable("long_term_memory", {
  id: text("id").primaryKey(),
  kind: text("kind").notNull(),
  summary: text("summary").notNull(),
  detail: text("detail"),
  salience: real("salience").notNull(),
  confidence: real("confidence").notNull(),
  firstSeenAt: text("first_seen_at").notNull(),
  lastSeenAt: text("last_seen_at").notNull(),
  status: text("status").notNull(),
  tags: text("tags").notNull(),
});

export const unresolvedThreadsTable = sqliteTable("unresolved_threads", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  openedAt: text("opened_at").notNull(),
  lastReferencedAt: text("last_referenced_at").notNull(),
  importance: real("importance").notNull(),
  emotionalWeight: real("emotional_weight").notNull(),
  status: text("status").notNull(),
});

export const futureEventsTable = sqliteTable("future_events", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  eventTime: text("event_time"),
  expectedWindow: text("expected_window"),
  significance: real("significance").notNull(),
  vulnerability: real("vulnerability").notNull(),
  unresolved: integer("unresolved", { mode: "boolean" }).notNull(),
  relationshipRelevance: real("relationship_relevance").notNull(),
  lastCheckedAt: text("last_checked_at"),
  status: text("status").notNull(),
});

export const followUpTriggersTable = sqliteTable("follow_up_triggers", {
  id: text("id").primaryKey(),
  sourceMemoryId: text("source_memory_id").notNull(),
  triggerType: text("trigger_type").notNull(),
  priorityScore: real("priority_score").notNull(),
  rationale: text("rationale").notNull(),
  eligibleAfter: text("eligible_after").notNull(),
  lastUsedAt: text("last_used_at"),
  cooldownUntil: text("cooldown_until"),
});

export const initiationEventsTable = sqliteTable("initiation_events", {
  id: text("id").primaryKey(),
  decision: text("decision").notNull(),
  createdAt: text("created_at").notNull(),
});
