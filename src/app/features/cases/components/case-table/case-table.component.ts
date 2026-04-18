import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Case } from '../../../../core/models';

@Component({
  selector: 'app-case-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="case-table-wrap">
      <table class="case-table">
        <thead>
          <tr>
            <th>رقم الملف</th>
            <th>الحريف</th>
            <th>النوع</th>
            <th>المحكمة</th>
            <th>الحالة</th>
            <th>التقدم</th>
            <th>الجلسة القادمة</th>
            <th>الأتعاب</th>
            <th>إجراءات</th>
          </tr>
        </thead>
        <tbody>
          @for (case_ of cases(); track case_.id) {
            <tr (click)="caseSelected.emit(case_)" (keydown)="onRowKeydown($event, case_)" class="case-table__row" role="button" tabindex="0" [attr.aria-label]="'فتح الملف: ' + case_.number + ' - ' + case_.clientName">
              <td class="case-table__num">{{ case_.number }}</td>
              <td class="case-table__client">{{ case_.clientName }}</td>
              <td><span class="type-badge" [class]="'type-badge--' + case_.type" [attr.aria-label]="'النوع: ' + typeLabels[case_.type]">{{ typeLabels[case_.type] }}</span></td>
              <td class="case-table__court">{{ case_.court }}</td>
              <td><span class="status-badge" [class]="'status-badge--' + case_.status" [attr.aria-label]="'الحالة: ' + statusLabels[case_.status]">{{ statusLabels[case_.status] }}</span></td>
              <td>
                <div class="progress-cell" role="progressbar" [attr.aria-valuenow]="case_.progress" aria-valuemin="0" aria-valuemax="100" [attr.aria-label]="'التقدم: ' + case_.progress + '%'">
                  <div class="progress-track"><div class="progress-fill" [style.width.%]="case_.progress"></div></div>
                  <span class="progress-pct">{{ case_.progress }}%</span>
                </div>
              </td>
              <td class="case-table__date">{{ case_.hearingDate || '—' }}</td>
              <td class="case-table__fees">{{ case_.fees | number:'1.0-0' }} <small>د.ت</small></td>
              <td class="case-table__actions">
                <button class="action-btn" (click)="editRequested.emit(case_); $event.stopPropagation()" [attr.aria-label]="'تعديل الملف ' + case_.number">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button class="action-btn action-btn--delete" (click)="deleteRequested.emit(case_.id); $event.stopPropagation()" [attr.aria-label]="'حذف الملف ' + case_.number">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .case-table-wrap { background: var(--clr-white); border: 1px solid var(--clr-border); border-radius: var(--radius-2xl); box-shadow: var(--shadow-sm); overflow: hidden; }
    .case-table { width: 100%; border-collapse: collapse; }
    .case-table thead { background: var(--clr-secondary-light); }
    .case-table th { padding: var(--space-3) var(--space-4); font-size: var(--text-sm); font-weight: var(--font-bold); color: var(--clr-text-muted); text-align: right; text-transform: uppercase; letter-spacing: .3px; white-space: nowrap; }
    .case-table__row { border-bottom: 1px solid var(--clr-border); cursor: pointer; transition: background var(--transition); }
    .case-table__row:hover { background: var(--clr-secondary-light); }
    .case-table__row:focus-visible { outline: 2px solid var(--clr-primary); outline-offset: -2px; }
    .case-table__row:last-child { border-bottom: none; }
    .case-table td { padding: var(--space-3) var(--space-4); font-size: var(--text-base); vertical-align: middle; }
    .case-table__num { font-family: 'SF Mono', 'Fira Code', monospace; font-weight: var(--font-bold); font-size: var(--text-base); color: var(--clr-secondary); }
    .case-table__client { font-weight: var(--font-semibold); }
    .case-table__court { font-size: var(--text-base); color: var(--clr-text-secondary); max-width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .case-table__date { font-size: var(--text-base); font-family: 'SF Mono', 'Fira Code', monospace; color: var(--clr-text-muted); }
    .case-table__fees { font-weight: var(--font-bold); white-space: nowrap; }
    .case-table__fees small { font-size: var(--text-xs); color: var(--clr-text-muted); font-weight: var(--font-medium); }
    .case-table__actions { display: flex; gap: var(--space-1); justify-content: center; }
    .action-btn { width: 28px; height: 28px; border-radius: var(--radius-sm); border: none; background: transparent; color: var(--clr-text-muted); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all var(--transition-fast); }
    .action-btn:hover { background: var(--clr-secondary-light); color: var(--clr-secondary); }
    .action-btn:focus-visible { outline: 2px solid var(--clr-primary); outline-offset: 2px; }
    .action-btn--delete:hover { background: var(--clr-primary-light); color: var(--clr-error); }
    .action-btn svg { width: 14px; height: 14px; }
    .type-badge { font-size: var(--text-xs); font-weight: var(--font-bold); padding: var(--space-1) var(--space-2); border-radius: var(--radius-sm); white-space: nowrap; }
    .type-badge--commercial { background: var(--clr-accent-blue-light); color: var(--clr-accent-blue); }
    .type-badge--family { background: var(--clr-accent-amber-light); color: var(--clr-accent-amber); }
    .type-badge--penal { background: var(--clr-primary-light); color: var(--clr-error); }
    .type-badge--civil { background: var(--clr-accent-green-light); color: var(--clr-accent-green); }
    .type-badge--administrative { background: var(--clr-accent-purple-light); color: var(--clr-accent-purple); }
    .status-badge { font-size: var(--text-xs); font-weight: var(--font-bold); padding: var(--space-1) var(--space-2); border-radius: var(--radius-sm); white-space: nowrap; }
    .status-badge--active { background: var(--clr-accent-green-light); color: var(--clr-accent-green); }
    .status-badge--pending { background: var(--clr-accent-amber-light); color: var(--clr-accent-amber); }
    .status-badge--urgent { background: var(--clr-primary-light); color: var(--clr-error); }
    .status-badge--closed { background: var(--clr-secondary-light); color: var(--clr-text-secondary); }
    .progress-cell { display: flex; align-items: center; gap: var(--space-2); min-width: 90px; }
    .progress-track { flex: 1; height: 4px; background: var(--clr-secondary-light); border-radius: var(--radius-sm); overflow: hidden; }
    .progress-fill { height: 100%; background: linear-gradient(90deg, var(--clr-accent-green), var(--clr-accent-blue)); border-radius: var(--radius-sm); }
    .progress-pct { font-size: var(--text-xs); font-weight: var(--font-bold); color: var(--clr-text-muted); min-width: 28px; }

    /* Tablet */
    @media (max-width: 1023px) {
      .case-table th, .case-table td { padding: var(--space-2) var(--space-3); }
      .case-table__court { max-width: 100px; }
    }

    /* Mobile */
    @media (max-width: 767px) {
      .case-table-wrap { border-radius: var(--radius-lg); overflow-x: auto; }
      .case-table { min-width: 800px; }
      .case-table th, .case-table td { padding: var(--space-2); font-size: var(--text-sm); }
      .case-table__num { font-size: var(--text-sm); }
      .case-table__court { max-width: 80px; }
    }
  `],
})
export class CaseTableComponent {
  cases = input.required<Case[]>();
  typeLabels: Record<string, string> = { commercial: 'تجاري', family: 'عائلي', penal: 'جزائي', civil: 'مدني', administrative: 'إداري' };
  statusLabels: Record<string, string> = { active: 'نشط', pending: 'معلق', urgent: 'عاجل', closed: 'منجز' };
  caseSelected = output<Case>();
  editRequested = output<Case>();
  deleteRequested = output<number>();

  onRowKeydown(event: KeyboardEvent, case_: Case) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.caseSelected.emit(case_);
    }
  }
}
