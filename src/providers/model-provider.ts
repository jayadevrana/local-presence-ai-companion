import type {
  HistoricalEntry,
  LocalModelRequest,
  LocalModelResponse,
} from "@/types/companion";

const LOCAL_MODEL_BASE_URL =
  process.env.LOCAL_MODEL_BASE_URL ?? "http://127.0.0.1:11434/v1";
const LOCAL_MODEL_NAME = process.env.LOCAL_MODEL_NAME ?? "llama3.1";

export async function generateCompanionText(
  request: LocalModelRequest,
): Promise<LocalModelResponse> {
  try {
    const response = await fetch(`${LOCAL_MODEL_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: LOCAL_MODEL_NAME,
        temperature: request.mode === "self_initiated" ? 0.9 : 0.78,
        top_p: 0.92,
        presence_penalty: 0.35,
        frequency_penalty: 0.4,
        messages: [
          { role: "system", content: request.systemPrompt },
          { role: "user", content: request.userInput },
        ],
      }),
      cache: "no-store",
    });

    if (response.ok) {
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content?.trim();
      if (text) {
        return {
          text,
          source: "local-model",
        };
      }
    }
  } catch {
    // Fall through to the local fallback voice.
  }

  return {
    text: buildFallbackText(request),
    source: "fallback",
  };
}

function buildFallbackText(request: LocalModelRequest) {
  if (request.mode === "onboarding") {
    return buildOnboardingFallback(request);
  }

  if (request.mode === "self_initiated") {
    return buildSelfInitiatedFallback(request);
  }

  return buildReactiveFallback(request);
}

function buildOnboardingFallback(request: LocalModelRequest) {
  const name = request.context.userProfile.userName;
  const role = request.context.userProfile.desiredAssistantRole;

  if (name && role) {
    return `${name}. All right. ${role} gives me a shape to lean into. Tell me what kind of tone you want from me when things get hard: softer, sharper, more reflective, more direct?`;
  }

  return pickVariant(
    [
      "I’m here. Give me a little orientation so I can meet you properly: what should I call you, where are you roughly, and what kind of presence would actually help?",
      "Before we turn this into a normal chat, orient me a little. What should I call you, where are you in the world, and what do you want me to be for you?",
      "Start me in the right direction. Tell me your name, your rough part of the world, and the role you want me to play here.",
    ],
    request,
  );
}

function buildReactiveFallback(request: LocalModelRequest) {
  const latestUser = getLatestUserMessage(request);
  const lower = latestUser.toLowerCase();
  const emotion = getLatestUserEmotion(request);
  const opener = pickVariant(buildOpeners(emotion, lower), request);
  const observation = pickVariant(buildObservations(lower, emotion), request);
  const question = pickVariant(
    buildQuestions(lower, request.context.adaptation.challengeTolerance),
    request,
  );
  const historyLine = buildHistoricalLine(request, lower);
  const maybeName = shouldUseName(request) ? `${request.context.userProfile.userName}, ` : "";

  return [maybeName ? `${maybeName}${opener}` : opener, observation, historyLine, question]
    .filter(Boolean)
    .join(" ");
}

function buildSelfInitiatedFallback(request: LocalModelRequest) {
  const followUp = request.context.futureEvents
    .filter((event) => event.unresolved)
    .sort((left, right) => right.significance - left.significance)[0];

  if (followUp) {
    const lower = followUp.description.toLowerCase();
    if (/proposal|propose/.test(lower)) {
      return pickVariant(
        [
          "I keep coming back to the proposal. Did it happen?",
          "I haven’t let go of the proposal thread. What happened?",
          "All right, I need the update. Did you ask her?",
          "The proposal is still sitting here with me. Tell me how it went.",
        ],
        request,
      );
    }

    if (/surgery/.test(lower)) {
      return pickVariant(
        [
          "I’ve been thinking about the surgery. How are you now?",
          "I want to check on the surgery thread. How did it go?",
          "That surgery stayed with me. Tell me where things are.",
        ],
        request,
      );
    }

    return pickVariant(
      [
        `I keep circling back to ${followUp.title.toLowerCase()}. How did it go?`,
        `${followUp.title} is still open in my head. What happened?`,
        `I don’t want to let ${followUp.title.toLowerCase()} disappear into silence. Give me the update.`,
      ],
      request,
    );
  }

  const unresolved = request.context.unresolvedThreads[0];
  if (unresolved) {
    return pickVariant(
      [
        `Something about ${unresolved.title.toLowerCase()} still feels unfinished. Where are you with it now?`,
        `I don’t think that thread is actually closed yet. What’s changed since we last touched it?`,
        `That situation still feels live to me. What are you noticing now that you weren’t before?`,
      ],
      request,
    );
  }

  const historyLine = buildHistoricalLine(
    request,
    request.context.sessionSummary?.rollingSummary.toLowerCase() ?? "",
    true,
  );

  return (
    historyLine ||
    pickVariant(
      [
        "You’ve been quiet long enough that I’m curious what’s happening under the surface.",
        "I’m not trying to fill silence for the sake of it, but I do want to ask what’s really on your mind.",
        "If there’s a real thought you’ve been circling and not saying, start there.",
      ],
      request,
    )
  );
}

function buildOpeners(emotion: string | undefined, lower: string) {
  if (/proposal|propose/.test(lower)) {
    return [
      "That’s a big sentence to carry around in your chest.",
      "Of course that has voltage in it.",
      "Yeah, that would make almost anyone tense.",
    ];
  }

  if (/exam|interview|presentation/.test(lower)) {
    return [
      "Pressure like that can narrow your whole field of vision.",
      "That kind of countdown changes the texture of everything.",
      "High-stakes moments have a way of making your thoughts louder.",
    ];
  }

  if (/quit my job|leave my job|career/.test(lower)) {
    return [
      "That’s not a casual thought. It usually means something deeper has been building.",
      "People don’t usually reach for that idea unless something in them is already done.",
      "That kind of decision usually carries relief and fear at the same time.",
    ];
  }

  switch (emotion) {
    case "anxious":
    case "overwhelmed":
      return [
        "Slow down with me for a second.",
        "Okay. Let’s not let panic set the rhythm here.",
        "Take one breath before we make this bigger than it is.",
      ];
    case "sad":
    case "hurt":
      return [
        "That lands heavy.",
        "There’s real weight in that.",
        "I can feel the bruise in that sentence.",
      ];
    case "angry":
      return [
        "There’s heat in that.",
        "You’re not saying that from a neutral place.",
        "That sounds like something that’s been building.",
      ];
    case "ambitious":
      return [
        "There’s real momentum in that.",
        "That sounds alive in you.",
        "I can hear how much you want movement there.",
      ];
    case "excited":
      return [
        "That has real charge to it.",
        "There’s a spark in that.",
        "That sounds bright and immediate.",
      ];
    default:
      return [
        "I’m tracking you.",
        "All right.",
        "Keep going.",
      ];
  }
}

function buildObservations(lower: string, emotion: string | undefined) {
  if (/proposal|propose/.test(lower)) {
    return [
      "This probably isn’t just about the words. It’s about what those words could change.",
      "The fear usually isn’t the sentence itself. It’s the life on the other side of it.",
      "Moments like that can feel small from the outside and enormous from the inside.",
    ];
  }

  if (/father|mother|parents/.test(lower)) {
    return [
      "Family conversations drag old versions of us into the room fast.",
      "Those moments are rarely about one conversation. They carry years behind them.",
      "It’s hard to stay present when history is standing right there with you.",
    ];
  }

  if (/quit my job|job|career/.test(lower)) {
    return [
      "Usually by the time someone says that out loud, the inner argument has already been running for a while.",
      "Decisions like that are never purely practical. Identity gets tangled up in them fast.",
      "Career decisions can sound logistical on the surface and still feel deeply personal underneath.",
    ];
  }

  if (emotion === "anxious" || emotion === "overwhelmed") {
    return [
      "Your mind is probably trying to rehearse every outcome at once.",
      "When your system is lit up like this, everything starts to feel more absolute than it is.",
      "Anxiety has a way of making one moment swallow the whole horizon.",
    ];
  }

  if (emotion === "sad" || emotion === "hurt") {
    return [
      "Part of this sounds like pain, not just analysis.",
      "I don’t think this is a problem you’re describing from a distance.",
      "There’s more feeling than performance in that, which matters.",
    ];
  }

  if (emotion === "ambitious") {
    return [
      "You sound pulled forward by something real, not just restless.",
      "There’s drive in that, but it wants shape.",
      "That doesn’t sound like fantasy. It sounds like pressure looking for direction.",
    ];
  }

  return [
    "I don’t think the surface version is the whole story here.",
    "There’s probably one part of this that matters more than the rest.",
    "The interesting part is usually not the headline but the thing underneath it.",
  ];
}

function buildQuestions(lower: string, challengeTolerance: number) {
  if (/proposal|propose/.test(lower)) {
    return challengeTolerance > 0.58
      ? [
          "What are you actually afraid of there: the answer, or the vulnerability of asking?",
          "If you strip away the performance pressure, what do you most want that moment to feel like?",
          "What would make you leave that moment feeling honest, regardless of the answer?",
        ]
      : [
          "What part of it is making you most nervous?",
          "What do you want that moment to feel like when you’re in it?",
          "Do you want help settling your nerves, or help thinking through the moment itself?",
        ];
  }

  if (/exam|interview|presentation/.test(lower)) {
    return [
      "What would help most right now: calm, structure, or a sharper plan?",
      "What part of it feels most exposed to you?",
      "Do you need steadiness right now or strategy?",
    ];
  }

  if (/father|mother|parents/.test(lower)) {
    return challengeTolerance > 0.58
      ? [
          "What truth are you most tempted to dilute when the moment comes?",
          "What would you regret not saying?",
          "What boundary matters enough that you don’t want to soften it away?",
        ]
      : [
          "What do you most need from that conversation?",
          "What are you hoping happens, even if it’s unlikely?",
          "Do you want to be understood there, protected there, or simply honest there?",
        ];
  }

  return challengeTolerance > 0.58
    ? [
        "What part of this needs honesty more than reassurance?",
        "If you stopped polishing the answer, what would you say plainly?",
        "What are you avoiding naming directly here?",
      ]
    : [
        "What feels most important in this right now?",
        "Where is the real pressure point for you?",
        "Do you want reflection, reassurance, or strategy from me right now?",
      ];
}

function buildHistoricalLine(
  request: LocalModelRequest,
  lower: string,
  allowSoftInsert = false,
) {
  const history = request.matchedHistory[0];
  if (!history) return "";
  if (!shouldUseHistory(request, lower, history, allowSoftInsert)) return "";

  const formats = [
    `If you want a frame for it, ${history.name} would probably point to this: ${history.practicalLesson}`,
    `${history.name} fits here, not as a quote machine, but because the lesson is simple: ${history.practicalLesson}`,
    `There’s a useful frame here from ${history.name}: ${history.practicalLesson}`,
  ];

  return pickVariant(formats, request);
}

function shouldUseHistory(
  request: LocalModelRequest,
  lower: string,
  history: HistoricalEntry,
  allowSoftInsert: boolean,
) {
  const recentAssistant = getRecentAssistantText(request);
  if (recentAssistant.includes(history.name.toLowerCase())) return false;
  if (/proposal|propose|exam|interview|strategy|leadership|discipline|fear|grief/.test(lower)) {
    return true;
  }
  return allowSoftInsert && stableHash(lower) % 4 === 0;
}

function shouldUseName(request: LocalModelRequest) {
  const name = request.context.userProfile.userName;
  if (!name) return false;
  const recentAssistant = getRecentAssistantText(request);
  return !recentAssistant.includes(`${name.toLowerCase()},`) && stableHash(name) % 3 === 0;
}

function pickVariant(
  variants: string[],
  request: LocalModelRequest,
) {
  const recentAssistant = getRecentAssistantText(request);
  const filtered = variants.filter((variant) => {
    const normalized = normalize(variant);
    return normalized && !recentAssistant.includes(normalized.slice(0, 28));
  });
  const pool = filtered.length > 0 ? filtered : variants;
  const latestUser = getLatestUserMessage(request);
  const seed = stableHash(
    `${request.mode}:${latestUser}:${request.context.recentMessages.length}:${pool.length}`,
  );
  return pool[seed % pool.length];
}

function getLatestUserMessage(request: LocalModelRequest) {
  return (
    request.context.recentMessages
      .filter((message) => message.role === "user")
      .at(-1)?.content ?? request.userInput
  );
}

function getLatestUserEmotion(request: LocalModelRequest) {
  return request.context.recentMessages
    .filter((message) => message.role === "user")
    .at(-1)?.emotion?.primary;
}

function getRecentAssistantText(request: LocalModelRequest) {
  return request.context.recentMessages
    .filter((message) => message.role === "assistant")
    .slice(-4)
    .map((message) => normalize(message.content))
    .join(" ");
}

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function stableHash(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}
