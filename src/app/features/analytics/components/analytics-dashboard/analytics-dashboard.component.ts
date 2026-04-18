import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { combineLatest, distinctUntilChanged, map, take } from 'rxjs';
import { AppEventType } from '../../../../core/models/events.model';
import { WORKSPACE_QUERY } from '../../../../core/constants/workspace-query-params';
import { EventService } from '../../../../core/services/event.service';
import { CasesStateService } from '../../../cases/services/cases-state.service';
import { TimelineStateService } from '../../../timeline/services/timeline-state.service';
import { AnalyticsStateService } from '../../services/analytics-state.service';
import { ChartContainerComponent } from '../chart-container/chart-container.component';
import { CaseDistributionChartComponent } from '../case-distribution-chart/case-distribution-chart.component';
import { ExportPanelComponent } from '../export-panel/export-panel.component';
import { KpiCardComponent } from '../kpi-card/kpi-card.component';
import { RevenueChartComponent } from '../revenue-chart/revenue-chart.component';

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    KpiCardComponent,
    ChartContainerComponent,
    RevenueChartComponent,
    CaseDistributionChartComponent,
    ExportPanelComponent,
  ],
  templateUrl: './analytics-dashboard.component.html',
  styleUrl: './analytics-dashboard.component.scss',
})
export class AnalyticsDashboardComponent implements OnInit {
  private readonly analytics = inject(AnalyticsStateService);
  private readonly casesState = inject(CasesStateService);
  private readonly timelineState = inject(TimelineStateService);
  private readonly events = inject(EventService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly w = WORKSPACE_QUERY;

  /** Bound in template with `async` (no API calls here). */
  readonly globalAnalytics$ = this.analytics.globalAnalytics$;
  readonly financialAnalytics$ = this.analytics.financialAnalytics$;
  readonly caseAnalytics$ = this.analytics.caseAnalytics$;

  /** Same source as `CASE_SELECTED` / workspace selection — drives export panel. */
  readonly selectedCaseId$ = this.casesState.selectSelectedCase().pipe(map(c => c?.id ?? null));

  ngOnInit(): void {
    this.casesState
      .selectCases()
      .pipe(take(1))
      .subscribe(cases => {
        if (cases.length === 0) this.casesState.loadCases();
      });

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

    combineLatest([this.route.queryParams, this.casesState.selectSelectedCase()])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([params, selected]) => {
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

    this.casesState
      .selectSelectedCase()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        distinctUntilChanged((a, b) => a?.id === b?.id),
        map(c => c?.id ?? null)
      )
      .subscribe(caseId => {
        if (caseId != null) {
          this.timelineState.loadTimeline(caseId);
        }
      });
  }

  caseDeepLinkParams(caseId: number): Record<string, number> {
    return { [WORKSPACE_QUERY.CASE_ID]: caseId };
  }

  clearSelectedCase(): void {
    this.casesState.clearSelection();
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { [WORKSPACE_QUERY.CASE_ID]: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  archiveCase(caseId: number): void {
    this.casesState.updateCase(caseId, { status: 'closed' });
    this.events.emit(AppEventType.ANALYTICS_UPDATED);
  }

  refreshAnalytics(): void {
    this.events.emit(AppEventType.ANALYTICS_UPDATED);
  }
}
