import { buildPromptEnvelope } from "@/engines/prompt-builder";
import { updateAdaptiveProfile } from "@/engines/adaptive-style-engine";
import { classifyEmotion, selectAssistantTone } from "@/engines/emotion-engine";
import { buildFollowUpTriggers, extractFutureEvents } from "@/engines/follow-up-engine";
import { matchHistoricalEntries } from "@/engines/historical-matching-engine";
import { applyOnboardingToProfile, extractLongTermMemories, extractUnresolvedThreads } from "@/engines/memory-engine";
import { buildSessionSummary } from "@/engines/session-summarizer";
import { evaluateSelfInitiation } from "@/engines/self-initiation-engine";
import { getSystemPrompt } from "@/prompts/system-prompts";
import { generateCompanionText } from "@/providers/model-provider";
import {
  appendMessage,
  ensureActiveSession,
  getBootstrapPayload,
  recordDecision,
  replaceFollowUpTriggers,
  saveAdaptiveProfile,
  saveOnboardingProfile,
  saveSessionSummary,
  saveUserProfile,
  upsertFutureEvents,
  upsertLongTermMemory,
  upsertUnresolvedThreads,
} from "@/repositories/companion-repository";
import { nowIso } from "@/lib/time";
import { getVoiceStyle } from "@/engines/voice-engine";
import type {
  ConversationResponse,
  OnboardingSubmission,
  PromptContext,
  SelfInitiationDecision,
  SelfInitiationInput,
} from "@/types/companion";

async function buildPromptContext(mode: PromptContext["mode"]): Promise<PromptContext> {
  const state = await getBootstrapPayload();
  return {
    mode,
    sessionSummary: state.summary ?? undefined,
    userProfile: state.userProfile,
    adaptation: state.adaptation,
    recentMessages: state.messages,
    longTermMemory: state.longTermMemory,
    followUps: state.followUps,
    futureEvents: state.futureEvents,
    unresolvedThreads: state.unresolvedThreads,
    settings: state.settings,
  };
}

export async function completeOnboarding(
  submission: OnboardingSubmission,
): Promise<ConversationResponse> {
  const now = nowIso();
  await saveOnboardingProfile({
    completed: true,
    userName: submission.userName,
    roughLocation: submission.roughLocation,
    desiredRole: submission.desiredRole,
    preferredStyleMix: submission.preferredStyleMix,
    createdAt: now,
    updatedAt: now,
  });

  const state = await getBootstrapPayload();
  const nextProfile = applyOnboardingToProfile(state.userProfile, submission);
  await saveUserProfile(nextProfile);

  const session = await ensureActiveSession();
  const context = await buildPromptContext("onboarding");
  const prompt = buildPromptEnvelope({
    mode: "onboarding",
    context: {
      ...context,
      userProfile: nextProfile,
    },
    input: `User name: ${submission.userName}\nLocation: ${submission.roughLocation}\nRole: ${submission.desiredRole}\nStyle: ${submission.preferredStyleMix.join(", ")}`,
    matchedHistory: [],
  });

  const result = await generateCompanionText({
    mode: "onboarding",
    systemPrompt: getSystemPrompt("onboarding"),
    userInput: prompt,
    context,
    matchedHistory: [],
  });

  const emotion = classifyEmotion(result.text);
  const tone = selectAssistantTone(emotion, state.adaptation.directness);
  const voiceStyle = getVoiceStyle(tone, state.settings.emotionalIntensity);
  await appendMessage({
    sessionId: session.id,
    role: "assistant",
    mode: "onboarding",
    content: result.text,
    emotion,
    assistantTone: tone,
    isSelfInitiated: false,
    historicalEntryIds: [],
    voiceStyleId: voiceStyle.id,
  });

  const bootstrap = await getBootstrapPayload();
  const summary = buildSessionSummary({
    sessionId: session.id,
    messages: bootstrap.messages,
    unresolvedThreads: bootstrap.unresolvedThreads,
  });
  await saveSessionSummary(summary);

  return {
    message: bootstrap.messages.at(-1)!,
    summary,
    longTermMemory: bootstrap.longTermMemory,
    futureEvents: bootstrap.futureEvents,
    followUps: bootstrap.followUps,
    unresolvedThreads: bootstrap.unresolvedThreads,
    adaptation: bootstrap.adaptation,
    latestDecision: bootstrap.latestDecision,
  };
}

