import { NextResponse } from "next/server";

import {
  clearConversationData,
  getBootstrapPayload,
} from "@/repositories/companion-repository";

export const dynamic = "force-dynamic";

export async function POST() {
  await clearConversationData();
  return NextResponse.json(await getBootstrapPayload());
}
