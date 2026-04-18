export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',
  /**
   * When true, `hearingsDemoInterceptor` serves mock cases + court-sessions API
   * so you can use `/espace-avocat/hearings` without Spring Boot. Set to `false` to hit a real API.
   */
  hearingsDemo: true,
  /** Mock cases endpoints for gradual migration away from DataService. */
  casesDemo: true,
  /** Mock `GET/POST/PATCH/DELETE /lawyers/me/sub-accounts` when no backend */
  lawyerSubAccountsDemo: true,
};
