import type {
  AssistantTone,
  EmotionalState,
  EmotionLabel,
} from "@/types/companion";
import { clamp } from "@/lib/utils";

const emotionLexicon: Array<{
  label: EmotionLabel;
  words: string[];
  valence: number;
  arousal: number;
}> = [
  { label: "anxious", words: ["anxious", "worried", "panic", "scared"], valence: -0.6, arousal: 0.8 },
  { label: "sad", words: ["sad", "heartbroken", "grief", "cry"], valence: -0.8, arousal: 0.3 },
  { label: "angry", words: ["angry", "furious", "rage", "pissed"], valence: -0.7, arousal: 0.85 },
  { label: "hopeful", words: ["hopeful", "maybe", "wish", "possible"], valence: 0.55, arousal: 0.55 },
  { label: "ambitious", words: ["build", "win", "career", "ambition", "grow"], valence: 0.5, arousal: 0.7 },
  { label: "excited", words: ["excited", "thrilled", "can't wait", "lets go"], valence: 0.75, arousal: 0.85 },
  { label: "overwhelmed", words: ["overwhelmed", "too much", "drowning"], valence: -0.75, arousal: 0.65 },
  { label: "conflicted", words: ["conflicted", "torn", "unsure", "mixed"], valence: -0.2, arousal: 0.55 },
  { label: "tired", words: ["tired", "exhausted", "drained", "burned out"], valence: -0.45, arousal: 0.2 },
  { label: "relieved", words: ["relieved", "finally", "thank god"], valence: 0.6, arousal: 0.3 },
  { label: "lonely", words: ["lonely", "alone", "isolated"], valence: -0.6, arousal: 0.25 },
  { label: "hurt", words: ["hurt", "betrayed", "wounded"], valence: -0.75, arousal: 0.55 },
  { label: "guarded", words: ["guarded", "careful", "not sure i trust"], valence: -0.1, arousal: 0.4 },
];

export function classifyEmotion(text: string): EmotionalState {
  const input = text.toLowerCase();
  const hits = emotionLexicon
    .map((entry) => ({
      ...entry,
      score: entry.words.reduce(
        (total, word) => total + (input.includes(word) ? 1 : 0),
        0,
      ),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score);

  const primary = hits[0];
  const secondary = hits[1];

  if (!primary) {
    const punctuated = /!/.test(input);
    return {
      primary: punctuated ? "excited" : "thoughtful",
      intensity: punctuated ? 0.58 : 0.38,
      confidence: 0.45,
      valence: punctuated ? 0.4 : 0.1,
      arousal: punctuated ? 0.72 : 0.38,
    };
  }

  const intensity = clamp(0.35 + primary.score * 0.18);
  return {
    primary: primary.label,
    secondary: secondary?.label,
    intensity,
    confidence: clamp(0.55 + primary.score * 0.1),
    valence: primary.valence,
    arousal: primary.arousal,
  };
}

export function selectAssistantTone(
  emotion: EmotionalState,
  desiredDirectness = 0.55,
): AssistantTone {
  if (emotion.primary === "sad" || emotion.primary === "hurt") return "warm";
  if (emotion.primary === "overwhelmed" || emotion.primary === "anxious")
    return "quiet";
  if (emotion.primary === "angry") return desiredDirectness > 0.6 ? "firm" : "protective";
  if (emotion.primary === "excited" || emotion.primary === "hopeful") return "excited";
  if (emotion.primary === "ambitious") return "reflective";
  if (emotion.primary === "tired" || emotion.primary === "numb") return "fragile";
  return "calm";
}
