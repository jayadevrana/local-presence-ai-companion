"use client";

import type { BootstrapPayload } from "@/types/companion";

interface DebugPanelProps {
  state: BootstrapPayload;
}

export function DebugPanel({ state }: DebugPanelProps) {
  const lastAssistantTone = [...state.messages]
    .reverse()
    .find((message) => message.role === "assistant")?.assistantTone;

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
      <p className="text-xs uppercase tracking-[0.22em] text-white/45">Developer mode</p>
      <div className="mt-4 space-y-4 text-sm text-white/75">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">Active themes</p>
          <p className="mt-2">
            {state.summary?.activeThemes.map((theme) => theme.label).join(", ") || "none"}
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">Current emotion</p>
          <p className="mt-2">{state.summary?.currentEmotion?.primary ?? "unknown"}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">Assistant tone</p>
          <p className="mt-2">{lastAssistantTone ?? "unknown"}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">Rolling summary</p>
          <p className="mt-2 leading-7 text-white/68">
            {state.summary?.rollingSummary ?? "No summary yet."}
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">Unresolved threads</p>
          <p className="mt-2">
            {state.unresolvedThreads.map((thread) => thread.title).join(", ") || "none"}
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">Follow-up queue</p>
          <p className="mt-2">
            {state.followUps
              .map((item) => `${item.priorityScore.toFixed(2)}:${item.rationale}`)
              .join(" | ") || "none"}
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">
            Self-initiation eligibility
          </p>
          <p className="mt-2">
            {state.latestDecision?.shouldSpeak
              ? `speak (${state.latestDecision.decisionType})`
              : state.latestDecision?.silenceReason ?? "not evaluated yet"}
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">
            Adaptation profile
          </p>
          <p className="mt-2 leading-7 text-white/68">
            warmth {state.adaptation.warmth.toFixed(2)} | directness{" "}
            {state.adaptation.directness.toFixed(2)} | reflectiveness{" "}
            {state.adaptation.reflectiveness.toFixed(2)} | challenge{" "}
            {state.adaptation.challengeTolerance.toFixed(2)}
          </p>
        </div>
      </div>
    </section>
  );
}
