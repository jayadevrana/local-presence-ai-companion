import { NextResponse } from "next/server";

import {
  getBootstrapPayload,
  saveSettings,
} from "@/repositories/companion-repository";
import type { AppSettings } from "@/types/companion";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const body = (await request.json()) as AppSettings;
  await saveSettings(body);
  return NextResponse.json(await getBootstrapPayload());
}
