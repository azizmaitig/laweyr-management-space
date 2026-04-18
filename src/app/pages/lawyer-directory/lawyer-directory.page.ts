import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { DataService } from '../../core/services/data.service';
import { TranslationService } from '../../core/services/translation.service';
import { Lawyer } from '../../core/models/lawyer.model';

@Component({
  selector: 'app-lawyer-directory',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatPaginatorModule],
  template: `
    <div class="directory-page">

      <!-- ════════════════════════════════════════════ -->
      <!-- PAGE HEADER                                    -->
      <!-- ════════════════════════════════════════════ -->
      <section class="page-header">
        <div class="page-header__pattern"></div>
        <div class="page-header__content">
          <h1>دليل المحامين</h1>
          <p>ابحثوا عن محامٍ بالاسم أو التخصص أو الولاية</p>
        </div>
      </section>

      <!-- ════════════════════════════════════════════ -->
      <!-- SEARCH & FILTERS                               -->
      <!-- ════════════════════════════════════════════ -->
      <section class="filters">
        <div class="filters__inner">
          <div class="search-box">
            <svg class="search-box__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              type="text"
              [formControl]="searchControl"
              (input)="onSearch()"
              placeholder="بحث بالاسم أو التخصص..."
              class="search-box__input">
          </div>
          <div class="filters__selects">
            <div class="select-wrap">
              <select [formControl]="specialtyControl" (change)="onFilter()" class="select">
                <option value="">جميع التخصصات</option>
                @for (spec of specialties(); track spec) {
                  <option [value]="spec">{{ spec }}</option>
                }
              </select>
            </div>
            <div class="select-wrap">
              <select [formControl]="governorateControl" (change)="onFilter()" class="select">
                <option value="">جميع الولايات</option>
                @for (gov of governorates(); track gov) {
                  <option [value]="gov">{{ gov }}</option>
                }
              </select>
            </div>
          </div>
        </div>
      </section>

      <!-- ════════════════════════════════════════════ -->
      <!-- RESULTS                                        -->
      <!-- ════════════════════════════════════════════ -->
      <section class="results">
        <div class="results__inner">
          @if (filteredLawyers().length === 0) {
            <div class="empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="17" y1="11" x2="23" y2="11"/></svg>
              <p>لم يتم العثور على محامين</p>
            </div>
          } @else {
            <div class="results__count">
              <span>{{ filteredLawyers().length }}</span> محامٍ
            </div>
            <div class="lawyers-grid">
              @for (lawyer of paginatedLawyers(); track lawyer.id) {
                <div class="lawyer-card">
                  <div class="lawyer-card__accent"></div>
                  <div class="lawyer-card__body">
                    <div class="lawyer-card__head">
                      <div class="lawyer-card__avatar">
                        {{ getInitials(lawyer.name) }}
                      </div>
                      <div class="lawyer-card__info">
                        <h3>{{ lawyer.name }}</h3>
                        <span class="lawyer-card__mat">{{ lawyer.matricule }}</span>
                      </div>
                    </div>
                    <div class="lawyer-card__details">
                      <div class="lawyer-card__detail">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                        <span>{{ lawyer.speciality }}</span>
                      </div>
                      <div class="lawyer-card__detail">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        <span>{{ lawyer.address }}</span>
                      </div>
                      <div class="lawyer-card__detail">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                        <span dir="ltr">{{ lawyer.phone }}</span>
                      </div>
                      <div class="lawyer-card__detail">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                        <span>{{ lawyer.governorate }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              }
            </div>

            <mat-paginator
              [length]="filteredLawyers().length"
              [pageSize]="pageSize"
              [pageSizeOptions]="[4, 8, 12]"
              (page)="onPageChange($event)"
              class="directory-paginator">
            </mat-paginator>
          }
        </div>
      </section>

    </div>
  `,
  styles: [`
    :host {
      --clr-bg: #f4f5f7;
      --clr-surface: #ffffff;
      --clr-border: #e8eaed;
      --clr-text: #1a1d23;
      --clr-text-secondary: #6b7280;
      --clr-text-muted: #9ca3af;
      --clr-brand: #ea3f48;
      --clr-brand-dark: #0f2d5e;
      --clr-teal: #0d9488;
      --radius-sm: 8px;
      --radius-md: 12px;
      --radius-lg: 16px;
      --radius-xl: 20px;
      --shadow-card: 0 1px 3px rgba(0,0,0,.04), 0 1px 2px rgba(0,0,0,.06);
      --shadow-card-hover: 0 8px 24px rgba(0,0,0,.08), 0 4px 8px rgba(0,0,0,.04);
      --transition: .25s cubic-bezier(.4,0,.2,1);
    }

    .directory-page {
      font-family: 'Cairo', system-ui, -apple-system, sans-serif;
      color: var(--clr-text);
      background: var(--clr-bg);
      direction: rtl;
    }

    /* ═══════════════════════════════════════════════
       PAGE HEADER
       ═══════════════════════════════════════════════ */
    .page-header {
      position: relative;
      background: linear-gradient(135deg, #0f2d5e 0%, #1a3a6e 50%, #ea3f48 100%);
      padding: 3rem 1.5rem;
      text-align: center;
      color: white;
      overflow: hidden;
    }
    .page-header__pattern {
      position: absolute;
      inset: 0;
      background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
      pointer-events: none;
    }
    .page-header__content {
      position: relative;
      z-index: 1;
    }
    .page-header h1 {
      font-size: 2rem;
      font-weight: 800;
      margin: 0 0 .5rem;
    }
    .page-header p {
      font-size: 1rem;
      opacity: .8;
      margin: 0;
    }

    /* ═══════════════════════════════════════════════
       FILTERS
       ═══════════════════════════════════════════════ */
    .filters {
      background: var(--clr-surface);
      border-bottom: 1px solid var(--clr-border);
      padding: 1.25rem 1.5rem;
    }
    .filters__inner {
      max-width: 1100px;
      margin: 0 auto;
      display: flex;
      gap: 1rem;
      align-items: flex-start;
      flex-wrap: wrap;
    }
    .search-box {
      flex: 1;
      min-width: 250px;
      position: relative;
    }
    .search-box__icon {
      position: absolute;
      right: .85rem;
      top: 50%;
      transform: translateY(-50%);
      width: 18px;
      height: 18px;
      color: var(--clr-text-muted);
      pointer-events: none;
    }
    .search-box__input {
      width: 100%;
      padding: .65rem .85rem .65rem 2.5rem;
      border: 1.5px solid var(--clr-border);
      border-radius: var(--radius-md);
      font-family: inherit;
      font-size: .88rem;
      background: var(--clr-bg);
      color: var(--clr-text);
      transition: border-color var(--transition), box-shadow var(--transition);
      outline: none;
    }
    .search-box__input:focus {
      border-color: var(--clr-brand);
      box-shadow: 0 0 0 3px rgba(234,63,72,.1);
    }
    .search-box__input::placeholder { color: var(--clr-text-muted); }
    .filters__selects {
      display: flex;
      gap: .75rem;
    }
    .select-wrap {
      position: relative;
    }
    .select-wrap::after {
      content: '';
      position: absolute;
      left: .75rem;
      top: 50%;
      transform: translateY(-50%);
      width: 0;
      height: 0;
      border-left: 5px solid transparent;
      border-right: 5px solid transparent;
      border-top: 5px solid var(--clr-text-muted);
      pointer-events: none;
    }
    .select {
      appearance: none;
      padding: .65rem 2.25rem .65rem .75rem;
      border: 1.5px solid var(--clr-border);
      border-radius: var(--radius-md);
      font-family: inherit;
      font-size: .85rem;
      background: var(--clr-bg);
      color: var(--clr-text);
      cursor: pointer;
      outline: none;
      transition: border-color var(--transition);
    }
    .select:focus {
      border-color: var(--clr-brand);
      box-shadow: 0 0 0 3px rgba(234,63,72,.1);
    }

    /* ═══════════════════════════════════════════════
       RESULTS
       ═══════════════════════════════════════════════ */
    .results {
      max-width: 1100px;
      margin: 1.5rem auto;
      padding: 0 1.5rem 3rem;
    }
    .results__inner { }
    .results__count {
      font-size: .82rem;
      color: var(--clr-text-muted);
      margin-bottom: 1rem;
    }
    .results__count span {
      font-weight: 700;
      color: var(--clr-text);
    }
    .lawyers-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    /* Lawyer Card */
    .lawyer-card {
      position: relative;
      background: var(--clr-surface);
      border: 1px solid var(--clr-border);
      border-radius: var(--radius-lg);
      overflow: hidden;
      box-shadow: var(--shadow-card);
      transition: all var(--transition);
    }
    .lawyer-card:hover {
      box-shadow: var(--shadow-card-hover);
      transform: translateY(-3px);
    }
    .lawyer-card__accent {
      height: 3px;
      background: linear-gradient(90deg, var(--clr-brand), var(--clr-brand-dark));
    }
    .lawyer-card__body { padding: 1.25rem; }
    .lawyer-card__head {
      display: flex;
      align-items: center;
      gap: .75rem;
      margin-bottom: 1rem;
    }
    .lawyer-card__avatar {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-sm);
      background: linear-gradient(135deg, var(--clr-brand), var(--clr-brand-dark));
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: .85rem;
      font-weight: 800;
      flex-shrink: 0;
    }
    .lawyer-card__info h3 {
      font-size: .95rem;
      font-weight: 700;
      margin: 0;
      color: var(--clr-text);
    }
    .lawyer-card__mat {
      font-size: .72rem;
      color: var(--clr-text-muted);
      font-family: 'SF Mono', 'Fira Code', monospace;
    }
    .lawyer-card__details {
      display: flex;
      flex-direction: column;
      gap: .5rem;
    }
    .lawyer-card__detail {
      display: flex;
      align-items: center;
      gap: .5rem;
      font-size: .82rem;
      color: var(--clr-text-secondary);
    }
    .lawyer-card__detail svg {
      width: 16px;
      height: 16px;
      color: var(--clr-brand);
      flex-shrink: 0;
    }

    /* Empty State */
    .empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 1rem;
      color: var(--clr-text-muted);
    }
    .empty svg {
      width: 56px;
      height: 56px;
      margin-bottom: .75rem;
      opacity: .35;
    }
    .empty p {
      font-size: .9rem;
      margin: 0;
    }

    /* Paginator */
    .directory-paginator {
      background: var(--clr-surface);
      border: 1px solid var(--clr-border);
      border-radius: var(--radius-md);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .filters__inner { flex-direction: column; }
      .search-box { min-width: 100%; }
      .filters__selects { width: 100%; }
      .select-wrap { flex: 1; }
      .select { width: 100%; }
      .lawyers-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class LawyerDirectoryPage {
  private data = inject(DataService);

  searchControl = new FormControl('');
  specialtyControl = new FormControl('');
  governorateControl = new FormControl('');

  searchQuery = signal('');
  specialtyFilter = signal('');
  governorateFilter = signal('');
  currentPage = signal(0);
  pageSize = 8;

  specialties = computed(() => [...new Set(this.data.getLawyers().map(l => l.speciality))]);
  governorates = computed(() => [...new Set(this.data.getLawyers().map(l => l.governorate))]);

  filteredLawyers = computed(() => {
    let lawyers = this.data.getLawyers();
    const search = this.searchQuery().toLowerCase();
    const specialty = this.specialtyFilter();
    const governorate = this.governorateFilter();

    if (search) {
      lawyers = lawyers.filter(l =>
        l.name.toLowerCase().includes(search) ||
        l.matricule.toLowerCase().includes(search) ||
        l.speciality.toLowerCase().includes(search)
      );
    }
    if (specialty) lawyers = lawyers.filter(l => l.speciality === specialty);
    if (governorate) lawyers = lawyers.filter(l => l.governorate === governorate);
    return lawyers;
  });

  paginatedLawyers = computed(() => {
    const start = this.currentPage() * this.pageSize;
    return this.filteredLawyers().slice(start, start + this.pageSize);
  });

  onSearch() {
    this.searchQuery.set(this.searchControl.value || '');
  }

  onFilter() {
    this.specialtyFilter.set(this.specialtyControl.value || '');
    this.governorateFilter.set(this.governorateControl.value || '');
    this.currentPage.set(0);
  }

  onPageChange(event: PageEvent) {
    this.currentPage.set(event.pageIndex);
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2);
  }
}
