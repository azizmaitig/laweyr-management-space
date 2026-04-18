# ONAT Angular Architecture

## Overview

This is a production-ready Angular frontend for a lawyer case management system. The architecture is designed to:
- Support event-driven updates across features
- Easily integrate with a Spring Boot backend
- Maintain clean separation of concerns
- Scale with additional features

## Folder Structure

```
onat-angular/
├── src/
│   ├── app/
│   │   ├── core/                          # Singleton services (providedIn: 'root')
│   │   │   ├── constants/
│   │   │   │   └── api-endpoints.ts       # All backend endpoint constants
│   │   │   ├── guards/
│   │   │   │   └── auth.guard.ts          # Route guard for authenticated routes
│   │   │   ├── interceptors/
│   │   │   │   ├── auth.interceptor.ts    # Attaches JWT token to requests
│   │   │   │   ├── error.interceptor.ts   # Global error handling + event emission
│   │   │   │   └── loading.interceptor.ts # Tracks active requests for loading indicators
│   │   │   ├── models/
│   │   │   │   ├── index.ts               # Barrel export for all models
│   │   │   │   ├── lawyer.model.ts        # Domain models (Case, Client, Task, Note, Document, etc.)
│   │   │   │   ├── api-response.model.ts  # API response types (PaginatedResponse, ApiError)
│   │   │   │   └── events.model.ts        # Event types enum (AppEventType)
│   │   │   └── services/
│   │   │       ├── api.service.ts         # Base HTTP wrapper (extends HttpClient)
│   │   │       ├── auth-api.service.ts    # Auth API endpoints (login, register, logout)
│   │   │       ├── auth-state.service.ts  # Auth state management (BehaviorSubject)
│   │   │       ├── data.service.ts        # Mock data (replace with API calls later)
│   │   │       ├── event.service.ts       # Global event bus (emit/on pattern)
│   │   │       └── realtime.service.ts    # WebSocket/SSE placeholder for real-time updates
│   │   │
│   │   ├── shared/                        # Reusable dumb components
│   │   │   └── components/
│   │   │       ├── stat-pill/             # Reusable stat card component
│   │   │       ├── empty-state/           # Reusable empty state component
│   │   │       └── confirm-dialog/        # Reusable confirmation dialog
│   │   │
│   │   ├── features/                      # Feature modules (lazy-loaded)
│   │   │   ├── public/                    # Public site (no auth required)
│   │   │   │   ├── home/
│   │   │   │   ├── lawyer-directory/
│   │   │   │   ├── news/
│   │   │   │   ├── legal-texts/
│   │   │   │   ├── events/
│   │   │   │   └── contact/
│   │   │   │
│   │   │   ├── auth/                      # Authentication feature
│   │   │   │   └── login/
│   │   │   │
│   │   │   ├── espace-avocat/             # Lawyer workspace (tabbed)
│   │   │   │   ├── shell/                 # Tab navigation shell
│   │   │   │   ├── cases/                 # ⚡ Case management feature
│   │   │   │   │   ├── components/        # Dumb UI components
│   │   │   │   │   │   ├── case-table/
│   │   │   │   │   │   ├── case-detail-modal/
│   │   │   │   │   │   └── case-form/
│   │   │   │   │   └── services/          # Smart services
│   │   │   │   │       ├── cases-api.service.ts     # HTTP calls to backend
│   │   │   │   │       └── cases-state.service.ts   # State management + event coordination
│   │   │   │   │
│   │   │   │   ├── clients/               # Client management
│   │   │   │   ├── finance/               # Fees & payments
│   │   │   │   ├── hearings/              # Court hearings
│   │   │   │   ├── stats/                 # Statistics & reports
│   │   │   │   └── settings/              # User settings
│   │   │   │
│   │   │   ├── timeline/                  # Case timeline feature
│   │   │   │   ├── components/
│   │   │   │   │   ├── timeline-view/
│   │   │   │   │   └── timeline-event/
│   │   │   │   └── services/
│   │   │   │       ├── timeline-api.service.ts
│   │   │   │       └── timeline-state.service.ts
│   │   │   │
│   │   │   ├── documents/                 # Document management
│   │   │   │   ├── components/
│   │   │   │   │   ├── document-list/
│   │   │   │   │   └── document-item/
│   │   │   │   └── services/
│   │   │   │       ├── documents-api.service.ts
│   │   │   │       └── documents-state.service.ts
│   │   │   │
│   │   │   ├── tasks/                     # Task management
│   │   │   │   ├── components/
│   │   │   │   │   ├── task-list/
│   │   │   │   │   ├── task-item/
│   │   │   │   │   └── task-form/
│   │   │   │   └── services/
│   │   │   │       ├── tasks-api.service.ts
│   │   │   │       └── tasks-state.service.ts
│   │   │   │
│   │   │   ├── notes/                     # Note editor
│   │   │   │   ├── components/
│   │   │   │   │   ├── note-list/
│   │   │   │   │   ├── note-editor/
│   │   │   │   │   └── note-item/
│   │   │   │   └── services/
│   │   │   │       ├── notes-api.service.ts
│   │   │   │       └── notes-state.service.ts
│   │   │   │
│   │   │   ├── search/                    # Advanced search
│   │   │   │   ├── components/
│   │   │   │   │   └── search-panel/
│   │   │   │   └── services/
│   │   │   │       └── search.service.ts
│   │   │   ├── analytics/                 # Stats dashboard, KPIs, export UI (`/espace-avocat/stats`)
│   │   │   │   ├── components/
│   │   │   │   └── services/              # AnalyticsStateService, ExportStateService, feature init
│   │   │   ├── dashboard/                 # Lawyer dashboard (lazy route under espace-avocat)
│   │   │   │   └── dashboard.page.ts
│   │   │   ├── agenda/                    # Agenda / calendar
│   │   │   │   └── agenda.page.ts
│   │   │   ├── files/                     # Files & cloud connectors
│   │   │   │   └── files.page.ts
│   │   │   └── notifications/             # Inbox page + API/state services
│   │   │       ├── notifications.page.ts
│   │   │       └── services/
│   │   │
│   │   ├── app.config.ts                  # Application configuration (providers)
│   │   ├── app.routes.ts                  # Top-level route definitions (lazy loading)
│   │   └── app.ts                         # Root component
│   │
│   ├── environments/
│   │   ├── environment.ts                 # Dev environment (apiUrl: 'http://localhost:8080/api')
│   │   └── environment.prod.ts            # Prod environment (apiUrl: '/api')
│   │
│   ├── main.ts                            # Application entry point
│   ├── index.html                         # HTML entry point
│   └── styles.scss                        # Global styles
│
├── public/                                # Static assets
│   └── favicon.svg
│
├── angular.json                           # Angular CLI configuration
├── package.json                           # Dependencies
├── tsconfig.json                          # TypeScript configuration
├── ARCHITECTURE.md                        # This file
├── FEATURE_STRUCTURE.md                   # Feature module structure guide
├── BACKEND_INTEGRATION.md                 # Guide for connecting to Spring Boot
└── BACKEND_INTEGRATION_ARCHITECTURE.md    # Technical architecture for backend integration
```

