# v0.2 scope update (supersedes conflicting v0.1 rows below)

Implemented in this revision:
- Next.js 16.4.3 stable with App Router, confirmed against the current official release.
- Phone-sized learner layout on every viewport, bottom navigation, separate desktop administration.
- `/panel`: create/list/search/details/edit/delete for all 49 models, relation selectors, enum/date/number/boolean/text fields, pagination and deletion impact confirmation.
- Test panel password `1111`, independent panel cookie, rate limiting and production verified-admin fallback.
- Immediate register/login with any valid email, no code or mail in test mode, separate cookies, logout.
- Local persistent test DB with automatic migration/seed; Supabase remains the production DB.
- Three short original anatomy lessons plus platform introduction; the full reference curriculum is intentionally not required by the revised brief.
- Four saved-content tabs: lessons, questions, highlights, review. Added question-save and question-report controls, text highlighting and link sharing.
- Automatic lesson-version bump on panel content changes and structural publishing checks.

Rechecked reference pages: saved tabs, loaded daily missions, community tabs/feed, profile badges/settings. Reference purchases, private backend rules and locked full curriculum were not inspected. No exact complete feature parity is claimed.

Still outside this implementation: media upload pipeline, automatic refund/dispute/tax handling, full student-verification workflow, automated notification dispatch, advanced spaced repetition and comprehensive account export/deletion. Raw admin CRUD now manages all their existing database records; it does not supply missing external-service workflows. Real Supabase/Vercel/SMTP/Stripe acceptance testing and complete browser E2E remain unverified.

## Prior baseline coverage (v0.1)

# Evidence and coverage ledger

Reference: authenticated Dentigo UI inspected previously and learning path/saved tabs rechecked during this implementation. No purchases, paywall bypass, social posting or wheel spending was performed on the reference. The complete question bank and locked lesson endings were not observed. This is an independent implementation, not source-code extraction.

| Capability | Implemented delivery | Remaining / reference uncertainty |
|---|---|---|
| German purple interface | Desktop/mobile layouts, common components, independent demo | Browser visuals observed; browser click progression could not be confirmed in managed preview; UI component tests cover progression |
| Email sign-in | Auth.js email magic links, DB sessions, 15-minute tokens, email limit | Actual SMTP/provider verification and operational anti-abuse |
| Learning catalogs | Courses, chapters, ordered lessons, specialty selection | 17 dental catalogs are drafts, not copied course content |
| Lessons/quizzes | Reading blocks, single-choice/true-false data, hint, answer feedback, pass/fail, bookmarks | Image/audio/video player, content-report UI, highlights selection UI and share-image export |
| Progress | Per-lesson completion, attempts, scores, activity, first-completion rewards | Exact reference XP/pass formula unverified; active time heartbeat needed |
| Review | Wrong-answer review cards and saved/review screens | Scheduled repetition algorithm, question bookmarking UI, review-card rescheduling |
| Hearts/streak/gems | Regeneration at lesson start, spending, guards, unique reward ledger | Reference account heart caps were inconsistent; final commercial rules require confirmation |
| Missions/wheel | Daily lesson mission and once-per-day gem wheel | Full reference prize mix (Pro days, coupon, hearts), animated wheel, all mission types |
| Leagues | Weekly/monthly scoring, sorting, transactional settlement, rewards, history API | Tier promotion rules, history screen, exact-boundary season creation, large-league scaling |
| Social | Text posts, search/filter, likes, comments, post bookmarks, follow endpoint/profile | Image/video storage, follower lists, profile feed, editing/report UI, blocked users, cursor pagination UI |
| Profile | Edit name/username/bio/university, privacy and goal preferences, badges | Avatar upload, all badge rules, follower state hydration |
| Certificates | Automatic completion certificate, public code verification, printable page | QR and A4/story graphics; private-account certificate preview |
| Shop | Product catalog, Stripe one-time checkout, paid webhook entitlements/gems | Credentials, real testing, repeat-Pro extension, refund/dispute, tax, coupon runtime, student review |
| Notifications | Database model, listing, mark read, reminder preference | Event generation, email delivery worker, push subscriptions |
| Support | FAQ, create/list tickets, reply endpoint, feedback endpoint | Admin reply inbox and end-user reply/feedback controls |
| Admin | Role gate, validated course import, review/publish, report APIs | Rich editor, preview-before-approval, version history, user/product/support dashboards |
| Account lifecycle | Sessions, revocation API and sign-out control | User-facing session screen, export/deletion, retention jobs |
| Deployment | Supabase-compatible migration, Vercel config and guide | User accounts/secrets required; no live Supabase/Vercel deployment performed |

## Project decisions, not verified parity

60% pass threshold; 20 completion XP + 5 XP per correct answer; rolling-24-hour free quota; one-hour attempts; UTC league periods; provisional EUR prices; provisional Stripe adapter; gem-only demo wheel. Keep these explicit until product acceptance.

## Reference scope

Observed main surfaces: home path/showcase, 17 specialty categories, a sample Endo lesson with text/MCQ/true-false, saved lesson/question/highlight/review tabs, goals, weekly/monthly league/history, profile settings, community/composer, Pro and standalone course store, student discount form, gems/hearts/streak guard, wheel, certificates, FAQ/tickets/feedback. Hidden content and every final-stage behavior cannot be inferred from these observations.
