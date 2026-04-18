# Backend Integration Architecture

This document defines the architectural patterns, layers, and standards for integrating the Angular frontend with the Spring Boot backend.

## 1. Architectural Layers

The integration is structured into four distinct layers to ensure separation of concerns and maintainability.

### Layer 1: Infrastructure (Interceptors & Config)
- **Role:** Handles cross-cutting concerns for every HTTP request.
- **Components:**
  - `AuthInterceptor`: Attaches JWT tokens from `AuthStateService`.
  - `ErrorInterceptor`: Catches global HTTP errors, handles 401s (logout), and emits events.
  - `LoadingInterceptor`: Tracks active requests to show/hide global loading indicators.
  - `EnvironmentConfig`: Managed via `src/environments/`, providing the `apiUrl`.

### Layer 2: API Services (Data Access)
- **Role:** Atomic, stateless services that map directly to REST resources.
- **Pattern:** `*ApiService` (e.g., `CasesApiService`).
- **Responsibilities:**
  - Constructing URL paths using `ApiEndpoints` constants.
  - Mapping HTTP responses to DTOs/Models.
  - Handling pagination parameters.
  - Simple error mapping (if specific to the endpoint).

### Layer 3: State Management (Domain Logic)
- **Role:** Manages local data cache and coordinates side effects.
- **Pattern:** `*StateService` (e.g., `CasesStateService`).
- **Responsibilities:**
  - Invoking API services.
  - Managing `BehaviorSubject` for reactive data streams.
  - Emitting global events via `EventService` after successful mutations.
  - Implementing optimistic updates (where appropriate).

### Layer 4: Real-time (Synchronization)
- **Role:** Handles asynchronous updates from the server.
- **Components:**
  - `RealtimeService`: Manages WebSocket/STOMP connections.
  - Maps backend event types (e.g., `case.updated`) to frontend `AppEventType`.

---

## 2. Security Architecture

### Authentication Flow (JWT)
1. **Login:** `AuthApiService.login()` receives a JWT and user profile.
2. **Persistence:** `AuthStateService` stores the token in `localStorage` and a private memory state.
3. **Transmission:** `AuthInterceptor` automatically injects the `Authorization: Bearer <token>` header into all outgoing requests except for public routes.
4. **Expiration:** `ErrorInterceptor` detects `401 Unauthorized` responses and triggers `AuthStateService.logout()`.

### Authorization
- **Route Guards:** `AuthGuard` protects private routes; `PermissionGuard` checks for specific user roles/permissions.
- **Directives:** `*hasPermission` directive conditionally renders UI elements based on user roles.

---

## 3. Communication Patterns

### RESTful API Standards
- **Standard Format:** All responses should ideally follow the `ApiResponse<T>` wrapper:
  ```json
  {
    "success": boolean,
    "data": T,
    "message": string,
    "errors": []
  }
  ```
- **Pagination:** Uses `page` and `size` query parameters. Responses include metadata (`totalElements`, `totalPages`, etc.).
- **HTTP Methods:** 
  - `GET`: Fetch data.
  - `POST`: Create new resources.
  - `PUT`: Full update.
  - `PATCH`: Partial update.
  - `DELETE`: Remove resource.

### Event-Driven Integration
When the backend completes an operation (e.g., via REST or WebSocket), the frontend propagates this change through the `EventService`. This allows decoupled features (like the Timeline or Notifications) to react without direct service dependencies.

---

## 4. Data Modeling Strategy

- **DTOs (Data Transfer Objects):** Defined as TypeScript interfaces in `core/models/` or feature-specific folders. They match the backend's JSON structure.
- **Enums:** Shared enums (e.g., `CaseStatus`, `TaskPriority`) are used to maintain type safety across the integration boundary.
- **Mapping:** Simple mapping is done in the `ApiService`; complex business object transformation happens in the `StateService`.

---

## 5. Error Handling & Resilience

### Global Strategy
1. **Interceptor Level:** Log error to console, trigger "Token Expired" if 401.
2. **State Level:** Catch error, update local `error` state (BehaviorSubject), and emit an error event for UI snackbars.
3. **Component Level:** Listen to the `error$` stream from the state service to show contextual error messages.

### Retry Logic
Critical GET requests use RxJS `retry(n)` to handle transient network issues before failing.

---

## 6. Contract Management

To prevent drift between frontend and backend:
- **API Endpoints:** Centralized in `src/app/core/constants/api-endpoints.ts`.
- **OpenAPI:** Documentation is maintained in `docs/openapi/`. 
- **Mocking:** `HearingsDemoInterceptor` and `LawyerSubAccountsDemoInterceptor` provide a blueprint for expected data shapes before the backend is fully implemented.

---

## 7. Environment Lifecycle

| Environment | API Base URL | Behavior |
|---|---|---|
| **Development** | `http://localhost:8080/api` | Full logging, interceptors active. |
| **Staging** | `https://staging-api.onat.tn/api` | Minified, production-like interceptors. |
| **Production** | `/api` | Relative path (assumes same-origin deployment). |
