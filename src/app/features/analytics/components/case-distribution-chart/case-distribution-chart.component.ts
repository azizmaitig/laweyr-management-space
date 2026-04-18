import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { CaseTypeSlice } from '../../models/analytics-view.model';

@Component({
  selector: 'app-case-distribution-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './case-distribution-chart.component.html',
  styleUrl: './case-distribution-chart.component.scss',
})
export class CaseDistributionChartComponent {
  @Input() slices: CaseTypeSlice[] = [];
}
