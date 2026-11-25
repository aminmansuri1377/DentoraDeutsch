import { LearningPage } from "@/features/learning/components/learning-page";

/**
 * The parent (app) layout authenticates the request. Fetching the catalog via
 * a recoverable client query prevents a slow database from failing the RSC page.
 */
export default function Page() {
  return <LearningPage />;
}