export async function sendUserMessage(input: string): Promise<ConversationResponse> {
  const state = await getBootstrapPayload();
  const session = state.session ?? (await ensureActiveSession());
  const userEmotion = classifyEmotion(input);

  await appendMessage({
    sessionId: session.id,
    role: "user",
    mode: "reactive_reply",
    content: input,
    emotion: userEmotion,
    isSelfInitiated: false,
    historicalEntryIds: [],
  });

  const refreshed = await getBootstrapPayload();
  const matchedHistory = refreshed.settings.historicalReferencesEnabled
    ? matchHistoricalEntries({ text: input, emotion: userEmotion, limit: 2 }).map(
        (item) => item.entry,
      )
    : [];
  const context = await buildPromptContext("reactive_reply");
  const envelope = buildPromptEnvelope({
    mode: "reactive_reply",
    context,
    input,
    matchedHistory,
  });

  const generated = await generateCompanionText({
    mode: "reactive_reply",
    systemPrompt: getSystemPrompt("reactive_reply"),
    userInput: envelope,
    context,
    matchedHistory,
  });

  const tone = selectAssistantTone(userEmotion, refreshed.adaptation.directness);
  const assistantEmotion = classifyEmotion(generated.text);
  const voiceStyle = getVoiceStyle(tone, refreshed.settings.emotionalIntensity);

  const reply = await appendMessage({
    sessionId: session.id,
    role: "assistant",
    mode: "reactive_reply",
    content: generated.text,
    emotion: assistantEmotion,
    assistantTone: tone,
    isSelfInitiated: false,
    historicalEntryIds: matchedHistory.map((entry) => entry.id),
    voiceStyleId: voiceStyle.id,
  });

  const nextAdaptation = updateAdaptiveProfile(refreshed.adaptation, input);
  await saveAdaptiveProfile(nextAdaptation);

  const longTermMemories = extractLongTermMemories(input);
  const unresolvedThreads = extractUnresolvedThreads(input);
  const futureEvents = extractFutureEvents(input);
  const followUps = buildFollowUpTriggers(futureEvents);

  await upsertLongTermMemory(longTermMemories);
  await upsertUnresolvedThreads(unresolvedThreads);
  await upsertFutureEvents(futureEvents);
  await replaceFollowUpTriggers([
    ...refreshed.followUps.filter((trigger) => !futureEvents.some((event) => event.id === trigger.sourceMemoryId)),
    ...followUps,
  ]);

  const finalState = await getBootstrapPayload();
  const summary = buildSessionSummary({
    sessionId: session.id,
    messages: finalState.messages,
    unresolvedThreads: finalState.unresolvedThreads,
  });
  await saveSessionSummary(summary);

  return {
    message: reply,
    summary,
    longTermMemory: finalState.longTermMemory,
    futureEvents: finalState.futureEvents,
    followUps: finalState.followUps,
    unresolvedThreads: finalState.unresolvedThreads,
    adaptation: nextAdaptation,
    latestDecision: finalState.latestDecision,
  };
}

export async function maybeSelfInitiate(
  input: SelfInitiationInput,
): Promise<ConversationResponse | { latestDecision: SelfInitiationDecision }> {
  const state = await getBootstrapPayload();
  const { decision, matchedHistory } = evaluateSelfInitiation(state, input);
  await recordDecision(decision);

  if (!decision.shouldSpeak || !state.session) {
    return { latestDecision: decision };
  }

  const context = await buildPromptContext("self_initiated");
  const prompt = buildPromptEnvelope({
    mode: "self_initiated",
    context,
    input: decision.decisionType ?? "reflection",
    matchedHistory,
  });

  const generated = await generateCompanionText({
    mode: "self_initiated",
    systemPrompt: getSystemPrompt("self_initiated"),
    userInput: prompt,
    context,
    matchedHistory,
  });

  const tone = selectAssistantTone(
    state.summary?.currentEmotion ?? classifyEmotion(generated.text),
    state.adaptation.directness,
  );
  const assistantEmotion = classifyEmotion(generated.text);
  const voiceStyle = getVoiceStyle(tone, state.settings.emotionalIntensity);
  const reply = await appendMessage({
    sessionId: state.session.id,
    role: "assistant",
    mode: "self_initiated",
    content: generated.text,
    emotion: assistantEmotion,
    assistantTone: tone,
    isSelfInitiated: true,
    historicalEntryIds: matchedHistory.map((entry) => entry.id),
    voiceStyleId: voiceStyle.id,
  });

  const finalState = await getBootstrapPayload();
  const summary = buildSessionSummary({
    sessionId: state.session.id,
    messages: finalState.messages,
    unresolvedThreads: finalState.unresolvedThreads,
  });
  await saveSessionSummary(summary);

  return {
    message: reply,
    summary,
    longTermMemory: finalState.longTermMemory,
    futureEvents: finalState.futureEvents,
    followUps: finalState.followUps,
    unresolvedThreads: finalState.unresolvedThreads,
    adaptation: finalState.adaptation,
    latestDecision: decision,
  };
}
