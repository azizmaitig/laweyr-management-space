import { Component, DestroyRef, ElementRef, inject, signal, computed, viewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { distinctUntilChanged } from 'rxjs';
import { WORKSPACE_QUERY } from '../../core/constants/workspace-query-params';
import { EventService } from '../../core/services/event.service';
import { CasesStateService } from '../../features/cases/services/cases-state.service';
import { TimelineService } from '../../features/timeline/services/timeline.service';
import { DocumentsService } from '../../features/documents/services/documents.service';
import { TasksService } from '../../features/tasks/services/tasks.service';
import { NotesService } from '../../features/notes/services/notes.service';
import { ClientsService } from '../../features/clients/services/clients.service';
import { AppEventType } from '../../core/models/events.model';
import { Case, CaseTimelineEvent, TimelineEventType, CaseDocument, DocumentFolder, DocumentFileType, Task, TaskPriority, TaskStatus, Note } from '../../core/models/lawyer.model';
import { UploadDialogComponent } from '../../features/documents/components/upload-dialog/upload-dialog.component';

const DOC_FOLDER_LABELS: Record<DocumentFolder | 'all', string> = {
  all: 'الكل',
  contracts: 'عقود',
  memos: 'مذكرات',
  rulings: 'أحكام',
  correspondence: 'مراسلات',
  other: 'أخرى',
};

/** Demo PDF for inline preview when no `url` is stored on the document. */
const DEMO_PDF_PREVIEW_URL =
  'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

interface SearchResult {
  type: 'case' | 'client' | 'document' | 'note';
  id: number;
  title: string;
  subtitle: string;
  icon: string;
  caseId?: number;
}

interface SavedSearch {
  id: number;
  query: string;
  filters: { status?: string; type?: string; dateFrom?: string; dateTo?: string };
  createdAt: string;
}

type CaseStatus = 'active' | 'pending' | 'urgent' | 'closed';
type CaseType = 'commercial' | 'family' | 'penal' | 'civil' | 'administrative';

@Component({
  selector: 'app-ea-cases',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatSnackBarModule, UploadDialogComponent],
  template: `
    <div class="ea-cases">
      <div class="ea-cases__header">
        <div>
          <h2>⚡ إدارة الملفات والقضايا</h2>
          <p>عرض وتتبع جميع القضايا والملفات القانونية</p>
        </div>
        <div class="header-actions">
          <button class="btn btn--outline" (click)="showSearchPanel = !showSearchPanel">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            بحث متقدم
          </button>
          <button class="btn btn--primary" (click)="openAddModal()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            ملف جديد
          </button>
        </div>
      </div>

      <!-- Advanced Search Panel -->
      @if (showSearchPanel) {
        <div class="search-panel">
          <div class="search-panel__header">
            <h3>🔍 البحث المتقدم</h3>
            <button class="search-panel__close" (click)="showSearchPanel = false">✕</button>
          </div>
          <div class="search-panel__body">
            <!-- Search Input -->
            <div class="search-panel__input-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" [formControl]="advSearchControl" (input)="onAdvSearch()" placeholder="ابحث في الملفات، العملاء، الوثائق، الملاحظات..." class="search-panel__input">
            </div>
            <!-- Filters -->
            <div class="search-panel__filters">
              <div class="search-panel__filter-group">
                <label>الحالة</label>
                <select [formControl]="advStatusControl" (change)="onAdvSearch()" class="search-panel__select">
                  <option value="">الكل</option>
                  <option value="active">نشط</option>
                  <option value="pending">معلق</option>
                  <option value="urgent">عاجل</option>
                  <option value="closed">منجز</option>
                </select>
              </div>
              <div class="search-panel__filter-group">
                <label>النوع</label>
                <select [formControl]="advTypeControl" (change)="onAdvSearch()" class="search-panel__select">
                  <option value="">الكل</option>
                  <option value="commercial">تجاري</option>
                  <option value="family">عائلي</option>
                  <option value="penal">جزائي</option>
                  <option value="civil">مدني</option>
                  <option value="administrative">إداري</option>
                </select>
              </div>
              <div class="search-panel__filter-group">
                <label>من تاريخ</label>
                <input type="date" [formControl]="advDateFromControl" (change)="onAdvSearch()" class="search-panel__date">
              </div>
              <div class="search-panel__filter-group">
                <label>إلى تاريخ</label>
                <input type="date" [formControl]="advDateToControl" (change)="onAdvSearch()" class="search-panel__date">
              </div>
            </div>
            <!-- Saved Searches -->
            @if (savedSearches().length > 0) {
              <div class="search-panel__saved">
                <h4>عمليات البحث المحفوظة</h4>
                <div class="search-panel__saved-list">
                  @for (s of savedSearches(); track s.id) {
                    <button class="search-panel__saved-btn" (click)="loadSavedSearch(s)">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                      <span>{{ s.query }}</span>
                      <span class="search-panel__saved-delete" (click)="deleteSavedSearch(s.id); $event.stopPropagation()">✕</span>
                    </button>
                  }
                </div>
              </div>
            }
            <!-- Save Search Button -->
            @if (advSearchQuery().length > 0) {
              <button class="btn btn--sm btn--outline" (click)="saveSearch()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                حفظ البحث
              </button>
            }
            <!-- Results -->
            @if (searchResults().length > 0) {
              <div class="search-panel__results">
                <h4>النتائج ({{ searchResults().length }})</h4>
                <div class="search-results-list">
                  @for (r of searchResults(); track r.type + r.id) {
                    <div class="search-result-item" (click)="onSearchResultClick(r)">
                      <span class="search-result-item__type" [class]="'search-result-item__type--' + r.type">
                        @if (r.type === 'case') { 📁 }
                        @if (r.type === 'client') { 👤 }
                        @if (r.type === 'document') { 📄 }
                        @if (r.type === 'note') { 📝 }
                      </span>
                      <div class="search-result-item__info">
                        <span class="search-result-item__title">{{ r.title }}</span>
                        <span class="search-result-item__sub">{{ r.subtitle }}</span>
                      </div>
                    </div>
                  }
                </div>
              </div>
            } @else if (advSearchQuery().length > 0) {
              <div class="search-panel__no-results">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <p>لا توجد نتائج</p>
              </div>
            }
          </div>
        </div>
      }

      <!-- Stats -->
      <div class="stats-row">
        @for (s of statusStats(); track s.label) {
          <div class="stat-pill" [class]="'stat-pill--' + s.color">
            <span class="stat-pill__value">{{ s.count }}</span>
            <span class="stat-pill__label">{{ s.label }}</span>
          </div>
        }
      </div>

      <!-- Filters -->
      <div class="filters">
        <div class="search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" [formControl]="searchControl" (input)="onSearch()" placeholder="بحث برقم الملف أو اسم الحريف..." class="search-box__input">
        </div>
        <div class="filters__selects">
          <select [formControl]="statusControl" (change)="onFilter()" class="select">
            <option value="">جميع الحالات</option>
            <option value="active">نشط</option>
            <option value="pending">معلق</option>
            <option value="urgent">عاجل</option>
            <option value="closed">منجز</option>
          </select>
          <select [formControl]="typeControl" (change)="onFilter()" class="select">
            <option value="">جميع الأنواع</option>
            <option value="commercial">تجاري</option>
            <option value="family">عائلي</option>
            <option value="penal">جزائي</option>
            <option value="civil">مدني</option>
            <option value="administrative">إداري</option>
          </select>
        </div>
      </div>

      <!-- Table -->
      @if (filteredCases().length === 0) {
        <div class="empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          <p>لا توجد ملفات</p>
        </div>
      } @else {
        <div class="table-wrap">
          <table class="table">
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
              @for (case_ of filteredCases(); track case_.id) {
                <tr (click)="viewCase(case_)" class="table__row">
                  <td class="table__num">{{ case_.number }}</td>
                  <td class="table__client">{{ case_.clientName }}</td>
                  <td><span class="type-badge" [class]="'type-badge--' + case_.type">{{ typeLabels[case_.type] }}</span></td>
                  <td class="table__court">{{ case_.court }}</td>
                  <td><span class="status-badge" [class]="'status-badge--' + case_.status">{{ statusLabels[case_.status] }}</span></td>
                  <td>
                    <div class="progress-cell">
                      <div class="progress-track"><div class="progress-fill" [style.width.%]="case_.progress"></div></div>
                      <span class="progress-pct">{{ case_.progress }}%</span>
                    </div>
                  </td>
                  <td class="table__date">{{ case_.hearingDate || '—' }}</td>
                  <td class="table__fees">{{ case_.fees | number:'1.0-0' }} <small>د.ت</small></td>
                  <td class="table__actions">
                    <button class="action-btn" (click)="uploadCaseId.set(case_.id); $event.stopPropagation()" aria-label="رفع وثيقة">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    </button>
                    <button class="action-btn" (click)="editCase(case_); $event.stopPropagation()">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="action-btn action-btn--delete" (click)="deleteCase(case_.id); $event.stopPropagation()">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- Detail Modal -->
      @if (selectedCase()) {
        <div class="modal-backdrop" (click)="closeDetail()">
          <div class="modal modal--detail" (click)="$event.stopPropagation()">
            <div class="modal__header">
              <div>
                <h2>ملف {{ selectedCase()!.number }}</h2>
                <p class="modal__sub">{{ selectedCase()!.clientName }}</p>
              </div>
              <button class="modal__close" (click)="closeDetail()">✕</button>
            </div>
            <!-- Modal Tabs -->
            <div class="modal-tabs">
              <button class="modal-tab" [class.modal-tab--active]="modalTab() === 'info'" (click)="modalTab.set('info')">معلومات الملف</button>
              <button class="modal-tab" [class.modal-tab--active]="modalTab() === 'timeline'" (click)="modalTab.set('timeline')">الجدول الزمني</button>
              <button class="modal-tab" [class.modal-tab--active]="modalTab() === 'docs'" (click)="modalTab.set('docs')">الوثائق</button>
              <button class="modal-tab" [class.modal-tab--active]="modalTab() === 'tasks'" (click)="modalTab.set('tasks')">المهام</button>
              <button class="modal-tab" [class.modal-tab--active]="modalTab() === 'notes'" (click)="modalTab.set('notes')">الملاحظات</button>
            </div>
            <div class="modal__body">
              @if (modalTab() === 'info') {
                <div class="detail-grid">
                  <div class="detail-section">
                    <h3>معلومات الملف</h3>
                    <div class="detail-row"><span>رقم الملف</span><span class="table__num">{{ selectedCase()!.number || '—' }}</span></div>
                    <div class="detail-row"><span>النوع</span><span class="type-badge" [class]="'type-badge--' + selectedCase()!.type">{{ typeLabels[selectedCase()!.type] }}</span></div>
                    <div class="detail-row"><span>المحكمة</span><span>{{ selectedCase()!.court }}</span></div>
                    <div class="detail-row"><span>الحالة</span><span class="status-badge" [class]="'status-badge--' + selectedCase()!.status">{{ statusLabels[selectedCase()!.status] }}</span></div>
                    <div class="detail-row"><span>المرحلة</span><span>{{ (selectedCase()!.stage ?? 0) }} / {{ selectedCase()!.totalStages ?? '—' }}</span></div>
                    <div class="detail-row"><span>الجلسة القادمة</span><span>{{ selectedCase()!.hearingDate || 'غير محددة' }}</span></div>
                  </div>
                  <div class="detail-section">
                    <h3>الأتعاب</h3>
                    <div class="detail-row"><span>الإجمالي</span><strong>{{ selectedCase()!.fees | number:'1.0-0' }} د.ت</strong></div>
                    <div class="detail-row"><span>المدفوع</span><strong class="text-green">{{ selectedCase()!.paidFees | number:'1.0-0' }} د.ت</strong></div>
                    <div class="detail-row"><span>المتبقي</span><strong class="text-amber">{{ remainingFees(selectedCase()!) | number:'1.0-0' }} د.ت</strong></div>
                    <div class="detail-progress">
                      <div class="detail-progress__track"><div class="detail-progress__fill" [style.width.%]="selectedCase()!.progress"></div></div>
                      <span>{{ selectedCase()!.progress }}%</span>
                    </div>
                  </div>
                </div>
                <div class="detail-tab-actions">
                  <button type="button" class="btn btn--outline btn--sm" (click)="editCaseFromDetail()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    تعديل الملف
                  </button>
                </div>
              } @else if (modalTab() === 'timeline') {
                <div class="timeline-container">
                  <div class="timeline-header">
                    <h3>الجدول الزمني للقضية</h3>
                    <div class="timeline-actions">
                      <button type="button" class="btn btn--sm btn--primary" (click)="toggleAddTimeline()">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        حدث جديد
                      </button>
                      <button type="button" class="btn btn--sm btn--outline" (click)="shareTimeline()">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                        مشاركة
                      </button>
                      <button type="button" class="btn btn--sm btn--outline" (click)="printTimeline()">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                        طباعة
                      </button>
                    </div>
                  </div>
                  @if (showAddTimeline) {
                    <div class="timeline-add-form">
                      <div class="timeline-add-row">
                        <input type="date" [(ngModel)]="newTimelineDate" class="form-input">
                        <select [(ngModel)]="newTimelineType" class="form-input">
                          <option value="hearing">جلسة</option>
                          <option value="deadline">أجل</option>
                          <option value="document">وثيقة</option>
                          <option value="note">ملاحظة</option>
                          <option value="payment">دفعة</option>
                        </select>
                      </div>
                      <input type="text" [(ngModel)]="newTimelineTitle" class="form-input timeline-add-full" placeholder="عنوان الحدث...">
                      <textarea [(ngModel)]="newTimelineDescription" class="form-input timeline-add-textarea" rows="2" placeholder="التفاصيل..."></textarea>
                      @if (newTimelineType === 'payment') {
                        <input type="number" [(ngModel)]="newTimelineAmount" class="form-input timeline-add-full" placeholder="المبلغ (د.ت)" min="0">
                      }
                      @if (newTimelineType === 'hearing' || newTimelineType === 'deadline') {
                        <input type="text" [(ngModel)]="newTimelineLocation" class="form-input timeline-add-full" placeholder="المكان (اختياري)">
                      }
                      <div class="timeline-add-actions">
                        <button type="button" class="btn btn--sm btn--outline" (click)="cancelAddTimeline()">إلغاء</button>
                        <button type="button" class="btn btn--sm btn--primary" (click)="addTimelineEvent()">إضافة</button>
                      </div>
                    </div>
                  }
                  <!-- Filters -->
                  <div class="timeline-filters">
                    @for (f of timelineFilters; track f.key) {
                      <button type="button" class="timeline-filter" [class.timeline-filter--active]="timelineFilter() === f.key" (click)="timelineFilter.set(f.key)">
                        <span class="timeline-filter__dot" [style.background]="f.color"></span>
                        {{ f.label }}
                      </button>
                    }
                  </div>
                  <!-- Timeline List -->
                  <div class="timeline-list">
                    @for (event of filteredTimeline(); track event.id) {
                      <div class="timeline-item">
                        <div class="timeline-item__line"></div>
                        <div class="timeline-item__dot" [style.background]="getEventTypeColor(event.type)"></div>
                        <div class="timeline-item__card">
                          <div class="timeline-item__date">{{ event.date }}</div>
                          <div class="timeline-item__content">
                            <div class="timeline-item__head">
                              <span class="timeline-item__type" [style.background]="getEventTypeColor(event.type) + '22'" [style.color]="getEventTypeColor(event.type)">{{ getEventTypeLabel(event.type) }}</span>
                              <h4>{{ event.title }}</h4>
                            </div>
                            <p>{{ event.description }}</p>
                            @if (event.location) {
                              <p class="timeline-item__loc">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                {{ event.location }}
                              </p>
                            }
                            @if (event.amount) {
                              <p class="timeline-item__amount">{{ event.amount | number:'1.0-0' }} د.ت</p>
                            }
                          </div>
                        </div>
                      </div>
                    }
                    @if (filteredTimeline().length === 0) {
                      <div class="timeline-empty">
                        <p>{{ timelineEmptyLabel() }}</p>
                      </div>
                    }
                  </div>
                </div>
              } @else if (modalTab() === 'docs') {
                <!-- Documents -->
                <div class="docs-container">
                  <div class="docs-header">
                    <h3>📄 وثائق القضية</h3>
                    <div class="docs-actions">
                      <button class="btn btn--sm btn--primary" (click)="uploadCaseId.set(selectedCase()!.id)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        رفع وثيقة
                      </button>
                      <button class="btn btn--sm btn--outline" (click)="printDocuments()">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                        طباعة
                      </button>
                    </div>
                  </div>
                  <div class="docs-folder-filters">
                    @for (f of docFolderFilters; track f.key) {
                      <button type="button" class="docs-folder-filter" [class.docs-folder-filter--active]="docFolderFilter() === f.key" (click)="docFolderFilter.set(f.key)">
                        {{ f.label }}
                      </button>
                    }
                  </div>
                  @if (filteredDocuments().length === 0) {
                    <div class="docs-empty">
                      <p>{{ docsEmptyMessage() }}</p>
                    </div>
                  }
                  <div class="docs-list-simple">
                    @for (doc of filteredDocuments(); track doc.id) {
                      <div class="doc-item">
                        <div class="doc-item__icon" [class]="'doc-item__icon--' + doc.fileType">
                          @if (doc.fileType === 'pdf') {
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                          } @else if (doc.fileType === 'word') {
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                          } @else {
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                          }
                        </div>
                        <div class="doc-item__info">
                          <div class="doc-item__head">
                            <h4>{{ doc.name }}</h4>
                            <span class="doc-item__version">v{{ doc.version }}</span>
                          </div>
                          <div class="doc-item__meta">
                            <span class="doc-item__folder">{{ docFolderLabel(doc.folder) }}</span>
                            <span>{{ doc.size }}</span>
                            <span>{{ doc.uploadDate }}</span>
                          </div>
                        </div>
                        <div class="doc-item__actions" (click)="$event.stopPropagation()">
                          <button type="button" class="doc-item__btn doc-item__btn--view" (click)="openDocumentPreview(doc)" title="معاينة" aria-label="معاينة">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          </button>
                          <button type="button" class="doc-item__btn doc-item__btn--print" (click)="printSingleDocument(doc)" title="طباعة" aria-label="طباعة">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                          </button>
                          <button type="button" class="doc-item__btn doc-item__btn--share" (click)="shareDocument(doc)" title="مشاركة" aria-label="مشاركة">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                          </button>
                          <button type="button" class="doc-item__btn doc-item__btn--delete" (click)="deleteCaseDocument(doc)" title="حذف" aria-label="حذف">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                          </button>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              } @else if (modalTab() === 'tasks') {
                <!-- Tasks -->
                <div class="tasks-container">
                  <div class="tasks-header">
                    <h3>✅ إدارة المهام والمتابعة</h3>
                    <button type="button" class="btn btn--sm btn--primary" (click)="openNewTaskForm()">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      مهمة جديدة
                    </button>
                  </div>
                  <!-- Add / Edit Task Form -->
                  @if (showAddTask) {
                    <div class="add-task-form">
                      <div class="add-task-row">
                        <input type="text" [(ngModel)]="newTaskTitle" class="form-input" placeholder="عنوان المهمة...">
                      </div>
                      <div class="add-task-row">
                        <input type="date" [(ngModel)]="newTaskDueDate" class="form-input">
                        <select [(ngModel)]="newTaskPriority" class="form-input">
                          <option [ngValue]="'HIGH'">🔴 عاجل</option>
                          <option [ngValue]="'MEDIUM'">🟡 متوسط</option>
                          <option [ngValue]="'LOW'">🟢 عادي</option>
                        </select>
                      </div>
                      <div class="add-task-actions">
                        <button type="button" class="btn btn--sm btn--outline" (click)="cancelTaskForm()">إلغاء</button>
                        <button type="button" class="btn btn--sm btn--primary" (click)="saveTask()">{{ editingTask ? 'حفظ التعديل' : 'إضافة' }}</button>
                      </div>
                    </div>
                  }
                  <!-- Task List -->
                  <div class="task-list">
                    @for (task of caseTasks(); track task.id) {
                      <div class="task-item" [class.task-item--done]="task.status === 'DONE'">
                        <button class="task-status-btn" [class]="'task-status--' + task.status" (click)="cycleTaskStatus(task)" [title]="taskStatusLabels[task.status]">
                          @if (task.status === 'DONE') {
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          } @else if (task.status === 'IN_PROGRESS') {
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          } @else {
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>
                          }
                        </button>
                        <div class="task-item__info">
                          <div class="task-item__head">
                            <h4 [class.task-item__title--done]="task.status === 'DONE'">{{ task.title }}</h4>
                            <span class="task-priority" [class]="'task-priority--' + task.priority">{{ taskPriorityLabels[task.priority] }}</span>
                          </div>
                          <div class="task-item__meta">
                            @if (task.dueDate) {
                              <span class="task-due" [class.task-due--overdue]="task.dueDate < todayStr && task.status !== 'DONE'">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                {{ task.dueDate }}
                              </span>
                            }
                            <span class="task-status-label">{{ taskStatusLabels[task.status] }}</span>
                          </div>
                        </div>
                        <button type="button" class="task-edit-btn" (click)="startEditTask(task)" title="تعديل">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button type="button" class="task-delete-btn" (click)="deleteTask(task.id)" title="حذف">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                      </div>
                    }
                    @if (caseTasks().length === 0) {
                      <div class="tasks-empty">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        <p>لا توجد مهام لهذا الملف</p>
                      </div>
                    }
                  </div>
                </div>
              } @else if (modalTab() === 'notes') {
                <!-- Notes -->
                <div class="notes-container">
                  <div class="notes-header">
                    <h3>📝 محرر ملاحظات القضية</h3>
                    <div class="notes-actions">
                      <div class="notes-search">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        <input type="text" [formControl]="noteSearchControl" (input)="onNoteSearch()" placeholder="بحث في الملاحظات..." class="notes-search__input">
                      </div>
                      <button class="btn btn--sm btn--primary" (click)="addNote()">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        ملاحظة جديدة
                      </button>
                    </div>
                  </div>
                  <!-- Notes List -->
                  <div class="notes-list">
                    @for (note of filteredNotes(); track note.id) {
                      <div class="note-card">
                        <div class="note-card__head">
                          <h4>{{ note.title || 'ملاحظة بدون عنوان' }}</h4>
                          <div class="note-card__meta">
                            <span class="note-card__updated">{{ note.updatedAt ?? note.createdAt }}</span>
                          </div>
                        </div>
                        <div class="note-card__content" [innerHTML]="note.content"></div>
                        <div class="note-card__actions">
                          <button class="note-action-btn" (click)="editNote(note)" title="تعديل">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          <button class="note-action-btn note-action-btn--delete" (click)="deleteNote(note.id)" title="حذف">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                          </button>
                        </div>
                      </div>
                    }
                    @if (filteredNotes().length === 0) {
                      <div class="notes-empty">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                        <p>لا توجد ملاحظات لهذا الملف</p>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- Add/Edit Modal -->
      @if (showFormModal) {
        <div class="modal-backdrop modal-backdrop--stack" (click)="closeFormModal()">
          <div class="modal modal--form" (click)="$event.stopPropagation()">
            <div class="modal__header">
              <h2>{{ editingCase ? 'تعديل الملف' : 'ملف جديد' }}</h2>
              <button class="modal__close" (click)="closeFormModal()">✕</button>
            </div>
            <div class="modal__body">
              <div class="form-grid">
                <div class="form-field"><label>رقم الملف</label><input type="text" [(ngModel)]="formNumber" class="form-input" placeholder="2024/XXXX"></div>
                <div class="form-field"><label>اسم الحريف</label><input type="text" [(ngModel)]="formClient" class="form-input" placeholder="اسم الحريف"></div>
                <div class="form-field"><label>النوع</label>
                  <select [(ngModel)]="formType" class="form-input"><option value="commercial">تجاري</option><option value="family">عائلي</option><option value="penal">جزائي</option><option value="civil">مدني</option><option value="administrative">إداري</option></select>
                </div>
                <div class="form-field"><label>المحكمة</label><input type="text" [(ngModel)]="formCourt" class="form-input" placeholder="اسم المحكمة"></div>
                <div class="form-field"><label>الحالة</label>
                  <select [(ngModel)]="formStatus" class="form-input"><option value="active">نشط</option><option value="pending">معلق</option><option value="urgent">عاجل</option><option value="closed">منجز</option></select>
                </div>
                <div class="form-field"><label>الجلسة القادمة</label><input type="date" [(ngModel)]="formHearingDate" class="form-input"></div>
                <div class="form-field"><label>الأتعاب (د.ت)</label><input type="number" [(ngModel)]="formFees" class="form-input" placeholder="0"></div>
                <div class="form-field"><label>المدفوع (د.ت)</label><input type="number" [(ngModel)]="formPaid" class="form-input" placeholder="0"></div>
              </div>
              <div class="form-actions">
                <button class="btn btn--outline" (click)="closeFormModal()">إلغاء</button>
                <button class="btn btn--primary" (click)="saveCase()">{{ editingCase ? 'حفظ التعديلات' : 'إنشاء الملف' }}</button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Note Edit Modal -->
      @if (showNoteModal) {
        <div class="modal-backdrop modal-backdrop--stack" (click)="closeNoteModal()">
          <div class="modal modal--note" (click)="$event.stopPropagation()">
            <div class="modal__header">
              <h2>{{ editingNote ? 'تعديل الملاحظة' : 'ملاحظة جديدة' }}</h2>
              <button class="modal__close" (click)="closeNoteModal()">✕</button>
            </div>
            <div class="modal__body">
              <div class="note-form">
                <div class="form-field"><label>العنوان</label><input type="text" [(ngModel)]="noteFormTitle" class="form-input" placeholder="عنوان الملاحظة..."></div>
                <!-- Rich Text Toolbar -->
                <div class="note-toolbar">
                  <button type="button" class="note-toolbar__btn" (mousedown)="$event.preventDefault()" (click)="execCmd('bold')" title="عريض"><strong>B</strong></button>
                  <button type="button" class="note-toolbar__btn" (mousedown)="$event.preventDefault()" (click)="execCmd('italic')" title="مائل"><em>I</em></button>
                  <button type="button" class="note-toolbar__btn" (mousedown)="$event.preventDefault()" (click)="execCmd('underline')" title="تحته خط"><u>U</u></button>
                  <span class="note-toolbar__sep"></span>
                  <button type="button" class="note-toolbar__btn" (mousedown)="$event.preventDefault()" (click)="execCmd('insertUnorderedList')" title="قائمة">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                  </button>
                </div>
                <div #noteEditor class="note-editor" contenteditable="true" [innerHTML]="noteFormContent" (input)="onNoteEditorInput($event)" dir="rtl"></div>
              </div>
              <div class="form-actions">
                <button class="btn btn--outline" (click)="closeNoteModal()">إلغاء</button>
                <button class="btn btn--primary" (click)="saveNote()">حفظ</button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Upload Document Dialog -->
      @if (uploadCaseId()) {
        <app-upload-dialog [caseId]="uploadCaseId()!" (closed)="uploadCaseId.set(null)" (uploaded)="onDocumentUploaded()"></app-upload-dialog>
      }

      <!-- Document preview (معاينة) -->
      @if (viewingDocument(); as vDoc) {
        <div class="doc-preview-backdrop" (click)="closeDocumentPreview()" role="presentation">
          <div class="doc-preview" (click)="$event.stopPropagation()" role="dialog" aria-modal="true" [attr.aria-label]="'معاينة: ' + vDoc.name">
            <div class="doc-preview__header">
              <div class="doc-preview__title-wrap">
                <h3 class="doc-preview__title">{{ vDoc.name }}</h3>
                <p class="doc-preview__meta">{{ docFolderLabel(vDoc.folder) }} · v{{ vDoc.version }} · {{ vDoc.uploadDate }}</p>
              </div>
              <div class="doc-preview__actions">
                <button type="button" class="doc-preview__icon-btn" (click)="printSingleDocument(vDoc)" title="طباعة" aria-label="طباعة">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                </button>
                <button type="button" class="doc-preview__icon-btn" (click)="shareDocument(vDoc)" title="مشاركة" aria-label="مشاركة">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                </button>
                <button type="button" class="doc-preview__icon-btn doc-preview__icon-btn--danger" (click)="deleteCaseDocument(vDoc)" title="حذف" aria-label="حذف">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
                <button type="button" class="doc-preview__icon-btn doc-preview__icon-btn--close" (click)="closeDocumentPreview()" title="إغلاق" aria-label="إغلاق">✕</button>
              </div>
            </div>
            <div class="doc-preview__body">
              @if (vDoc.fileType === 'pdf') {
                <iframe class="doc-preview__iframe" [src]="safePdfPreviewUrl(vDoc)" title="معاينة PDF"></iframe>
              } @else if (vDoc.fileType === 'image') {
                <div class="doc-preview__img-wrap">
                  <img class="doc-preview__img" [src]="imagePreviewUrl(vDoc)" [alt]="vDoc.name" />
                </div>
              } @else {
                <div class="doc-preview__word">
                  <div class="doc-preview__word-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                  </div>
                  <p class="doc-preview__word-title">مستند Word</p>
                  <p class="doc-preview__word-hint">معاينة مباشرة غير متاحة في المتصفح. يمكنك طباعة بطاقة المعلومات أو مشاركة الرابط، أو فتح الملف من تطبيق سطح المكتب بعد التكامل مع الخادم.</p>
                  <div class="doc-preview__word-actions">
                    <button type="button" class="btn btn--sm btn--outline" (click)="printSingleDocument(vDoc)">طباعة بطاقة المعلومات</button>
                    <button type="button" class="btn btn--sm btn--primary" (click)="shareDocument(vDoc)">مشاركة الرابط</button>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      --clr-bg: #f4f5f7; --clr-surface: #ffffff; --clr-border: #e8eaed;
      --clr-text: #1a1d23; --clr-text-secondary: #6b7280; --clr-text-muted: #9ca3af;
      --clr-brand: #ea3f48; --clr-brand-dark: #0f2d5e; --clr-teal: #0d9488;
      --clr-teal-light: #ccfbf1; --clr-amber: #f59e0b; --clr-amber-light: #fef3c7;
      --clr-blue: #3b82f6; --clr-blue-light: #eff6ff; --clr-red: #ea3f48;
      --clr-red-light: #fef2f2; --clr-green: #16a34a; --clr-green-light: #f0fdf4;
      --clr-gray: #6b7280; --clr-gray-light: #f3f4f6;
      --clr-commercial: #6366f1; --clr-commercial-light: #e0e7ff;
      --clr-family: #f59e0b; --clr-family-light: #fef3c7;
      --clr-penal: #ea3f48; --clr-penal-light: #fef2f2;
      --clr-civil: #0d9488; --clr-civil-light: #ccfbf1;
      --clr-administrative: #8b5cf6; --clr-administrative-light: #ede9fe;
      --radius-sm: 8px; --radius-md: 12px; --radius-lg: 16px;
      --shadow-card: 0 1px 3px rgba(0,0,0,.04), 0 1px 2px rgba(0,0,0,.06);
      --transition: .2s cubic-bezier(.4,0,.2,1);
    }
    .ea-cases { font-family: 'Cairo', system-ui, sans-serif; color: var(--clr-text); }
    .ea-cases__header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; gap: 1rem; flex-wrap: wrap; }
    .ea-cases__header h2 { font-size: 1.25rem; font-weight: 800; margin: 0; }
    .ea-cases__header p { font-size: .78rem; color: var(--clr-text-muted); margin: .15rem 0 0; }
    .header-actions { display: flex; gap: .5rem; }
    .btn { display: inline-flex; align-items: center; gap: .4rem; padding: .55rem 1.1rem; border-radius: var(--radius-sm); font-family: inherit; font-size: .82rem; font-weight: 700; cursor: pointer; transition: all var(--transition); border: none; }
    .btn svg { width: 16px; height: 16px; }
    .btn--primary { background: var(--clr-brand); color: white; }
    .btn--primary:hover { background: #c8333d; transform: translateY(-1px); }
    .btn--outline { background: transparent; border: 1.5px solid var(--clr-border); color: var(--clr-text-secondary); }
    .btn--outline:hover { border-color: var(--clr-text-muted); color: var(--clr-text); }
    .search-panel { background: var(--clr-surface); border: 1px solid var(--clr-border); border-radius: var(--radius-lg); padding: 1.25rem; margin-bottom: 1rem; box-shadow: var(--shadow-card); }
    .search-panel__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .search-panel__header h3 { font-size: 1rem; font-weight: 700; margin: 0; }
    .search-panel__close { width: 28px; height: 28px; border-radius: 6px; border: none; background: transparent; color: var(--clr-text-muted); font-size: 1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .search-panel__close:hover { background: var(--clr-bg); color: var(--clr-text); }
    .search-panel__input-wrap { position: relative; margin-bottom: .75rem; }
    .search-panel__input-wrap svg { position: absolute; right: .75rem; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; color: var(--clr-text-muted); pointer-events: none; }
    .search-panel__input { width: 100%; padding: .65rem .75rem .65rem 2.5rem; border: 1.5px solid var(--clr-border); border-radius: var(--radius-md); font-family: inherit; font-size: .88rem; background: var(--clr-bg); color: var(--clr-text); outline: none; transition: border-color var(--transition); }
    .search-panel__input:focus { border-color: var(--clr-brand); }
    .search-panel__filters { display: grid; grid-template-columns: repeat(4, 1fr); gap: .65rem; margin-bottom: .75rem; }
    .search-panel__filter-group { display: flex; flex-direction: column; gap: .25rem; }
    .search-panel__filter-group label { font-size: .68rem; font-weight: 600; color: var(--clr-text-muted); }
    .search-panel__select, .search-panel__date { padding: .45rem .6rem; border: 1.5px solid var(--clr-border); border-radius: var(--radius-sm); font-family: inherit; font-size: .78rem; background: var(--clr-surface); color: var(--clr-text); outline: none; }
    .search-panel__saved { margin-bottom: .75rem; }
    .search-panel__saved h4 { font-size: .78rem; font-weight: 700; margin: 0 0 .4rem; color: var(--clr-text-secondary); }
    .search-panel__saved-list { display: flex; flex-wrap: wrap; gap: .35rem; }
    .search-panel__saved-btn { display: inline-flex; align-items: center; gap: .3rem; padding: .3rem .6rem; border: 1px solid var(--clr-border); border-radius: 20px; background: var(--clr-bg); font-family: inherit; font-size: .72rem; color: var(--clr-text-secondary); cursor: pointer; transition: all var(--transition); }
    .search-panel__saved-btn:hover { border-color: var(--clr-brand); color: var(--clr-brand); }
    .search-panel__saved-btn svg { width: 12px; height: 12px; }
    .search-panel__saved-delete { color: var(--clr-text-muted); margin-right: .15rem; }
    .search-panel__saved-delete:hover { color: var(--clr-red); }
    .search-panel__results h4 { font-size: .78rem; font-weight: 700; margin: 0 0 .4rem; color: var(--clr-text-secondary); }
    .search-results-list { display: flex; flex-direction: column; gap: .35rem; max-height: 250px; overflow-y: auto; }
    .search-result-item { display: flex; align-items: center; gap: .5rem; padding: .5rem .65rem; border: 1px solid var(--clr-border); border-radius: var(--radius-sm); cursor: pointer; transition: all var(--transition); }
    .search-result-item:hover { background: var(--clr-bg); border-color: var(--clr-brand); }
    .search-result-item__type { font-size: 1rem; }
    .search-result-item__info { flex: 1; min-width: 0; }
    .search-result-item__title { display: block; font-size: .78rem; font-weight: 600; color: var(--clr-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .search-result-item__sub { display: block; font-size: .68rem; color: var(--clr-text-muted); }
    .docs-folder-filters { display: flex; flex-wrap: wrap; gap: .4rem; margin-bottom: .75rem; }
    .docs-folder-filter { padding: .3rem .65rem; border: 1.5px solid var(--clr-border); border-radius: 20px; background: transparent; font-family: inherit; font-size: .72rem; font-weight: 600; color: var(--clr-text-secondary); cursor: pointer; transition: all var(--transition); }
    .docs-folder-filter--active { border-color: var(--clr-brand); color: var(--clr-brand); background: var(--clr-red-light); }
    .search-panel__no-results { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem 1rem; color: var(--clr-text-muted); }
    .search-panel__no-results svg { width: 32px; height: 32px; margin-bottom: .4rem; opacity: .35; }
    .search-panel__no-results p { font-size: .78rem; margin: 0; }
    @media (max-width: 768px) { .search-panel__filters { grid-template-columns: repeat(2, 1fr); } }
    .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: .65rem; margin-bottom: 1rem; }
    .stat-pill { background: var(--clr-surface); border: 1px solid var(--clr-border); border-radius: var(--radius-md); padding: .75rem 1rem; text-align: center; box-shadow: var(--shadow-card); }
    .stat-pill__value { display: block; font-size: 1.25rem; font-weight: 800; line-height: 1; }
    .stat-pill__label { display: block; font-size: .7rem; color: var(--clr-text-muted); margin-top: .15rem; }
    .stat-pill--teal .stat-pill__value { color: var(--clr-teal); }
    .stat-pill--amber .stat-pill__value { color: var(--clr-amber); }
    .stat-pill--red .stat-pill__value { color: var(--clr-red); }
    .stat-pill--gray .stat-pill__value { color: var(--clr-gray); }
    .filters { display: flex; gap: .75rem; margin-bottom: 1rem; flex-wrap: wrap; }
    .search-box { flex: 1; min-width: 250px; position: relative; }
    .search-box svg { position: absolute; right: .75rem; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: var(--clr-text-muted); pointer-events: none; }
    .search-box__input { width: 100%; padding: .55rem .75rem .55rem 2.25rem; border: 1.5px solid var(--clr-border); border-radius: var(--radius-sm); font-family: inherit; font-size: .82rem; background: var(--clr-surface); color: var(--clr-text); outline: none; transition: border-color var(--transition); }
    .search-box__input:focus { border-color: var(--clr-brand); }
    .search-box__input::placeholder { color: var(--clr-text-muted); }
    .filters__selects { display: flex; gap: .5rem; }
    .select { padding: .55rem .75rem; border: 1.5px solid var(--clr-border); border-radius: var(--radius-sm); font-family: inherit; font-size: .8rem; background: var(--clr-surface); color: var(--clr-text); cursor: pointer; outline: none; }
    .select:focus { border-color: var(--clr-brand); }
    .empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 1rem; color: var(--clr-text-muted); }
    .empty svg { width: 48px; height: 48px; margin-bottom: .5rem; opacity: .35; }
    .empty p { font-size: .85rem; margin: 0; }
    .table-wrap { background: var(--clr-surface); border: 1px solid var(--clr-border); border-radius: var(--radius-lg); box-shadow: var(--shadow-card); overflow: hidden; }
    .table { width: 100%; border-collapse: collapse; }
    .table thead { background: var(--clr-bg); }
    .table th { padding: .7rem .85rem; font-size: .68rem; font-weight: 700; color: var(--clr-text-muted); text-align: right; text-transform: uppercase; letter-spacing: .3px; white-space: nowrap; }
    .table__row { border-bottom: 1px solid var(--clr-border); cursor: pointer; transition: background var(--transition); }
    .table__row:hover { background: #fafbfc; }
    .table__row:last-child { border-bottom: none; }
    .table td { padding: .65rem .85rem; font-size: .8rem; vertical-align: middle; }
    .table__num { font-family: 'SF Mono', 'Fira Code', monospace; font-weight: 700; font-size: .75rem; color: var(--clr-brand-dark); }
    .table__client { font-weight: 600; }
    .table__court { font-size: .75rem; color: var(--clr-text-secondary); max-width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .table__date { font-size: .75rem; font-family: 'SF Mono', 'Fira Code', monospace; color: var(--clr-text-muted); }
    .table__fees { font-weight: 700; white-space: nowrap; }
    .table__fees small { font-size: .65rem; color: var(--clr-text-muted); font-weight: 500; }
    .table__actions { display: flex; gap: .25rem; justify-content: center; }
    .action-btn { width: 28px; height: 28px; border-radius: 6px; border: none; background: transparent; color: var(--clr-text-muted); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all var(--transition); }
    .action-btn:hover { background: var(--clr-bg); color: var(--clr-text); }
    .action-btn--delete:hover { background: var(--clr-red-light); color: var(--clr-red); }
    .action-btn svg { width: 14px; height: 14px; }
    .status-badge { font-size: .62rem; font-weight: 700; padding: .12rem .4rem; border-radius: 5px; white-space: nowrap; }
    .status-badge--active { background: var(--clr-teal-light); color: var(--clr-teal); }
    .status-badge--pending { background: var(--clr-amber-light); color: var(--clr-amber); }
    .status-badge--urgent { background: var(--clr-red-light); color: var(--clr-red); }
    .status-badge--closed { background: var(--clr-gray-light); color: var(--clr-gray); }
    .type-badge { font-size: .62rem; font-weight: 700; padding: .12rem .4rem; border-radius: 5px; white-space: nowrap; }
    .type-badge--commercial { background: var(--clr-commercial-light); color: var(--clr-commercial); }
    .type-badge--family { background: var(--clr-family-light); color: var(--clr-family); }
    .type-badge--penal { background: var(--clr-penal-light); color: var(--clr-penal); }
    .type-badge--civil { background: var(--clr-civil-light); color: var(--clr-civil); }
    .type-badge--administrative { background: var(--clr-administrative-light); color: var(--clr-administrative); }
    .progress-cell { display: flex; align-items: center; gap: .4rem; min-width: 90px; }
    .progress-track { flex: 1; height: 4px; background: var(--clr-bg); border-radius: 2px; overflow: hidden; }
    .progress-fill { height: 100%; background: linear-gradient(90deg, var(--clr-teal), #14b8a6); border-radius: 2px; transition: width .4s cubic-bezier(.4,0,.2,1); }
    .progress-pct { font-size: .65rem; font-weight: 700; color: var(--clr-text-muted); min-width: 28px; }
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.4); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; animation: fadeIn .2s ease; }
    .modal-backdrop--stack { z-index: 1100; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .modal { background: var(--clr-surface); border-radius: var(--radius-lg); width: 90%; max-width: 600px; max-height: 85vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,.15); animation: slideUp .3s ease; }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    .modal--form { max-width: 500px; }
    .modal__header { display: flex; justify-content: space-between; align-items: flex-start; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--clr-border); }
    .modal__header h2 { font-size: 1.1rem; font-weight: 800; margin: 0; }
    .modal__sub { font-size: .75rem; color: var(--clr-text-muted); margin: .15rem 0 0; }
    .modal__close { width: 28px; height: 28px; border-radius: 6px; border: none; background: transparent; color: var(--clr-text-muted); font-size: 1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all var(--transition); }
    .modal__close:hover { background: var(--clr-bg); color: var(--clr-text); }
    .modal__body { padding: 1.25rem 1.5rem; }
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
    .detail-section h3 { font-size: .85rem; font-weight: 700; margin: 0 0 .65rem; }
    .detail-row { display: flex; justify-content: space-between; align-items: center; padding: .4rem 0; font-size: .8rem; }
    .detail-row span:first-child { color: var(--clr-text-secondary); }
    .detail-row strong { color: var(--clr-text); }
    .text-green { color: var(--clr-green) !important; }
    .text-amber { color: var(--clr-amber) !important; }
    .detail-progress { display: flex; align-items: center; gap: .5rem; margin-top: .5rem; }
    .detail-progress__track { flex: 1; height: 6px; background: var(--clr-bg); border-radius: 3px; overflow: hidden; }
    .detail-progress__fill { height: 100%; background: linear-gradient(90deg, var(--clr-teal), #14b8a6); border-radius: 3px; }
    .detail-progress span { font-size: .75rem; font-weight: 700; color: var(--clr-text-muted); }
    .detail-tab-actions { display: flex; justify-content: flex-end; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--clr-border); }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; margin-bottom: 1rem; }
    .form-field { display: flex; flex-direction: column; gap: .3rem; }
    .form-field label { font-size: .72rem; font-weight: 600; color: var(--clr-text-secondary); }
    .form-input { padding: .5rem .65rem; border: 1.5px solid var(--clr-border); border-radius: var(--radius-sm); font-family: inherit; font-size: .82rem; background: var(--clr-bg); color: var(--clr-text); outline: none; transition: border-color var(--transition); }
    .form-input:focus { border-color: var(--clr-brand); }
    .form-actions { display: flex; justify-content: flex-end; gap: .5rem; }
    @media (max-width: 1024px) { .table-wrap { overflow-x: auto; } .table { min-width: 900px; } }
    @media (max-width: 768px) { .stats-row { grid-template-columns: repeat(2, 1fr); } .detail-grid { grid-template-columns: 1fr; } .form-grid { grid-template-columns: 1fr; } }
    .modal--detail { max-width: 750px; }
    .modal-tabs { display: flex; flex-wrap: nowrap; gap: .15rem; overflow-x: auto; border-bottom: 1px solid var(--clr-border); padding: 0 1rem; -webkit-overflow-scrolling: touch; scrollbar-width: thin; }
    .modal-tab { flex-shrink: 0; padding: .65rem .85rem; border: none; background: transparent; font-family: inherit; font-size: .78rem; font-weight: 600; color: var(--clr-text-muted); cursor: pointer; border-bottom: 2px solid transparent; transition: all var(--transition); white-space: nowrap; }
    .modal-tab:hover { color: var(--clr-text); }
    .modal-tab--active { color: var(--clr-brand); border-bottom-color: var(--clr-brand); }
    .timeline-container { direction: rtl; }
    .timeline-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: .75rem; }
    .timeline-header h3 { font-size: .9rem; font-weight: 700; margin: 0; }
    .btn--sm { padding: .35rem .7rem; font-size: .75rem; }
    .btn--sm svg { width: 14px; height: 14px; }
    .timeline-actions { display: flex; gap: .4rem; }
    .timeline-filters { display: flex; flex-wrap: wrap; gap: .4rem; margin-bottom: 1rem; }
    .timeline-filter { display: inline-flex; align-items: center; gap: .3rem; padding: .3rem .6rem; border: 1.5px solid var(--clr-border); border-radius: 20px; background: transparent; font-family: inherit; font-size: .7rem; font-weight: 600; color: var(--clr-text-secondary); cursor: pointer; transition: all var(--transition); }
    .timeline-filter--active { border-color: var(--clr-brand); color: var(--clr-brand); background: var(--clr-red-light); }
    .timeline-filter__dot { width: 8px; height: 8px; border-radius: 50%; }
    .timeline-list { position: relative; padding-right: 1.5rem; max-height: 450px; overflow-y: auto; }
    .timeline-item { position: relative; padding-bottom: 1rem; }
    .timeline-item__line { position: absolute; right: 5px; top: 20px; bottom: 0; width: 2px; background: var(--clr-border); }
    .timeline-item:last-child .timeline-item__line { display: none; }
    .timeline-item__dot { position: absolute; right: 0; top: 6px; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 0 1px var(--clr-border); z-index: 1; }
    .timeline-item__card { display: flex; gap: .75rem; background: var(--clr-bg); border: 1px solid var(--clr-border); border-radius: var(--radius-md); padding: .75rem; margin-right: .5rem; }
    .timeline-item__date { font-size: .7rem; font-family: 'SF Mono', 'Fira Code', monospace; color: var(--clr-text-muted); white-space: nowrap; min-width: 75px; padding-top: .15rem; }
    .timeline-item__content { flex: 1; min-width: 0; }
    .timeline-item__head { display: flex; align-items: center; gap: .4rem; margin-bottom: .2rem; flex-wrap: wrap; }
    .timeline-item__type { font-size: .58rem; font-weight: 700; padding: .08rem .35rem; border-radius: 4px; }
    .timeline-item__head h4 { font-size: .8rem; font-weight: 700; margin: 0; color: var(--clr-text); }
    .timeline-item__content > p { font-size: .72rem; color: var(--clr-text-secondary); margin: 0 0 .2rem; line-height: 1.4; }
    .timeline-item__loc { display: flex; align-items: center; gap: .2rem; font-size: .68rem; color: var(--clr-text-muted); margin: 0 !important; }
    .timeline-item__loc svg { width: 11px; height: 11px; }
    .timeline-item__amount { font-size: .75rem; font-weight: 700; color: var(--clr-teal); margin: 0 !important; }
    .timeline-empty { text-align: center; padding: 2rem 1rem; color: var(--clr-text-muted); font-size: .8rem; }
    .timeline-add-form { background: var(--clr-bg); border: 1px solid var(--clr-border); border-radius: var(--radius-md); padding: .75rem; margin-bottom: .75rem; }
    .timeline-add-row { display: flex; gap: .5rem; margin-bottom: .5rem; }
    .timeline-add-row .form-input { flex: 1; min-width: 0; }
    .timeline-add-full { width: 100%; margin-bottom: .5rem; box-sizing: border-box; }
    .timeline-add-textarea { width: 100%; min-height: 56px; resize: vertical; margin-bottom: .5rem; box-sizing: border-box; font-family: inherit; }
    .timeline-add-actions { display: flex; justify-content: flex-end; gap: .4rem; margin-top: .25rem; }
    @media print { .modal-backdrop { position: static; background: none; } .modal { box-shadow: none; max-width: 100%; } .timeline-filters, .timeline-actions, .timeline-add-form, .detail-tab-actions, .docs-actions { display: none !important; } .timeline-list, .docs-list-simple { max-height: none; overflow: visible; } .timeline-item { break-inside: avoid; } }
    .docs-container { }
    .docs-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: .75rem; }
    .docs-header h3 { font-size: .9rem; font-weight: 700; margin: 0; }
    .docs-actions { display: flex; gap: .5rem; align-items: center; }
    .docs-list-simple { max-height: 450px; overflow-y: auto; }
    .docs-empty { text-align: center; padding: 1.25rem 1rem; color: var(--clr-text-muted); font-size: .8rem; background: var(--clr-bg); border-radius: var(--radius-md); margin-bottom: .5rem; border: 1px dashed var(--clr-border); }
    .docs-empty p { margin: 0; }
    .doc-item { display: flex; align-items: center; gap: .65rem; padding: .6rem .75rem; border: 1px solid var(--clr-border); border-radius: var(--radius-sm); margin-bottom: .4rem; transition: all var(--transition); }
    .doc-item:hover { box-shadow: 0 2px 8px rgba(0,0,0,.06); }
    .doc-item__icon { width: 36px; height: 36px; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .doc-item__icon svg { width: 18px; height: 18px; }
    .doc-item__icon--pdf { background: #fef2f2; color: #ea3f48; }
    .doc-item__icon--word { background: #eff6ff; color: #3b82f6; }
    .doc-item__icon--image { background: #f0fdf4; color: #16a34a; }
    .doc-item__info { flex: 1; min-width: 0; }
    .doc-item__head { display: flex; justify-content: space-between; align-items: center; gap: .4rem; margin-bottom: .15rem; }
    .doc-item__head h4 { font-size: .78rem; font-weight: 600; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .doc-item__version { font-size: .6rem; font-weight: 700; background: var(--clr-bg); padding: .08rem .3rem; border-radius: 4px; color: var(--clr-text-muted); white-space: nowrap; }
    .doc-item__meta { display: flex; align-items: center; flex-wrap: wrap; gap: .35rem .5rem; font-size: .65rem; color: var(--clr-text-muted); }
    .doc-item__folder { font-weight: 700; color: var(--clr-brand-dark); background: var(--clr-blue-light); padding: .06rem .35rem; border-radius: 4px; font-size: .58rem; }
    .doc-item__actions { display: flex; flex-shrink: 0; gap: .2rem; align-items: center; }
    .doc-item__btn { width: 30px; height: 30px; border: none; border-radius: 6px; background: transparent; color: var(--clr-text-muted); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all var(--transition); }
    .doc-item__btn svg { width: 14px; height: 14px; }
    .doc-item__btn--view:hover { background: var(--clr-teal-light); color: var(--clr-teal); }
    .doc-item__btn--print:hover { background: var(--clr-gray-light); color: var(--clr-text); }
    .doc-item__btn--share:hover { background: var(--clr-blue-light); color: var(--clr-blue); }
    .doc-item__btn--delete:hover { background: var(--clr-red-light); color: var(--clr-red); }
    .doc-preview-backdrop { position: fixed; inset: 0; z-index: 1200; background: rgba(15,23,42,.55); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; padding: 1rem; animation: fadeIn .2s ease; }
    .doc-preview { width: 100%; max-width: 900px; max-height: 90vh; display: flex; flex-direction: column; background: var(--clr-surface); border-radius: var(--radius-lg); box-shadow: 0 24px 80px rgba(0,0,0,.2); overflow: hidden; border: 1px solid var(--clr-border); }
    .doc-preview__header { display: flex; align-items: flex-start; justify-content: space-between; gap: .75rem; padding: .85rem 1rem; border-bottom: 1px solid var(--clr-border); background: var(--clr-bg); flex-shrink: 0; }
    .doc-preview__title { margin: 0; font-size: .95rem; font-weight: 800; color: var(--clr-text); line-height: 1.3; word-break: break-word; }
    .doc-preview__meta { margin: .2rem 0 0; font-size: .68rem; color: var(--clr-text-muted); }
    .doc-preview__actions { display: flex; gap: .25rem; flex-shrink: 0; }
    .doc-preview__icon-btn { width: 34px; height: 34px; border: none; border-radius: var(--radius-sm); background: transparent; color: var(--clr-text-secondary); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1rem; transition: all var(--transition); }
    .doc-preview__icon-btn:hover { background: var(--clr-surface); color: var(--clr-text); }
    .doc-preview__icon-btn svg { width: 16px; height: 16px; }
    .doc-preview__icon-btn--danger:hover { background: var(--clr-red-light); color: var(--clr-red); }
    .doc-preview__icon-btn--close:hover { background: var(--clr-gray-light); }
    .doc-preview__body { flex: 1; min-height: 320px; max-height: calc(90vh - 72px); overflow: auto; background: #f8f9fb; }
    .doc-preview__iframe { width: 100%; height: min(72vh, 640px); border: none; display: block; background: white; }
    .doc-preview__img-wrap { display: flex; align-items: center; justify-content: center; padding: 1rem; min-height: 320px; }
    .doc-preview__img { max-width: 100%; max-height: min(72vh, 640px); object-fit: contain; border-radius: var(--radius-sm); box-shadow: var(--shadow-card); }
    .doc-preview__word { padding: 2rem 1.5rem; text-align: center; max-width: 400px; margin: 0 auto; }
    .doc-preview__word-icon { width: 56px; height: 56px; margin: 0 auto 1rem; border-radius: var(--radius-md); background: #eff6ff; color: #3b82f6; display: flex; align-items: center; justify-content: center; }
    .doc-preview__word-icon svg { width: 28px; height: 28px; }
    .doc-preview__word-title { font-weight: 800; margin: 0 0 .5rem; font-size: 1rem; }
    .doc-preview__word-hint { font-size: .78rem; color: var(--clr-text-secondary); line-height: 1.6; margin: 0 0 1.25rem; }
    .doc-preview__word-actions { display: flex; flex-wrap: wrap; gap: .5rem; justify-content: center; }
    @media print { .doc-preview-backdrop { position: static; background: none; padding: 0; } .doc-preview { max-width: 100%; max-height: none; box-shadow: none; border: none; } .doc-preview__header .doc-preview__actions { display: none !important; } .doc-preview__body { max-height: none; overflow: visible; } }
    .tasks-container { }
    .tasks-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: .75rem; }
    .tasks-header h3 { font-size: .9rem; font-weight: 700; margin: 0; }
    .add-task-form { background: var(--clr-bg); border: 1px solid var(--clr-border); border-radius: var(--radius-md); padding: .75rem; margin-bottom: .75rem; }
    .add-task-row { display: flex; gap: .5rem; margin-bottom: .5rem; }
    .add-task-row .form-input { flex: 1; }
    .add-task-actions { display: flex; justify-content: flex-end; gap: .4rem; }
    .task-list { max-height: 400px; overflow-y: auto; }
    .task-item { display: flex; align-items: center; gap: .6rem; padding: .6rem .75rem; border: 1px solid var(--clr-border); border-radius: var(--radius-sm); margin-bottom: .4rem; transition: all var(--transition); }
    .task-item:hover { box-shadow: 0 2px 8px rgba(0,0,0,.06); }
    .task-item--done { opacity: .6; }
    .task-item--done .task-item__title--done { text-decoration: line-through; color: var(--clr-text-muted); }
    .task-status-btn { width: 28px; height: 28px; border-radius: 50%; border: 2px solid var(--clr-border); background: transparent; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all var(--transition); flex-shrink: 0; }
    .task-status-btn svg { width: 14px; height: 14px; }
    .task-status--TODO { border-color: var(--clr-text-muted); color: var(--clr-text-muted); }
    .task-status--IN_PROGRESS { border-color: var(--clr-amber); color: var(--clr-amber); }
    .task-status--DONE { border-color: var(--clr-green); background: var(--clr-green); color: white; }
    .task-priority { font-size: .58rem; font-weight: 700; padding: .08rem .35rem; border-radius: 4px; white-space: nowrap; }
    .task-priority--HIGH { background: var(--clr-red-light); color: var(--clr-red); }
    .task-priority--MEDIUM { background: var(--clr-amber-light); color: var(--clr-amber); }
    .task-priority--LOW { background: var(--clr-green-light); color: var(--clr-green); }
    .task-item__info { flex: 1; min-width: 0; }
    .task-item__head { display: flex; justify-content: space-between; align-items: center; gap: .4rem; margin-bottom: .15rem; }
    .task-item__head h4 { font-size: .78rem; font-weight: 600; margin: 0; }
    .task-item__meta { display: flex; align-items: center; gap: .5rem; font-size: .65rem; color: var(--clr-text-muted); }
    .task-due { display: inline-flex; align-items: center; gap: .2rem; }
    .task-due svg { width: 11px; height: 11px; }
    .task-due--overdue { color: #ea3f48; font-weight: 700; }
    .task-status-label { font-weight: 600; }
    .task-edit-btn { width: 24px; height: 24px; border-radius: 4px; border: none; background: transparent; color: var(--clr-text-muted); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all var(--transition); flex-shrink: 0; }
    .task-edit-btn:hover { background: var(--clr-bg); color: var(--clr-brand); }
    .task-edit-btn svg { width: 13px; height: 13px; }
    .task-delete-btn { width: 24px; height: 24px; border-radius: 4px; border: none; background: transparent; color: var(--clr-text-muted); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all var(--transition); flex-shrink: 0; }
    .task-delete-btn:hover { background: #fef2f2; color: #ea3f48; }
    .task-delete-btn svg { width: 13px; height: 13px; }
    .tasks-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem 1rem; color: var(--clr-text-muted); }
    .tasks-empty svg { width: 32px; height: 32px; margin-bottom: .4rem; opacity: .35; }
    .tasks-empty p { font-size: .78rem; margin: 0; }
    .notes-container { }
    .notes-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: .75rem; flex-wrap: wrap; gap: .5rem; }
    .notes-header h3 { font-size: .9rem; font-weight: 700; margin: 0; }
    .notes-actions { display: flex; gap: .5rem; align-items: center; }
    .notes-search { position: relative; }
    .notes-search svg { position: absolute; right: .5rem; top: 50%; transform: translateY(-50%); width: 14px; height: 14px; color: var(--clr-text-muted); pointer-events: none; }
    .notes-search__input { padding: .35rem .5rem .35rem 1.75rem; border: 1.5px solid var(--clr-border); border-radius: var(--radius-sm); font-family: inherit; font-size: .75rem; background: var(--clr-bg); color: var(--clr-text); outline: none; width: 180px; }
    .notes-search__input:focus { border-color: var(--clr-brand); }
    .notes-list { max-height: 450px; overflow-y: auto; display: flex; flex-direction: column; gap: .5rem; }
    .note-card { border: 1px solid var(--clr-border); border-radius: var(--radius-md); padding: .85rem; background: var(--clr-surface); transition: all var(--transition); }
    .note-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,.06); }
    .note-card__head { margin-bottom: .5rem; }
    .note-card__head h4 { font-size: .85rem; font-weight: 700; margin: 0 0 .25rem; }
    .note-card__meta { display: flex; align-items: center; gap: .5rem; font-size: .65rem; color: var(--clr-text-muted); flex-wrap: wrap; }
    .note-card__linked { display: inline-flex; align-items: center; gap: .15rem; }
    .note-card__linked svg { width: 11px; height: 11px; }
    .note-card__version { background: var(--clr-bg); padding: .05rem .25rem; border-radius: 3px; }
    .note-card__content { font-size: .78rem; color: var(--clr-text-secondary); line-height: 1.6; padding: .5rem 0; border-top: 1px solid var(--clr-border); }
    .note-card__content :first-child { margin-top: 0; }
    .note-card__content :last-child { margin-bottom: 0; }
    .note-card__content ul { padding-right: 1.25rem; margin: .25rem 0; }
    .note-card__content strong { color: var(--clr-text); }
    .note-card__actions { display: flex; gap: .25rem; justify-content: flex-end; }
    .note-action-btn { width: 26px; height: 26px; border-radius: 5px; border: none; background: transparent; color: var(--clr-text-muted); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all var(--transition); }
    .note-action-btn:hover { background: var(--clr-bg); color: var(--clr-text); }
    .note-action-btn--delete:hover { background: var(--clr-red-light); color: var(--clr-red); }
    .note-action-btn svg { width: 13px; height: 13px; }
    .notes-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem 1rem; color: var(--clr-text-muted); }
    .notes-empty svg { width: 32px; height: 32px; margin-bottom: .4rem; opacity: .35; }
    .notes-empty p { font-size: .78rem; margin: 0; }
    .modal--note { max-width: 600px; }
    .note-form { display: flex; flex-direction: column; gap: .65rem; }
    .note-toolbar { display: flex; gap: .25rem; padding: .35rem; background: var(--clr-bg); border-radius: var(--radius-sm); border: 1px solid var(--clr-border); }
    .note-toolbar__btn { width: 28px; height: 28px; border: none; background: transparent; border-radius: 4px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all var(--transition); color: var(--clr-text-secondary); font-size: .75rem; }
    .note-toolbar__btn:hover { background: var(--clr-surface); color: var(--clr-text); }
    .note-toolbar__btn svg { width: 14px; height: 14px; }
    .note-toolbar__sep { width: 1px; background: var(--clr-border); margin: 0 .25rem; }
    .note-editor { min-height: 200px; max-height: 350px; overflow-y: auto; border: 1.5px solid var(--clr-border); border-radius: var(--radius-sm); padding: .75rem; font-family: inherit; font-size: .85rem; line-height: 1.7; background: var(--clr-surface); outline: none; transition: border-color var(--transition); }
    .note-editor:focus { border-color: var(--clr-brand); }
    .note-editor ul { padding-right: 1.25rem; }
  `],
})
export class EACasesPage {
  private events = inject(EventService);
  private casesState = inject(CasesStateService);
  private timelineService = inject(TimelineService);
  private documentsService = inject(DocumentsService);
  private tasksService = inject(TasksService);
  private notesService = inject(NotesService);
  private clientsService = inject(ClientsService);
  private destroyRef = inject(DestroyRef);
  private sanitizer = inject(DomSanitizer);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  readonly noteEditor = viewChild<ElementRef<HTMLDivElement>>('noteEditor');

