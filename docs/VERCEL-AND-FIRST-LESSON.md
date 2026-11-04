# Vercel mutations and the first reference lesson

Base: `ab4e611267ac5178610634ac03079c3cd9827453` (master).

## Apply

```powershell
git apply --check .\DentoraDeutsch-vercel-first-lesson.patch
git apply .\DentoraDeutsch-vercel-first-lesson.patch
npm run db:generate
npm run db:migrate
npm run db:import:first-lesson
```

Run the migration/import locally using the existing working Supabase environment and CA configuration. The migration adds LETTER_ORDER and nullable AttemptAnswer.submittedText; it does not reset tables. The importer adds a separate course (`dentigo-endodontologie`) at the top of the catalog and lesson (`dentigo-744-pulpa`), preserving all existing samples, users, attempts and progress. It can be run again without duplicates; it does not overwrite subsequent editorial changes. A newly imported lesson is published only after all its contents are saved.

In Vercel Production set both AUTH_URL and APP_URL to `https://dentora-deutsch.vercel.app`. Keep local AUTH_URL at localhost. Push the patch changes and redeploy after the migration succeeds. Do not run the content import as part of every Vercel build.

## 403 diagnosis

The existing POST handler rejects any Origin different from AUTH_URL and returns plain text Forbidden. That matches the screenshot's JSON parse failure. Actual Production environment values were not available for inspection. The new helper accepts exact configured APP_URL/AUTH_URL and the deployment domains supplied by Vercel; it never trusts forwarded headers or a wildcard vercel.app suffix. Missing, malformed or foreign Origins remain rejected. See https://vercel.com/docs/environment-variables/system-environment-variables . Non-JSON errors now produce a readable German message rather than Unexpected token F.

## Observed source and precise scope

Reviewed through the authorized browser on 2026-11-04: https://app.dentigoapp.com/fa/lesson/744 . The source currently begins Endodontics with "Structure of the pulp: four zones and their cells". This patch imports that ONE complete lesson, not all 33 chapters, nor the remaining four lessons of chapter one.

Observed sequence: two study pages, three single-choice questions (positions 1, 2, 4), one true/false question (3), one letter-order question (5), then results. German content preserves the page division, prompts, options and answer explanations. Letter ordering uses ZELLREICHE for German grammar. Correctness is checked on the server, not inferred from the chosen answer ID. Saved letter answers survive reopening and cannot be changed retroactively.

The histology image is packaged locally with the original caption attribution. The source SVG diagram is adapted with German labels and equivalent geometry; it is not pixel-identical. App colors remain purple. This is not a claim of pixel-identical reproduction of every source control: source image-export, its exact reward formula, timed completion screen and question hint text have not been replicated. Existing bookmarking/reporting/highlight tools remain.

The original study prose makes stronger general claims about repair capacity and permeability than the source's own question explanations. Both are translated without silently rewriting the source. The lesson is not marked reviewedAt/reviewerName; the dental editorial team should reconcile these claims and review the German terminology before clinical publication. The source attributes the histology figure to Cohen's Pathways of the Pulp; retain the team's applicable image permissions and attribution.

## Validation

Verified: 59 tests in 17 suites passed (`npx vitest run --maxWorkers=2`); production build passed.

Regression coverage includes deployment origin allowlisting, foreign/missing Origin rejection, plain-text 403 handling, idempotent content import, all five answers, incorrect letter scoring, saved-answer restoration and prevention of altered resubmissions. No production database credentials are used in tests. A passing local test/build is not a claim that the user's Vercel deployment was modified or verified live.
