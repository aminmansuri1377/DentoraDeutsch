# v0.2 architecture changes

The learner UI is deliberately constrained to 480px; `/panel` is a separate desktop workspace. All 49 model CRUD screens are metadata-driven. Full schema metadata is generated at build time because Prisma 7 runtime DMMF strips required/default/index metadata. The generated registry preserves foreign-key definitions and supports correct forms and encrypted record keys, including compound-key VerificationToken records.

Test email sign-in uses its own random database session token and cookie, separate from the verified Auth.js cookie. Test panel login uses an encrypted 8-hour cookie and is independent of learner identity. In production with test mode disabled, only verified ADMIN accounts can enter full CRUD. Local PGlite is optional and dev-only; production keeps the pg adapter for Supabase.

Panel service checks field names/types/enums, masks auth secrets, rejects nested writes, maintains lesson versions and uses DB constraints. Changing course content is dynamic; this does not make every algorithm or external payment action database-driven.

# Architecture and invariants

Request → App Router route → tRPC procedure → Zod validation → session/role authorization → service → Prisma transaction → PostgreSQL.

The app uses a modular monolith. Auth.js owns users, tokens and database sessions; Supabase Auth is not used alongside it. Supabase provides PostgreSQL, not a second identity system. Prisma credentials remain server-only. Authenticated pages and all sensitive procedures enforce access independently.

## Learning

Course → chapter → ordered lessons → reading blocks and ordered questions → answer options. Published state is checked server-side, including parent course status. Free previews bypass paid access, not publication or sequential prerequisites. Each chapter's preceding published lesson must be completed; first lessons of separate chapters are independently available, reflecting the observed reference behavior.

`startLesson` resumes an unexpired open attempt. Free accounts are limited to four starts per rolling 24 hours; this is an explicit design decision, not a verified identical implementation of the reference's calendar-day allowance. Attempts expire after one hour and record content version. Answer validation binds user, attempt, lesson, question and option. Public lesson DTOs omit correct-answer flags and explanations; explanations are returned only after submission.

`finishLesson` requires every question answered and scores at least 60% to unlock progress. The 60% threshold and XP formula are configurable project decisions; exact Dentigo rules were not visible. A unique reward key plus serializable transaction prevents duplicate XP on retry or replay. Scores, prices and credits are never accepted from the browser. An incorrect answer creates a review card and consumes one heart.

Study duration currently measures server elapsed attempt time capped at 15 minutes; it is not a foreground-attention tracker. No study-time reward is issued. Hearts regenerate lazily when starting a lesson; the header may show the stored value until then. Streaks use Europe/Berlin calendar dates; one guard bridges one missed day. Weekly/monthly seasons use UTC calendar boundaries.

## Commerce

Products store integer cents. Checkout retrieves the configured Stripe price and verifies amount, currency and one-time payment mode. An order is created before redirect. Only signed, paid checkout webhooks grant entitlements or gems. Event IDs and order status make duplicate processing harmless. The browser's success URL grants nothing.

Do not enable products before webhook, refund/dispute handling, tax and mandatory seller-information workflows are completed and tested. Products are inactive by default. Pro extensions currently create separate validity periods rather than extending the longest current period: resolve renewal policy before enabling repeat Pro purchases.

## Trust boundaries

- tRPC mutations reject foreign/missing origins at the HTTP boundary.
- Per-account database-backed mutation limit; per-email magic-link limits.
- All sensitive read/write ownership comes from the authenticated session.
- Admin/editor role is read from DB; role changes are not client-exposed.
- Plain text rendering avoids arbitrary HTML injection.
- PostgreSQL check constraints prevent negative wallet values and self-following.
- RLS is enabled and grants revoked for Supabase public client roles on app tables; Prisma uses the server role. RLS does not replace server authorization because the server owner bypasses it.
- CSP/frame restrictions and no-sniff headers are provided. CSP allows inline scripts/styles for Next.js; nonce-based tightening remains a production hardening task.
- Audit records accompany content publication/import.

## Deliberate boundaries

Notifications have persistence and read controls; email-reminder delivery is not scheduled yet. Media and student verification are modeled but not uploaded/approved in the shipped runtime. Account export/deletion and operational retention need a reviewed implementation. The privacy page is explicitly a development placeholder, not finished legal copy. Roles must be provisioned manually through trusted DB administration; no seed admin/backdoor exists.
