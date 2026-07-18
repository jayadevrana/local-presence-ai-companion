import { NextResponse } from "next/server";

import { maybeSelfInitiate } from "@/engines/conversation-engine";
import { getBootstrapPayload } from "@/repositories/companion-repository";
import type { SelfInitiationInput } from "@/types/companion";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<SelfInitiationInput>;
  await maybeSelfInitiate({
    isTyping: Boolean(body.isTyping),
    idleSeconds: Number(body.idleSeconds ?? 0),
    draft: body.draft ?? "",
  });
  return NextResponse.json(await getBootstrapPayload());
}
