# ONAT Angular

Production-oriented **Angular** frontend for a lawyer case-management and public ONAT-style experience: public site, authenticated **Espace Avocat** (dashboard, agenda, notifications, files, and domain sections), and a separate **client portal**. The app is structured for integration with a **Spring Boot** (or compatible) REST API and JWT auth.

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting started](#getting-started)
- [Environment & API](#environment--api)
- [Application routes](#application-routes)
- [Project structure](#project-structure)
- [Architecture & conventions](#architecture--conventions)
- [Documentation](#documentation)
- [Scripts](#scripts)
- [Building for production](#building-for-production)
- [Testing](#testing)
- [Code quality](#code-quality)
- [Further reading](#further-reading)

---

## Features

- **Public site**: home, lawyer directory, news, legal texts, events, contact.
- **Authentication**: login and route protection for lawyer areas (`authGuard`, JWT via HTTP interceptor).
- **Espace Avocat** (protected): cases, clients, finance, hearings, statistics, settings, plus dashboard, agenda, notifications inbox, and files (routes under `/espace-avocat`; page components live in `features/`).
- **Feature layer** (`features/`): domain UI and services (cases, clients, tasks, notes, documents, timeline, search, notifications API/state, event bus) and lazy **pages** for dashboard, agenda, notifications inbox, and files.
- **Client portal**: dedicated route `/client-portal` (separate from lawyer auth).
- **Global HTTP**: loading tracking, auth header attachment, centralized error handling.

---

## Tech stack

| Area | Choice |
|------|--------|
| Framework | [Angular](https://angular.dev/) 21 (standalone components, lazy routes) |
| UI | [Angular Material](https://material.angular.io/) + CDK |
| Language | TypeScript ~5.9 |
| Styling | SCSS |
| Async | RxJS |
| CLI / build | Angular CLI 21, `@angular/build:application` |
| Formatting | Prettier |

---

## Prerequisites

- **Node.js** (LTS recommended; align with your team’s policy)
- **npm** (this repo declares `packageManager`: npm 11.4.0 in `package.json`)

---

## Getting started

Clone the repository, install dependencies, and start the dev server:

```bash
npm install
npm start
```

The app is served at **http://localhost:4200/** with live reload.

Equivalent CLI command:

```bash
ng serve
```

---

## Environment & API

API base URLs live under `src/environments/`:

| File | Typical `apiUrl` |
|------|------------------|
| `environment.ts` | `http://localhost:8080/api` (development) |
| `environment.prod.ts` | `/api` (production, same origin) |

Services resolve the backend through this configuration (see **`BACKEND_INTEGRATION.md`** for CORS, JWT flow, and API patterns).

---

## Application routes

| Path | Access | Description |
|------|--------|-------------|
| `/` | Public | Home |
| `/login` | Public | Login |
| `/annuaire-avocats` | Public | Lawyer directory |
| `/actualites` | Public | News |
| `/textes-juridiques` | Public | Legal texts |
| `/evenements` | Public | Events |
| `/contact` | Public | Contact |
| `/espace-avocat/*` | **Protected** | Lawyer shell; default redirect to `dashboard` |
| `/espace-avocat/dashboard`, `agenda`, `notifications`, `files` | Protected | Lawyer dashboard, agenda, notifications, files (`features/*`) |
| `/espace-avocat/cases`, `clients`, `finance`, `hearings`, `stats`, `settings` | Protected | Espace Avocat sections |
| `/client-portal` | Public | Client portal |
| `**` | — | Redirects to `/` |

Route definitions: `src/app/app.routes.ts`.

---

## Project structure

High-level layout (see **`ARCHITECTURE.md`** for the full narrative):

```text
src/app/
├── core/           # Guards, interceptors, API base, auth, models, constants, cross-cutting services
├── shared/         # Reusable UI and shared SCSS partials
├── features/       # Domain features + Espace Avocat tool pages (dashboard, agenda, notifications, files, cases, clients, …)
├── pages/          # Route-level pages (public, login, ea-*, shell)
├── app.config.ts   # Router, animations, HttpClient + interceptors
├── app.routes.ts   # Lazy-loaded routes
└── app.ts          # Root component
```

---

## Architecture & conventions

- **Core vs shared vs features**: singletons and infrastructure in `core`; dumb reusable widgets in `shared`; domain logic and feature UI in `features/` (see **`ARCHITECTURE.md`**).
- **API vs state services**: `*-api.service.ts` for HTTP; `*-state.service.ts` for state and coordination (see **`FEATURE_STRUCTURE.md`**).
- **Cross-feature updates**: `EventService` and typed events (e.g. task/document/note lifecycle) to keep views in sync.
- **HTTP pipeline** (`app.config.ts`): `loadingInterceptor` → `authInterceptor` → `errorInterceptor`.

Naming patterns (examples): `cases-api.service.ts`, `cases-state.service.ts`, `auth.guard.ts`, `*.model.ts`.

---

## Documentation

| Document | Purpose |
|----------|---------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Layers, folder map, events, RxJS practices |
| [FEATURE_STRUCTURE.md](./FEATURE_STRUCTURE.md) | Smart/dumb split, state service patterns |
| [BACKEND_INTEGRATION.md](./BACKEND_INTEGRATION.md) | Spring Boot, JWT, CORS, pagination, errors, real-time notes |
| [UI_STYLE_GUIDE.md](./UI_STYLE_GUIDE.md) | UI conventions (duplicate may exist under `docs/`) |

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Dev server (`ng serve`) |
| `npm run build` | Production build (`ng build`) |
| `npm run watch` | Development build with watch |
| `npm test` | Runs `ng test` (see [Testing](#testing)) |
| `npx ng generate --help` | Scaffolding (components, services, etc.) |

---

## Building for production

```bash
npm run build
```

Output goes to `dist/` (configured in `angular.json`). Production defaults include budgets and hashed assets.

Serve the production configuration explicitly if needed:

```bash
ng serve --configuration production
```

---

## Testing

Project schematics are configured with **`skipTests: true`**, and **`angular.json` does not define a `test` target** yet. The `npm test` script invokes `ng test`, which requires adding a test builder to the workspace (for example following the current [Angular testing guide](https://angular.dev/guide/testing)).

End-to-end testing is not configured out of the box; add a runner (Cypress, Playwright, etc.) when you need it.

---

## Code quality

- **Prettier** is listed in `devDependencies`; format consistently with your team’s config (add a root `.prettierrc` if you want shared rules).

---

## Further reading

- [Angular documentation](https://angular.dev/)
- [Angular CLI reference](https://angular.dev/tools/cli)

---

*Generated with [Angular CLI](https://github.com/angular/angular-cli) 21.2.6; this README describes the ONAT Angular application and how to run and extend it.*
