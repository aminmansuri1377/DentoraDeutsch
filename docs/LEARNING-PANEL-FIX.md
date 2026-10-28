# Learning, panel and loading fixes

Base: `aminmansuri1377/DentoraDeutsch`, commit `f942c55a62e212d3817bca14206de5d8b9c27e82`.

## Behavior

- Resumed attempts restore previously submitted options and feedback. Submitting a different option for an already answered question returns a conflict instead of marking the new selection with the previous result.
- Incorrect answers have explicit incorrect feedback. Finishing can be retried without resubmitting answers or granting duplicate XP.
- Serializable transactions have a 30-second execution budget and a 10-second acquisition budget instead of relying on Prisma's short defaults. Only the idempotent lesson-finish operation retries connection-loss errors (at most twice); arbitrary mutations are not replayed.
- Connection/transaction failures have actionable user messages. Server logs include procedure, error code, database error code and timestamp without inputs, credentials or SQL.
- Confirmed panel creates, updates and deletes update React Query cache immediately; background invalidation reconciles related views and server sorting. Search and last-page deletion are handled. Failed mutations leave the dialog open and preserve data.
- A shared purple animated tooth loader covers query loading, route loading, lesson submission and panel saving/deletion. Reduced-motion preferences are respected.

## Apply

Keep your `.env` and certificate. From the repository root:

```powershell
git apply --check DentoraDeutsch-fixes.patch
git apply DentoraDeutsch-fixes.patch
npm test
npm run dev
```

No new dependency, migration or seed is required. Restart the dev server and reopen the lesson after applying.

## Verification and limits

49 tests pass, including negative answers, resume feedback, a seeded course's rewards/leagues/certificate, finish retries after a lost commit acknowledgement, panel cache mutations and transaction settings. Production build and TypeScript pass. The patch is checked and applied to a clean checkout of the base commit.

The user's live Supabase database and its server logs were not available. The generic `learning.finish` 500 response alone does not prove which underlying database exception occurred. The patch addresses the short transaction budget, safe recovery from transient connection loss and missing diagnostics; it cannot prevent a persistent database/network outage. Browser visual verification against the user's running instance was not performed.
