import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-revenue-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './revenue-chart.component.html',
  styleUrl: './revenue-chart.component.scss',
})
export class RevenueChartComponent {
  /** Revenue series (monthly or yearly bars). */
  @Input() series: { label: string; amount: number }[] = [];

  max(): number {
    const m = Math.max(0, ...this.series.map(p => p.amount));
    return m > 0 ? m : 1;
  }
}
