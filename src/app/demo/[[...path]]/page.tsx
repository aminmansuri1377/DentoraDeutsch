import { DemoPage } from "@/features/demo/demo-page";
export default async function Page({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}) {
  const { path = [] } = await params;
  return <DemoPage path={path} />;
}