## Architecture Principles

### 1. Core vs Shared vs Features

| Layer | Purpose | Examples |
|---|---|---|
| **Core** | Singleton services, guards, interceptors, models | `ApiService`, `EventService`, `AuthStateService` |
| **Shared** | Reusable dumb components (no business logic) | `StatPillComponent`, `EmptyStateComponent` |
| **Features** | Business logic + UI for specific domain | `cases/`, `tasks/`, `documents/`, `notes/` |

### 2. Smart vs Dumb Components

| Type | Characteristics | Location |
|---|---|---|
| **Smart (Container)** | Injects services, manages state, passes data to dumb components | `features/*/services/*.state.service.ts` |
| **Dumb (Presentational)** | Uses `input()`/`output()`, no direct service injection | `features/*/components/*/` |

### 3. Event-Driven Updates

Features communicate through `EventService`:
```
Task Completed → emits TASK_COMPLETED event → TimelineStateService adds timeline entry
Document Uploaded → emits DOCUMENT_UPLOADED event → TimelineStateService adds timeline entry
Note Created → emits NOTE_ADDED event → TimelineStateService adds timeline entry
```

### 4. Backend Integration Ready

- All API endpoints defined in `core/constants/api-endpoints.ts`
- `ApiService` base class wraps `HttpClient` with pagination, retry, error handling
- `RealtimeService` placeholder for WebSocket/SSE connection
- Environment-based API URL (`environment.ts`)

