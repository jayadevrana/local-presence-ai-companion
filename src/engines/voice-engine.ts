import type { AssistantTone, VoiceStyle } from "@/types/companion";

const toneMap: Record<AssistantTone, VoiceStyle> = {
  calm: { id: "calm", tone: "calm", rate: 0.95, pitch: 1, volume: 0.9 },
  warm: { id: "warm", tone: "warm", rate: 0.93, pitch: 1.02, volume: 0.92 },
  reflective: { id: "reflective", tone: "reflective", rate: 0.88, pitch: 0.98, volume: 0.88 },
  intense: { id: "intense", tone: "intense", rate: 1.02, pitch: 1.01, volume: 0.95 },
  firm: { id: "firm", tone: "firm", rate: 0.96, pitch: 0.94, volume: 0.94 },
  sad: { id: "sad", tone: "sad", rate: 0.86, pitch: 0.92, volume: 0.82 },
  excited: { id: "excited", tone: "excited", rate: 1.02, pitch: 1.07, volume: 0.94 },
  fragile: { id: "fragile", tone: "fragile", rate: 0.84, pitch: 0.96, volume: 0.8 },
  quiet: { id: "quiet", tone: "quiet", rate: 0.82, pitch: 0.97, volume: 0.75 },
  annoyed: { id: "annoyed", tone: "annoyed", rate: 1, pitch: 0.9, volume: 0.9 },
  protective: { id: "protective", tone: "protective", rate: 0.9, pitch: 0.97, volume: 0.9 },
};

export function getVoiceStyle(tone: AssistantTone = "calm", intensity = 0.68): VoiceStyle {
  const base = toneMap[tone];
  return {
    ...base,
    rate: Math.max(0.75, Math.min(1.05, base.rate + (intensity - 0.5) * 0.08)),
    pitch: Math.max(0.85, Math.min(1.15, base.pitch + (intensity - 0.5) * 0.05)),
  };
}
