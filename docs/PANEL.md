# Administration guide

## Entering

Local test: `/panel`, password `1111`. Override with PANEL_PASSWORD. Panel sessions last 8 hours in an encrypted, HttpOnly, SameSite=Strict cookie. Failed sign-ins are rate-limited. AUTH_SECRET must be at least 32 characters; the dev launcher creates one for local testing.

Production: `ENABLE_DEMO_AUTH=false`; sign in normally through verified email, then assign ADMIN in a trusted DB session. EDITOR alone does not grant full CRUD administration.

## Building a course

1. Create a Fachgebiet (`Specialty`) with a unique slug and position.
2. Create a Kurs (`Course`) and select the specialty. Initially use Entwurf.
3. Create Kapitel (`Chapter`), select the course and set its order.
4. Create Lektionen (`Lesson`), select the chapter, set position/duration/access preview.
5. Add Lerninhalte (`LessonBlock`), selecting the lesson and ordering text blocks.
6. Add Fragen (`Question`) with prompt, explanation, hint and kind.
7. Add Antwortmöglichkeiten (`AnswerOption`), selecting the question and marking exactly one correct choice.
8. Publish the lesson once it has text and valid questions. Publish the parent course to expose it to learners.

The user-facing catalog reads the database directly via tRPC. No source-code change is needed for new content. Each chapter unlocks sequentially; separate chapter openings remain independent.

## Reusable schema-driven fields

Text, long text, number, boolean, enum, UTC date/time and foreign-key relation controls are generated from schema metadata. Create forms omit unset default fields; Prisma assigns defaults. Edit forms send only changed fields. Optional fields can be explicitly cleared. Primary keys cannot be changed. Authentication tokens are never exposed in table/details responses; a secret field can be replaced without reading its previous value.

Search and pagination run on the server (20 rows per page). Details show every scalar field; relational children are edited in their own table. Relation pickers support searching. Technical field names appear below German labels to help developers.

## Deletion and bookkeeping

Deletion is permanent. The dialog reports immediate dependents; recursive cascades can affect further records, so use backups. Foreign-key restrictions can reject a deletion. Every CRUD mutation records an AuditLog entry without logging field contents/secrets. AuditLog itself is manageable as requested; deleting it is not a tamper-proof audit design.

Changing Order.status is a database edit, not a Stripe refund. Changing one wallet/ledger row does not run all economic reconciliation rules. For live financial actions, use an audited business workflow and a payment provider. Do not infer that raw CRUD provides those external effects.

## After changing Prisma

Run `npm run db:generate`. It generates Prisma Client and the full DMMF-based panel registry. `npm run build` also regenerates both. A migration is still required for physical database changes. The registry does not accept arbitrary table names, raw SQL or nested relation writes from the browser.
