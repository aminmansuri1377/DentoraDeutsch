# Loading and initial-page performance

## What changed

- `/lernen` renders its initial personalized course catalog on the server and
  includes it in the Next.js response. There is no second `learning.catalog`
  fetch immediately after client hydration; React Query retains background
  revalidation and normal invalidation for subsequent edits.
- Course catalog selection only fetches fields needed by the learning screen.
  Each user's completion state remains user-scoped. **Do not globally cache the
  personalized catalog** or leak progress between accounts.
- The header calls `profile.header` (a lightweight read) instead of `profile.me`
  (counts, full user profile, game upsert, and 90 activity records).
- `auth()` uses request-scoped React cache to avoid duplicate session reads by
  the `(app)` layout and `/lernen` page in the same render request.
- Non-compact `Loading` uses the supplied walking mascot; `compact` retains
  the SVG circular rabbit for small spaces. Existing Next.js `loading.tsx`
  boundaries already use the full-page walking animation.
- Only `/loaders/walking.html` is allowed to be framed by the same-origin app.
  All other routes preserve the anti-framing CSP and X-Frame-Options headers.
  Static loader assets use one-hour browser caching to avoid revalidation on
  every route transition.

## Verify

1. Apply on top of the loader patch, on the updated `master` branch.
2. Run `npm run typecheck`, `npm test`, and `npm run build`.
3. Test as a signed-in learner in a fresh/incognito browser tab. Open Network:
   initial `/lernen` should not issue a `learning.catalog` client RPC request.
   A separate `profile.header` request should appear, replacing the full
   `profile.me` call from the shell. Direct profile and goals pages still use
   `profile.me` where their detailed fields are required.
4. Open `/community`, `/profil`, `/shop`, and a lesson on slow network: the
   walking animation should appear for large content waits, with the circular
   rabbit retained for smaller nested areas.
5. Complete a lesson and verify header counters update, course completion
   refreshes, and navigation still uses the correct user's progress.

For DB query timings, optionally set `DENTORA_PERF_LOG=true` in the Vercel
server environment or local `.env`, then inspect server logs for
`[dentora:perf] learning.catalog`. It reports duration and course count, not
personal data.

## What this does not fix

Supabase region/network latency, cold Vercel functions, slow SQL plans on very
large catalogs, and DNS/connection timeouts may still delay the first response.
Use a deployed-production browser waterfall and Vercel logs to separate time to
first byte from hydration and API fetching before changing database deployment
configuration. Never enable cross-user caching for progress, nor cache session
cookies or authorization responses in a CDN.
