import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { getLearningCatalog } from "@/server/services/catalog";
import { LearningPage } from "@/features/learning/components/learning-page";

export default async function Page() {
  const session = await auth();
  if (!session?.user?.id) redirect("/anmelden");

  const catalog = await getLearningCatalog(db, session.user.id);
  return (
    <LearningPage
      initialCatalog={catalog}
      name={session.user.name?.split(" ")[0] ?? undefined}
    />
  );
}
