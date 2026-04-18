import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DataService } from '../../core/services/data.service';
import { EventService } from '../../core/services/event.service';
import { AppEventType } from '../../core/models/events.model';
import { WORKSPACE_QUERY } from '../../core/constants/workspace-query-params';
import { Client } from '../../core/models/lawyer.model';

@Component({
  selector: 'app-ea-clients',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="ea-clients">
      <div class="ea-clients__header">
        <div class="ea-clients__title-row">
          <div>
            <h2>👥 إدارة العملاء</h2>
            <p>إدارة بيانات الحرفاء وملفاتهم — مرتبطة بصفحة الملفات عبر التصفية والروابط</p>
          </div>
          <div class="ea-clients__header-actions">
            <span class="ea-clients__stat-pill" [attr.title]="'عرض الملفات مفلترة لكل عميل'">
              @if (searchQuery().trim()) {
                {{ filteredClients().length }} نتيجة من {{ totalClients() }}
              } @else {
                {{ totalClients() }} عميل
              }
            </span>
            <button type="button" class="btn btn--primary" (click)="openCreateClient()">عميل جديد</button>
            <a routerLink="/espace-avocat/cases" class="btn btn--outline">كل الملفات</a>
            <a routerLink="/espace-avocat/hearings" class="btn btn--outline">الجلسات</a>
            <a routerLink="/espace-avocat/finance" class="btn btn--outline">المالية</a>
          </div>
        </div>
      </div>
      <div class="search-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" [formControl]="searchControl" (input)="onSearch()" placeholder="بحث عن حريف..." class="search-box__input">
      </div>
      @if (filteredClients().length === 0) {
        <div class="ea-clients__empty">
          @if (searchQuery().trim()) {
            <p class="ea-clients__empty-title">لا يوجد عملاء يطابقون البحث</p>
            <p class="ea-clients__empty-hint">جرّب تغيير كلمات البحث أو امسح الحقل لعرض الكل.</p>
          } @else {
            <p class="ea-clients__empty-title">لا يوجد عملاء مسجّلون</p>
            <p class="ea-clients__empty-hint">ستظهر البيانات هنا عند إضافة عملاء أو ربط التطبيق بالخادم.</p>
          }
        </div>
      } @else {
        <div class="clients-grid">
          @for (client of filteredClients(); track client.id) {
            <div class="client-card">
              <div class="client-card__accent"></div>
              <div class="client-card__body">
                <div class="client-card__head">
                  <div class="client-card__avatar">{{ getInitials(client.name) }}</div>
                  <div class="client-card__info">
                    <h3>{{ client.name }}</h3>
                    <span class="client-card__sub">
                      @if (client.kind === 'NATURAL') {
                        {{ client.address || client.cin || '—' }}
                      } @else {
                        {{ client.address || client.taxId || client.vatNumber || '—' }}
                      }
                    </span>
                  </div>
                </div>
                <div class="client-card__badges">
                  <span class="pill" [class.pill--blue]="client.kind === 'NATURAL'" [class.pill--purple]="client.kind === 'LEGAL'">
                    {{ client.kind === 'NATURAL' ? 'شخص طبيعي' : 'شخص معنوي' }}
                  </span>
                  @if (client.kind === 'NATURAL' && client.cin) { <span class="pill pill--muted">CIN: {{ client.cin }}</span> }
                  @if (client.kind === 'LEGAL' && client.taxId) { <span class="pill pill--muted">MF: {{ client.taxId }}</span> }
                  @if (client.kind === 'LEGAL' && client.vatNumber) { <span class="pill pill--muted">TVA: {{ client.vatNumber }}</span> }
                </div>
                <div class="client-card__details">
                  <div class="client-card__detail"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg><span dir="ltr">{{ client.phone }}</span></div>
                  @if (client.email) { <div class="client-card__detail"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg><span dir="ltr">{{ client.email }}</span></div> }
                </div>
                <div class="client-card__cases">
                  <span class="client-card__cases-label">الملفات</span>
                  <div class="client-card__case-chips">
                    @if (client.cases && client.cases.length > 0) {
                      @for (case_ of client.cases; track case_.id) {
                        <a
                          [routerLink]="['/espace-avocat', 'cases']"
                          [queryParams]="caseDeepLink(case_.id)"
                          class="client-card__case-chip client-card__case-chip--link">{{ case_.number || case_.title }}</a>
                      }
                    } @else {
                      <span class="client-card__case-chip client-card__case-chip--muted">لا توجد ملفات</span>
                    }
                  </div>
                </div>
                <div class="client-card__actions">
                  <button type="button" class="client-card__btn client-card__btn--primary" (click)="goToClientCases(client)">عرض ملفات هذا العميل</button>
                  <button type="button" class="client-card__btn client-card__btn--ghost" (click)="openEditClient(client)">تعديل</button>
                  @if (client.cases && client.cases.length > 0) {
                    <a [routerLink]="['/espace-avocat', 'cases']" [queryParams]="caseDeepLink(client.cases[0].id)" class="client-card__btn client-card__btn--ghost">فتح أول ملف</a>
                  } @else {
                    <span class="client-card__btn client-card__btn--ghost client-card__btn--disabled" tabindex="-1">فتح أول ملف</span>
                  }
                  @if (client.cases && client.cases.length > 0) {
                    <a
                      [routerLink]="['/espace-avocat', 'hearings']"
                      [queryParams]="caseDeepLink(client.cases[0].id)"
                      class="client-card__btn client-card__btn--ghost"
                      >الجلسات</a
                    >
                  }
                  <a [routerLink]="['/espace-avocat', 'finance']" [queryParams]="financeClientLink(client.id)" class="client-card__btn client-card__btn--ghost">المالية</a>
                </div>
              </div>
            </div>
          }
        </div>
      }

      @if (showClientModal()) {
        <div class="modal-backdrop" role="dialog" aria-modal="true">
          <div class="modal" dir="rtl">
            <div class="modal__head">
              <h3>{{ editingClientId() ? 'تعديل العميل' : 'عميل جديد' }}</h3>
              <button type="button" class="modal__close" (click)="closeClientModal()">✕</button>
            </div>

            <div class="modal__body">
              @if (clientFormError()) {
                <div class="form-error">{{ clientFormError() }}</div>
              }

              <div class="form-grid">
                <label class="field">
                  <span>الاسم *</span>
                  <input class="input" [formControl]="nameControl" placeholder="اسم العميل" />
                </label>

                <label class="field">
                  <span>النوع *</span>
                  <select class="input" [formControl]="kindControl">
                    <option value="NATURAL">شخص طبيعي</option>
                    <option value="LEGAL">شخص معنوي</option>
                  </select>
                </label>

                @if (kindControl.value === 'NATURAL') {
                  <label class="field">
                    <span>CIN *</span>
                    <input class="input" [formControl]="cinControl" placeholder="رقم بطاقة التعريف" />
                  </label>
                } @else {
                  <label class="field">
                    <span>MF / Tax ID *</span>
                    <input class="input" [formControl]="taxIdControl" placeholder="Matricule fiscal" />
                  </label>
                  <label class="field">
                    <span>TVA</span>
                    <input class="input" [formControl]="vatNumberControl" placeholder="Numéro TVA" />
                  </label>
                }

                <label class="field field--full">
                  <span>العنوان *</span>
                  <input class="input" [formControl]="addressControl" placeholder="العنوان" />
                </label>

                <label class="field">
                  <span>الهاتف *</span>
                  <input class="input" [formControl]="phoneControl" placeholder="+216 ..." dir="ltr" />
                </label>

                <label class="field">
                  <span>البريد الإلكتروني</span>
                  <input class="input" [formControl]="emailControl" placeholder="email@example.com" dir="ltr" />
                </label>

                <label class="field field--full">
                  <span>ملاحظات</span>
                  <textarea class="input" rows="3" [formControl]="notesControl" placeholder="ملاحظات داخلية..."></textarea>
                </label>
              </div>
            </div>

            <div class="modal__foot">
              <button type="button" class="btn btn--outline" (click)="closeClientModal()">إلغاء</button>
              <button type="button" class="btn btn--primary" (click)="saveClientFromModal()">حفظ</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { --clr-bg: #f4f5f7; --clr-surface: #ffffff; --clr-border: #e8eaed; --clr-text: #1a1d23; --clr-text-secondary: #6b7280; --clr-text-muted: #9ca3af; --clr-teal: #0d9488; --clr-teal-light: #ccfbf1; --clr-brand: #ea3f48; --radius-sm: 8px; --radius-md: 12px; --radius-lg: 16px; --shadow-card: 0 1px 3px rgba(0,0,0,.04), 0 1px 2px rgba(0,0,0,.06); --shadow-card-hover: 0 8px 24px rgba(0,0,0,.08); --transition: .25s cubic-bezier(.4,0,.2,1); }
    .ea-clients { font-family: 'Cairo', system-ui, sans-serif; color: var(--clr-text); }
    .ea-clients__header { margin-bottom: 1.25rem; }
    .ea-clients__title-row { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 1rem; }
    .ea-clients__header h2 { font-size: 1.25rem; font-weight: 800; margin: 0; }
    .ea-clients__header p { font-size: .78rem; color: var(--clr-text-muted); margin: .15rem 0 0; max-width: 36rem; line-height: 1.45; }
    .ea-clients__header-actions { display: flex; flex-wrap: wrap; align-items: center; gap: .5rem; }
    .ea-clients__stat-pill { font-size: .72rem; font-weight: 700; padding: .35rem .65rem; border-radius: 999px; background: var(--clr-teal-light); color: var(--clr-teal); }
    .btn { display: inline-flex; align-items: center; justify-content: center; gap: .35rem; padding: .45rem .85rem; border-radius: var(--radius-sm); font-family: inherit; font-size: .78rem; font-weight: 600; text-decoration: none; cursor: pointer; transition: all var(--transition); border: none; }
    .btn--outline { background: var(--clr-surface); border: 1.5px solid var(--clr-border); color: var(--clr-text-secondary); }
    .btn--outline:hover { border-color: var(--clr-brand); color: var(--clr-brand); }
    .btn--primary { background: var(--clr-brand); color: #fff; border: 1.5px solid var(--clr-brand); }
    .btn--primary:hover { filter: brightness(1.05); }
    .search-box { position: relative; max-width: 320px; margin-bottom: 1.25rem; }
    .search-box svg { position: absolute; right: .75rem; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: var(--clr-text-muted); pointer-events: none; }
    .search-box__input { width: 100%; padding: .55rem .75rem .55rem 2.25rem; border: 1.5px solid var(--clr-border); border-radius: var(--radius-sm); font-family: inherit; font-size: .82rem; background: var(--clr-surface); color: var(--clr-text); outline: none; transition: border-color var(--transition); }
    .search-box__input:focus { border-color: #ea3f48; }
    .search-box__input::placeholder { color: var(--clr-text-muted); }
    .clients-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; }
    .client-card { position: relative; background: var(--clr-surface); border: 1px solid var(--clr-border); border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow-card); transition: all var(--transition); }
    .client-card:hover { box-shadow: var(--shadow-card-hover); transform: translateY(-3px); }
    .client-card__accent { height: 3px; background: linear-gradient(90deg, var(--clr-teal), #14b8a6); }
    .client-card__body { padding: 1.1rem; }
    .client-card__head { display: flex; align-items: center; gap: .65rem; margin-bottom: .75rem; }
    .client-card__avatar { width: 42px; height: 42px; border-radius: var(--radius-sm); background: linear-gradient(135deg, var(--clr-teal), #14b8a6); color: white; display: flex; align-items: center; justify-content: center; font-size: .8rem; font-weight: 800; flex-shrink: 0; }
    .client-card__info h3 { font-size: .9rem; font-weight: 700; margin: 0; }
    .client-card__sub { font-size: .7rem; color: var(--clr-text-muted); }
    .client-card__details { display: flex; flex-direction: column; gap: .4rem; margin-bottom: .65rem; }
    .client-card__badges { display: flex; flex-wrap: wrap; gap: .35rem; margin: .2rem 0 .55rem; }
    .pill { font-size: .62rem; font-weight: 800; padding: .12rem .4rem; border-radius: 999px; border: 1px solid var(--clr-border); background: #fff; color: var(--clr-text-secondary); }
    .pill--muted { background: #f3f4f6; }
    .pill--blue { background: #eff6ff; border-color: #bfdbfe; color: #1d4ed8; }
    .pill--purple { background: #faf5ff; border-color: #e9d5ff; color: #6d28d9; }
    .client-card__detail { display: flex; align-items: center; gap: .45rem; font-size: .78rem; color: var(--clr-text-secondary); }
    .client-card__detail svg { width: 14px; height: 14px; color: var(--clr-teal); flex-shrink: 0; }
    .client-card__cases { border-top: 1px solid var(--clr-border); padding-top: .6rem; }
    .client-card__cases-label { font-size: .68rem; font-weight: 600; color: var(--clr-text-muted); }
    .client-card__case-chips { display: flex; flex-wrap: wrap; gap: .3rem; margin-top: .3rem; }
    .client-card__case-chip { font-size: .65rem; font-weight: 600; background: var(--clr-teal-light); color: var(--clr-teal); padding: .12rem .4rem; border-radius: 5px; }
    .client-card__case-chip--muted { background: #f3f4f6; color: var(--clr-text-muted); }
    .client-card__case-chip--link { text-decoration: none; cursor: pointer; transition: opacity var(--transition), transform var(--transition); border: none; }
    .client-card__case-chip--link:hover { opacity: .88; transform: translateY(-1px); }
    .client-card__actions { display: flex; flex-wrap: wrap; gap: .4rem; margin-top: .75rem; padding-top: .65rem; border-top: 1px solid var(--clr-border); }
    .client-card__btn { flex: 1; min-width: 0; padding: .4rem .55rem; border-radius: var(--radius-sm); font-family: inherit; font-size: .72rem; font-weight: 700; text-align: center; text-decoration: none; cursor: pointer; transition: all var(--transition); border: 1.5px solid transparent; }
    .client-card__btn--primary { background: var(--clr-brand); color: white; border-color: var(--clr-brand); }
    .client-card__btn--primary:hover { filter: brightness(1.05); }
    .client-card__btn--ghost { background: transparent; color: var(--clr-teal); border-color: var(--clr-teal-light); }
    .client-card__btn--ghost:hover { background: var(--clr-teal-light); }
    .client-card__btn--disabled { pointer-events: none; opacity: .45; }
    .ea-clients__empty { text-align: center; padding: 2.5rem 1rem; background: var(--clr-surface); border: 1px dashed var(--clr-border); border-radius: var(--radius-md); }
    .ea-clients__empty-title { margin: 0; font-size: .95rem; font-weight: 700; color: var(--clr-text); }
    .ea-clients__empty-hint { margin: .5rem 0 0; font-size: .8rem; color: var(--clr-text-muted); }
    @media (max-width: 640px) { .clients-grid { grid-template-columns: 1fr; } .ea-clients__title-row { flex-direction: column; } }

    /* Modal */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.35); display: flex; align-items: center; justify-content: center; padding: 1rem; z-index: 50; }
    .modal { width: min(760px, 100%); background: #fff; border-radius: 14px; border: 1px solid var(--clr-border); box-shadow: 0 18px 60px rgba(0,0,0,.18); overflow: hidden; }
    .modal__head { display: flex; align-items: center; justify-content: space-between; padding: .85rem 1rem; border-bottom: 1px solid var(--clr-border); background: #fbfbfc; }
    .modal__head h3 { margin: 0; font-size: .95rem; font-weight: 900; }
    .modal__close { width: 32px; height: 32px; border: none; background: transparent; cursor: pointer; border-radius: 8px; color: var(--clr-text-muted); }
    .modal__close:hover { background: #f3f4f6; color: var(--clr-text); }
    .modal__body { padding: 1rem; }
    .modal__foot { display: flex; justify-content: flex-end; gap: .5rem; padding: .85rem 1rem; border-top: 1px solid var(--clr-border); background: #fbfbfc; }

    .form-error { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; padding: .6rem .75rem; border-radius: 10px; font-size: .78rem; margin-bottom: .75rem; }
    .form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: .75rem; }
    .field { display: flex; flex-direction: column; gap: .35rem; font-size: .72rem; color: var(--clr-text-secondary); }
    .field--full { grid-column: 1 / -1; }
    .input { width: 100%; padding: .55rem .7rem; border-radius: 10px; border: 1.5px solid var(--clr-border); outline: none; font-family: inherit; font-size: .82rem; }
    .input:focus { border-color: var(--clr-brand); }
    textarea.input { resize: vertical; }
    @media (max-width: 640px) { .form-grid { grid-template-columns: 1fr; } }
  `],
})
export class EAClientsPage {
  private data = inject(DataService);
  private router = inject(Router);
  private events = inject(EventService);
  searchControl = new FormControl('');
  searchQuery = signal('');
  /** Clients merged with related cases from `getCases()` (mock `clients` entries do not embed `cases`). */
  private clientsWithCases = computed((): Client[] => {
    const cases = this.data.getCases();
    return this.data.getClients().map(c => ({
      ...c,
      cases: cases.filter(k => k.clientId === c.id),
    }));
  });
  readonly totalClients = computed(() => this.clientsWithCases().length);
  filteredClients = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const list = this.clientsWithCases();
    if (!query) return list;
    return list.filter(
      c =>
        c.name.toLowerCase().includes(query) ||
        (c.email || '').toLowerCase().includes(query) ||
        (c.phone || '').includes(query) ||
        (c.address || '').toLowerCase().includes(query) ||
        (c.cin || '').includes(query) ||
        (c.taxId || '').toLowerCase().includes(query) ||
        (c.vatNumber || '').toLowerCase().includes(query)
    );
  });
  onSearch() { this.searchQuery.set(this.searchControl.value || ''); }
  getInitials(name: string): string { return name.split(' ').map(n => n[0]).join('').substring(0, 2); }

  caseDeepLink(caseId: number): Record<string, number> {
    return { [WORKSPACE_QUERY.CASE_ID]: caseId };
  }

  financeClientLink(clientId: number): Record<string, number> {
    return { [WORKSPACE_QUERY.CLIENT_ID]: clientId };
  }

  /** يوجّه إلى إدارة الملفات مع `clientId` ويُبلغ الحافلة للمزامنة مع ميزات أخرى لاحقاً. */
  goToClientCases(client: Client): void {
    this.events.emit(AppEventType.CLIENT_WORKSPACE_FOCUS, { clientId: client.id, clientName: client.name });
    void this.router.navigate(['/espace-avocat', 'cases'], {
      queryParams: { [WORKSPACE_QUERY.CLIENT_ID]: client.id },
    });
  }

  // Create/Edit modal state
  showClientModal = signal(false);
  editingClientId = signal<number | null>(null);
  clientFormError = signal<string | null>(null);

  nameControl = new FormControl<string>('', { nonNullable: true });
  kindControl = new FormControl<'NATURAL' | 'LEGAL'>('NATURAL', { nonNullable: true });
  cinControl = new FormControl<string>('', { nonNullable: true });
  taxIdControl = new FormControl<string>('', { nonNullable: true });
  vatNumberControl = new FormControl<string>('', { nonNullable: true });
  addressControl = new FormControl<string>('', { nonNullable: true });
  phoneControl = new FormControl<string>('', { nonNullable: true });
  emailControl = new FormControl<string>('', { nonNullable: true });
  notesControl = new FormControl<string>('', { nonNullable: true });

  openCreateClient(): void {
    this.editingClientId.set(null);
    this.clientFormError.set(null);
    this.nameControl.setValue('');
    this.kindControl.setValue('NATURAL');
    this.cinControl.setValue('');
    this.taxIdControl.setValue('');
    this.vatNumberControl.setValue('');
    this.addressControl.setValue('');
    this.phoneControl.setValue('');
    this.emailControl.setValue('');
    this.notesControl.setValue('');
    this.showClientModal.set(true);
  }

  openEditClient(client: Client): void {
    this.editingClientId.set(client.id);
    this.clientFormError.set(null);
    this.nameControl.setValue(client.name ?? '');
    this.kindControl.setValue(client.kind ?? 'NATURAL');
    this.cinControl.setValue(client.cin ?? '');
    this.taxIdControl.setValue(client.taxId ?? '');
    this.vatNumberControl.setValue(client.vatNumber ?? '');
    this.addressControl.setValue(client.address ?? '');
    this.phoneControl.setValue(client.phone ?? '');
    this.emailControl.setValue(client.email ?? '');
    this.notesControl.setValue(client.notes ?? '');
    this.showClientModal.set(true);
  }

  closeClientModal(): void {
    this.showClientModal.set(false);
    this.editingClientId.set(null);
    this.clientFormError.set(null);
  }

  private validateClientModal(): string | null {
    const name = this.nameControl.value.trim();
    const address = this.addressControl.value.trim();
    const phone = this.phoneControl.value.trim();
    const kind = this.kindControl.value;
    const email = this.emailControl.value.trim();

    if (!name) return 'الاسم مطلوب.';
    if (!address) return 'العنوان مطلوب.';
    if (!phone) return 'الهاتف مطلوب.';
    if (email && !email.includes('@')) return 'البريد الإلكتروني غير صالح.';

    if (kind === 'NATURAL') {
      const cin = this.cinControl.value.trim();
      if (!cin) return 'CIN مطلوب للشخص الطبيعي.';
      if (!/^\d{6,12}$/.test(cin)) return 'CIN يجب أن يكون أرقاماً (6–12).';
    } else {
      const taxId = this.taxIdControl.value.trim();
      if (!taxId) return 'MF / Tax ID مطلوب للشخص المعنوي.';
    }
    return null;
  }

  saveClientFromModal(): void {
    const err = this.validateClientModal();
    if (err) {
      this.clientFormError.set(err);
      return;
    }

    const kind = this.kindControl.value;
    const base = {
      name: this.nameControl.value.trim(),
      kind,
      address: this.addressControl.value.trim(),
      phone: this.phoneControl.value.trim(),
      email: this.emailControl.value.trim(),
      notes: this.notesControl.value.trim() || undefined,
    };

    const identity =
      kind === 'NATURAL'
        ? { cin: this.cinControl.value.trim(), taxId: undefined, vatNumber: undefined }
        : { cin: undefined, taxId: this.taxIdControl.value.trim(), vatNumber: this.vatNumberControl.value.trim() || undefined };

    const id = this.editingClientId();
    if (id) {
      this.data.updateClient(id, { ...base, ...identity });
    } else {
      this.data.addClient({ ...base, ...identity });
    }

    this.closeClientModal();
  }
}
