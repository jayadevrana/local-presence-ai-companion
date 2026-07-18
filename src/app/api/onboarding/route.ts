import { NextResponse } from "next/server";

import { completeOnboarding } from "@/engines/conversation-engine";
import { getBootstrapPayload } from "@/repositories/companion-repository";
import type { OnboardingSubmission } from "@/types/companion";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as OnboardingSubmission;

  if (!body.userName || !body.roughLocation || !body.desiredRole) {
    return NextResponse.json({ error: "Incomplete onboarding payload." }, { status: 400 });
  }

  await completeOnboarding(body);
  return NextResponse.json(await getBootstrapPayload());
}
