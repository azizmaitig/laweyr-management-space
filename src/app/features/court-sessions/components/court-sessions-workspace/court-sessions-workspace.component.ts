import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, distinctUntilChanged, map, of, switchMap, take } from 'rxjs';
import { CasesStateService } from '../../../cases/services/cases-state.service';
import { DeadlinesStateService } from '../../services/deadlines-state.service';
import { OutcomesStateService } from '../../services/outcomes-state.service';
import { PreparationStateService } from '../../services/preparation-state.service';
import { SessionsStateService } from '../../services/sessions-state.service';
import { WORKSPACE_QUERY } from '../../../../core/constants/workspace-query-params';
import type { Case } from '../../../../core/models';
import type {
  Deadline,
  DeadlinePriority,
  DeadlineType,
  Session,
  SessionOutcome,
  SessionOutcomeResult,
  SessionPreparation,
  SessionStatus,
} from '../../../../core/models';

type WorkspaceTab = 'sessions' | 'preparation' | 'outcomes' | 'deadlines';

@Component({
  selector: 'app-court-sessions-workspace',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './court-sessions-workspace.component.html',
  styleUrl: './court-sessions-workspace.component.scss',
})
export class CourtSessionsWorkspaceComponent implements OnInit {
  protected casesState = inject(CasesStateService);
  protected sessionsState = inject(SessionsStateService);
  protected preparationState = inject(PreparationStateService);
  protected outcomesState = inject(OutcomesStateService);
  protected deadlinesState = inject(DeadlinesStateService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  /** Expose query key for template hint (`?case=`). */
  protected readonly wq = WORKSPACE_QUERY;

  readonly selectedCase$ = this.casesState.selectSelectedCase();
  readonly casesList$ = this.casesState.selectCases();

  private readonly caseId$ = this.selectedCase$.pipe(
    map(c => c?.id ?? null),
    distinctUntilChanged()
  );

  readonly sessions$ = this.caseId$.pipe(
    switchMap(id => (id != null ? this.sessionsState.selectSessions(id) : of([] as Session[])))
  );

  readonly preparations$ = combineLatest([
    this.caseId$,
    this.sessions$,
    this.preparationState.selectPreparations(),
  ]).pipe(
    map(([id, sessions, prep]) => {
      if (id == null) return [] as SessionPreparation[];
      const sid = new Set(sessions.map(s => s.id));
      return prep.filter(p => sid.has(p.sessionId));
    })
  );

  readonly outcomes$ = combineLatest([
    this.caseId$,
    this.sessions$,
    this.outcomesState.selectOutcomes(),
  ]).pipe(
    map(([id, sessions, outcomes]) => {
      if (id == null) return [] as SessionOutcome[];
      const sid = new Set(sessions.map(s => s.id));
      return outcomes.filter(o => sid.has(o.sessionId));
    })
  );

  readonly deadlines$ = combineLatest([this.caseId$, this.deadlinesState.selectDeadlines()]).pipe(
    map(([id, ds]) => (id == null ? [] : ds.filter(d => d.caseId === id)))
  );

  readonly loading$ = combineLatest([
    this.sessionsState.selectLoading(),
    this.preparationState.selectLoading(),
    this.outcomesState.selectLoading(),
    this.deadlinesState.selectLoading(),
  ]).pipe(map(([a, b, c, d]) => a || b || c || d));

  readonly error$ = combineLatest([
    this.sessionsState.selectError(),
    this.preparationState.selectError(),
    this.outcomesState.selectError(),
    this.deadlinesState.selectError(),
  ]).pipe(map(([a, b, c, d]) => a || b || c || d || null));

  /** Per session id (incl. optimistic negative id): `create` | `update` */
  readonly sessionWritePending$ = this.sessionsState.selectSessionWritePending();
  readonly preparationSavePending$ = this.preparationState.selectPreparationSavePendingSessions();
  readonly outcomeRecordPending$ = this.outcomesState.selectOutcomeRecordPendingSessions();
  readonly outcomeWritePending$ = this.outcomesState.selectOutcomeWritePending();
  readonly deadlineWritePending$ = this.deadlinesState.selectDeadlineWritePending();

  activeTab: WorkspaceTab = 'sessions';

  newSessionDate = '';
  newSessionCourt = '';
  newSessionType = '';
  newSessionStatus: SessionStatus = 'UPCOMING';

  prepSessionId: number | null = null;
  prepChecklistText = '';
  prepNotes = '';

  outcomeSessionId: number | null = null;
  outcomeResult: SessionOutcomeResult = 'POSTPONED';
  outcomeSummary = '';
  outcomeNextDate = '';

  deadlineTitle = '';
  deadlineDue = '';
  deadlineType: DeadlineType = 'LEGAL';
  deadlinePriority: DeadlinePriority = 'MEDIUM';
  deadlineNotifyLevels = '7,3,1';

  readonly sessionStatusLabels: Record<SessionStatus, string> = {
    UPCOMING: 'قادمة',
    COMPLETED: 'مكتملة',
    POSTPONED: 'مؤجلة',
  };

  readonly outcomeLabels: Record<SessionOutcomeResult, string> = {
    POSTPONED: 'تأجيل',
    PARTIAL_JUDGMENT: 'حكم جزئي',
    FINAL_JUDGMENT: 'حكم نهائي',
    APPEAL: 'استئناف',
  };

  readonly deadlineTypeLabels: Record<DeadlineType, string> = {
    LEGAL: 'قانوني',
    CUSTOM: 'مخصص',
  };

  readonly priorityLabels: Record<DeadlinePriority, string> = {
    LOW: 'منخفض',
    MEDIUM: 'متوسط',
    HIGH: 'عالٍ',
  };

  readonly outcomeResults: SessionOutcomeResult[] = [
    'POSTPONED',
    'PARTIAL_JUDGMENT',
    'FINAL_JUDGMENT',
    'APPEAL',
  ];

  ngOnInit(): void {
    this.casesState
      .selectCases()
      .pipe(take(1))
      .subscribe(cases => {
        if (cases.length === 0) this.casesState.loadCases();
      });

    // URL → state: `?case=<id>` loads that dossier (bookmark / cross-page links).
    this.route.queryParams
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        distinctUntilChanged(
          (a, b) =>
            String(a[WORKSPACE_QUERY.CASE_ID] ?? '') === String(b[WORKSPACE_QUERY.CASE_ID] ?? '')
        )
      )
      .subscribe(params => {
        const raw = params[WORKSPACE_QUERY.CASE_ID];
        if (raw == null || raw === '') {
          return;
        }
        const id = Number(raw);
        if (Number.isFinite(id) && id > 0) {
          this.casesState.loadCase(id);
        }
      });

    // If global selection exists but URL has no `case`, mirror selection into the URL (replace — shareable).
    combineLatest([
      this.route.queryParams.pipe(take(1)),
      this.casesState.selectSelectedCase().pipe(take(1)),
    ]).subscribe(([params, selected]) => {
      const raw = params[WORKSPACE_QUERY.CASE_ID];
      if ((raw == null || raw === '') && selected != null) {
        void this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { [WORKSPACE_QUERY.CASE_ID]: selected.id },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });
      }
    });
  }

  casesForPicker(all: Case[] | null | undefined): Case[] {
    return all ?? [];
  }

  onSelectCase(caseId: string): void {
    if (!caseId) {
      this.casesState.clearSelection();
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {
          [WORKSPACE_QUERY.CLIENT_ID]: null,
          [WORKSPACE_QUERY.CLIENT_NAME]: null,
          [WORKSPACE_QUERY.CASE_ID]: null,
        },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
      return;
    }
    const id = Number(caseId);
    if (!Number.isFinite(id)) return;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        [WORKSPACE_QUERY.CASE_ID]: id,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
    // `loadCase` runs from `queryParams` subscription (keeps URL as single source of truth).
  }

  createSession(caseId: number): void {
    if (!this.newSessionDate.trim() || !this.newSessionCourt.trim()) return;
    this.sessionsState.createSession({
      caseId,
      date: new Date(this.newSessionDate),
      court: this.newSessionCourt.trim(),
      type: this.newSessionType.trim() || undefined,
      status: this.newSessionStatus,
    });
    this.newSessionDate = '';
    this.newSessionCourt = '';
    this.newSessionType = '';
    this.newSessionStatus = 'UPCOMING';
  }

  setSessionStatus(session: Session, status: SessionStatus): void {
    this.sessionsState.updateSession(session.id, { status });
  }

  removeSession(id: number): void {
    this.sessionsState.deleteSession(id);
    if (this.prepSessionId === id) {
      this.prepSessionId = null;
      this.prepChecklistText = '';
      this.prepNotes = '';
    }
    if (this.outcomeSessionId === id) this.outcomeSessionId = null;
  }

  onPrepSessionChange(value: number | null, preparations: SessionPreparation[]): void {
    this.prepSessionId = value;
    if (value == null) {
      this.prepChecklistText = '';
      this.prepNotes = '';
      return;
    }
    const p = preparations.find(x => x.sessionId === value);
    this.prepChecklistText = p?.checklist?.length ? p.checklist.join('\n') : '';
    this.prepNotes = p?.notes ?? '';
  }

  savePreparation(): void {
    if (this.prepSessionId == null) return;
    const checklist = this.prepChecklistText
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);
    this.preparationState.savePreparation(this.prepSessionId, checklist, this.prepNotes);
  }

  recordOutcome(): void {
    if (this.outcomeSessionId == null || !this.outcomeSummary.trim()) return;
    this.outcomesState.recordOutcome({
      sessionId: this.outcomeSessionId,
      result: this.outcomeResult,
      summary: this.outcomeSummary.trim(),
      nextSessionDate: this.outcomeNextDate ? new Date(this.outcomeNextDate) : undefined,
    });
    this.outcomeSummary = '';
    this.outcomeNextDate = '';
  }

  parseNotifyLevels(raw: string): number[] {
    return raw
      .split(/[,،\s]+/)
      .map(s => Number(s.trim()))
      .filter(n => Number.isFinite(n) && n > 0);
  }

  addDeadline(caseId: number): void {
    if (!this.deadlineTitle.trim() || !this.deadlineDue) return;
    const levels = this.parseNotifyLevels(this.deadlineNotifyLevels);
    this.deadlinesState.addDeadline({
      caseId,
      title: this.deadlineTitle.trim(),
      dueDate: new Date(this.deadlineDue),
      type: this.deadlineType,
      priority: this.deadlinePriority,
      notifiedLevels: levels.length ? levels : [7, 3, 1],
    });
    this.deadlineTitle = '';
    this.deadlineDue = '';
  }

  runDeadlineCheck(): void {
    this.deadlinesState.checkUpcomingDeadlines();
  }

  removeDeadline(id: number): void {
    this.deadlinesState.deleteDeadline(id);
  }

  /** Sessions persisted on the server (exclude optimistic rows for prep/outcome pickers). */
  confirmedSessions(sessions: Session[]): Session[] {
    return sessions.filter(s => s.id > 0);
  }

  sessionRowPending(
    pending: Record<number, string> | null | undefined,
    id: number
  ): string | null {
    const v = pending?.[id];
    return v ?? null;
  }

  isPrepSavePending(map: Record<number, true> | null | undefined, sessionId: number | null): boolean {
    return sessionId != null && !!map?.[sessionId];
  }

  isOutcomeRecordPending(map: Record<number, true> | null | undefined, sessionId: number | null): boolean {
    return sessionId != null && !!map?.[sessionId];
  }

  upcomingCount(sessions: Session[]): number {
    return sessions.filter(s => s.status === 'UPCOMING').length;
  }

  todaySessions(sessions: Session[]): Session[] {
    const t = new Date();
    const y = t.getFullYear();
    const m = t.getMonth();
    const d = t.getDate();
    return sessions.filter(s => {
      const x = new Date(s.date);
      return x.getFullYear() === y && x.getMonth() === m && x.getDate() === d && s.status === 'UPCOMING';
    });
  }
}
