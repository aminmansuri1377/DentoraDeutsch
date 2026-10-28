import { LessonPage } from "@/features/learning/components/lesson-page";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <LessonPage id={(await params).id} />;
}
