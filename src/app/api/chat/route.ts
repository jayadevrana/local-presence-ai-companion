import { NextResponse } from "next/server";

import { sendUserMessage } from "@/engines/conversation-engine";
import { getBootstrapPayload } from "@/repositories/companion-repository";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as { content?: string };
  const content = body.content?.trim();

  if (!content) {
    return NextResponse.json({ error: "Message content is required." }, { status: 400 });
  }

  await sendUserMessage(content);
  return NextResponse.json(await getBootstrapPayload());
}
