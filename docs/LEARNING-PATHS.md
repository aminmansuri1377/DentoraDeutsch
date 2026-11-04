# Lernpfade mit Kategorien und Maskottchen

Apply `DentoraDeutsch-learning-paths.patch` **after** the previous
`DentoraDeutsch-vercel-first-lesson.patch`. The patch does not reset the DB and
needs no new schema migration. Existing letter-question migrations must already
be applied.

```powershell
git apply --check .\DentoraDeutsch-learning-paths.patch
git apply .\DentoraDeutsch-learning-paths.patch
npm run db:import:paths
npm run dev
```

For Vercel, run the import locally against the same Supabase DB as the deployment,
then commit/push these changes and redeploy. No additional environment variables
are required. The importer uses the existing verified TLS configuration and
bounded retry runner. Re-running it preserves editorial changes and progress.

## What changes

- Left/right category navigation wraps at either end. A select and course overview
  offer direct access. Selection survives returning from a lesson in the same tab.
- Each course has a separate vertical, alternating path, chapter headers and real
  database progress. Exactly one unfinished, published lesson is current.
- The supplied original purple rabbit PNG is displayed above the current step.
  Its small floating animation respects reduced-motion preferences.
- Later lessons are disabled, muted and marked with a lock. Completed lessons can
  be replayed. Unlocking is enforced on the server across chapter boundaries too.
- Catalog invalidation after lesson completion updates the marker and progress.
- Categories, courses, chapters and lessons remain editable in `/panel`.

## Content coverage — deliberately separate from UI completion

The 17 category names and the **first section's outline** in each category were
checked in the reference interface on 2026-11-04. Course detail pages supplied
public outlines for paid courses. The import adds these German outline titles,
not the full clinical text, images and questions of every lesson. The existing
Endodontologie lesson retains its two learning pages and five questions. Other
outline-only lessons are DRAFT and appear as `In Vorbereitung`; no empty lesson
is presented as playable. Populate its blocks and questions and publish it in
`/panel` when ready. Do not publish an empty outline.

Reference: https://app.dentigoapp.com/fa/home and its specialty picker.
Paid outlines inspected: `/fa/courses/emergencies-systemic`,
`/fa/courses/clinical-competence`, `/fa/courses/complete-dentures`,
`/fa/courses/rotary-endo`.

This patch imports only the first section per category, not every subsequent
section. The UI renders every chapter and lesson subsequently added via the panel
without a code change. Old sample courses remain untouched. The clinical
competence course retains PURCHASE access, separate from PRO.

## Implementation

`path-state.ts` is the UI's pure progress calculation. `CategoryCarousel`,
`LearningPath` and `LearningDashboard` are separate components with scoped CSS.
The catalog exposes only titles/status/progress of reference drafts whose slug
starts with `dentigo-path-`; normal editorial drafts remain hidden. The lesson
API continues to require PUBLISHED content and entitlement checks.

The source site can unlock some first lessons of later chapters independently.
This implementation follows the requested strict sequential path, including
chapter boundaries. Already completed lessons remain replayable.

## Validation

TypeScript, production build, UI tests (selection, progression, disabled links,
mascot position), integration tests (idempotent import, published content retained,
and server enforcement across chapters). Tests use PGlite, not production
Supabase. Live Vercel deployment and production data were not modified.
