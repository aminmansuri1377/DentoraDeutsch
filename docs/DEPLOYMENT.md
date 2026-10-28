# Deployment notes for v0.2

## Local testing first

Run `npm ci`, `npm run db:generate`, `npm run dev` without creating an `.env` file. If no DATABASE_URL exists, the launcher enables a persistent, isolated local PGlite database. `/panel` uses password `1111`; user login accepts any valid email without verification. This is a development convenience only. Use `npm run dev:local` to force local isolation. Never copy `.local-database/` into a deployment.

## Before production

Set `ENABLE_DEMO_AUTH=false`. Use a long random AUTH_SECRET, real AUTH_URL, verified SMTP and Supabase credentials. The test cookie is separate from Auth.js and ignored once test mode is disabled. The password `1111` is not used for production panel access; verified ADMIN accounts are required. `/admin` now redirects to `/panel`.

## Supabase + Vercel deployment

No cloud project or paid resource was created by this delivery.

## 1. PostgreSQL

Create a dedicated Supabase project in the region appropriate for the operator. Keep app tables in a dedicated project; do not run the initial migration against a database with conflicting tables. Back up any existing data first.

Use the Supabase transaction-pooler URL on port 6543 as `DATABASE_URL` for the Vercel runtime. Use the direct connection (IPv6-capable environment) or session pooler on port 5432 as `DIRECT_URL` for Prisma migrations. Use the exact values shown by Supabase Connect, including the project-qualified username. Require TLS and verify certificates. Never set `rejectUnauthorized: false`.

Disable the Data API if it is not needed. This application does not use a browser Supabase client. The migration additionally enables RLS and revokes `anon`/`authenticated` access for its own tables. Keep database credentials and any service-role key out of `NEXT_PUBLIC_*` variables.

```sh
npm ci
npm run db:migrate
npm run db:seed
```

Use migrations, not `db push`, for production. Do not run `migrate reset` on production. The schema has 49 models; SQL includes indexes, foreign keys and check constraints.

## 2. Email-only login

Configure a transactional SMTP provider with verified sender domain, SPF/DKIM and SMTP TLS. Set `EMAIL_SERVER` and `EMAIL_FROM`. Set `AUTH_URL` to the exact HTTPS production origin, with no path; generate `AUTH_SECRET` securely (for example `openssl rand -base64 32`) and store it in Vercel secrets. Do not commit secrets.

Auth.js stores hashed verification tokens; links expire after 15 minutes and are single-use. Test actual message delivery, expired/replayed links, normalized addresses and sign-out/session revocation. Never log magic links in production. Add trusted-platform IP rate limiting/WAF before public launch; the application email/account limit alone is not enough for distributed mail abuse.

## 3. Vercel

Import the source into a private Git repository and connect it to Vercel. Framework: Next.js. Install: `npm ci`. Build: `npm run build`. Node: 24. Set all production environment variables in Vercel, not in source control. Use separate Supabase databases and payment credentials for preview and production.

Run migrations as a controlled CI/release job before rollout, not at every serverless cold start. Set `CRON_SECRET` and verify that `/api/cron/leagues` receives Vercel's Authorization bearer header. The provided daily UTC cron settles completed seasons, opens new ones and removes expired rate-limit buckets. A once-daily cron does not guarantee exact-boundary league availability; add a suitable schedule/atomic lazy creation before a strict live competition launch.

## 4. Optional commerce integration

Stripe is the implemented payment adapter, chosen provisionally because the German provider was unspecified. Replace it behind the router/webhook boundary if a different provider is required. Create **one-time** EUR prices, set corresponding `stripePriceId`, and keep `Product.active=false` until testing is complete. Set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`. Register `/api/webhooks/stripe` for checkout completion and async success. Test signed events, retries, duplicate deliveries, amount mismatches, customer cancellation and failure. Refunds/disputes and tax/invoice workflows remain launch blockers.

## 5. Editorial setup

After signing in normally, assign EDITOR/ADMIN to the intended user using a trusted administrative DB connection. Open `/panel`. Use the schema-driven forms to create a course, chapter, lesson, blocks, questions and options. See PANEL.md. Supply your own authored/licensed content, review it, then publish the lesson and parent course. Never represent technical sample content as clinically reviewed.

## 6. Release gates

- Complete all missing workflows in FEATURE-COVERAGE.md; no parity claim before acceptance testing.
- Review medical material and lawful content rights.
- Test access isolation using two real accounts and admin/user roles.
- Test production PostgreSQL concurrency, no negative hearts/gems, duplicate completion and webhook replay.
- Test email deliverability, rate limits and token invalidation.
- Provide operator-specific privacy, legal/contact, cancellation/refund and data-retention policies.
- Implement and test account data export/deletion, upload moderation, backups and restore.
- Test keyboard use, screen readers, responsive layout and contrast on real devices.
- Connect error monitoring without logging secrets or learning answers; configure alerts for failed cron/webhooks.
