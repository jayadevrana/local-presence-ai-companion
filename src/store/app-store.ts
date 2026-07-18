"use client";

import { create } from "zustand";

import type {
  AppSettings,
  BootstrapPayload,
  ChatMessage,
  SelfInitiationDecision,
} from "@/types/companion";

const emptyBootstrap: BootstrapPayload = {
  session: null,
  onboarding: {
    completed: false,
    preferredStyleMix: [],
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  },
  settings: {
    voiceEnabled: true,
    selfInitiationEnabled: true,
    quietMode: false,
    historicalReferencesEnabled: true,
    emotionalIntensity: 0.68,
    debugMode: false,
  },
  userProfile: {
    stylePreferences: [],
    explicitBoundaries: [],
    stablePreferences: [],
    updatedAt: new Date(0).toISOString(),
  },
  summary: null,
  messages: [],
  longTermMemory: [],
  futureEvents: [],
  followUps: [],
  unresolvedThreads: [],
  adaptation: {
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
    updatedAt: new Date(0).toISOString(),
  },
  latestDecision: null,
  evalScenarios: [],
};

type CompanionStore = BootstrapPayload & {
  hydrated: boolean;
  draft: string;
  isTyping: boolean;
  idleSeconds: number;
  isSending: boolean;
  isSpeaking: boolean;
  pendingEcho: string | null;
  memoryOpen: boolean;
  lastSpokenMessageId: string | null;
  hydrate: (payload: BootstrapPayload) => void;
  setDraft: (draft: string) => void;
  setTyping: (typing: boolean) => void;
  touchActivity: () => void;
  tickIdle: () => void;
  setSending: (sending: boolean) => void;
  setSpeaking: (speaking: boolean) => void;
  setPendingEcho: (content: string | null) => void;
  setMemoryOpen: (open: boolean) => void;
  setSettingsLocal: (settings: AppSettings) => void;
  setLatestDecision: (decision: SelfInitiationDecision | null) => void;
  setLastSpokenMessageId: (messageId: string | null) => void;
  replaceMessages: (messages: ChatMessage[]) => void;
};

export const useCompanionStore = create<CompanionStore>((set) => ({
  ...emptyBootstrap,
  hydrated: false,
  draft: "",
  isTyping: false,
  idleSeconds: 0,
  isSending: false,
  isSpeaking: false,
  pendingEcho: null,
  memoryOpen: false,
  lastSpokenMessageId: null,
  hydrate: (payload) =>
    set({
      ...payload,
      hydrated: true,
      pendingEcho: null,
    }),
  setDraft: (draft) => set({ draft }),
  setTyping: (isTyping) => set({ isTyping }),
  touchActivity: () => set({ idleSeconds: 0 }),
  tickIdle: () => set((state) => ({ idleSeconds: state.idleSeconds + 1 })),
  setSending: (isSending) => set({ isSending }),
  setSpeaking: (isSpeaking) => set({ isSpeaking }),
  setPendingEcho: (pendingEcho) => set({ pendingEcho }),
  setMemoryOpen: (memoryOpen) => set({ memoryOpen }),
  setSettingsLocal: (settings) => set({ settings }),
  setLatestDecision: (latestDecision) => set({ latestDecision }),
  setLastSpokenMessageId: (lastSpokenMessageId) => set({ lastSpokenMessageId }),
  replaceMessages: (messages) => set({ messages }),
}));
