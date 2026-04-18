import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  HEARINGS_DEMO_CASES,
  HEARINGS_DEMO_DEADLINES_RAW,
  HEARINGS_DEMO_OUTCOMES_RAW,
  HEARINGS_DEMO_PREPARATIONS_RAW,
  HEARINGS_DEMO_SESSIONS_RAW,
} from '../../features/court-sessions/hearings-demo.data';

/** In-memory lists (mutable) so POST/DELETE in demo mode update subsequent GETs */
let demoSessions: Record<string, unknown>[] = JSON.parse(JSON.stringify(HEARINGS_DEMO_SESSIONS_RAW));
let demoPreparations: Record<string, unknown>[] = JSON.parse(JSON.stringify(HEARINGS_DEMO_PREPARATIONS_RAW));
let demoOutcomes: Record<string, unknown>[] = JSON.parse(JSON.stringify(HEARINGS_DEMO_OUTCOMES_RAW));
let demoDeadlines: Record<string, unknown>[] = JSON.parse(JSON.stringify(HEARINGS_DEMO_DEADLINES_RAW));

let nextSessionId = 9100;
let nextPrepId = 8100;
let nextOutcomeId = 7100;
let nextDeadlineId = 6100;

function apiPath(url: string): string | null {
  const base = environment.apiUrl.replace(/\/$/, '');
  if (!url.startsWith(base)) return null;
  return url.slice(base.length).split('?')[0];
}

/**
 * When `environment.hearingsDemo` is true, serves mock cases + court-sessions resources
 * so `/espace-avocat/hearings` works without Spring Boot.
 */
