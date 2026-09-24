# Atoll

An Angular single-page app — Tailwind CSS, installable as a PWA, built as a static site and deployed on [Atoll](https://atoll.eutima.ch). Login is handled by [Helix](https://helix.eutima.ch) and is optional, controlled per deployment.

## Stack

- **Angular 22** — standalone components, routing, zoneless change detection
- **Tailwind CSS v4**
- **@angular/service-worker** — installable PWA
- **@jsverse/transloco** — runtime i18n (English, German, French, Italian)
- **nginx** — serves the production build, no backend/app server
- **Vitest** — unit tests

## Getting started

```bash
npm install
npm start          # ng serve — http://localhost:4200, auto-reloads on change
```

## Scripts

| Command | What it does |
|---|---|
| `npm start` | Dev server (`ng serve`) |
| `npm run build` | Production build → `dist/atoll` |
| `npm test` | Unit tests (Vitest via `ng test`) |
| `npm run watch` | Development build in watch mode |

## Docker

Matches exactly what Atoll builds and runs — multi-stage: an `npm run build` in a Node stage, then nginx serves the static output on port `8000`.

```bash
docker build -t atoll-app .
docker run -p 8000:8000 atoll-app
```

## Deployment (Atoll)

This repo is set up for Atoll's **Generic** profile: container port `8000`, health check at `GET /metrics`. Every environment variable the app can read is declared in [`.env.example`](.env.example). The Atoll MCP server is registered in [`.mcp.json`](.mcp.json) — open this repo with an AI agent that supports MCP to create/manage environments and deploy through it.

## Optional Helix login

Set `HELIX_ENABLED=true` (plus `HELIX_BASE_URL`, `HELIX_OAUTH_CLIENT_ID`, `HELIX_OAUTH_TENANT`, `HELIX_WORKSPACE_TENANT` — see `.env.example`) to require every user to sign in with Helix and belong to the configured workspace. Leave it `false` (the default) and the app has no login gate at all. See [Enabling it locally](#enabling-helix-locally) below to test this without a deployment.

### Enabling Helix locally

- **`ng serve`**: edit `public/assets/env.js` directly (don't commit the change).
- **Docker**: pass `-e HELIX_ENABLED=true -e HELIX_BASE_URL=... -e HELIX_OAUTH_CLIENT_ID=... -e HELIX_OAUTH_TENANT=... -e HELIX_WORKSPACE_TENANT=...` to `docker run`.

Either way, a Helix workspace admin needs to register this app as a public OAuth client with the exact callback URL for whichever local port you're using (`http://localhost:4200/auth/helix/callback` for `ng serve`, `http://localhost:8000/auth/helix/callback` for Docker).

## Internationalization

Supported languages: English (default), German, French, Italian. Translation files live in `public/assets/i18n/*.json`; the language is auto-detected from the browser and can be overridden with the switcher shown on every screen. Adding a new user-facing string means adding the key to all four JSON files — a test (`translations-parity.spec.ts`) fails the build if they drift out of sync.

## CI

`.github/workflows/test.yml` runs the test suite on every push to `main` and on pull requests. This is unrelated to deployment — Atoll deploys via its own webhook on push to a mapped branch, not through CI.

## Project structure

```
src/app/
  core/          # services: auth, i18n, runtime config — no UI
  features/      # routed feature UI (e.g. the Helix auth screens)
  shared/        # reusable presentational components (e.g. the language switcher)
```

For the full set of engineering conventions (Atoll's compatibility contract, the Helix auth design, UX guidelines, etc.), see [`CLAUDE.md`](CLAUDE.md).
