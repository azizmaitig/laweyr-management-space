import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyticsDashboardComponent } from '../../features/analytics/components/analytics-dashboard/analytics-dashboard.component';

@Component({
  selector: 'app-ea-stats',
  standalone: true,
  imports: [CommonModule, AnalyticsDashboardComponent],
  template: `
    <div class="ea-stats-page">
      <app-analytics-dashboard />
    </div>
  `,
  styles: [
    `
      /* Padding comes from EspaceAvocatShellPage .ea-content — avoid double gutters. */
      .ea-stats-page {
        min-height: 100%;
      }
    `,
  ],
})
export class EAStatsPage {}
