# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

Angular (standalone components, routing, `@angular/service-worker` PWA) with Tailwind CSS v4. Pure static build — no backend framework or app server; `nginx.conf` is the only piece of infrastructure, serving the built SPA and answering Atoll's health check.

## Commands

```bash
npm install
npm start              # ng serve, dev server with HMR
npm run build           # production build -> dist/atoll
npm test                # unit tests (vitest via `ng test`)
```

Docker (matches what Atoll builds/runs — multi-stage: `npm run build` in a node stage, then nginx serves the static output):

```bash
docker build -t atoll-app .
docker run -p 8000:8000 atoll-app
```

## Atoll deployment

This repo targets the **Generic** deployment profile: container port `8000`, health check `GET /metrics` (returns `200`, Prometheus-style body — see `nginx.conf`). Conventions are documented in `.claude/skills/atoll-compatible-skill/`; deploying/managing environments goes through the `atoll-environments`, `atoll-variables`, and `atoll-deploy` skills via the Atoll MCP server (`.mcp.json`).

- Every environment variable the app reads at runtime must have a live, uncommented line in `.env.example` — see the `atoll-compatible-skill` skill before adding one.
- Don't add a `PORT` env var or an `atoll.yaml`/manifest — the port is fixed by the profile, not configurable from the repo.
- Angular routes need SPA fallback support at the web server level (`nginx.conf`'s `try_files ... /index.html`) — if you add a route, no nginx change is needed, but don't remove that fallback.
- `.github/workflows/test.yml` runs the test suite on push/PR — this is for our own CI feedback only, it has no bearing on Atoll: Atoll deploys via its own webhook-triggered pipeline on push to a mapped branch, never via GitHub Actions (`atoll-compatible-skill` explicitly excludes CI pipelines from its compatibility contract).

## Helix login (optional)

`HELIX_ENABLED=false` (default) means no login gate at all. `true` means the entire app requires a Helix login plus `HELIX_WORKSPACE_TENANT` membership (the "gate-only" pattern — see `.claude/skills/helix-auth` if it's synced into this repo; `atoll skills sync` if not).

- This is a public OAuth client (PKCE, no client secret) — this app is a static SPA with no backend to keep a secret. Never add `HELIX_OAUTH_CLIENT_SECRET`.
- Because Atoll only injects env vars into the running container (never as Docker build args), the five `HELIX_*` values can't be baked into the Angular build. `nginx/docker-entrypoint.d/30-render-helix-env.sh` renders them into `assets/env.js` (`window.__env`) at container start, read by `src/app/core/config/env-config.service.ts`. `public/assets/env.js` is the checked-in dev/fallback default (Helix off). `envsubst` always renders `HELIX_ENABLED` as a *string* — never do a plain truthiness check on it, use `String(v) === 'true'`. (`assets/i18n/*.json` — see "UX" below — deliberately does *not* follow this per-deployment-render pattern; don't assume every file under `public/assets/` is entrypoint-rendered.)
- The callback URL is computed at runtime (`<origin>/auth/helix/callback`), not an env var. A Helix workspace admin must register that exact URL (or a wildcard) per domain this app is deployed to.
- Tokens are stored in `localStorage`, AES-GCM encrypted with a non-extractable key kept in IndexedDB (`core/auth/crypto-key-store.ts`). This raises the bar against at-rest/non-JS threats (device forensics, disk scraping) — it does **not** protect against XSS in this app, since the decrypt path must stay usable by the app's own JS. Don't "fix" this into plain `localStorage`/`sessionStorage` without re-reading that tradeoff.
- The gate lives at the root (`app.ts`), not per-route guards — any route added to `app.routes.ts` is automatically covered.

## UX

This app should feel polished and modern, not like a default framework scaffold — details matter.

- **Errors are descriptive, not generic.** Never show a bare "Something went wrong" / "Error" — state what happened and, where possible, what the user can do next. Mirror the pattern already used for the Helix "Permission denied — contact your administrator" message: specific, calm, actionable.
- **i18n.** Implemented via `@jsverse/transloco` — not Angular's built-in compile-time i18n (`@angular/localize`), which needs a separate build per locale and would conflict with this app's single-build/single-Docker-image architecture. Translation JSON lives in `public/assets/i18n/{en,de,fr,it}.json` (flat namespaced keys, e.g. `auth.loginPrompt.title`; `en` is the default/fallback), loaded at runtime by `core/i18n/transloco.loader.ts`. Unlike `assets/env.js`, these are ordinary versioned build output and are PWA-precached (`ngsw-config.json`'s `i18n` asset group). `core/i18n/language.service.ts` detects the initial language from `navigator.language` (falling back to English) and persists an explicit user override in plain `localStorage` (key `atoll_lang` — not the encrypted mechanism used for Helix tokens, this is a UI preference, not a secret), keeping `document.documentElement.lang` in sync. The switcher (`shared/language-switcher/`) renders unconditionally in `app.html`, outside the Helix gate's `@if` branches, so it's available on every screen. Templates use `| transloco` (`TranslocoPipe`) — add a key to all 4 JSON files (`translations-parity.spec.ts` enforces they stay in sync) rather than hardcoding new user-facing strings.
- **Icons, never emojis.** Emoji characters render inconsistently across platforms/OSes and look unpolished. Use a proper SVG icon set (inline SVGs or an icon component library, e.g. Lucide) instead — consistent stroke width/sizing, `aria-hidden="true"` on decorative icons, a real accessible label when an icon is the only content of a control.
- **Modern, considered UI — amaze, don't just function.** Every screen (including loading/empty/error states) gets real design attention: consistent spacing and type scale via Tailwind's design tokens, smooth transitions on state changes, sensible focus states, responsive by default. Use `src/app/features/auth/` (`login-prompt`, `access-denied`) as the baseline visual style to match going forward, not the untouched `ng new` placeholder still in `app.html`.

## Working conventions

- Standalone Angular components/routes (no NgModules).
- Tailwind utility classes in templates; avoid component-scoped CSS unless Tailwind can't express it.
- Keep `nginx.conf` minimal — it's infrastructure (static file serving + health check), not application logic.