  /** Bumps when tasks/notes mutate so computeds refresh (mock stores are not signal-backed). */
  private dataTick = signal(0);
  /** Bumps when case documents list changes (e.g. after upload). */
  private docRefreshTick = signal(0);

  docFolderFilters: { key: DocumentFolder | 'all'; label: string }[] = [
    { key: 'all', label: DOC_FOLDER_LABELS.all },
    { key: 'contracts', label: DOC_FOLDER_LABELS.contracts },
    { key: 'memos', label: DOC_FOLDER_LABELS.memos },
    { key: 'rulings', label: DOC_FOLDER_LABELS.rulings },
    { key: 'correspondence', label: DOC_FOLDER_LABELS.correspondence },
    { key: 'other', label: DOC_FOLDER_LABELS.other },
  ];

  constructor() {
    this.casesState
      .selectCases()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(cases => this.cases.set(cases));
    this.casesState.loadCases();

    this.events
      .on<{ caseId: number; documentId: number; name: string }>(AppEventType.DOCUMENT_UPLOADED)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(payload => {
        if (!payload?.caseId || !payload.name) return;
        this.appendCaseDocumentFromUpload(payload.caseId, payload.name);
        this.docRefreshTick.update(n => n + 1);
      });

    /**
     * `clientId` → search field (same as before).
     */
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(q => {
      const clientIdStr = q.get(WORKSPACE_QUERY.CLIENT_ID);
      if (clientIdStr) {
        const id = parseInt(clientIdStr, 10);
        if (!Number.isNaN(id)) {
          const cl = this.clientsService.getById(id);
          if (cl) {
            this.searchControl.setValue(cl.name);
            this.searchQuery.set(cl.name);
            this.urlClientSearchCanonical.set(cl.name.trim().toLowerCase());
          }
        }
      } else {
        this.urlClientSearchCanonical.set(null);
      }
    });

    /**
     * `case` / `doc` — aligned with `/espace-avocat/hearings` & dashboard: URL stays in sync while
     * the detail modal is open; `doc` is removed from the URL after opening a shared preview once.
     */
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
          this.resetDetailState();
          return;
        }
        const cid = parseInt(String(raw), 10);
        if (Number.isNaN(cid)) {
          this.clearInvalidCaseDeepLink();
          return;
        }
        const case_ = this.cases().find(c => c.id === cid);
        if (!case_) {
          this.clearInvalidCaseDeepLink();
          return;
        }
        this.applyCaseFromUrl(case_);
        const docIdStr = params[WORKSPACE_QUERY.DOC_ID];
        if (docIdStr) {
          const did = parseInt(String(docIdStr), 10);
          if (!Number.isNaN(did)) {
            const doc = this.documentsService.getAll().find(d => d.id === did && d.caseId === cid);
            if (doc) {
              queueMicrotask(() => {
                this.openDocumentPreview(doc);
                void this.router.navigate([], {
                  relativeTo: this.route,
                  queryParams: { [WORKSPACE_QUERY.DOC_ID]: null },
                  queryParamsHandling: 'merge',
                  replaceUrl: true,
                });
              });
            }
          }
        }
      });
  }

  searchControl = new FormControl('');
  statusControl = new FormControl('');
  typeControl = new FormControl('');

  searchQuery = signal('');
  /** Normalized client name from `clientId` query — used to drop `clientId` when search diverges. */
  urlClientSearchCanonical = signal<string | null>(null);
  statusFilter = signal('');
  typeFilter = signal('');

  // Advanced Search
  showSearchPanel = false;
  advSearchControl = new FormControl('');
  advStatusControl = new FormControl('');
  advTypeControl = new FormControl('');
  advDateFromControl = new FormControl('');
  advDateToControl = new FormControl('');
  advSearchQuery = signal('');
  savedSearches = signal<SavedSearch[]>([]);
  searchResults = signal<SearchResult[]>([]);

  onAdvSearch() {
    const query = (this.advSearchControl.value || '').toLowerCase();
    const status = this.advStatusControl.value || '';
    const type = this.advTypeControl.value || '';
    const dateFrom = this.advDateFromControl.value || '';
    const dateTo = this.advDateToControl.value || '';
    this.advSearchQuery.set(query);

    const results: SearchResult[] = [];

    // Search cases
    this.cases().forEach(c => {
      if (status && c.status !== status) return;
      if (type && c.type !== type) return;
      if (dateFrom && c.hearingDate && c.hearingDate < dateFrom) return;
      if (dateTo && c.hearingDate && c.hearingDate > dateTo) return;
      if (!query || (c.number || '').toLowerCase().includes(query) || c.clientName.toLowerCase().includes(query) || c.court.toLowerCase().includes(query)) {
        results.push({ type: 'case', id: c.id, title: `${c.number} - ${c.clientName}`, subtitle: c.court, icon: '📁', caseId: c.id });
      }
    });

    // Search clients
    this.clientsService.getAll().forEach(cl => {
      if (!query || cl.name.toLowerCase().includes(query) || cl.phone.includes(query) || cl.email.toLowerCase().includes(query)) {
        const idHint = cl.cin || cl.taxId || cl.vatNumber || '';
        results.push({ type: 'client', id: cl.id, title: cl.name, subtitle: cl.address || idHint, icon: '👤' });
      }
    });

    // Search documents
    this.documentsService.getAll().forEach(d => {
      if (!query || d.name.toLowerCase().includes(query) || d.tags.some(t => t.toLowerCase().includes(query))) {
        const case_ = this.cases().find(c => c.id === d.caseId);
        results.push({ type: 'document', id: d.id, title: d.name, subtitle: `${case_?.clientName || ''} · ${d.size}`, icon: '📄', caseId: d.caseId });
      }
    });

    // Search notes
    this.notesService.getAll().forEach(n => {
      if (!query || (n.title ?? '').toLowerCase().includes(query) || n.content.toLowerCase().includes(query)) {
        const case_ = this.cases().find(c => c.id === n.caseId);
        results.push({ type: 'note', id: n.id, title: n.title ?? 'ملاحظة', subtitle: `${case_?.clientName || ''} · ${n.updatedAt ?? n.createdAt}`, icon: '📝', caseId: n.caseId });
      }
    });

    this.searchResults.set(results.slice(0, 50));
  }

  onSearchResultClick(result: SearchResult) {
    if (result.type === 'client') {
      this.searchControl.setValue(result.title);
      this.searchQuery.set(result.title.toLowerCase());
      this.showSearchPanel = false;
      return;
    }
    if (result.caseId) {
      const case_ = this.cases().find(c => c.id === result.caseId);
      if (case_) this.viewCase(case_);
    }
  }

  saveSearch() {
    const query = this.advSearchQuery();
    if (!query) return;
    const newId = this.savedSearches().length > 0 ? Math.max(...this.savedSearches().map(s => s.id), 0) + 1 : 1;
    this.savedSearches.update(s => [...s, {
      id: newId,
      query,
      filters: {
        status: this.advStatusControl.value || undefined,
        type: this.advTypeControl.value || undefined,
        dateFrom: this.advDateFromControl.value || undefined,
        dateTo: this.advDateToControl.value || undefined,
      },
      createdAt: this.todayStr,
    }]);
  }

  loadSavedSearch(s: SavedSearch) {
    this.advSearchControl.setValue(s.query);
    this.advStatusControl.setValue(s.filters.status || '');
    this.advTypeControl.setValue(s.filters.type || '');
    this.advDateFromControl.setValue(s.filters.dateFrom || '');
    this.advDateToControl.setValue(s.filters.dateTo || '');
    this.onAdvSearch();
  }

  deleteSavedSearch(id: number) {
    this.savedSearches.update(s => s.filter(x => x.id !== id));
  }

  cases = signal<Case[]>([]);

  statusStats = computed(() => [
    { label: 'نشط', count: this.cases().filter(c => c.status === 'active').length, color: 'teal' },
    { label: 'معلق', count: this.cases().filter(c => c.status === 'pending').length, color: 'amber' },
    { label: 'عاجل', count: this.cases().filter(c => c.status === 'urgent').length, color: 'red' },
    { label: 'منجز', count: this.cases().filter(c => c.status === 'closed').length, color: 'gray' },
  ]);

  filteredCases = computed(() => {
    let result = this.cases();
    const search = (this.searchQuery() || '').trim().toLowerCase();
    const status = this.statusFilter();
    const type = this.typeFilter();
    if (search) result = result.filter(c => (c.number || '').toLowerCase().includes(search) || c.clientName.toLowerCase().includes(search) || c.court.toLowerCase().includes(search));
    if (status) result = result.filter(c => c.status === status);
    if (type) result = result.filter(c => c.type === type);
    return result;
  });

  selectedCase = signal<Case | null>(null);
  modalTab = signal<'info' | 'timeline' | 'docs' | 'tasks' | 'notes'>('info');
  timelineFilter = signal<TimelineEventType | 'all'>('all');
  timelineFilters = [
    { key: 'all' as const, label: 'الكل', color: '#6b7280' },
    { key: 'hearing' as const, label: 'الجلسات', color: '#ea3f48' },
    { key: 'deadline' as const, label: 'الآجال', color: '#f59e0b' },
    { key: 'document' as const, label: 'الوثائق', color: '#3b82f6' },
    { key: 'note' as const, label: 'الملاحظات', color: '#8b5cf6' },
    { key: 'payment' as const, label: 'المدفوعات', color: '#16a34a' },
  ];

  /** Invalidates timeline list after local CRUD on `timelineEvents`. */
  private timelineTick = signal(0);

  filteredTimeline = computed(() => {
    this.timelineTick();
    const case_ = this.selectedCase();
    if (!case_) return [];
    let events = this.timelineService.getByCaseId(case_.id);
    const filter = this.timelineFilter();
    if (filter !== 'all') events = events.filter(e => e.type === filter);
    return events;
  });

  timelineEmptyLabel = computed(() => {
    this.timelineTick();
    const case_ = this.selectedCase();
    if (!case_) return '';
    const allForCase = this.timelineService.getAll().filter(e => e.caseId === case_.id);
    if (allForCase.length === 0) return 'لا توجد أحداث مسجّلة لهذا الملف.';
    if (this.timelineFilter() !== 'all') return 'لا توجد أحداث في التصفية الحالية — جرّب «الكل».';
    return 'لا توجد أحداث.';
  });

  showAddTimeline = false;
  newTimelineDate = '';
  newTimelineTitle = '';
  newTimelineDescription = '';
  newTimelineLocation = '';
  newTimelineAmount = 0;
  newTimelineType: TimelineEventType = 'note';

  toggleAddTimeline() {
    this.showAddTimeline = !this.showAddTimeline;
    if (this.showAddTimeline && !this.newTimelineDate) {
      this.newTimelineDate = this.todayStr;
    }
  }

  cancelAddTimeline() {
    this.showAddTimeline = false;
    this.newTimelineDate = '';
    this.newTimelineTitle = '';
    this.newTimelineDescription = '';
    this.newTimelineLocation = '';
    this.newTimelineAmount = 0;
    this.newTimelineType = 'note';
  }

  addTimelineEvent() {
    const case_ = this.selectedCase();
    if (!case_ || !this.newTimelineDate?.trim() || !this.newTimelineTitle?.trim()) return;
    const newId = Math.max(0, ...this.timelineService.getAll().map(e => e.id)) + 1;
    const evt: CaseTimelineEvent = {
      id: newId,
      caseId: case_.id,
      date: this.newTimelineDate.trim(),
      type: this.newTimelineType,
      title: this.newTimelineTitle.trim(),
      description: this.newTimelineDescription.trim() || '—',
    };
    const loc = this.newTimelineLocation.trim();
    if (loc) evt.location = loc;
    if (this.newTimelineType === 'payment' && this.newTimelineAmount > 0) {
      evt.amount = this.newTimelineAmount;
    }
    this.timelineService.add(evt);
    this.timelineTick.update(n => n + 1);
    this.cancelAddTimeline();
  }

  getEventTypeColor(type: TimelineEventType): string {
    const colors: Record<TimelineEventType, string> = { hearing: '#ea3f48', deadline: '#f59e0b', document: '#3b82f6', note: '#8b5cf6', payment: '#16a34a' };
    return colors[type];
  }

  getEventTypeLabel(type: TimelineEventType): string {
    const labels: Record<TimelineEventType, string> = { hearing: 'جلسة', deadline: 'أجل', document: 'وثيقة', note: 'ملاحظة', payment: 'دفعة' };
    return labels[type];
  }

  printTimeline() {
    window.print();
  }

  // Documents
  docFolderFilter = signal<DocumentFolder | 'all'>('all');

  filteredDocuments = computed(() => {
    this.docRefreshTick();
    const case_ = this.selectedCase();
    if (!case_) return [];
    let docs = this.documentsService.getByCaseId(case_.id);
    const folder = this.docFolderFilter();
    if (folder !== 'all') docs = docs.filter(d => d.folder === folder);
    return docs;
  });

  docsEmptyMessage = computed(() => {
    this.docRefreshTick();
    const case_ = this.selectedCase();
    if (!case_) return '';
    const all = this.documentsService.getAll().filter(d => d.caseId === case_.id);
    if (all.length === 0) return 'لا توجد وثائق بعد — استخدم «رفع وثيقة».';
    if (this.docFolderFilter() !== 'all') return 'لا توجد وثائق في هذا التصنيف.';
    return '';
  });

  docFolderLabel(folder: DocumentFolder): string {
    return DOC_FOLDER_LABELS[folder];
  }

  /** Inline preview modal for a case document. */
  viewingDocument = signal<CaseDocument | null>(null);

  openDocumentPreview(doc: CaseDocument) {
    this.viewingDocument.set(doc);
  }

  closeDocumentPreview() {
    this.viewingDocument.set(null);
    if (this.route.snapshot.queryParamMap.get(WORKSPACE_QUERY.DOC_ID)) {
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { [WORKSPACE_QUERY.DOC_ID]: null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    }
  }

  /** Bad `?case=` (non-numeric or unknown id): clear URL and tell the user. */
  private clearInvalidCaseDeepLink() {
    this.snackBar.open('الملف غير موجود', 'إغلاق', { duration: 4500 });
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        [WORKSPACE_QUERY.CASE_ID]: null,
        [WORKSPACE_QUERY.DOC_ID]: null,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  safePdfPreviewUrl(doc: CaseDocument): SafeResourceUrl {
    const raw = doc.url?.trim() ? doc.url! : DEMO_PDF_PREVIEW_URL;
    return this.sanitizer.bypassSecurityTrustResourceUrl(raw);
  }

  imagePreviewUrl(doc: CaseDocument): string {
    return doc.url?.trim() ? doc.url! : `https://picsum.photos/seed/onat-doc-${doc.id}/960/720`;
  }

  documentShareLink(doc: CaseDocument): string {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const c = WORKSPACE_QUERY.CASE_ID;
    const d = WORKSPACE_QUERY.DOC_ID;
    return `${origin}/espace-avocat/cases?${c}=${doc.caseId}&${d}=${doc.id}`;
  }

  async shareDocument(doc: CaseDocument) {
    const url = this.documentShareLink(doc);
    const title = doc.name;
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share({ title, text: `وثيقة من ملف القضية: ${title}`, url });
        return;
      }
    } catch {
      /* cancelled or unsupported */
    }
    this.copyTextToClipboard(url, 'تم نسخ رابط المشاركة');
  }

  private copyTextToClipboard(text: string, successMessage: string) {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(() => alert(successMessage))
        .catch(() => alert(`انسخ الرابط يدوياً:\n${text}`));
    } else {
      alert(`انسخ الرابط:\n${text}`);
    }
  }

  printSingleDocument(doc: CaseDocument) {
    const case_ = this.cases().find(c => c.id === doc.caseId);
    const html = `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"/><title>${this.escapeHtml(doc.name)}</title>
<style>
body{font-family:'Cairo','Segoe UI',sans-serif;padding:28px;color:#1a1d23}
h1{font-size:20px;margin:0 0 8px}
.sub{color:#6b7280;font-size:13px;margin-bottom:24px}
dl{display:grid;grid-template-columns:120px 1fr;gap:10px 16px;font-size:14px}
dt{color:#6b7280;margin:0}
dd{margin:0;font-weight:600}
.foot{margin-top:32px;font-size:12px;color:#9ca3af;border-top:1px solid #e8eaed;padding-top:16px}
</style></head><body>
<h1>${this.escapeHtml(doc.name)}</h1>
<p class="sub">ملف القضية: ${this.escapeHtml(case_?.number || '—')} — ${this.escapeHtml(case_?.clientName || '')}</p>
<dl>
<dt>التصنيف</dt><dd>${this.escapeHtml(this.docFolderLabel(doc.folder))}</dd>
<dt>الإصدار</dt><dd>v${doc.version}</dd>
<dt>تاريخ الرفع</dt><dd>${this.escapeHtml(doc.uploadDate)}</dd>
<dt>الحجم</dt><dd>${this.escapeHtml(doc.size)}</dd>
</dl>
<p class="foot">بطاقة معلومات الوثيقة — للنسخة الكاملة استخدم المنصة بعد ربط التخزين.</p>
</body></html>`;
    const w = window.open('', '_blank');
    if (!w) {
      alert('يُرجى السماح بالنوافذ المنبثقة لاستخدام الطباعة');
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 200);
  }

  private escapeHtml(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  deleteCaseDocument(doc: CaseDocument) {
    if (!confirm(`حذف الوثيقة «${doc.name}»؟`)) return;
    this.documentsService.delete(doc.id);
    if (this.viewingDocument()?.id === doc.id) {
      this.viewingDocument.set(null);
    }
    this.docRefreshTick.update(n => n + 1);
  }

  private appendCaseDocumentFromUpload(caseId: number, name: string) {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    const fileType: DocumentFileType =
      ext === 'pdf' ? 'pdf' : ['doc', 'docx'].includes(ext) ? 'word' : 'image';
    const newId = Math.max(0, ...this.documentsService.getAll().map(d => d.id)) + 1;
    const today = new Date().toISOString().split('T')[0];
    this.documentsService.add({
      id: newId,
      caseId,
      name,
      folder: 'other',
      fileType,
      size: '—',
      uploadDate: today,
      version: 1,
      tags: ['رفع'],
    });
  }

  printDocuments() {
    window.print();
  }

  shareTimeline() {
    const case_ = this.selectedCase();
    if (!case_) return;
    const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/espace-avocat/cases?timeline=${case_.id}`;
    const onCopied = () => alert(`تم نسخ الرابط:\n${link}`);
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(link).then(onCopied).catch(() => alert(`انسخ الرابط يدوياً:\n${link}`));
    } else {
      alert(`انسخ الرابط:\n${link}`);
    }
  }

  // Tasks
  showAddTask = false;
  editingTask: Task | null = null;
  newTaskTitle = '';
  newTaskDueDate = '';
  newTaskPriority: TaskPriority = 'MEDIUM';
  todayStr = new Date().toISOString().split('T')[0];

  caseTasks = computed(() => {
    this.dataTick();
    const case_ = this.selectedCase();
    if (!case_) return [];
    return this.tasksService.getByCaseId(case_.id);
  });

  taskPriorityLabels: Record<TaskPriority, string> = { HIGH: '🔴 عالي', MEDIUM: '🟡 متوسط', LOW: '🟢 منخفض' };
  taskStatusLabels: Record<TaskStatus, string> = { TODO: 'قيد الانتظار', IN_PROGRESS: 'قيد التنفيذ', DONE: 'مكتمل' };

  cycleTaskStatus(task: Task) {
    const order: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE'];
    const idx = order.indexOf(task.status);
    task.status = order[(idx + 1) % 3];
    this.dataTick.update(n => n + 1);
  }

  openNewTaskForm() {
    this.editingTask = null;
    this.newTaskTitle = '';
    this.newTaskDueDate = '';
    this.newTaskPriority = 'MEDIUM';
    this.showAddTask = true;
  }

  startEditTask(task: Task) {
    this.editingTask = task;
    this.newTaskTitle = task.title;
    this.newTaskDueDate = task.dueDate || '';
    this.newTaskPriority = task.priority;
    this.showAddTask = true;
  }

  cancelTaskForm() {
    this.showAddTask = false;
    this.editingTask = null;
    this.newTaskTitle = '';
    this.newTaskDueDate = '';
    this.newTaskPriority = 'MEDIUM';
  }

  saveTask() {
    if (!this.newTaskTitle.trim() || !this.newTaskDueDate) return;
    const case_ = this.selectedCase();
    if (!case_) return;
    if (this.editingTask) {
      this.editingTask.title = this.newTaskTitle.trim();
      this.editingTask.dueDate = this.newTaskDueDate;
      this.editingTask.priority = this.newTaskPriority;
      this.editingTask.updatedAt = this.todayStr;
    } else {
      const newId = Math.max(0, ...this.tasksService.getAll().map(t => t.id)) + 1;
      this.tasksService.add({
        id: newId,
        caseId: case_.id,
        title: this.newTaskTitle.trim(),
        dueDate: this.newTaskDueDate,
        priority: this.newTaskPriority,
        status: 'TODO',
        createdAt: this.todayStr,
      });
    }
    this.cancelTaskForm();
    this.dataTick.update(n => n + 1);
  }

  deleteTask(id: number) {
    this.tasksService.delete(id);
    this.dataTick.update(n => n + 1);
  }

  // Notes
  noteSearchControl = new FormControl('');
  noteSearchQuery = signal('');
  showNoteModal = false;
  editingNote: Note | null = null;
  noteFormTitle = '';
  noteFormContent = '';

  // Document upload
  uploadCaseId = signal<number | null>(null);

  onDocumentUploaded() {
    this.uploadCaseId.set(null);
    this.docRefreshTick.update(n => n + 1);
  }

  filteredNotes = computed(() => {
    this.dataTick();
    const case_ = this.selectedCase();
    if (!case_) return [];
    let notes = this.notesService.getByCaseId(case_.id);
    const search = this.noteSearchQuery().toLowerCase();
    if (search) notes = notes.filter(n => (n.title ?? '').toLowerCase().includes(search) || n.content.toLowerCase().includes(search));
    return notes;
  });

  onNoteSearch() {
    this.noteSearchQuery.set(this.noteSearchControl.value || '');
  }

  addNote() {
    this.editingNote = null;
    this.noteFormTitle = '';
    this.noteFormContent = '';
    this.showNoteModal = true;
  }

  editNote(note: Note) {
    this.editingNote = note;
    this.noteFormTitle = note.title ?? '';
    this.noteFormContent = note.content;
    this.showNoteModal = true;
  }

  closeNoteModal() {
    this.showNoteModal = false;
    this.editingNote = null;
  }

  execCmd(cmd: string) {
    const el = this.noteEditor()?.nativeElement;
    if (!el) return;
    el.focus();
    document.execCommand(cmd, false);
    this.noteFormContent = el.innerHTML;
  }

  onNoteEditorInput(event: Event) {
    const el = event.target as HTMLElement;
    this.noteFormContent = el.innerHTML;
  }

  saveNote() {
    const plain = this.plainTextFromHtml(this.noteFormContent);
    if (!plain) return;
    const title = this.noteFormTitle.trim() || undefined;
    const case_ = this.selectedCase();
    if (!case_) return;
    const today = this.todayStr;
    if (this.editingNote) {
      this.editingNote.title = title;
      this.editingNote.content = this.noteFormContent;
      this.editingNote.updatedAt = today;
    } else {
      const newId = Math.max(0, ...this.notesService.getAll().map(n => n.id)) + 1;
      this.notesService.add({
        id: newId,
        caseId: case_.id,
        title,
        content: this.noteFormContent,
        createdAt: today,
        updatedAt: today,
      });
    }
    this.closeNoteModal();
    this.dataTick.update(n => n + 1);
  }

  private plainTextFromHtml(html: string): string {
    if (typeof document === 'undefined') {
      return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }
    const d = document.createElement('div');
    d.innerHTML = html;
    return (d.textContent || '').replace(/\s+/g, ' ').trim();
  }

  deleteNote(id: number) {
    this.notesService.delete(id);
    this.dataTick.update(n => n + 1);
  }
  showFormModal = false;
  editingCase: Case | null = null;
  formNumber = ''; formClient = ''; formType: CaseType = 'commercial';
  formCourt = ''; formStatus: CaseStatus = 'active';
  formHearingDate = ''; formFees = 0; formPaid = 0;

  typeLabels: Record<string, string> = { commercial: 'تجاري', family: 'عائلي', penal: 'جزائي', civil: 'مدني', administrative: 'إداري' };
  statusLabels: Record<string, string> = { active: 'نشط', pending: 'معلق', urgent: 'عاجل', closed: 'منجز' };

  onSearch() {
    this.searchQuery.set(this.searchControl.value || '');
    const q = (this.searchControl.value || '').trim().toLowerCase();
    const canonical = this.urlClientSearchCanonical();
    const hasClientInUrl = !!this.route.snapshot.queryParamMap.get(WORKSPACE_QUERY.CLIENT_ID);
    if (hasClientInUrl && canonical !== null && q !== canonical) {
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { [WORKSPACE_QUERY.CLIENT_ID]: null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    }
  }
  onFilter() { this.statusFilter.set(this.statusControl.value || ''); this.typeFilter.set(this.typeControl.value || ''); }

  /** Opens / selects a dossier — URL is source of truth (see constructor `queryParams` sync). */
  viewCase(case_: Case) {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { [WORKSPACE_QUERY.CASE_ID]: case_.id },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  closeDetail() {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        [WORKSPACE_QUERY.CASE_ID]: null,
        [WORKSPACE_QUERY.DOC_ID]: null,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private applyCaseFromUrl(case_: Case) {
    this.selectedCase.set(case_);
    this.modalTab.set('info');
    this.timelineFilter.set('all');
    this.docFolderFilter.set('all');
    this.cancelAddTimeline();
    this.cancelTaskForm();
    this.viewingDocument.set(null);
  }

  private resetDetailState() {
    this.selectedCase.set(null);
    this.showAddTimeline = false;
    this.cancelAddTimeline();
    this.cancelTaskForm();
    this.viewingDocument.set(null);
  }

  editCaseFromDetail() {
    const c = this.selectedCase();
    if (c) this.editCase(c);
  }

  remainingFees(c: Case): number {
    return Math.max(0, c.fees - c.paidFees);
  }
  private resolveClientIdByName(name: string): number | null {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const clients = this.clientsService.getAll();
    const hit = clients.find(c => c.name.trim().toLowerCase() === trimmed.toLowerCase());
    return hit?.id ?? null;
  }
  openAddModal() { this.editingCase = null; this.formNumber = ''; this.formClient = ''; this.formType = 'commercial'; this.formCourt = ''; this.formStatus = 'active'; this.formHearingDate = ''; this.formFees = 0; this.formPaid = 0; this.showFormModal = true; }
  editCase(case_: Case) { this.editingCase = case_; this.formNumber = case_.number || ''; this.formClient = case_.clientName; this.formType = case_.type; this.formCourt = case_.court; this.formStatus = case_.status; this.formHearingDate = case_.hearingDate; this.formFees = case_.fees; this.formPaid = case_.paidFees; this.showFormModal = true; }
  closeFormModal() { this.showFormModal = false; this.editingCase = null; }
  saveCase() {
    if (!this.formClient.trim() || !this.formCourt.trim()) return;
    const clientId = this.resolveClientIdByName(this.formClient);
    if (!clientId) {
      this.snackBar.open('الرجاء اختيار حريف موجود (نفس الاسم في سجل العملاء).', 'حسناً', { duration: 3500 });
      return;
    }
    const progress =
      this.formFees > 0 ? Math.min(100, Math.round((this.formPaid / this.formFees) * 100)) : 0;
    if (this.editingCase) {
      const eid = this.editingCase.id;
      const current = this.cases().find(c => c.id === eid);
      if (!current) return;
      this.casesState.updateCase(eid, {
        number: this.formNumber.trim() || current.number,
        title: current.title || this.formClient.trim(),
        clientId,
        clientName: this.formClient.trim(),
        type: this.formType,
        court: this.formCourt.trim(),
        status: this.formStatus,
        hearingDate: this.formHearingDate,
        fees: this.formFees,
        paidFees: this.formPaid,
      });
      if (this.selectedCase()?.id === eid) {
        this.selectedCase.set({
          ...current,
          number: this.formNumber.trim() || current.number,
          clientId,
          clientName: this.formClient.trim(),
          type: this.formType,
          court: this.formCourt.trim(),
          status: this.formStatus,
          hearingDate: this.formHearingDate,
          fees: this.formFees,
          paidFees: this.formPaid,
          progress,
        });
      }
    } else {
      const nextId = Math.max(0, ...this.cases().map(c => c.id)) + 1;
      this.casesState.createCase({
        number: this.formNumber.trim() || `2026/${String(nextId).padStart(4, '0')}`,
        title: this.formClient.trim(),
        clientId,
        clientName: this.formClient.trim(),
        type: this.formType,
        court: this.formCourt.trim(),
        status: this.formStatus,
        fees: this.formFees,
        paidFees: this.formPaid,
        hearingDate: this.formHearingDate,
      });
    }
    this.closeFormModal();
  }
  deleteCase(id: number) {
    if (this.selectedCase()?.id === id) this.closeDetail();
    this.casesState.deleteCase(id);
  }
}
