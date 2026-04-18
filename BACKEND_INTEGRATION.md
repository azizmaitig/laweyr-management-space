# Backend Integration Guide

This guide explains how to connect the Angular frontend to a Spring Boot backend.

## Table of Contents
1. [Environment Configuration](#environment-configuration)
2. [CORS Configuration](#cors-configuration)
3. [JWT Authentication Flow](#jwt-authentication-flow)
4. [API Service Pattern](#api-service-pattern)
5. [Court sessions & hearings API](#court-sessions--hearings-api)
6. [Error Handling](#error-handling)
7. [Pagination](#pagination)
8. [Real-Time Updates](#real-time-updates)
9. [Event-Driven Architecture](#event-driven-architecture)
10. [Testing Strategies](#testing-strategies)

---

## Environment Configuration

### Current Setup
```typescript
// environments/environment.ts (development)
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',
};

// environments/environment.prod.ts (production)
export const environment = {
  production: true,
  apiUrl: '/api',  // Relative URL (same origin)
};
```

### How to Change
1. Update `apiUrl` in `environment.ts` to match your Spring Boot server
2. All API services automatically use this URL via `ApiService.baseUrl`
3. No component changes needed

---

## CORS Configuration

### Spring Boot Side
```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins("http://localhost:4200")  // Angular dev server
            .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH")
            .allowedHeaders("*")
            .exposedHeaders("Authorization")
            .allowCredentials(true)
            .maxAge(3600);
    }
}
```

### Angular Side
Already configured via `auth.interceptor.ts` which attaches the `Authorization` header.

---

## JWT Authentication Flow

### 1. Login Flow
```
User enters credentials
  → AuthStateService.login(dto)
    → POST /api/auth/login
    → Spring Boot validates credentials
    → Returns { token, user }
    → AuthStateService stores token in state + localStorage
    → Auth interceptor attaches token to future requests
```

### 2. Token Attachment
```typescript
// core/interceptors/auth.interceptor.ts
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthStateService).token;

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq);
};
```

### 3. Token Refresh
```typescript
// When 401 is received:
// 1. Error interceptor catches it
// 2. AuthStateService.logout() is called
// 3. User is redirected to /login
// 4. localStorage is cleared
```

### Spring Boot Expected Endpoints
```
POST /api/auth/login      → { token, user: { id, name, email, roles } }
POST /api/auth/register   → { token, user }
POST /api/auth/logout     → void
POST /api/auth/refresh    → { token, user }
GET  /api/auth/profile    → { user }
```

---

## API Service Pattern

### Base Service
```typescript
// core/services/api.service.ts
export class ApiService {
  protected http = inject(HttpClient);
  protected baseUrl = environment.apiUrl;

  protected get<T>(url, params?) { ... }
  protected post<T>(url, body, params?) { ... }
  protected put<T>(url, body) { ... }
  protected delete<T>(url) { ... }
  protected fetchPaginated<T>(url, pageParams) { ... }
}
```

### Feature API Service
```typescript
// features/notes/services/notes-api.service.ts
export interface CreateNoteDto {
  caseId: number;
  title?: string;
  content: string;
}

export interface UpdateNoteDto {
  title?: string;
  content?: string;
}

@Injectable({ providedIn: 'root' })
export class NotesApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;
  private endpoint = '/notes';

  getByCase(caseId: number): Observable<Note[]> {
    return this.http.get<Note[]>(`${this.endpoint}/case/${caseId}`);
  }

  create(dto: CreateNoteDto): Observable<Note> {
    return this.http.post<Note>(this.endpoint, dto);
  }

  update(id: number, dto: UpdateNoteDto): Observable<Note> {
    return this.http.put<Note>(`${this.endpoint}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`);
  }
}
```

### Court sessions & hearings API

The Angular **court-sessions** feature expects dedicated REST resources under `environment.apiUrl`:

| Artifact | Location |
|----------|----------|
| Human-readable contract (paths, JSON shapes, enums) | [API_COURT_SESSIONS.md](./docs/API_COURT_SESSIONS.md) |
| OpenAPI 3.0 YAML (import into Swagger / codegen) | `docs/openapi/court-sessions.openapi.yaml` |
| Path constants in the app | `src/app/core/constants/api-endpoints.ts` (`COURT_SESSIONS`, `SESSION_PREPARATIONS`, `SESSION_OUTCOMES`, `DEADLINES`) |

These are distinct from the legacy `HEARINGS` routes in the same constants file unless you choose to alias or merge them on the server.

### Expected Spring Boot Response Format
```json
// Success
{
  "data": { ... },
  "message": "Optional success message",
  "success": true
}

// Paginated
{
  "data": [ ... ],
  "total": 150,
  "page": 0,
  "size": 20,
  "totalPages": 8,
  "hasNext": true,
  "hasPrev": false
}

// Error
{
  "status": 400,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": { "email": ["Invalid email format"] },
  "timestamp": "2025-04-05T15:00:00Z"
}
```

---

## Error Handling

### Global Error Interceptor
```typescript
// core/interceptors/error.interceptor.ts
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError(error => {
      // Emit event for UI components
      events.emit(AppEventType.API_ERROR, errorData);

      // Log appropriately
      if (error.status >= 500) console.error(...);
      else if (error.status === 404) console.warn(...);

      return throwError(() => errorData);
    })
  );
};
```

### State Service Error Handling
```typescript
// features/notes/services/notes-state.service.ts
loadNotes(caseId: number) {
  this.patchState({ loading: true, error: null });
  this.api.getByCase(caseId).pipe(
    tap(notes => this.patchState({ notes, filteredNotes: notes, loading: false })),
    catchError(err => {
      this.patchState({ loading: false, error: err.message });
      this.events.emit(AppEventType.NOTE_ERROR, err.message);
      return of([]);  // Don't break the stream
    })
  ).subscribe();
}
```

### UI Error Display
```html
<!-- In component template -->
@if (error$ | async; as error) {
  <app-error-message [message]="error" (dismiss)="clearError()" />
}
```

---

## Pagination

### Frontend Usage
```typescript
// State service
loadCases(pageParams: PageParams) {
  this.api.getPaginated(pageParams).pipe(
    tap(response => {
      this.patchState({
        cases: response.data,
        pagination: {
          page: response.page,
          size: response.size,
          total: response.total,
          totalPages: response.totalPages,
        },
      });
    })
  ).subscribe();
}
```

### Expected Spring Boot Endpoint
```
GET /api/cases?page=0&size=20&sort=name,asc
```

### Spring Boot Controller
```java
@GetMapping
public Page<Case> getCases(
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size,
    @RequestParam(defaultValue = "id") String sort,
    @RequestParam(defaultValue = "asc") String direction
) {
    Sort sortObj = Sort.by(Sort.Direction.fromString(direction), sort);
    Pageable pageable = PageRequest.of(page, size, sortObj);
    return caseService.findAll(pageable);
}
```

---

## Real-Time Updates

### Current Setup
```typescript
// core/services/realtime.service.ts
export class RealtimeService {
  connect() {
    // Uncomment when backend is ready:
    // this.ws = new WebSocket(`${wsUrl}/ws`);
    // this.ws.onmessage = (event) => { ... };
  }
}
```

### Spring Boot WebSocket Setup
```java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic");
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
            .setAllowedOrigins("http://localhost:4200")
            .withSockJS();
    }
}
```

### Event Mapping
```typescript
// Backend sends: { type: 'case.updated', data: { ... } }
// Frontend maps to: AppEventType.CASE_UPDATED
```

---

## Event-Driven Architecture

### Overview
The frontend uses an event bus (`EventService`) for cross-feature communication. Features never call each other directly.

### Event Flow
```
User Action → State Service → API Call → Update State → Emit Event
                                                          ↓
                                                  Other State Services
                                                  (listen and react)
```

### Standardized Event Payloads

| Event Type | Payload Structure |
|---|---|
| `TASK_CREATED` | `{ caseId, taskId, title, status, dueDate }` |
| `TASK_UPDATED` | `{ caseId, taskId, title, status, dueDate }` |
| `TASK_COMPLETED` | `{ caseId, taskId, title, status, dueDate }` |
| `TASK_DELETED` | `{ caseId, taskId, title, status, dueDate }` |
| `DOCUMENT_UPLOADED` | `{ caseId, documentId, name }` |
| `DOCUMENT_UPDATED` | `{ caseId, documentId, name }` |
| `DOCUMENT_DELETED` | `{ caseId, documentId, name }` |
| `NOTE_ADDED` | `{ caseId, noteId, title, createdAt }` |
| `NOTE_UPDATED` | `{ caseId, noteId, title, createdAt }` |
| `NOTE_DELETED` | `{ caseId, noteId, title, createdAt }` |
| `CASE_SELECTED` | `caseId: number` |
| `CASE_DELETED` | `caseId: number` |
| `ANALYTICS_UPDATED` | optional payload |
| `EXPORT_CASE_PDF` | `caseId: number` |
| `EXPORT_CASE_JSON` | `caseId: number` |

### Cross-Feature Event Coord

| Trigger | Event Emitted | Listeners React |
|---|---|---|
| Task completed | `TASK_COMPLETED` | TimelineStateService adds timeline entry |
| Document uploaded | `DOCUMENT_UPLOADED` | TimelineStateService adds timeline entry |
| Note created | `NOTE_ADDED` | TimelineStateService adds timeline entry |
| Case selected | `CASE_SELECTED` | Tasks/Notes/Documents load their data |
| Case deleted | `CASE_DELETED` | Tasks/Notes/Documents clear their data |
| Analytics refresh (manual/UI) | `ANALYTICS_UPDATED` | AnalyticsStateService bumps refresh tick |
| Export PDF / JSON from stats UI | `EXPORT_CASE_PDF` / `EXPORT_CASE_JSON` | CaseExportEventBridgeService (swap for real download) |

### Adding New Event Listeners

```typescript
// In any state service constructor:
private setupEventListeners(): void {
  this.subscriptions.add(
    this.events.on<TaskEventPayload>(AppEventType.TASK_COMPLETED)
      .subscribe(({ caseId, taskId, title }) => {
        // React to task_completion
      })
  );
}
```

### Spring Boot Event Integration

When backend is ready, map backend events to frontend `AppEventType`:

```typescript
// core/services/realtime.service.ts
private handleMessage(message: RealtimeMessage): void {
  const eventMap: Record<string, AppEventType> = {
    'task.completed': AppEventType.TASK_COMPLETED,
    'document.uploaded': AppEventType.DOCUMENT_UPLOADED,
    'note.created': AppEventType.NOTE_ADDED,
    // Add more mappings as needed
  };

  const eventType = eventMap[message.type];
  if (eventType) {
    this.events.emit(eventType, message.data);
  }
}
```

---

## Testing Strategies

### 1. Unit Testing Services
```typescript
// Use mock HTTP client
const httpMock = new HttpTestingController();
const apiService = TestBed.inject(NotesApiService);

apiService.getByCase(1).subscribe(notes => {
  expect(notes.length).toBe(3);
});

const req = httpMock.expectOne('/api/notes/case/1');
req.flush(mockNotes);
```

### 2. Integration Testing
```typescript
// Test state service with real API (use testcontainers for Spring Boot)
describe('NotesStateService', () => {
  it('should load notes from backend', async () => {
    await stateService.loadNotes(1);
    stateService.selectNotes(1).subscribe(notes => {
      expect(notes).toBeDefined();
    });
  });
});
```

### 3. E2E Testing
```typescript
// Use Cypress or Playwright
cy.intercept('GET', '/api/notes/case/1', { fixture: 'notes.json' });
cy.visit('/cases/1/notes');
cy.get('[data-testid="note-list"]').should('be.visible');
```

---

## Quick Start Checklist

- [ ] Set `apiUrl` in `environment.ts` to Spring Boot URL
- [ ] Configure CORS in Spring Boot
- [ ] Implement `/api/auth/login` endpoint
- [ ] Implement `/api/auth/register` endpoint
- [ ] Implement JWT token generation
- [ ] Test login flow
- [ ] Implement remaining CRUD endpoints
- [ ] Test pagination
- [ ] Test error handling
- [ ] (Optional) Set up WebSocket for real-time updates
- [ ] (Optional) Map backend events to frontend `AppEventType`

---

## Troubleshooting

| Issue | Solution |
|---|---|
| CORS error | Add `allowedOrigins("http://localhost:4200")` in Spring Boot |
| 401 Unauthorized | Check JWT token format, ensure `Bearer ` prefix |
| 403 Forbidden | Check role-based access, ensure user has required roles |
| 500 Internal Error | Check Spring Boot logs, verify request body format |
| Token not attached | Verify `AuthStateService.token` returns valid token |
| Events not firing | Check `EventService.emit()` calls in state services |
| State not updating | Verify `patchState()` creates new object (immutable update) |
| Search not working | Check `filteredNotes` vs `notes` in state service |
