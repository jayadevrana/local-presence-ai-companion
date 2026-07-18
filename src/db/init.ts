import "server-only";

import { sqlite } from "@/db/client";
import { nowIso } from "@/lib/time";

let initialized = false;

export async function ensureDatabase() {
  if (initialized) return;

  sqlite.exec(`
    create table if not exists settings (
      id integer primary key,
      voice_enabled integer not null,
      self_initiation_enabled integer not null,
      quiet_mode integer not null,
      historical_references_enabled integer not null,
      emotional_intensity real not null,
      debug_mode integer not null,
      updated_at text not null
    );
    create table if not exists onboarding_profile (
      id integer primary key,
      completed integer not null,
      user_name text,
      rough_location text,
      desired_role text,
      preferred_style_mix text not null,
      created_at text not null,
      updated_at text not null
    );
    create table if not exists user_profile (
      id integer primary key,
      user_name text,
      rough_location text,
      desired_assistant_role text,
      style_preferences text not null,
      explicit_boundaries text not null,
      stable_preferences text not null,
      updated_at text not null
    );
    create table if not exists adaptive_profile (
      id integer primary key,
      warmth real not null,
      humor real not null,
      directness real not null,
      reflectiveness real not null,
      challenge_tolerance real not null,
      emotional_openness real not null,
      pacing real not null,
      lexical_complexity real not null,
      bluntness real not null,
      adaptation_strength real not null,
      updated_at text not null
    );
    create table if not exists sessions (
      id text primary key,
      created_at text not null,
      updated_at text not null,
      status text not null
    );
    create table if not exists messages (
      id text primary key,
      session_id text not null,
      role text not null,
      mode text not null,
      content text not null,
      created_at text not null,
      timestamp_label text not null,
      emotion text,
      assistant_tone text,
      is_self_initiated integer not null,
      follow_up_source_id text,
      historical_entry_ids text not null,
      voice_style_id text
    );
    create table if not exists session_summaries (
      session_id text primary key,
      rolling_summary text not null,
      active_themes text not null,
      current_emotion text,
      unresolved_thread_ids text not null,
      recent_goals text not null,
      recent_frictions text not null,
      important_mentions text not null,
      updated_at text not null
    );
    create table if not exists long_term_memory (
      id text primary key,
      kind text not null,
      summary text not null,
      detail text,
      salience real not null,
      confidence real not null,
      first_seen_at text not null,
      last_seen_at text not null,
      status text not null,
      tags text not null
    );
    create table if not exists unresolved_threads (
      id text primary key,
      title text not null,
      description text not null,
      opened_at text not null,
      last_referenced_at text not null,
      importance real not null,
      emotional_weight real not null,
      status text not null
    );
    create table if not exists future_events (
      id text primary key,
      title text not null,
      description text not null,
      event_time text,
      expected_window text,
      significance real not null,
      vulnerability real not null,
      unresolved integer not null,
      relationship_relevance real not null,
      last_checked_at text,
      status text not null
    );
    create table if not exists follow_up_triggers (
      id text primary key,
      source_memory_id text not null,
      trigger_type text not null,
      priority_score real not null,
      rationale text not null,
      eligible_after text not null,
      last_used_at text,
      cooldown_until text
    );
    create table if not exists initiation_events (
      id text primary key,
      decision text not null,
      created_at text not null
    );
  `);

  const now = nowIso();

  sqlite
    .prepare(
      `
        insert or ignore into settings (
          id,
          voice_enabled,
          self_initiation_enabled,
          quiet_mode,
          historical_references_enabled,
          emotional_intensity,
          debug_mode,
          updated_at
        ) values (?, ?, ?, ?, ?, ?, ?, ?)
      `,
    )
    .run(1, 1, 1, 0, 1, 0.68, 0, now);

  sqlite
    .prepare(
      `
        insert or ignore into onboarding_profile (
          id,
          completed,
          user_name,
          rough_location,
          desired_role,
          preferred_style_mix,
          created_at,
          updated_at
        ) values (?, ?, ?, ?, ?, ?, ?, ?)
      `,
    )
    .run(1, 0, null, null, null, "[]", now, now);

  sqlite
    .prepare(
      `
        insert or ignore into user_profile (
          id,
          user_name,
          rough_location,
          desired_assistant_role,
          style_preferences,
          explicit_boundaries,
          stable_preferences,
          updated_at
        ) values (?, ?, ?, ?, ?, ?, ?, ?)
      `,
    )
    .run(
      1,
      null,
      null,
      null,
      "[]",
      JSON.stringify([
        "Do not fabricate a human biography.",
        "Do not claim a body, family, or offline life.",
      ]),
      "[]",
      now,
    );

  sqlite
    .prepare(
      `
        insert or ignore into adaptive_profile (
          id,
          warmth,
          humor,
          directness,
          reflectiveness,
          challenge_tolerance,
          emotional_openness,
          pacing,
          lexical_complexity,
          bluntness,
          adaptation_strength,
          updated_at
        ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
    )
    .run(1, 0.7, 0.35, 0.55, 0.7, 0.45, 0.55, 0.55, 0.6, 0.35, 0.45, now);

  initialized = true;
}
