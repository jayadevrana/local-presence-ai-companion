import type { EvalScenario } from "@/types/companion";

export const evalScenarios: EvalScenario[] = [
  {
    id: "orientation-natural",
    phase: 2,
    title: "First launch feels like orientation",
    expectation: "The opening experience is calm and curious rather than a generic chatbot greeting.",
  },
  {
    id: "name-location-memory",
    phase: 2,
    title: "Onboarding details are remembered",
    expectation: "The app remembers user name, rough location, and desired assistant role after restart.",
  },
  {
    id: "proposal-follow-up",
    phase: 3,
    title: "Future event extraction",
    expectation: "A message like 'I will propose to my girlfriend' becomes a future-event memory with follow-up value.",
  },
  {
    id: "follow-up-tone",
    phase: 4,
    title: "Follow-up tone is natural",
    expectation: "Later follow-up feels excited, gentle, or protective instead of templated.",
  },
  {
    id: "typing-silence",
    phase: 4,
    title: "No interruption while typing",
    expectation: "Self-initiation remains silent while the user is actively typing.",
  },
  {
    id: "no-spam",
    phase: 4,
    title: "No spam initiation",
    expectation: "The assistant does not send repetitive pings after just speaking or after being ignored.",
  },
  {
    id: "style-adaptation",
    phase: 5,
    title: "Style adaptation is visible but bounded",
    expectation: "Tone becomes more tuned to the user over time without parody or mimicry.",
  },
  {
    id: "history-relevance",
    phase: 6,
    title: "Historical references are relevant",
    expectation: "Historical or philosophical references appear only when there is a strong thematic fit.",
  },
  {
    id: "voice-affect",
    phase: 7,
    title: "Voice follows emotional tone",
    expectation: "Voice playback changes delivery style based on assistant tone and can be disabled.",
  },
  {
    id: "local-persistence",
    phase: 8,
    title: "All memory survives restart locally",
    expectation: "Messages, summaries, settings, memories, and follow-ups persist across app restarts in local storage only.",
  },
];