### 5. RxJS Best Practices

| Practice | Implementation |
|---|---|
| **BehaviorSubject** | Single source of truth per feature state |
| **Selectors as Observables** | `selectNotes()`, `selectTasks()`, etc. return filtered observables |
| **tap/catchError** | Side effects in `tap`, errors handled with `catchError` + `of([])` |
| **Subscription cleanup** | `Subscription` object + `ngOnDestroy` |
| **Immutable updates** | Spread operator, `map`, `filter` for state changes |

### 6. Standardized Event Payloads

All events emit consistent payloads:

| Event Type | Payload Structure |
|---|---|
| `TASK_*` | `{ caseId, taskId, title, status, dueDate }` |
| `DOCUMENT_*` | `{ caseId, documentId, name }` |
| `NOTE_*` | `{ caseId, noteId, title, createdAt }` |
| `CLIENT_WORKSPACE_FOCUS` | `{ clientId, clientName }` — emitted from **إدارة العملاء** when opening a client’s dossiers; optional listeners (dashboard, analytics) can react without coupling to the router. |
| `ANALYTICS_UPDATED` | `void` (optional payload) — manual or post-mutation refresh hook for analytics streams. |
| `EXPORT_CASE_PDF` | `caseId: number` — UI requests PDF export; handled by `CaseExportEventBridgeService` (replace with HTTP when the API exists). |
| `EXPORT_CASE_JSON` | `caseId: number` — same for JSON export. |

### Lawyer workspace: deep links (`WORKSPACE_QUERY`)

The **only** canonical names for these query keys are `WORKSPACE_QUERY` in `src/app/core/constants/workspace-query-params.ts`. That file is the contract; this section describes **per-route** read/write behavior and whether each param **stays in the URL** (**kept**) or is **removed after handling** (**consumed**).

Shell tab links use `queryParamsHandling="preserve"` on `EspaceAvocatShellPage`, so unrelated keys (e.g. `?case=`) survive tab switches unless a page clears them.

#### `/espace-avocat/dashboard` (`DashboardPage`)

| Key (URL) | Constant | Read | Write | Lifecycle |
|-----------|----------|------|-------|-----------|
| `case` | `CASE_ID` | Yes | Yes | **Kept** while a global dossier is selected: URL → `CasesStateService.loadCase`; missing `case` with an existing selection is **mirrored** into the URL (`merge` + `replaceUrl`). Row click / clear update the URL. |

#### `/espace-avocat/cases` (`EACasesPage`)

| Key (URL) | Constant | Read | Write | Lifecycle |
|-----------|----------|------|-------|-----------|
| `clientId` | `CLIENT_ID` | Yes | Yes | **Kept** for filtering: resolves client (via `DataService` today), fills search. **Removed** if the user changes search so it no longer matches that client’s canonical name (`merge` + `replaceUrl`). |
| `case` | `CASE_ID` | Yes | Yes | **Kept** while the case detail modal is open; opening a row or deep link sets it; closing the modal clears `case` and `doc`. Invalid / unknown id is cleared and a snackbar shows «الملف غير موجود». |
| `doc` | `DOC_ID` | Yes | Yes | **Consumed** after handling: with a valid `case`, opens document preview then **`doc` is stripped** from the URL (`merge` + `replaceUrl`); `case` remains. Closing the preview also removes `doc` if still present. Share links use `case` + `doc` together. |

