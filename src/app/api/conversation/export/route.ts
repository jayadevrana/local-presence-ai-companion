import { getBootstrapPayload } from "@/repositories/companion-repository";

export const dynamic = "force-dynamic";

export async function GET() {
  return new Response(JSON.stringify(await getBootstrapPayload(), null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="companion-export.json"',
    },
  });
}
