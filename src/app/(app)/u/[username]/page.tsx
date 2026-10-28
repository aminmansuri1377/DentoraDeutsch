import { PublicProfilePage } from "@/features/profile/public-profile-page";
export default async function Page({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  return <PublicProfilePage username={(await params).username} />;
}
