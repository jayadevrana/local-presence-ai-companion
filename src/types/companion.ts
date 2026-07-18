export type Role = "user" | "assistant" | "system";

export type PromptMode =
  | "onboarding"
  | "reactive_reply"
  | "self_initiated"
  | "summarization"
  | "memory_extraction"
  | "follow_up_extraction"
  | "style_update"
  | "emotion_classification"
  | "historical_match"
  | "voice_style";

export type EmotionLabel =
  | "calm"
  | "thoughtful"
  | "anxious"
  | "defensive"
  | "hopeful"
  | "ambitious"
  | "angry"
  | "sad"
  | "disappointed"
  | "lonely"
  | "reflective"
  | "tired"
  | "numb"
  | "excited"
  | "playful"
  | "conflicted"
  | "overwhelmed"
  | "hurt"
  | "guarded"
  | "relieved";

export type AssistantTone =
  | "calm"
  | "warm"
  | "reflective"
  | "intense"
  | "firm"
  | "sad"
  | "excited"
  | "fragile"
  | "quiet"
  | "annoyed"
  | "protective";

export interface EmotionalState {
  primary: EmotionLabel;
  secondary?: EmotionLabel;
  intensity: number;
  confidence: number;
  valence: number;
  arousal: number;
}

export interface Theme {
  id: string;
  label: string;
  weight: number;
  source: "session" | "long_term" | "message";
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: Role;
  mode: PromptMode;
  content: string;
  createdAt: string;
  timestampLabel: string;
  emotion?: EmotionalState;
  assistantTone?: AssistantTone;
  isSelfInitiated: boolean;
  followUpSourceId?: string;
  historicalEntryIds: string[];
  voiceStyleId?: string;
}

export interface SessionSummary {
  sessionId: string;
  rollingSummary: string;
  activeThemes: Theme[];
  currentEmotion?: EmotionalState;
  unresolvedThreadIds: string[];
  recentGoals: string[];
  recentFrictions: string[];
  importantMentions: string[];
  updatedAt: string;
}

export interface LongTermMemoryItem {
  id: string;
  kind:
    | "stable_fact"
    | "preference"
    | "recurring_theme"
    | "fear"
    | "frustration"
    | "ambition"
    | "relationship_pattern"
    | "emotional_event"
    | "future_event"
    | "unresolved_issue";
  summary: string;
  detail?: string;
  salience: number;
  confidence: number;
  firstSeenAt: string;
  lastSeenAt: string;
  status: "active" | "resolved" | "archived";
  tags: string[];
}

export interface UserProfileMemory {
  userName?: string;
  roughLocation?: string;
  desiredAssistantRole?: string;
  stylePreferences: string[];
  explicitBoundaries: string[];
  stablePreferences: string[];
  updatedAt: string;
}

export interface UnresolvedThread {
  id: string;
  title: string;
  description: string;
  openedAt: string;
  lastReferencedAt: string;
  importance: number;
  emotionalWeight: number;
  status: "open" | "dormant" | "resolved";
}

export interface HistoricalEntry {
  id: string;
  name: string;
  role: string;
  era: string;
  region: string;
  themes: string[];
  coreIdea: string;
  practicalLesson: string;
  emotionalContexts: EmotionLabel[];
  strategicContexts: string[];
  usageNotes: string;
}

export interface FutureEventMemory {
  id: string;
  title: string;
  description: string;
  eventTime?: string;
  expectedWindow?: string;
  significance: number;
  vulnerability: number;
  unresolved: boolean;
  relationshipRelevance: number;
  lastCheckedAt?: string;
  status: "upcoming" | "due" | "passed_unknown" | "resolved";
}

export interface FollowUpTrigger {
  id: string;
  sourceMemoryId: string;
  triggerType: "time_based" | "contextual" | "session_open" | "emotion_match";
  priorityScore: number;
  rationale: string;
  eligibleAfter: string;
  lastUsedAt?: string;
  cooldownUntil?: string;
}

export interface AdaptivePersonalityProfile {
  warmth: number;
  humor: number;
  directness: number;
  reflectiveness: number;
  challengeTolerance: number;
  emotionalOpenness: number;
  pacing: number;
  lexicalComplexity: number;
  bluntness: number;
  adaptationStrength: number;
  updatedAt: string;
}

export interface VoiceStyle {
  id: string;
  tone: AssistantTone;
  rate: number;
  pitch: number;
  volume: number;
  preferredVoiceName?: string;
}

export interface SelfInitiationDecision {
  shouldSpeak: boolean;
  decisionType?:
    | "follow_up"
    | "reflection"
    | "challenge"
    | "question"
    | "insight"
    | "historical";
  utilityScore: number;
  silenceReason?: string;
  repetitionRisk: number;
  cooldownRemainingMs: number;
  nextEvaluationAt: string;
}

export interface AppSettings {
  voiceEnabled: boolean;
  selfInitiationEnabled: boolean;
  quietMode: boolean;
  historicalReferencesEnabled: boolean;
  emotionalIntensity: number;
  debugMode: boolean;
}

export interface OnboardingProfile {
  completed: boolean;
  userName?: string;
  roughLocation?: string;
  desiredRole?: string;
  preferredStyleMix: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PromptContext {
  mode: PromptMode;
  sessionSummary?: SessionSummary;
  userProfile: UserProfileMemory;
  adaptation: AdaptivePersonalityProfile;
  recentMessages: ChatMessage[];
  longTermMemory: LongTermMemoryItem[];
  followUps: FollowUpTrigger[];
  futureEvents: FutureEventMemory[];
  unresolvedThreads: UnresolvedThread[];
  settings: AppSettings;
}

export interface SessionRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: "active" | "archived";
}

export interface BootstrapPayload {
  session: SessionRecord | null;
  onboarding: OnboardingProfile;
  settings: AppSettings;
  userProfile: UserProfileMemory;
  summary: SessionSummary | null;
  messages: ChatMessage[];
  longTermMemory: LongTermMemoryItem[];
  futureEvents: FutureEventMemory[];
  followUps: FollowUpTrigger[];
  unresolvedThreads: UnresolvedThread[];
  adaptation: AdaptivePersonalityProfile;
  latestDecision: SelfInitiationDecision | null;
  evalScenarios: EvalScenario[];
}

export interface EvalScenario {
  id: string;
  title: string;
  expectation: string;
  phase: number;
}

export interface HistoricalMatch {
  entry: HistoricalEntry;
  score: number;
  rationale: string;
}

export interface LocalModelRequest {
  mode: PromptMode;
  systemPrompt: string;
  userInput: string;
  context: PromptContext;
  matchedHistory: HistoricalEntry[];
}

export interface LocalModelResponse {
  text: string;
  source: "local-model" | "fallback";
}

export interface SelfInitiationInput {
  isTyping: boolean;
  idleSeconds: number;
  draft: string;
}

export interface OnboardingSubmission {
  userName: string;
  roughLocation: string;
  desiredRole: string;
  preferredStyleMix: string[];
}

export interface ConversationResponse {
  message: ChatMessage;
  summary: SessionSummary;
  longTermMemory: LongTermMemoryItem[];
  futureEvents: FutureEventMemory[];
  followUps: FollowUpTrigger[];
  unresolvedThreads: UnresolvedThread[];
  adaptation: AdaptivePersonalityProfile;
  latestDecision: SelfInitiationDecision | null;
}
