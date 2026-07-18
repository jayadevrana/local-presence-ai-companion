import { NextResponse } from "next/server";

import { getBootstrapPayload } from "@/repositories/companion-repository";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getBootstrapPayload());
}