#### `/espace-avocat/hearings` (`CourtSessionsWorkspaceComponent`)

| Key (URL) | Constant | Read | Write | Lifecycle |
|-----------|----------|------|-------|-----------|
| `case` | `CASE_ID` | Yes | Yes | **Kept**: URL → `loadCase`; if URL has no `case` but a dossier is already selected, it is **mirrored** into the URL. Clearing the dossier clears `case` and also clears `clientId` / `client` (billing-style params). |
| `clientId` | `CLIENT_ID` | — | Yes (clear) | Cleared when clearing dossier selection (not the primary filter on this page). |
| `client` | `CLIENT_NAME` | — | Yes (clear) | Same as `clientId` on clear. |

#### `/espace-avocat/finance` (`EAFinancePage` + `FinancialBillingComponent`)

| Key (URL) | Constant | Read | Write | Lifecycle |
|-----------|----------|------|-------|-----------|
| `clientId` | `CLIENT_ID` | Yes (`EAFinancePage`) | Yes (`FinancialBillingComponent` on clear) | **Kept** while filtering: resolved to client name → `filterClientName` / case picker. Clearing the selected dossier in billing sets `clientId` and `client` to **null** (`merge` + `replaceUrl`). |
| `client` | `CLIENT_NAME` | Yes (`EAFinancePage`) | Yes (on clear) | Optional raw name when id is unavailable; same filter semantics as `clientId`. |

`CASE_ID` is **not** written by the finance billing UI today; dossier selection is in-component state. Mock honoraires on the finance page still use the resolved client name for filtering.

#### `/espace-avocat/stats` (`EAStatsPage` + `AnalyticsDashboardComponent`)

| Key (URL) | Constant | Read | Write | Lifecycle |
|-----------|----------|------|-------|-----------|
| `case` | `CASE_ID` | Yes | Yes | **Kept**: `?case=` → `CasesStateService.loadCase`; if the URL has no `case` but a dossier is already selected globally, it is **mirrored** into the URL (`merge` + `replaceUrl`), same pattern as **لوحة التحكم** and **الجلسات**. **إزالة التحديد** clears selection and drops `case` from the query string. |

Loads the timeline for the active dossier so **ملخص النشاط الأخير** can show `TimelineStateService` data. Shell tabs use `queryParamsHandling="preserve"`, so `?case=` survives when switching away and back.

#### `/espace-avocat/clients` (`EAClientsPage`)

| Key (URL) | Constant | Read | Write | Lifecycle |
|-----------|----------|------|-------|-----------|
| — | — | No subscription to workspace keys on this page | **Produces** links | Navigation **to** `/cases` with `clientId`, and router `queryParams` helpers for `case` / `clientId` on outbound links. Emits `CLIENT_WORKSPACE_FOCUS` when opening a client’s dossiers from here. |

**إدارة العملاء** uses `WORKSPACE_QUERY` only when building URLs to other workspace routes; it does not own URL state for those keys on the clients route itself.

## File Naming Conventions

| Type | Pattern | Example |
|---|---|---|
| API Service | `*.api.service.ts` | `cases-api.service.ts` |
| State Service | `*.state.service.ts` | `cases-state.service.ts` |
| Component | `*.component.ts` | `case-table.component.ts` |
| Model | `*.model.ts` | `lawyer.model.ts` |
| Guard | `*.guard.ts` | `auth.guard.ts` |
| Interceptor | `*.interceptor.ts` | `auth.interceptor.ts` |
