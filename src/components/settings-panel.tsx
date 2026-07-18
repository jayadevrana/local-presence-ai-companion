"use client";

import { Download, Eraser, MoonStar, Sparkles } from "lucide-react";

import type { AppSettings } from "@/types/companion";

interface SettingsPanelProps {
  settings: AppSettings;
  onSettingsChange: (next: AppSettings) => void;
  onExport: () => void;
  onClear: () => void;
  onInspectMemory: () => void;
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-[1.3rem] border border-white/10 bg-white/[0.03] px-4 py-3 text-left"
    >
      <div>
        <p className="text-sm text-white/92">{label}</p>
        <p className="mt-1 text-xs leading-6 text-white/45">{description}</p>
      </div>
      <div
        className={`relative h-6 w-11 rounded-full transition ${checked ? "bg-cyan-300/75" : "bg-white/10"}`}
      >
        <div
          className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${checked ? "left-6" : "left-1"}`}
        />
      </div>
    </button>
  );
}

export function SettingsPanel({
  settings,
  onSettingsChange,
  onExport,
  onClear,
  onInspectMemory,
}: SettingsPanelProps) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
      <div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-white/45">
        <MoonStar className="h-4 w-4" />
        Environment
      </div>
      <div className="space-y-3">
        <Toggle
          label="Voice output"
          description="Browser speech synthesis with tone-aware delivery."
          checked={settings.voiceEnabled}
          onChange={(voiceEnabled) =>
            onSettingsChange({
              ...settings,
              voiceEnabled,
            })
          }
        />
        <Toggle
          label="Self-initiation"
          description="Let the companion evaluate whether silence or follow-up is better."
          checked={settings.selfInitiationEnabled}
          onChange={(selfInitiationEnabled) =>
            onSettingsChange({
              ...settings,
              selfInitiationEnabled,
            })
          }
        />
        <Toggle
          label="Quiet mode"
          description="Reactive replies only. No self-initiated dialogue."
          checked={settings.quietMode}
          onChange={(quietMode) =>
            onSettingsChange({
              ...settings,
              quietMode,
            })
          }
        />
        <Toggle
          label="Historical layer"
          description="Allow philosophical or historical references only when strongly relevant."
          checked={settings.historicalReferencesEnabled}
          onChange={(historicalReferencesEnabled) =>
            onSettingsChange({
              ...settings,
              historicalReferencesEnabled,
            })
          }
        />
        <Toggle
          label="Developer mode"
          description="Show active themes, follow-up queue, and internal scoring."
          checked={settings.debugMode}
          onChange={(debugMode) =>
            onSettingsChange({
              ...settings,
              debugMode,
            })
          }
        />
      </div>
      <div className="mt-5">
        <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/45">
          Emotional intensity
        </label>
        <input
          type="range"
          min={0.3}
          max={1}
          step={0.01}
          value={settings.emotionalIntensity}
          onChange={(event) =>
            onSettingsChange({
              ...settings,
              emotionalIntensity: Number(event.target.value),
            })
          }
          className="w-full accent-cyan-300"
        />
      </div>
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <button
          type="button"
          onClick={onInspectMemory}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 text-xs uppercase tracking-[0.18em] text-white/75"
        >
          <Sparkles className="h-4 w-4" />
          Memory
        </button>
        <button
          type="button"
          onClick={onExport}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 text-xs uppercase tracking-[0.18em] text-white/75"
        >
          <Download className="h-4 w-4" />
          Export
        </button>
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-300/15 bg-rose-300/10 px-4 py-3 text-xs uppercase tracking-[0.18em] text-rose-100/85"
        >
          <Eraser className="h-4 w-4" />
          Clear
        </button>
      </div>
    </section>
  );
}
