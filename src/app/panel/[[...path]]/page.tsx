import { panelIdentity } from "@/server/panel/session";
import { testModeEnabled } from "@/server/test-mode";
import { PanelLogin } from "@/features/panel/login";
import { PanelWorkspace } from "@/features/panel/workspace";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}) {
  const identity = await panelIdentity();
  if (!identity) return <PanelLogin testMode={testModeEnabled()} />;
  const { path } = await params;
  return (
    <PanelWorkspace selected={path?.[0]} testMode={identity.mode === "test"} />
  );
}
