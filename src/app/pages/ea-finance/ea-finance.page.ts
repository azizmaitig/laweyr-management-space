import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FinancialBillingComponent } from '../../features/financial/components/financial-billing/financial-billing.component';
import { DataService } from '../../core/services/data.service';
import { WORKSPACE_QUERY } from '../../core/constants/workspace-query-params';

/**
 * Host for المالية: reads `WORKSPACE_QUERY` deep links, passes client filter into billing,
 * and shows mock honoraires from {@link DataService} filtered like cases search.
 */
@Component({
  selector: 'app-ea-finance',
  standalone: true,
  imports: [CommonModule, FinancialBillingComponent, RouterLink],
  template: `
    <div class="ea-finance-wrap" dir="rtl">
      @if (clientFilterName()) {
        <div class="ea-finance-banner">
          <span>التصفية حسب العميل: <strong>{{ clientFilterName() }}</strong></span>
          <a routerLink="/espace-avocat/finance" class="ea-finance-banner__clear">عرض الكل</a>
        </div>
      }
      <app-financial-billing [filterClientName]="clientFilterName()" />

      @if (honorairesView().length > 0) {
        <section class="ea-finance-honoraires" aria-label="ملخص أتعاب تجريبي">
          <h3 class="ea-finance-honoraires__title">
            @if (clientFilterName()) {
              أتعاب العميل (تجريبي)
            } @else {
              ملخص الأتعاب (تجريبي — DataService)
            }
          </h3>
          <p class="ea-finance-honoraires__hint">
            روابط مستقرة مع الخادم: <code>?{{ w.CLIENT_ID }}=</code> أو
            <code>?{{ w.CLIENT_NAME }}=</code> (اسم مطابق لسجل الأتعاب)
          </p>
          <div class="ea-finance-honoraires__list">
            @for (h of honorairesView(); track h.id) {
              <div class="ea-finance-honoraires__row">
                <div>
                  <strong>{{ h.client }}</strong>
                  <span class="ea-finance-honoraires__case">{{ h.case }}</span>
                </div>
                <div class="ea-finance-honoraires__nums">
                  <span>الإجمالي: {{ h.total | number: '1.0-0' }} د.ت</span>
                  <span>المدفوع: {{ h.paid | number: '1.0-0' }} د.ت</span>
                </div>
              </div>
            }
          </div>
        </section>
      }
    </div>
  `,
  styles: [`
    .ea-finance-wrap { font-family: 'Cairo', system-ui, sans-serif; max-width: 1200px; margin: 0 auto; padding: 0 0 1.5rem; }
    .ea-finance-banner { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: .5rem; padding: .65rem 1rem; margin-bottom: .75rem; background: #ecfdf5; border: 1px solid #99f6e4; border-radius: 10px; font-size: .82rem; }
    .ea-finance-banner__clear { color: #0f766e; font-weight: 700; text-decoration: none; }
    .ea-finance-banner__clear:hover { text-decoration: underline; }
    .ea-finance-honoraires { margin-top: 1.25rem; padding: 1rem 1.1rem; background: #fff; border: 1px solid #e8eaed; border-radius: 12px; }
    .ea-finance-honoraires__title { margin: 0 0 .35rem; font-size: .95rem; font-weight: 800; }
    .ea-finance-honoraires__hint { margin: 0 0 .75rem; font-size: .72rem; color: #6b7280; }
    .ea-finance-honoraires__row { display: flex; flex-wrap: wrap; justify-content: space-between; gap: .5rem; padding: .6rem 0; border-bottom: 1px solid #f3f4f6; font-size: .8rem; }
    .ea-finance-honoraires__row:last-child { border-bottom: none; }
    .ea-finance-honoraires__case { display: block; font-size: .72rem; color: #9ca3af; margin-top: .15rem; }
    .ea-finance-honoraires__nums { display: flex; flex-direction: column; gap: .15rem; text-align: left; }
  `],
})
export class EAFinancePage {
  private route = inject(ActivatedRoute);
  private data = inject(DataService);
  protected readonly w = WORKSPACE_QUERY;

  readonly clientFilterName = signal<string | null>(null);

  readonly honorairesView = computed(() => {
    const name = this.clientFilterName();
    const all = this.data.getHonoraires();
    if (!name) return all;
    return all.filter(h => h.client === name);
  });

  constructor() {
    const destroyRef = inject(DestroyRef);
    this.route.queryParamMap.pipe(takeUntilDestroyed(destroyRef)).subscribe(q => {
      const idStr = q.get(WORKSPACE_QUERY.CLIENT_ID);
      const clientParam = q.get(WORKSPACE_QUERY.CLIENT_NAME);
      let name: string | null = null;
      if (idStr) {
        const id = parseInt(idStr, 10);
        if (!Number.isNaN(id)) {
          const cl = this.data.getClients().find(c => c.id === id);
          name = cl?.name ?? null;
        }
      }
      if (!name && clientParam?.trim()) {
        try {
          name = decodeURIComponent(clientParam.trim());
        } catch {
          name = clientParam.trim();
        }
      }
      this.clientFilterName.set(name);
    });
  }
}
