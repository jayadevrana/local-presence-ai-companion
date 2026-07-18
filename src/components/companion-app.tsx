"use client";

import {
  startTransition,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from "react";
import { Brain, MessageCircleHeart, Mic2, MoonStar, TimerReset } from "lucide-react";

import { DebugPanel } from "@/components/debug-panel";
import { MemoryInspector } from "@/components/memory-inspector";
import { MessageComposer } from "@/components/message-composer";
import { MessageList } from "@/components/message-list";
import { OnboardingFlow } from "@/components/onboarding-flow";
import { PresenceOrb } from "@/components/presence-orb";
import { SettingsPanel } from "@/components/settings-panel";
import { StatusPill } from "@/components/status-pill";
import { useCompanionStore } from "@/store/app-store";
import type { AppSettings, BootstrapPayload, ChatMessage } from "@/types/companion";

interface CompanionAppProps {
  initialData: BootstrapPayload;
  instanceName?: string | null;
}

type PillTone = "active" | "neutral" | "warn" | "soft";
type BrowserSpeechRecognitionEvent = Event & {
  resultIndex: number;
  results: ArrayLike<
    ArrayLike<{
      transcript: string;
      confidence: number;
    }> & { isFinal: boolean }
  >;
};
type BrowserSpeechRecognitionErrorEvent = Event & {
  error: string;
  message: string;
};
type BrowserSpeechRecognition = EventTarget & {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onend: ((event: Event) => void) | null;
  onerror: ((event: BrowserSpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  onstart: ((event: Event) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

export function CompanionApp({
  initialData,
  instanceName,
}: CompanionAppProps) {
  const hydrated = useCompanionStore((store) => store.hydrated);
  const session = useCompanionStore((store) => store.session);
  const onboarding = useCompanionStore((store) => store.onboarding);
  const settings = useCompanionStore((store) => store.settings);
  const userProfile = useCompanionStore((store) => store.userProfile);
  const summary = useCompanionStore((store) => store.summary);
  const messages = useCompanionStore((store) => store.messages);
  const longTermMemory = useCompanionStore((store) => store.longTermMemory);
  const futureEvents = useCompanionStore((store) => store.futureEvents);
  const followUps = useCompanionStore((store) => store.followUps);
  const unresolvedThreads = useCompanionStore((store) => store.unresolvedThreads);
  const adaptation = useCompanionStore((store) => store.adaptation);
  const latestDecision = useCompanionStore((store) => store.latestDecision);
  const evalScenarios = useCompanionStore((store) => store.evalScenarios);
  const draft = useCompanionStore((store) => store.draft);
  const isTyping = useCompanionStore((store) => store.isTyping);
  const idleSeconds = useCompanionStore((store) => store.idleSeconds);
  const isSending = useCompanionStore((store) => store.isSending);
  const isSpeaking = useCompanionStore((store) => store.isSpeaking);
  const pendingEcho = useCompanionStore((store) => store.pendingEcho);
  const memoryOpen = useCompanionStore((store) => store.memoryOpen);
  const lastSpokenMessageId = useCompanionStore(
    (store) => store.lastSpokenMessageId,
  );
  const hydrate = useCompanionStore((store) => store.hydrate);
  const setDraft = useCompanionStore((store) => store.setDraft);
  const setTyping = useCompanionStore((store) => store.setTyping);
  const touchActivity = useCompanionStore((store) => store.touchActivity);
  const tickIdle = useCompanionStore((store) => store.tickIdle);
  const setSending = useCompanionStore((store) => store.setSending);
  const setSpeaking = useCompanionStore((store) => store.setSpeaking);
  const setPendingEcho = useCompanionStore((store) => store.setPendingEcho);
  const setMemoryOpen = useCompanionStore((store) => store.setMemoryOpen);
  const setSettingsLocal = useCompanionStore((store) => store.setSettingsLocal);
  const setLastSpokenMessageId = useCompanionStore(
    (store) => store.setLastSpokenMessageId,
  );
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const finalTranscriptRef = useRef("");

  const state = hydrated
    ? {
        hydrated,
        session,
        onboarding,
        settings,
        userProfile,
        summary,
        messages,
        longTermMemory,
        futureEvents,
        followUps,
        unresolvedThreads,
        adaptation,
        latestDecision,
        evalScenarios,
        draft,
        isTyping,
        idleSeconds,
        isSending,
        isSpeaking,
        pendingEcho,
        memoryOpen,
        lastSpokenMessageId,
      }
    : {
        ...initialData,
        hydrated: true,
        draft,
        isTyping,
        idleSeconds,
        isSending,
        isSpeaking,
        pendingEcho,
        memoryOpen,
        lastSpokenMessageId,
      };

  useEffect(() => {
    hydrate(initialData);
  }, [hydrate, initialData]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const speechWindow = window as Window & {
      SpeechRecognition?: BrowserSpeechRecognitionConstructor;
      webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
    };
    const Recognition =
      speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    setSpeechSupported(Boolean(Recognition));
    if (!Recognition) return;

    const recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      finalTranscriptRef.current = "";
      setRecognitionError(null);
      setIsListening(true);
      touchActivity();
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        setSpeaking(false);
      }
    };

    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const transcript = event.results[index][0]?.transcript ?? "";
        if (event.results[index].isFinal) {
          finalText += transcript;
        } else {
          interimText += transcript;
        }
      }

      const nextText = [finalTranscriptRef.current, finalText, interimText]
        .filter(Boolean)
        .join(" ")
        .trim();

      if (finalText.trim()) {
        finalTranscriptRef.current = [finalTranscriptRef.current, finalText]
          .filter(Boolean)
          .join(" ")
          .trim();
      }

      setDraft(nextText);
      touchActivity();
    };

    recognition.onerror = (event) => {
      if (event.error === "aborted") return;
      setRecognitionError(
        event.error === "not-allowed"
          ? "Microphone permission was denied."
          : `Voice input error: ${event.error}`,
      );
    };

    recognition.onend = () => {
      setIsListening(false);
      const transcript = finalTranscriptRef.current.trim();
      finalTranscriptRef.current = "";
      if (transcript) {
        setDraft(transcript);
        void sendVoiceTranscript(transcript);
      }
    };

    recognitionRef.current = recognition as unknown as BrowserSpeechRecognition;

    return () => {
      recognition.abort();
      recognitionRef.current = null;
    };
  }, [setDraft, setSpeaking, touchActivity]);

  useEffect(() => {
    const tick = window.setInterval(() => tickIdle(), 1000);
    return () => window.clearInterval(tick);
  }, [tickIdle]);

  useEffect(() => {
    const handleActivity = () => touchActivity();
    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("mousedown", handleActivity);
    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("mousedown", handleActivity);
    };
  }, [touchActivity]);

  useEffect(() => {
    const nextTyping = draft.trim().length > 0;
    if (nextTyping !== isTyping) {
      setTyping(nextTyping);
    }
  }, [draft, isTyping, setTyping]);

  const applyPayload = useEffectEvent((payload: BootstrapPayload) => {
    startTransition(() => {
      hydrate(payload);
    });
  });

  const saveSettings = useEffectEvent(async (settings: AppSettings) => {
    setSettingsLocal(settings);
    const response = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    const payload = (await response.json()) as BootstrapPayload;
    applyPayload(payload);
  });

  const submitOnboarding = useEffectEvent(async (payload: {
    userName: string;
    roughLocation: string;
    desiredRole: string;
    preferredStyleMix: string[];
  }) => {
    setSending(true);
    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const next = (await response.json()) as BootstrapPayload;
      applyPayload(next);
    } finally {
      setSending(false);
    }
  });

  const sendMessage = useEffectEvent(async () => {
    const content = draft.trim();
    if (!content || isSending) return;

    setPendingEcho(content);
    setDraft("");
    setSending(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const payload = (await response.json()) as BootstrapPayload;
      applyPayload(payload);
    } finally {
      setSending(false);
    }
  });

  const sendVoiceTranscript = useEffectEvent(async (content: string) => {
    const normalized = content.trim();
    if (!normalized || isSending) return;

    setPendingEcho(normalized);
    setDraft("");
    setSending(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: normalized }),
      });
      const payload = (await response.json()) as BootstrapPayload;
      applyPayload(payload);
    } finally {
      setSending(false);
    }
  });

  const toggleListening = useEffectEvent(() => {
    const recognition = recognitionRef.current;
    if (!recognition || isSending) return;
    if (isListening) {
      recognition.stop();
      return;
    }

    finalTranscriptRef.current = "";
    setRecognitionError(null);
    setDraft("");
    recognition.start();
  });

  const maybeSpeak = useEffectEvent((message: ChatMessage) => {
    if (!state.settings.voiceEnabled || typeof window === "undefined") return;
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message.content);
    const intensity = state.settings.emotionalIntensity;
    utterance.rate =
      message.assistantTone === "quiet" || message.assistantTone === "fragile"
        ? 0.84 + intensity * 0.05
        : message.assistantTone === "excited"
          ? 1 + intensity * 0.06
          : 0.92 + intensity * 0.04;
    utterance.pitch =
      message.assistantTone === "warm"
        ? 1.02
        : message.assistantTone === "firm"
          ? 0.94
          : 0.99;
    utterance.volume = 0.88;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setLastSpokenMessageId(message.id);
  });

  useEffect(() => {
    const lastAssistant = [...state.messages]
      .reverse()
      .find((message) => message.role === "assistant");
    if (!lastAssistant) return;
    if (lastAssistant.id === state.lastSpokenMessageId) return;
    if (!state.settings.voiceEnabled) return;
    maybeSpeak(lastAssistant);
  }, [
    maybeSpeak,
    state.lastSpokenMessageId,
    state.messages,
    state.settings.voiceEnabled,
  ]);

  const evaluateSilence = useEffectEvent(async () => {
    if (!state.onboarding.completed || !state.settings.selfInitiationEnabled) return;

    const response = await fetch("/api/self-initiate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        isTyping: state.isTyping,
        idleSeconds: state.idleSeconds,
        draft: state.draft,
      }),
    });
    const payload = (await response.json()) as BootstrapPayload;
    applyPayload(payload);
  });

  useEffect(() => {
    if (!state.onboarding.completed || !state.settings.selfInitiationEnabled) return;
    if (state.settings.quietMode || state.isTyping || state.draft.trim().length > 0) return;

    const timeout = window.setTimeout(() => {
      void evaluateSilence();
    }, 5000 + Math.random() * 55000);

    return () => window.clearTimeout(timeout);
  }, [
    evaluateSilence,
    state.draft,
    state.isTyping,
    state.messages.length,
    state.onboarding.completed,
    state.settings.quietMode,
    state.settings.selfInitiationEnabled,
  ]);

  const handleExport = useEffectEvent(async () => {
    const response = await fetch("/api/conversation/export");
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "companion-export.json";
    anchor.click();
    window.URL.revokeObjectURL(url);
  });

  const handleClear = useEffectEvent(async () => {
    const confirmed = window.confirm(
      "Clear local conversation memory, follow-ups, and summaries?",
    );
    if (!confirmed) return;
    const response = await fetch("/api/conversation/clear", {
      method: "POST",
    });
    const payload = (await response.json()) as BootstrapPayload;
    applyPayload(payload);
  });

  const emotionLabel = state.summary?.currentEmotion?.primary ?? "calm";
  const statusPills = useMemo(
    (): Array<{ label: string; tone: PillTone }> => [
      {
        label: isListening
          ? "Listening"
          : state.isTyping
            ? "Typing"
            : state.idleSeconds > 18
              ? "Idle"
              : "Present",
        tone: isListening
          ? "active"
          : state.isTyping
            ? "warn"
            : state.idleSeconds > 18
              ? "soft"
              : "active",
      },
      {
        label: state.isSpeaking ? "Speaking" : "Silent",
        tone: state.isSpeaking ? "active" : "neutral",
      },
      {
        label: `Emotion ${emotionLabel}`,
        tone: "soft" as const,
      },
      {
        label: state.settings.quietMode ? "Quiet mode" : "Initiative on",
        tone: state.settings.quietMode ? "warn" : "neutral",
      },
    ],
    [
      emotionLabel,
      isListening,
      state.idleSeconds,
      state.isSpeaking,
      state.isTyping,
      state.settings.quietMode,
    ],
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(76,122,255,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(232,189,92,0.08),transparent_28%),#05060a] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.5fr_0.8fr]">
        <section className="rounded-[2.4rem] border border-white/10 bg-black/30 p-4 shadow-[0_40px_160px_rgba(0,0,0,0.5)] backdrop-blur-2xl sm:p-6">
          <header className="mb-6 flex flex-col gap-5 border-b border-white/8 pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-3 text-xs uppercase tracking-[0.24em] text-white/45">
                <MessageCircleHeart className="h-4 w-4" />
                Local Presence
                {instanceName ? (
                  <span className="rounded-full border border-white/15 px-2 py-1 text-[0.65rem] tracking-[0.18em] text-white/65">
                    {instanceName}
                  </span>
                ) : null}
              </div>
              <h1 className="mt-3 max-w-2xl font-serif text-4xl leading-tight text-white/95 sm:text-5xl">
                A companion with memory, timing, and restraint.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-8 text-white/62">
                Local-only continuity, emotional awareness, adaptive style, and
                selective initiative without fake biography.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {statusPills.map((pill) => (
                <StatusPill key={pill.label} label={pill.label} tone={pill.tone} />
              ))}
            </div>
          </header>

          {!state.onboarding.completed ? (
            <OnboardingFlow
              isSubmitting={state.isSending}
              onSubmit={submitOnboarding}
            />
          ) : (
            <div className="grid gap-5">
              <div className="grid gap-6 rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,188,88,0.08),transparent_30%),rgba(255,255,255,0.02)] p-5 sm:grid-cols-[1.1fr_0.9fr] sm:items-center">
                <div className="space-y-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/40">
                    Voice presence
                  </p>
                  <h2 className="font-serif text-3xl leading-tight text-white/94 sm:text-4xl">
                    Speak naturally. The orb listens, transcribes, and sends for you.
                  </h2>
                  <p className="max-w-xl text-sm leading-8 text-white/62">
                    This mode is speech-first. Tap the orb and talk out loud. The
                    keyboard stays here only as a fallback.
                  </p>
                </div>
                <PresenceOrb
                  isListening={isListening}
                  isSpeaking={state.isSpeaking}
                  hasDraft={state.draft.trim().length > 0}
                  disabled={!speechSupported || state.isSending}
                  onToggleListening={() => void toggleListening()}
                />
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-white/[0.02] p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-white/40">
                      Current session
                    </p>
                    <h2 className="mt-2 font-serif text-2xl text-white/92">
                      {state.userProfile.userName
                        ? `${state.userProfile.userName}, pick up where we left off.`
                        : "Pick up where we left off."}
                    </h2>
                  </div>
                  <div className="flex gap-2 text-white/45">
                    <MoonStar className="h-5 w-5" />
                    <Mic2 className="h-5 w-5" />
                    <TimerReset className="h-5 w-5" />
                  </div>
                </div>
                <MessageList messages={state.messages} pendingEcho={state.pendingEcho} />
              </div>

              <MessageComposer
                draft={state.draft}
                isTyping={state.isTyping}
                isSending={state.isSending}
                isListening={isListening}
                speechSupported={speechSupported}
                recognitionError={recognitionError}
                onDraftChange={setDraft}
                onSubmit={() => void sendMessage()}
                onToggleListening={() => void toggleListening()}
              />
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <SettingsPanel
            settings={state.settings}
            onSettingsChange={(settings) => void saveSettings(settings)}
            onExport={() => void handleExport()}
            onClear={() => void handleClear()}
            onInspectMemory={() => setMemoryOpen(true)}
          />

          <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-white/45">
              <Brain className="h-4 w-4" />
              Continuity
            </div>
            <p className="mt-4 text-sm leading-7 text-white/76">
              {state.summary?.rollingSummary ??
                "After onboarding, this space tracks themes, future events, unresolved threads, and emotional continuity."}
            </p>
            <div className="mt-4 grid gap-3">
              <div className="rounded-[1.5rem] bg-white/[0.03] p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">
                  Follow-up queue
                </p>
                <p className="mt-2 text-sm leading-7 text-white/76">
                  {state.followUps[0]?.rationale ?? "No follow-up cue captured yet."}
                </p>
              </div>
              <div className="rounded-[1.5rem] bg-white/[0.03] p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">
                  Adaptation signal
                </p>
                <p className="mt-2 text-sm leading-7 text-white/76">
                  Warmth {state.adaptation.warmth.toFixed(2)}, directness{" "}
                  {state.adaptation.directness.toFixed(2)}, challenge{" "}
                  {state.adaptation.challengeTolerance.toFixed(2)}.
                </p>
              </div>
            </div>
          </section>

          {state.settings.debugMode ? <DebugPanel state={state} /> : null}
        </aside>
      </div>

      <MemoryInspector
        open={state.memoryOpen}
        summary={state.summary}
        memory={state.longTermMemory}
        futureEvents={state.futureEvents}
        followUps={state.followUps}
        onClose={() => setMemoryOpen(false)}
      />
    </div>
  );
}
