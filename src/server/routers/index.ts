import { panelRouter } from "./panel";
import { router } from "../trpc";
import { learningRouter } from "./learning";
import { profileRouter } from "./profile";
import { socialRouter } from "./social";
import { gameRouter } from "./game";
import { supportRouter } from "./support";
import { shopRouter } from "./shop";
import { adminRouter } from "./admin";
export const appRouter = router({
  panel: panelRouter,
  learning: learningRouter,
  profile: profileRouter,
  social: socialRouter,
  game: gameRouter,
  support: supportRouter,
  shop: shopRouter,
  admin: adminRouter,
});
export type AppRouter = typeof appRouter;
