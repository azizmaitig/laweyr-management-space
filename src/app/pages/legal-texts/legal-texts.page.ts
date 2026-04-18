import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../core/services/data.service';

@Component({
  selector: 'app-legal-texts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="legal-page">

      <!-- ════════════════════════════════════════════ -->
      <!-- PAGE HEADER                                    -->
      <!-- ════════════════════════════════════════════ -->
      <section class="page-header">
        <div class="page-header__pattern"></div>
        <div class="page-header__content">
          <h1>النصوص القانونية</h1>
          <p>استشيروا نصوص القانون والمراجع القانونية المعتمدة</p>
        </div>
      </section>

      <!-- ════════════════════════════════════════════ -->
      <!-- TABLE                                          -->
      <!-- ════════════════════════════════════════════ -->
      <section class="table-section">
        <div class="table-wrap">
          <table class="legal-table">
            <thead>
              <tr>
                <th>المرجع</th>
                <th>العنوان</th>
                <th>الفئة</th>
                <th>التاريخ</th>
                <th>الوصف</th>
              </tr>
            </thead>
            <tbody>
              @for (text of legalTexts; track text.id) {
                <tr>
                  <td>
                    <span class="ref-badge">{{ text.reference }}</span>
                  </td>
                  <td class="title-cell">{{ text.title }}</td>
                  <td>
                    <span class="category-pill" [class]="'category-pill--' + getCategoryClass(text.category)">
                      {{ text.category }}
                    </span>
                  </td>
                  <td class="date-cell">{{ text.date }}</td>
                  <td class="desc-cell">{{ text.description }}</td>
                </tr>
              }
            </tbody>
          </table>
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
      --clr-indigo: #6366f1;
      --clr-amber: #f59e0b;
      --radius-sm: 8px;
      --radius-md: 12px;
      --radius-lg: 16px;
      --shadow-card: 0 1px 3px rgba(0,0,0,.04), 0 1px 2px rgba(0,0,0,.06);
      --transition: .2s cubic-bezier(.4,0,.2,1);
    }

    .legal-page {
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
    .page-header__content { position: relative; z-index: 1; }
    .page-header h1 { font-size: 2rem; font-weight: 800; margin: 0 0 .5rem; }
    .page-header p { font-size: 1rem; opacity: .8; margin: 0; }

    /* ═══════════════════════════════════════════════
       TABLE
       ═══════════════════════════════════════════════ */
    .table-section {
      max-width: 1100px;
      margin: 2rem auto;
      padding: 0 1.5rem 3rem;
    }
    .table-wrap {
      background: var(--clr-surface);
      border: 1px solid var(--clr-border);
      border-radius: var(--radius-lg);
      overflow: hidden;
      box-shadow: var(--shadow-card);
    }
    .legal-table {
      width: 100%;
      border-collapse: collapse;
    }
    .legal-table thead {
      background: var(--clr-bg);
      border-bottom: 2px solid var(--clr-border);
    }
    .legal-table th {
      padding: .85rem 1rem;
      font-size: .75rem;
      font-weight: 700;
      color: var(--clr-text-muted);
      text-align: right;
      text-transform: uppercase;
      letter-spacing: .3px;
      white-space: nowrap;
    }
    .legal-table tbody tr {
      border-bottom: 1px solid var(--clr-border);
      transition: background var(--transition);
    }
    .legal-table tbody tr:last-child { border-bottom: none; }
    .legal-table tbody tr:hover { background: #fafbfc; }
    .legal-table td {
      padding: .85rem 1rem;
      font-size: .85rem;
      vertical-align: middle;
    }
    .ref-badge {
      display: inline-block;
      font-size: .72rem;
      font-weight: 700;
      font-family: 'SF Mono', 'Fira Code', monospace;
      background: #fef2f2;
      color: var(--clr-brand);
      padding: .2rem .5rem;
      border-radius: 6px;
      border: 1px solid #fecaca;
    }
    .title-cell {
      font-weight: 700;
      color: var(--clr-text);
    }
    .category-pill {
      display: inline-block;
      font-size: .7rem;
      font-weight: 700;
      padding: .15rem .5rem;
      border-radius: 6px;
    }
    .category-pill--Code { background: #e0e7ff; color: var(--clr-indigo); }
    .category-pill--Loi { background: #f0fdfa; color: var(--clr-teal); }
    .date-cell {
      font-size: .8rem;
      color: var(--clr-text-muted);
      font-family: 'SF Mono', 'Fira Code', monospace;
      white-space: nowrap;
    }
    .desc-cell {
      font-size: .8rem;
      color: var(--clr-text-secondary);
      max-width: 280px;
      line-height: 1.5;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .table-wrap { overflow-x: auto; }
      .legal-table { min-width: 700px; }
    }
  `],
})
export class LegalTextsPage {
  private data = inject(DataService);
  legalTexts = this.data.getLegalTexts();

  getCategoryClass(category: string): string {
    return category === 'Code' ? 'Code' : 'Loi';
  }
}