export const hearingsDemoInterceptor: HttpInterceptorFn = (req, next) => {
  if (!environment.hearingsDemo || environment.production) {
    return next(req);
  }

  const path = apiPath(req.url);
  if (path == null) {
    return next(req);
  }

  const json = (body: unknown, status = 200) =>
    of(new HttpResponse({ body, status, url: req.url }));

  // --- Cases (list + by id) ---
  if (req.method === 'GET' && path === '/cases') {
    return json(HEARINGS_DEMO_CASES);
  }
  const caseById = /^\/cases\/(\d+)$/.exec(path);
  if (req.method === 'GET' && caseById) {
    const id = Number(caseById[1]);
    const c = HEARINGS_DEMO_CASES.find(x => x.id === id);
    return c ? json(c) : json({ message: 'Case not found' }, 404);
  }

  // --- Court sessions ---
  const sessionsByCase = /^\/court-sessions\/case\/(\d+)$/.exec(path);
  if (req.method === 'GET' && sessionsByCase) {
    const caseId = Number(sessionsByCase[1]);
    return json(demoSessions.filter(s => s['caseId'] === caseId));
  }
  const sessionById = /^\/court-sessions\/(\d+)$/.exec(path);
  if (req.method === 'GET' && sessionById) {
    const id = Number(sessionById[1]);
    const s = demoSessions.find(x => x['id'] === id);
    return s ? json(s) : json({ message: 'Session not found' }, 404);
  }
  if (req.method === 'POST' && path === '/court-sessions') {
    const body = req.body as Record<string, unknown>;
    const created = {
      ...body,
      id: nextSessionId++,
    };
    demoSessions = [created, ...demoSessions];
    return json(created, 201);
  }
  if (req.method === 'PUT' && sessionById) {
    const id = Number(sessionById[1]);
    const body = req.body as Record<string, unknown>;
    const idx = demoSessions.findIndex(x => x['id'] === id);
    if (idx < 0) return json({ message: 'Not found' }, 404);
    const updated = { ...demoSessions[idx], ...body, id };
    demoSessions = [...demoSessions.slice(0, idx), updated, ...demoSessions.slice(idx + 1)];
    return json(updated);
  }
  if (req.method === 'DELETE' && sessionById) {
    const id = Number(sessionById[1]);
    demoSessions = demoSessions.filter(x => x['id'] !== id);
    return json(null, 204);
  }

  // --- Preparations ---
  const prepByCase = /^\/session-preparations\/case\/(\d+)$/.exec(path);
  if (req.method === 'GET' && prepByCase) {
    const caseId = Number(prepByCase[1]);
    const sessionIds = new Set(
      demoSessions.filter(s => s['caseId'] === caseId).map(s => s['id'] as number)
    );
    return json(demoPreparations.filter(p => sessionIds.has(p['sessionId'] as number)));
  }
  const prepById = /^\/session-preparations\/(\d+)$/.exec(path);
  if (req.method === 'POST' && path === '/session-preparations') {
    const body = req.body as Record<string, unknown>;
    const created = { ...body, id: nextPrepId++ };
    demoPreparations = [created as Record<string, unknown>, ...demoPreparations];
    return json(created, 201);
  }
  if (req.method === 'PUT' && prepById) {
    const id = Number(prepById[1]);
    const body = req.body as Record<string, unknown>;
    const idx = demoPreparations.findIndex(x => x['id'] === id);
    if (idx < 0) return json({ message: 'Not found' }, 404);
    const updated = { ...demoPreparations[idx], ...body, id };
    demoPreparations = [...demoPreparations.slice(0, idx), updated, ...demoPreparations.slice(idx + 1)];
    return json(updated);
  }
  if (req.method === 'DELETE' && prepById) {
    const id = Number(prepById[1]);
    demoPreparations = demoPreparations.filter(x => x['id'] !== id);
    return json(null, 204);
  }

  // --- Outcomes ---
  const outcomesByCase = /^\/session-outcomes\/case\/(\d+)$/.exec(path);
  if (req.method === 'GET' && outcomesByCase) {
    const caseId = Number(outcomesByCase[1]);
    const sessionIds = new Set(
      demoSessions.filter(s => s['caseId'] === caseId).map(s => s['id'] as number)
    );
    return json(demoOutcomes.filter(o => sessionIds.has(o['sessionId'] as number)));
  }
  const outcomeById = /^\/session-outcomes\/(\d+)$/.exec(path);
  if (req.method === 'POST' && path === '/session-outcomes') {
    const body = req.body as Record<string, unknown>;
    const created = {
      ...body,
      id: nextOutcomeId++,
      createdAt: new Date().toISOString(),
    };
    demoOutcomes = [created, ...demoOutcomes];
    return json(created, 201);
  }
  if (req.method === 'PUT' && outcomeById) {
    const id = Number(outcomeById[1]);
    const body = req.body as Record<string, unknown>;
    const idx = demoOutcomes.findIndex(x => x['id'] === id);
    if (idx < 0) return json({ message: 'Not found' }, 404);
    const updated = { ...demoOutcomes[idx], ...body, id };
    demoOutcomes = [...demoOutcomes.slice(0, idx), updated, ...demoOutcomes.slice(idx + 1)];
    return json(updated);
  }
  if (req.method === 'DELETE' && outcomeById) {
    const id = Number(outcomeById[1]);
    demoOutcomes = demoOutcomes.filter(x => x['id'] !== id);
    return json(null, 204);
  }

  // --- Deadlines ---
  const deadlinesByCase = /^\/deadlines\/case\/(\d+)$/.exec(path);
  if (req.method === 'GET' && deadlinesByCase) {
    const caseId = Number(deadlinesByCase[1]);
    return json(demoDeadlines.filter(d => d['caseId'] === caseId));
  }
  const deadlineById = /^\/deadlines\/(\d+)$/.exec(path);
  if (req.method === 'POST' && path === '/deadlines') {
    const body = req.body as Record<string, unknown>;
    const created = { ...body, id: nextDeadlineId++ };
    demoDeadlines = [created, ...demoDeadlines];
    return json(created, 201);
  }
  if (req.method === 'PUT' && deadlineById) {
    const id = Number(deadlineById[1]);
    const body = req.body as Record<string, unknown>;
    const idx = demoDeadlines.findIndex(x => x['id'] === id);
    if (idx < 0) return json({ message: 'Not found' }, 404);
    const updated = { ...demoDeadlines[idx], ...body, id };
    demoDeadlines = [...demoDeadlines.slice(0, idx), updated, ...demoDeadlines.slice(idx + 1)];
    return json(updated);
  }
  if (req.method === 'DELETE' && deadlineById) {
    const id = Number(deadlineById[1]);
    demoDeadlines = demoDeadlines.filter(x => x['id'] !== id);
    return json(null, 204);
  }

  return next(req);
};
