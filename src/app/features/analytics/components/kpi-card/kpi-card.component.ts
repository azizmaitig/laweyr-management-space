import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type KpiCardVariant = 'teal' | 'green' | 'blue' | 'amber' | 'indigo';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kpi-card.component.html',
  styleUrl: './kpi-card.component.scss',
})
export class KpiCardComponent {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) value!: string | number | null;
  @Input() suffix = '';
  @Input() variant: KpiCardVariant = 'teal';
}
