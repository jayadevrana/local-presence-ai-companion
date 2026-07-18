import { CompanionApp } from "@/components/companion-app";
import { getBootstrapPayload } from "@/repositories/companion-repository";

export const dynamic = "force-dynamic";

export default async function Home() {
  const initialData = await getBootstrapPayload();
  const instanceName = process.env.APP_INSTANCE_NAME?.trim() ?? null;

  return <CompanionApp initialData={initialData} instanceName={instanceName} />;
}
