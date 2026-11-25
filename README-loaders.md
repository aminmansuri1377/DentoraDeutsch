# Dentora loaders

- `FirstVisitOpening`: animated 9-frame WebP, shown once per tab session after hydration, dismissed once the window load event has fired (minimum 700ms; safety timeout 8s). Browser storage key: `dentora.opening.seen.v1`.
- `FullPageLoader`: original 14.4s Canvas walk, used by App Router loading boundaries for the app and admin panel.
- `RabbitLoader`: original face and variable-speed SVG ring; replaces shared `Loader` on inline loading states.
- The animated WebP and Canvas atlas are binary assets and are included in the Git binary patch. Do not copy separate files.
- `walking.html` runs in a sandboxed frame; it cannot access the application document or authentication state.
- For testing the opening again, open a fresh browser tab or remove the sessionStorage key in DevTools.
- First-visit opening is a visual introduction, not a network-completion indicator. Next.js route loading is handled independently by Suspense boundaries.
