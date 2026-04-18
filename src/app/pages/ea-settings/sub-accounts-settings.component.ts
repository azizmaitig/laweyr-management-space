import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ALL_ACCESS_OPTIONS,
  DEFAULT_ACCESS_BY_KIND,
  READ_ONLY_ACCESS_PRESET,
  SUB_ACCOUNT_ACCESS_GROUPS,
  SUB_ACCOUNT_ACCESS_LABELS,
  SUB_ACCOUNT_KIND_LABELS,
  SUB_ACCOUNT_STATUS_LABELS,
  normalizeSubAccountAccess,
  type LawyerSubAccount,
  type SubAccountAccess,
  type SubAccountKind,
} from '../../core/models/lawyer-subaccount.model';
import { LawyerSubAccountsService } from '../../core/services/lawyer-sub-accounts.service';
import { CasesStateService } from '../../features/cases/services/cases-state.service';
import type { Case } from '../../core/models';

type FilterTab = SubAccountKind | 'ALL';

@Component({
  selector: 'app-sub-accounts-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSnackBarModule],
  template: `
    <div class="sub-accounts">
      <header class="sa-intro">
        <div class="sa-intro__mark" aria-hidden="true">👥</div>
        <div class="sa-intro__body">
          <p class="sa-intro__text">
            اضبط ما يراه ويعدّله كل مستخدم. تفعيل <strong>التعديل</strong> يفعّل <strong>العرض</strong> تلقائياً للمجال نفسه.
            استخدم المحرّر لكل حساب أو القوالب السريعة لتوفير الوقت.
          </p>
          <details class="sa-intro__details">
            <summary>واجهة البرمجة</summary>
            <p class="sa-intro__api">التزامن مع الخادم عبر <code>GET / PATCH</code> على المسار <code>/lawyers/me/sub-accounts</code>.</p>
          </details>
        </div>
      </header>

      @if (subAccounts.error()) {
        <div class="sa-alert" role="alert">
          <span class="sa-alert__icon" aria-hidden="true">!</span>
          <span class="sa-alert__msg">{{ subAccounts.error() }}</span>
          <span class="sa-alert__actions">
            <button type="button" class="sa-text-btn" (click)="subAccounts.clearError()">إخفاء</button>
            <button type="button" class="sa-text-btn sa-text-btn--strong" (click)="subAccounts.load()">إعادة التحميل</button>
          </span>
        </div>
      }
      @if (subAccounts.loading()) {
        <div class="sa-status sa-status--load">
          <span class="sa-status__dot"></span>
          جاري تحميل الحسابات الفرعية…
        </div>
      }
      @if (subAccounts.syncInFlight()) {
        <div class="sa-status sa-status--sync">
          <span class="sa-status__dot"></span>
          جاري المزامنة مع الخادم…
        </div>
      }

      @if (inviteAfterCreate(); as inv) {
        <div class="sa-invite">
          <div class="sa-invite__accent" aria-hidden="true"></div>
          <div class="sa-invite__inner">
            <div class="sa-invite__head">
              <span class="sa-invite__badge">جديد</span>
              <h3 class="sa-invite__title">تم إنشاء الحساب — شارك رابط الدعوة</h3>
            </div>
            <p class="sa-invite__text">
              الحالة <strong>{{ statusLabel(inv.status) }}</strong> حتى أول تسجيل دخول عبر الرابط، ثم يصبح الحساب
              <strong>مفعّلاً</strong> تلقائياً.
            </p>
            <label class="sa-field-label" for="sa-invite-url">رابط الدعوة</label>
            <div class="sa-invite__row">
              <input id="sa-invite-url" class="sa-input sa-invite__url" readonly [value]="buildInviteUrl(inv)" />
              <button type="button" class="sa-btn sa-btn--soft sa-btn--sm" (click)="copyInviteLink(inv)">نسخ</button>
              <button
                type="button"
                class="sa-btn sa-btn--primary sa-btn--sm"
                [disabled]="inviteSendBusy()"
                (click)="sendInviteEmailFor(inv)"
              >
                إرسال بالبريد
              </button>
              <button type="button" class="sa-btn sa-btn--ghost sa-btn--sm" (click)="dismissInviteBanner()">إغلاق</button>
            </div>
          </div>
        </div>
      }

      <div class="sa-toolbar">
        <div class="sa-tabs" role="group" aria-label="تصفية حسب نوع الحساب">
          @for (tab of filterTabs; track tab.key) {
            <button
              type="button"
              class="sa-tab"
              [class.sa-tab--on]="filter() === tab.key"
              [attr.aria-pressed]="filter() === tab.key"
              (click)="filter.set(tab.key)"
            >
              {{ tab.label }}
            </button>
          }
        </div>
        <button
          type="button"
          class="sa-btn sa-btn--primary sa-btn--cta"
          [disabled]="subAccounts.loading()"
          (click)="toggleForm()"
        >
          {{ showForm() ? 'إغلاق النموذج' : '+ إضافة حساب فرعي' }}
        </button>
      </div>

      @if (showForm()) {
        <section class="sa-panel sa-panel--create" aria-labelledby="sa-create-heading">
          <div class="sa-panel__head">
            <span class="sa-panel__step">١</span>
            <div>
              <h3 id="sa-create-heading" class="sa-panel__title">حساب جديد</h3>
              <p class="sa-panel__sub">البيانات الأساسية ثم الصلاحيات أدناه</p>
            </div>
          </div>
          <div class="sa-chips">
            <span class="sa-chips__label">قوالب سريعة</span>
            <button type="button" class="sa-chip" (click)="applyDraftPreset('kind_default')">
              افتراضي {{ kindLabel(draftKind()) }}
            </button>
            <button type="button" class="sa-chip" (click)="applyDraftPreset('read_only')">قراءة فقط</button>
            <button type="button" class="sa-chip sa-chip--muted" (click)="applyDraftPreset('clear')">مسح الكل</button>
          </div>
          <div class="sa-form-grid">
            <div class="sa-field">
              <label class="sa-field-label" for="sa-draft-name">الاسم الكامل</label>
              <input id="sa-draft-name" class="sa-input" [(ngModel)]="draftName" placeholder="مثال: أحمد بن علي" />
            </div>
            <div class="sa-field">
              <label class="sa-field-label" for="sa-draft-email">البريد الإلكتروني</label>
              <input
                id="sa-draft-email"
                class="sa-input"
                type="email"
                [(ngModel)]="draftEmail"
                placeholder="name@example.tn"
              />
            </div>
              <div class="sa-field">
                <label class="sa-field-label" for="sa-draft-phone">رقم الهاتف</label>
                <input
                  id="sa-draft-phone"
                  class="sa-input"
                  type="tel"
                  [(ngModel)]="draftPhone"
                  placeholder="مثال: +216 12 345 678"
                />
              </div>
            <div class="sa-field">
              <label class="sa-field-label" for="sa-draft-kind">نوع الحساب</label>
              <select
                id="sa-draft-kind"
                class="sa-input sa-input--select"
                [ngModel]="draftKind()"
                (ngModelChange)="onKindChange($event)"
              >
                @for (k of kinds; track k) {
                  <option [ngValue]="k">{{ kindLabel(k) }}</option>
                }
              </select>
            </div>

            <div class="sa-case-scope">
              <div class="sa-case-scope__head">
                <div>
                  <div class="sa-case-scope__title">نطاق القضايا</div>
                  <div class="sa-case-scope__hint">اختر كل القضايا أو حدّد قضايا معيّنة لهذا الحساب.</div>
                </div>
              </div>
              <div class="sa-case-scope__modes">
                <label class="sa-radio">
                  <input
                    type="radio"
                    name="draft-case-scope"
                    [checked]="draftCaseScope() === 'ALL'"
                    (change)="onDraftCaseScopeChange('ALL')"
                  />
                  <span>كل القضايا</span>
                </label>
                <label class="sa-radio">
                  <input
                    type="radio"
                    name="draft-case-scope"
                    [checked]="draftCaseScope() === 'SELECTED'"
                    (change)="onDraftCaseScopeChange('SELECTED')"
                  />
                  <span>قضايا محدّدة</span>
                </label>
              </div>

              @if (draftCaseScope() === 'SELECTED') {
                <div class="sa-case-list">
                  @for (c of casesList(); track c.id) {
                    <label class="sa-checkrow">
                      <input
                        class="sa-check"
                        type="checkbox"
                        [checked]="isDraftCaseChecked(c.id)"
                        (change)="toggleDraftCase(c.id, $event)"
                      />
                      <span class="sa-checkrow__text">
                        <strong>#{{ c.number ?? c.id }}</strong>
                        <span class="sa-checkrow__sub">{{ c.title }}</span>
                      </span>
                    </label>
                  } @empty {
                    <div class="sa-case-empty">لا توجد قضايا للعرض.</div>
                  }
                </div>
              }
            </div>
          </div>
          <div class="sa-panel__divider">
            <span class="sa-panel__step sa-panel__step--inline">٢</span>
            <span class="sa-panel__divider-text">مجالات الصلاحية</span>
          </div>
          <ng-container *ngTemplateOutlet="permissionPanel; context: { mode: 'draft' }" />
          <div class="sa-panel__foot">
            <button
              type="button"
              class="sa-btn sa-btn--primary"
              [disabled]="!canSubmit() || subAccounts.syncInFlight()"
              (click)="submit()"
            >
              حفظ وإنشاء الحساب
            </button>
          </div>
        </section>
      }

      <div class="sa-list">
        @if (filtered().length === 0) {
          <div class="sa-empty">
            <div class="sa-empty__visual" aria-hidden="true">👥</div>
            <p class="sa-empty__title">لا توجد حسابات في هذا التصنيف</p>
            <p class="sa-empty__hint">أضف مستخدماً جديداً أو غيّر التصفية لعرض بقية الفريق.</p>
            <div class="sa-empty__actions">
              <button type="button" class="sa-btn sa-btn--primary sa-btn--sm" (click)="openCreateForm()">إضافة حساب فرعي</button>
              @if (filter() !== 'ALL') {
                <button type="button" class="sa-btn sa-btn--ghost sa-btn--sm" (click)="filter.set('ALL')">عرض الكل</button>
              }
            </div>
          </div>
        } @else {
          <div class="sa-table-wrap">
            <table class="sa-table">
              <thead>
                <tr>
                  <th>المستخدم</th>
                  <th>البريد</th>
                  <th>النوع</th>
                  <th>الدعوة</th>
                  <th>الصلاحيات</th>
                  <th>تشغيل</th>
                  <th class="sa-table__th-actions">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                @for (row of filtered(); track row.id) {
                  <tr class="sa-row" [class.sa-row--inactive]="!row.active" [class.sa-row--open]="editingUserId() === row.id">
                    <td>
                      <div class="sa-user">
                        <span class="sa-user__avatar">{{ rowInitials(row.name) }}</span>
                        <strong class="sa-user__name">{{ row.name }}</strong>
                      </div>
                    </td>
                    <td><span class="sa-mono">{{ row.email }}</span></td>
                    <td><span class="sa-badge" [class]="'sa-badge--' + row.kind.toLowerCase()">{{ kindLabel(row.kind) }}</span></td>
                    <td>
                      <span class="sa-pill" [class.sa-pill--pending]="row.status === 'PENDING'">
                        {{ statusLabel(row.status) }}
                      </span>
                      @if (row.status === 'PENDING' && row.inviteToken && !isPending(row)) {
                        <button type="button" class="sa-text-btn sa-text-btn--block" (click)="copyInviteLink(row)">
                          نسخ الرابط
                        </button>
                      }
                    </td>
                    <td>
                      <div class="sa-tags">{{ accessSummary(row) }}</div>
                      <span class="sa-perm-count">{{ row.access.length }} صلاحية</span>
                    </td>
                    <td>
                      <button
                        type="button"
                        class="sa-toggle"
                        [class.sa-toggle--on]="row.active"
                        [disabled]="isPending(row)"
                        [attr.aria-pressed]="row.active"
                        [attr.aria-label]="row.active ? 'تعطيل الحساب' : 'تفعيل الحساب'"
                        (click)="toggleRow(row)"
                      >
                        <span class="sa-toggle__knob"></span>
                      </button>
                    </td>
                    <td class="sa-table__td-actions">
                      <div class="sa-row-actions">
                        <button
                          type="button"
                          class="sa-btn sa-btn--sm"
                          [class.sa-btn--soft]="editingUserId() !== row.id"
                          [disabled]="isPending(row)"
                          (click)="togglePermissionEditor(row)"
                        >
                          {{ editingUserId() === row.id ? 'إغلاق' : 'الصلاحيات' }}
                        </button>
                        <button
                          type="button"
                          class="sa-icon-btn"
                          title="حذف الحساب"
                          (click)="remove(row)"
                        >
                          <span aria-hidden="true">🗑</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                  @if (editingUserId() === row.id) {
                    <tr class="sa-editor-row">
                      <td colspan="7">
                        <div class="sa-editor">
                          <div class="sa-editor__head">
                            <div>
                              <h4 class="sa-editor__title">تعديل صلاحيات {{ row.name }}</h4>
                              <p class="sa-editor__sub">التغييرات تُحفظ عند الضغط على «حفظ الصلاحيات»</p>
                            </div>
                            <div class="sa-chips sa-chips--compact">
                              <button type="button" class="sa-chip" (click)="applyEditPreset(row, 'kind_default')">
                                افتراضي {{ kindLabel(row.kind) }}
                              </button>
                              <button type="button" class="sa-chip" (click)="applyEditPreset(row, 'read_only')">قراءة فقط</button>
                              <button type="button" class="sa-chip sa-chip--muted" (click)="applyEditPreset(row, 'clear')">
                                مسح الكل
                              </button>
                            </div>
                          </div>
                          <ng-container *ngTemplateOutlet="permissionPanel; context: { mode: 'edit' }" />
                          <div class="sa-editor__foot">
                            <button type="button" class="sa-btn sa-btn--ghost sa-btn--sm" (click)="cancelPermissionEdit()">
                              إلغاء
                            </button>
                            <button
                              type="button"
                              class="sa-btn sa-btn--primary sa-btn--sm"
                              [disabled]="editAccess().length === 0 || isPending(row) || subAccounts.syncInFlight()"
                              (click)="savePermissionEdit(row.id)"
                            >
                              حفظ الصلاحيات
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>

    <ng-template #permissionPanel let-mode="mode">
      <div class="sa-perm-grid">
        @for (group of accessGroups; track group.title) {
          <div class="sa-perm-card">
            <div class="sa-perm-card__head">
              <span class="sa-perm-card__title">{{ group.title }}</span>
              <span class="sa-perm-card__actions">
                <button type="button" class="sa-text-btn" (click)="setGroupAll(mode, group.keys, true)">الكل</button>
                <button type="button" class="sa-text-btn" (click)="setGroupAll(mode, group.keys, false)">لا شيء</button>
              </span>
            </div>
            <div class="sa-perm-card__body">
              @for (key of group.keys; track key) {
                <div class="sa-access">
                  <label class="sa-access__label">
                    <input
                      class="sa-check"
                      type="checkbox"
                      [checked]="isAccessChecked(mode, key)"
                      (change)="onAccessToggle(mode, key, $event)"
                    />
                    <span class="sa-access__text">{{ accessLabel(key) }}</span>
                  </label>
                  @if (isWriteAccessKey(key)) {
                    <p class="sa-access__hint">يتطلب عرض البيانات</p>
                  }
                </div>
              }
            </div>
          </div>
        }
      </div>
    </ng-template>
  `,
  styles: `
    :host {
      display: block;
      --sa-transition: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      --sa-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 4px 14px rgba(0, 0, 0, 0.04);
      --sa-radius: var(--radius-md, 12px);
      --sa-radius-sm: var(--radius-sm, 8px);
    }
    .sub-accounts {
      font-size: 0.82rem;
      color: var(--clr-text, #1a1d23);
    }

    .sa-intro {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 0.85rem 1rem;
      align-items: start;
      padding: 1rem 1.1rem;
      margin-bottom: 1.1rem;
      border-radius: var(--sa-radius);
      background: linear-gradient(135deg, rgba(234, 63, 72, 0.06), rgba(13, 148, 136, 0.05));
      border: 1px solid var(--clr-border, #e8eaed);
      box-shadow: var(--sa-shadow);
    }
    .sa-intro__mark {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: var(--sa-radius-sm);
      background: var(--clr-surface, #fff);
      border: 1px solid var(--clr-border, #e8eaed);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.15rem;
      color: var(--clr-teal, #0d9488);
    }
    .sa-intro__text {
      margin: 0;
      font-size: 0.78rem;
      line-height: 1.65;
      color: var(--clr-text-secondary, #6b7280);
    }
    .sa-intro__details {
      margin-top: 0.6rem;
      font-size: 0.72rem;
      color: var(--clr-text-muted, #9ca3af);
    }
    .sa-intro__details summary {
      cursor: pointer;
      font-weight: 600;
      color: var(--clr-teal, #0d9488);
      list-style-position: inside;
    }
    .sa-intro__api {
      margin: 0.4rem 0 0;
      line-height: 1.5;
    }
    .sa-intro__api code {
      font-size: 0.68rem;
      background: rgba(255, 255, 255, 0.85);
      padding: 0.12rem 0.35rem;
      border-radius: 4px;
      border: 1px solid var(--clr-border, #e8eaed);
    }

    .sa-alert {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem 0.75rem;
      padding: 0.65rem 0.85rem;
      margin-bottom: 0.85rem;
      border-radius: var(--sa-radius-sm);
      background: linear-gradient(135deg, #fef2f2, #fff);
      border: 1px solid #fecaca;
      color: #b91c1c;
      font-size: 0.76rem;
    }
    .sa-alert__icon {
      flex-shrink: 0;
      width: 1.5rem;
      height: 1.5rem;
      border-radius: 50%;
      background: #fee2e2;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 0.85rem;
    }
    .sa-alert__msg { flex: 1 1 12rem; min-width: 0; }
    .sa-alert__actions { display: flex; flex-wrap: wrap; gap: 0.5rem; }

    .sa-status {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      font-size: 0.74rem;
      margin-bottom: 0.65rem;
      padding: 0.4rem 0;
    }
    .sa-status--load { color: var(--clr-teal, #0d9488); }
    .sa-status--sync { color: var(--clr-text-muted, #9ca3af); }
    .sa-status__dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
      animation: sa-pulse 1.1s ease-in-out infinite;
    }
    @keyframes sa-pulse {
      0%,
      100% {
        opacity: 0.35;
        transform: scale(1);
      }
      50% {
        opacity: 1;
        transform: scale(1.15);
      }
    }

    .sa-invite {
      position: relative;
      display: flex;
      margin-bottom: 1.1rem;
      border-radius: var(--sa-radius);
      overflow: hidden;
      border: 1px solid #c7d2fe;
      background: var(--clr-surface, #fff);
      box-shadow: var(--sa-shadow);
    }
    .sa-invite__accent {
      width: 4px;
      flex-shrink: 0;
      background: linear-gradient(180deg, #6366f1, #a5b4fc);
    }
    .sa-invite__inner {
      flex: 1;
      padding: 1rem 1.1rem;
    }
    .sa-invite__head {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.4rem;
    }
    .sa-invite__badge {
      font-size: 0.62rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 0.2rem 0.45rem;
      border-radius: 6px;
      background: #e0e7ff;
      color: #3730a3;
    }
    .sa-invite__title {
      margin: 0;
      font-size: 0.88rem;
      font-weight: 800;
      color: #312e81;
    }
    .sa-invite__text {
      margin: 0 0 0.75rem;
      font-size: 0.76rem;
      line-height: 1.55;
      color: #4338ca;
    }
    .sa-invite__row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.45rem;
      align-items: center;
    }
    .sa-invite__url {
      flex: 1 1 200px;
      min-width: 0;
      font-size: 0.72rem;
    }

    .sa-toolbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 0.85rem;
      margin-bottom: 1rem;
    }
    .sa-tabs {
      display: inline-flex;
      flex-wrap: wrap;
      gap: 0.25rem;
      padding: 0.3rem;
      border-radius: 999px;
      background: var(--clr-bg, #f4f5f7);
      border: 1px solid var(--clr-border, #e8eaed);
    }
    .sa-tab {
      border: none;
      background: transparent;
      font-family: inherit;
      font-size: 0.72rem;
      font-weight: 600;
      padding: 0.4rem 0.85rem;
      border-radius: 999px;
      cursor: pointer;
      color: var(--clr-text-secondary, #6b7280);
      transition: background var(--sa-transition), color var(--sa-transition), box-shadow var(--sa-transition);
    }
    .sa-tab:hover {
      color: var(--clr-text, #1a1d23);
      background: rgba(255, 255, 255, 0.65);
    }
    .sa-tab--on {
      background: var(--clr-surface, #fff);
      color: var(--clr-brand, #ea3f48);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    }

    .sa-panel {
      border-radius: var(--sa-radius);
      border: 1px solid var(--clr-border, #e8eaed);
      background: var(--clr-surface, #fff);
      padding: 1.1rem 1.15rem;
      margin-bottom: 1.1rem;
      box-shadow: var(--sa-shadow);
    }
    .sa-panel--create {
      border-style: solid;
      background: linear-gradient(180deg, #fff 0%, var(--clr-bg, #f4f5f7) 120%);
    }
    .sa-panel__head {
      display: flex;
      gap: 0.75rem;
      align-items: flex-start;
      margin-bottom: 1rem;
    }
    .sa-panel__step {
      flex-shrink: 0;
      width: 1.75rem;
      height: 1.75rem;
      border-radius: 10px;
      background: linear-gradient(135deg, var(--clr-brand, #ea3f48), #c8333d);
      color: #fff;
      font-size: 0.8rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .sa-panel__step--inline {
      width: 1.35rem;
      height: 1.35rem;
      font-size: 0.68rem;
    }
    .sa-panel__title {
      margin: 0;
      font-size: 0.92rem;
      font-weight: 800;
    }
    .sa-panel__sub {
      margin: 0.2rem 0 0;
      font-size: 0.72rem;
      color: var(--clr-text-muted, #9ca3af);
    }
    .sa-panel__divider {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0.25rem 0 0.85rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px dashed var(--clr-border, #e8eaed);
    }
    .sa-panel__divider-text {
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--clr-text-secondary, #6b7280);
    }
    .sa-panel__foot {
      display: flex;
      justify-content: flex-end;
      margin-top: 1rem;
      padding-top: 0.85rem;
      border-top: 1px solid var(--clr-border, #e8eaed);
    }

    .sa-chips {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.4rem;
      margin-bottom: 1rem;
    }
    .sa-chips--compact {
      margin-bottom: 0;
      justify-content: flex-end;
    }
    .sa-chips__label {
      font-size: 0.68rem;
      font-weight: 600;
      color: var(--clr-text-muted, #9ca3af);
      margin-inline-end: 0.25rem;
    }
    .sa-chip {
      border: 1px solid var(--clr-border, #e8eaed);
      background: var(--clr-surface, #fff);
      font-family: inherit;
      font-size: 0.7rem;
      font-weight: 600;
      padding: 0.35rem 0.65rem;
      border-radius: 999px;
      cursor: pointer;
      color: var(--clr-text, #1a1d23);
      transition: border-color var(--sa-transition), background var(--sa-transition), transform 0.15s ease;
    }
    .sa-chip:hover {
      border-color: var(--clr-teal, #0d9488);
      background: rgba(13, 148, 136, 0.06);
    }
    .sa-chip--muted:hover {
      border-color: var(--clr-text-muted, #9ca3af);
    }

    .sa-form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
      gap: 0.75rem;
      margin-bottom: 0.25rem;
    }
    .sa-field { display: flex; flex-direction: column; gap: 0.3rem; }
    .sa-field-label {
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--clr-text-secondary, #6b7280);
    }
    .sa-input {
      padding: 0.5rem 0.65rem;
      border: 1.5px solid var(--clr-border, #e8eaed);
      border-radius: var(--sa-radius-sm);
      font-family: inherit;
      font-size: 0.8rem;
      background: var(--clr-surface, #fff);
      color: var(--clr-text, #1a1d23);
      outline: none;
      transition: border-color var(--sa-transition), box-shadow var(--sa-transition);
    }
    .sa-input:focus {
      border-color: var(--clr-brand, #ea3f48);
      box-shadow: 0 0 0 3px rgba(234, 63, 72, 0.12);
    }
    .sa-input--select {
      cursor: pointer;
      appearance: auto;
    }

    .sa-case-scope {
      margin-top: 0.9rem;
      grid-column: 1 / -1;
      width: 100%;
      padding: 0.85rem 0.9rem;
      border-radius: var(--sa-radius-sm);
      border: 1px solid var(--clr-border, #e8eaed);
      background: linear-gradient(180deg, #fff, var(--clr-bg, #f4f5f7));
    }

    .sa-case-scope__head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.75rem;
      margin-bottom: 0.65rem;
    }

    .sa-case-scope__title {
      font-weight: 800;
      font-size: 0.78rem;
      color: var(--clr-text, #1a1d23);
    }

    .sa-case-scope__hint {
      margin-top: 0.25rem;
      font-size: 0.7rem;
      color: var(--clr-text-muted, #9ca3af);
      line-height: 1.45;
    }

    .sa-case-scope__modes {
      display: flex;
      flex-wrap: wrap;
      gap: 0.7rem;
      margin-bottom: 0.65rem;
    }

    .sa-radio {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      font-size: 0.74rem;
      font-weight: 700;
      color: var(--clr-text-secondary, #6b7280);
      cursor: pointer;
      user-select: none;
    }

    .sa-radio input {
      accent-color: var(--clr-brand, #ea3f48);
    }

    .sa-case-list {
      display: flex;
      flex-direction: row;
      gap: 0.55rem;
      overflow-x: auto;
      overflow-y: hidden;
      padding: 0.35rem 0.1rem 0.5rem;
      scroll-snap-type: x proximity;
    }

    .sa-checkrow {
      display: flex;
      align-items: flex-start;
      gap: 0.55rem;
      padding: 0.5rem 0.55rem;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.7);
      border: 1px solid rgba(232, 234, 237, 0.9);
      cursor: pointer;
      transition: background var(--sa-transition), border-color var(--sa-transition);
      min-width: 240px;
      max-width: 320px;
      flex: 0 0 auto;
      scroll-snap-align: start;
    }

    .sa-checkrow:hover {
      background: rgba(13, 148, 136, 0.05);
      border-color: rgba(13, 148, 136, 0.25);
    }

    .sa-checkrow__text {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      min-width: 0;
      font-size: 0.72rem;
      color: var(--clr-text, #1a1d23);
      line-height: 1.25;
    }

    .sa-checkrow__sub {
      font-size: 0.68rem;
      color: var(--clr-text-secondary, #6b7280);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 48ch;
    }

    .sa-case-empty {
      text-align: center;
      font-size: 0.72rem;
      color: var(--clr-text-muted, #9ca3af);
      padding: 0.75rem 0.25rem;
    }

    .sa-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.35rem;
      padding: 0.5rem 1rem;
      border-radius: var(--sa-radius-sm);
      font-family: inherit;
      font-size: 0.78rem;
      font-weight: 700;
      cursor: pointer;
      border: none;
      transition: background var(--sa-transition), transform 0.15s ease, box-shadow var(--sa-transition);
    }
    .sa-btn:active:not(:disabled) {
      transform: scale(0.98);
    }
    .sa-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .sa-btn--sm {
      padding: 0.38rem 0.75rem;
      font-size: 0.72rem;
    }
    .sa-btn--cta {
      box-shadow: 0 2px 8px rgba(234, 63, 72, 0.25);
    }
    .sa-btn--primary {
      background: var(--clr-brand, #ea3f48);
      color: #fff;
    }
    .sa-btn--primary:hover:not(:disabled) {
      background: #c8333d;
    }
    .sa-btn--soft {
      background: #e0e7ff;
      color: #3730a3;
    }
    .sa-btn--soft:hover:not(:disabled) {
      background: #c7d2fe;
    }
    .sa-btn--ghost {
      background: transparent;
      border: 1.5px solid var(--clr-border, #e8eaed);
      color: var(--clr-text-secondary, #6b7280);
    }
    .sa-btn--ghost:hover:not(:disabled) {
      border-color: var(--clr-text-muted, #9ca3af);
      color: var(--clr-text, #1a1d23);
    }

    .sa-text-btn {
      background: none;
      border: none;
      padding: 0;
      font-family: inherit;
      font-size: 0.72rem;
      font-weight: 600;
      color: var(--clr-teal, #0d9488);
      cursor: pointer;
      text-decoration: underline;
      text-underline-offset: 2px;
    }
    .sa-text-btn--strong {
      font-weight: 800;
    }
    .sa-text-btn--block {
      display: block;
      margin-top: 0.35rem;
      text-align: right;
    }

    .sa-perm-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(228px, 1fr));
      gap: 0.65rem;
    }
    .sa-perm-card {
      background: var(--clr-surface, #fff);
      border: 1px solid var(--clr-border, #e8eaed);
      border-radius: var(--sa-radius-sm);
      padding: 0.65rem 0.75rem;
      transition: border-color var(--sa-transition), box-shadow var(--sa-transition);
    }
    .sa-perm-card:hover {
      border-color: rgba(13, 148, 136, 0.35);
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
    }
    .sa-perm-card__head {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 0.35rem;
      margin-bottom: 0.5rem;
      padding-bottom: 0.45rem;
      border-bottom: 1px solid var(--clr-border, #e8eaed);
    }
    .sa-perm-card__title {
      font-size: 0.74rem;
      font-weight: 800;
      color: var(--clr-text, #1a1d23);
    }
    .sa-perm-card__actions {
      display: flex;
      gap: 0.45rem;
    }
    .sa-perm-card__body {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .sa-access__label {
      display: flex;
      align-items: flex-start;
      gap: 0.45rem;
      font-size: 0.73rem;
      cursor: pointer;
      line-height: 1.4;
    }
    .sa-check {
      width: 1rem;
      height: 1rem;
      margin-top: 0.12rem;
      flex-shrink: 0;
      accent-color: var(--clr-brand, #ea3f48);
      cursor: pointer;
    }
    .sa-access__hint {
      margin: 0.08rem 0 0;
      padding-inline-start: 1.45rem;
      font-size: 0.62rem;
      color: var(--clr-text-muted, #9ca3af);
      line-height: 1.35;
    }

    .sa-list { margin-top: 0.25rem; }
    .sa-empty {
      text-align: center;
      padding: 2.25rem 1.25rem;
      border-radius: var(--sa-radius);
      border: 2px dashed var(--clr-border, #e8eaed);
      background: var(--clr-bg, #f4f5f7);
    }
    .sa-empty__visual {
      font-size: 2.25rem;
      line-height: 1;
      margin-bottom: 0.65rem;
      filter: grayscale(0.2);
    }
    .sa-empty__title {
      margin: 0 0 0.35rem;
      font-size: 0.88rem;
      font-weight: 800;
      color: var(--clr-text, #1a1d23);
    }
    .sa-empty__hint {
      margin: 0 0 1rem;
      font-size: 0.76rem;
      color: var(--clr-text-secondary, #6b7280);
      line-height: 1.55;
    }
    .sa-empty__actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.45rem;
      justify-content: center;
    }

    .sa-table-wrap {
      border-radius: var(--sa-radius);
      border: 1px solid var(--clr-border, #e8eaed);
      overflow: hidden;
      background: var(--clr-surface, #fff);
      box-shadow: var(--sa-shadow);
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }
    .sa-table {
      width: 100%;
      min-width: 720px;
      border-collapse: collapse;
      font-size: 0.76rem;
    }
    .sa-table thead {
      background: linear-gradient(180deg, var(--clr-bg, #f4f5f7), #fff);
    }
    .sa-table th,
    .sa-table td {
      text-align: right;
      padding: 0.65rem 0.75rem;
      border-bottom: 1px solid var(--clr-border, #e8eaed);
      vertical-align: middle;
    }
    .sa-table th {
      font-size: 0.68rem;
      font-weight: 700;
      color: var(--clr-text-muted, #9ca3af);
      text-transform: none;
      letter-spacing: 0;
    }
    .sa-table tbody tr:last-child td {
      border-bottom: none;
    }
    .sa-table__th-actions,
    .sa-table__td-actions {
      white-space: nowrap;
    }
    .sa-table__th-actions {
      min-width: 130px;
    }

    .sa-row {
      transition: background var(--sa-transition);
    }
    .sa-row:hover {
      background: rgba(13, 148, 136, 0.04);
    }
    .sa-row--inactive {
      opacity: 0.58;
    }
    .sa-row--open {
      background: rgba(234, 63, 72, 0.04);
    }

    .sa-user {
      display: flex;
      align-items: center;
      gap: 0.55rem;
    }
    .sa-user__avatar {
      flex-shrink: 0;
      width: 2.1rem;
      height: 2.1rem;
      border-radius: 10px;
      background: linear-gradient(135deg, var(--clr-teal, #0d9488), #0f766e);
      color: #fff;
      font-size: 0.68rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .sa-user__name {
      font-weight: 700;
      font-size: 0.78rem;
    }
    .sa-mono {
      font-family: ui-monospace, monospace;
      font-size: 0.72rem;
      color: var(--clr-text-secondary, #6b7280);
      word-break: break-all;
    }

    .sa-badge {
      display: inline-block;
      padding: 0.18rem 0.5rem;
      border-radius: 999px;
      font-size: 0.66rem;
      font-weight: 700;
    }
    .sa-badge--lawyer {
      background: #dcfce7;
      color: #166534;
    }
    .sa-badge--secretary {
      background: #dbeafe;
      color: #1d4ed8;
    }
    .sa-badge--client {
      background: #fef9c3;
      color: #854d0e;
    }
    .sa-badge--partner {
      background: #ede9fe;
      color: #6d28d9;
    }

    .sa-pill {
      display: inline-block;
      font-size: 0.64rem;
      font-weight: 700;
      padding: 0.15rem 0.45rem;
      border-radius: 999px;
      background: #dcfce7;
      color: #166534;
    }
    .sa-pill--pending {
      background: #fef9c3;
      color: #854d0e;
    }

    .sa-tags {
      line-height: 1.45;
      color: var(--clr-text-secondary, #6b7280);
      max-width: 280px;
      font-size: 0.72rem;
    }
    .sa-perm-count {
      display: block;
      margin-top: 0.25rem;
      font-size: 0.64rem;
      color: var(--clr-text-muted, #9ca3af);
    }

    .sa-toggle {
      width: 44px;
      height: 24px;
      border-radius: 12px;
      border: 2px solid var(--clr-border, #e8eaed);
      background: var(--clr-bg, #f4f5f7);
      cursor: pointer;
      position: relative;
      transition: background var(--sa-transition), border-color var(--sa-transition);
    }
    .sa-toggle:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
    .sa-toggle--on {
      background: var(--clr-teal, #0d9488);
      border-color: var(--clr-teal, #0d9488);
    }
    .sa-toggle__knob {
      position: absolute;
      top: 2px;
      right: 2px;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: white;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
      transition: right var(--sa-transition);
    }
    .sa-toggle--on .sa-toggle__knob {
      right: calc(100% - 18px);
    }

    .sa-row-actions {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
    }
    .sa-icon-btn {
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 0.25rem;
      border-radius: var(--sa-radius-sm);
      font-size: 1rem;
      opacity: 0.55;
      line-height: 1;
      transition: opacity var(--sa-transition), background var(--sa-transition);
    }
    .sa-icon-btn:hover {
      opacity: 1;
      background: rgba(0, 0, 0, 0.05);
    }

    .sa-editor-row td {
      padding: 0 !important;
      background: var(--clr-bg, #f4f5f7);
      border-bottom: 2px solid var(--clr-border, #e8eaed);
    }
    .sa-editor {
      padding: 1rem 1.15rem 1.1rem;
      border-inline-start: 4px solid var(--clr-brand, #ea3f48);
      background: linear-gradient(90deg, rgba(234, 63, 72, 0.06), transparent 48%);
    }
    .sa-editor__head {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.75rem;
      margin-bottom: 0.85rem;
    }
    .sa-editor__title {
      margin: 0;
      font-size: 0.88rem;
      font-weight: 800;
    }
    .sa-editor__sub {
      margin: 0.25rem 0 0;
      font-size: 0.7rem;
      color: var(--clr-text-muted, #9ca3af);
    }
    .sa-editor__foot {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      margin-top: 0.85rem;
      padding-top: 0.75rem;
      border-top: 1px solid var(--clr-border, #e8eaed);
    }

    @media (max-width: 640px) {
      .sa-intro {
        grid-template-columns: 1fr;
      }
      .sa-intro__mark {
        justify-self: start;
      }
      .sa-toolbar {
        flex-direction: column;
        align-items: stretch;
      }
      .sa-tabs {
        justify-content: center;
      }
      .sa-btn--cta {
        width: 100%;
      }
    }
  `,
})
export class SubAccountsSettingsComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  readonly subAccounts = inject(LawyerSubAccountsService);
  private casesState = inject(CasesStateService);
  private snack = inject(MatSnackBar);

  /** Shown right after successful create (PENDING + token). */
  inviteAfterCreate = signal<LawyerSubAccount | null>(null);
  inviteSendBusy = signal(false);

  casesList = signal<Case[]>([]);

  ngOnInit(): void {
    this.subAccounts.load();
    this.casesState.loadCases();
    this.casesState
      .selectCases()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(rows => this.casesList.set(rows));
  }

  /** Optimistic row waiting for POST — id &lt; 0 */
  isPending(row: LawyerSubAccount): boolean {
    return row.id < 0;
  }

  readonly kinds: SubAccountKind[] = ['LAWYER', 'SECRETARY', 'CLIENT', 'PARTNER'];
  readonly accessGroups = SUB_ACCOUNT_ACCESS_GROUPS;
  /** flat list kept for any edge use */
  readonly allAccess = ALL_ACCESS_OPTIONS;
  readonly filterTabs: { key: FilterTab; label: string }[] = [
    { key: 'ALL', label: 'الكل' },
    { key: 'LAWYER', label: 'محامون' },
    { key: 'SECRETARY', label: 'كتبة' },
    { key: 'CLIENT', label: 'حرفاء' },
    { key: 'PARTNER', label: 'شركاء / خبراء' },
  ];

  filter = signal<FilterTab>('ALL');
  showForm = signal(false);

  draftName = '';
  draftEmail = '';
  draftPhone = '';
  draftKind = signal<SubAccountKind>('SECRETARY');
  draftAccess = signal<SubAccountAccess[]>([...DEFAULT_ACCESS_BY_KIND.SECRETARY]);
  draftCaseScope = signal<'ALL' | 'SELECTED'>('ALL');
  draftAllowedCaseIds = signal<number[]>([]);

  editingUserId = signal<number | null>(null);
  editAccess = signal<SubAccountAccess[]>([]);

  filtered = computed(() => this.subAccounts.listFiltered(this.filter()));

  kindLabel(k: SubAccountKind): string {
    return SUB_ACCOUNT_KIND_LABELS[k];
  }

  statusLabel(s: LawyerSubAccount['status']): string {
    return SUB_ACCOUNT_STATUS_LABELS[s];
  }

  buildInviteUrl(inv: LawyerSubAccount): string {
    if (!inv.inviteToken || typeof window === 'undefined') return '';
    return `${window.location.origin}/login?invite=${encodeURIComponent(inv.inviteToken)}`;
  }

  copyInviteLink(inv: LawyerSubAccount): void {
    const url = this.buildInviteUrl(inv);
    if (!url) {
      this.snack.open('لا يوجد رمز دعوة', 'OK', { duration: 2500 });
      return;
    }
    void navigator.clipboard.writeText(url).then(
      () => this.snack.open('تم نسخ رابط الدعوة', 'OK', { duration: 2500 }),
      () => this.snack.open('تعذر النسخ — انسخ الرابط يدوياً', 'OK', { duration: 3500 })
    );
  }

  sendInviteEmailFor(inv: LawyerSubAccount): void {
    if (inv.id < 0) return;
    this.inviteSendBusy.set(true);
    this.subAccounts
      .sendInviteEmail(inv.id)
      .pipe(finalize(() => this.inviteSendBusy.set(false)))
      .subscribe({
        next: () => this.snack.open('تم طلب إرسال الدعوة بالبريد', 'OK', { duration: 4000 }),
        error: (e: { message?: string }) =>
          this.snack.open(e?.message ?? 'فشل طلب الإرسال', 'OK', { duration: 4000 }),
      });
  }

  dismissInviteBanner(): void {
    this.inviteAfterCreate.set(null);
  }

  accessLabel(k: SubAccountAccess): string {
    return SUB_ACCOUNT_ACCESS_LABELS[k];
  }

  /** Shown under `*:write` checkboxes — write implies read (see `normalizeSubAccountAccess`). */
  isWriteAccessKey(key: SubAccountAccess): boolean {
    return key.endsWith(':write');
  }

  onKindChange(kind: SubAccountKind): void {
    this.draftKind.set(kind);
    this.draftAccess.set([...DEFAULT_ACCESS_BY_KIND[kind]]);
  }

  isAccessChecked(mode: 'draft' | 'edit', key: SubAccountAccess): boolean {
    const list = mode === 'draft' ? this.draftAccess() : this.editAccess();
    return list.includes(key);
  }

  onAccessToggle(mode: 'draft' | 'edit', key: SubAccountAccess, ev: Event): void {
    const checked = (ev.target as HTMLInputElement).checked;
    if (mode === 'draft') {
      this.draftAccess.set(this.toggleAccessList(this.draftAccess(), key, checked));
    } else {
      this.editAccess.set(this.toggleAccessList(this.editAccess(), key, checked));
    }
  }

  setGroupAll(mode: 'draft' | 'edit', keys: SubAccountAccess[], on: boolean): void {
    const cur = mode === 'draft' ? this.draftAccess() : this.editAccess();
    const set = new Set(cur);
    if (on) keys.forEach(k => set.add(k));
    else keys.forEach(k => set.delete(k));
    const next = normalizeSubAccountAccess([...set]);
    if (mode === 'draft') this.draftAccess.set(next);
    else this.editAccess.set(next);
  }

  private toggleAccessList(current: SubAccountAccess[], key: SubAccountAccess, checked: boolean): SubAccountAccess[] {
    const next = checked ? [...current, key] : current.filter(x => x !== key);
    return normalizeSubAccountAccess(next);
  }

  toggleForm(): void {
    this.showForm.update(v => !v);
  }

  /** Empty-state CTA: open the create form (keeps current filter tab). */
  openCreateForm(): void {
    this.showForm.set(true);
  }

  rowInitials(name: string): string {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .map(part => part[0] || '')
      .join('')
      .substring(0, 2);
  }

  canSubmit(): boolean {
    return this.draftName.trim().length > 2 && this.draftEmail.includes('@') && this.draftAccess().length > 0;
  }

  onDraftCaseScopeChange(scope: 'ALL' | 'SELECTED'): void {
    this.draftCaseScope.set(scope);
    if (scope === 'ALL') this.draftAllowedCaseIds.set([]);
  }

  isDraftCaseChecked(caseId: number): boolean {
    return this.draftAllowedCaseIds().includes(caseId);
  }

  toggleDraftCase(caseId: number, ev: Event): void {
    const checked = (ev.target as HTMLInputElement).checked;
    const cur = new Set(this.draftAllowedCaseIds());
    if (checked) cur.add(caseId);
    else cur.delete(caseId);
    this.draftAllowedCaseIds.set([...cur]);
  }

  submit(): void {
    if (!this.canSubmit()) return;
    this.subAccounts
      .add({
        name: this.draftName,
        email: this.draftEmail,
        phone: this.draftPhone,
        kind: this.draftKind(),
        access: normalizeSubAccountAccess(this.draftAccess()),
        caseScope: this.draftCaseScope(),
        allowedCaseIds: this.draftCaseScope() === 'SELECTED' ? this.draftAllowedCaseIds() : undefined,
      })
      .subscribe(created => {
        if (!created) return;
        this.draftName = '';
        this.draftEmail = '';
        this.draftPhone = '';
        this.draftKind.set('SECRETARY');
        this.draftAccess.set([...DEFAULT_ACCESS_BY_KIND.SECRETARY]);
        this.draftCaseScope.set('ALL');
        this.draftAllowedCaseIds.set([]);
        this.showForm.set(false);
        if (created.status === 'PENDING' && created.inviteToken) {
          this.inviteAfterCreate.set(created);
        }
      });
  }

  togglePermissionEditor(row: LawyerSubAccount): void {
    if (this.editingUserId() === row.id) {
      this.editingUserId.set(null);
      return;
    }
    this.editingUserId.set(row.id);
    this.editAccess.set([...row.access]);
  }

  cancelPermissionEdit(): void {
    this.editingUserId.set(null);
  }

  savePermissionEdit(id: number): void {
    if (this.editAccess().length === 0) return;
    this.subAccounts.updateAccess(id, this.editAccess());
    this.editingUserId.set(null);
  }

  applyEditPreset(row: LawyerSubAccount, preset: 'kind_default' | 'read_only' | 'clear'): void {
    if (preset === 'kind_default') {
      this.editAccess.set([...DEFAULT_ACCESS_BY_KIND[row.kind]]);
    } else if (preset === 'read_only') {
      this.editAccess.set(normalizeSubAccountAccess([...READ_ONLY_ACCESS_PRESET]));
    } else {
      this.editAccess.set([]);
    }
  }

  applyDraftPreset(preset: 'kind_default' | 'read_only' | 'clear'): void {
    if (preset === 'kind_default') {
      this.draftAccess.set([...DEFAULT_ACCESS_BY_KIND[this.draftKind()]]);
    } else if (preset === 'read_only') {
      this.draftAccess.set(normalizeSubAccountAccess([...READ_ONLY_ACCESS_PRESET]));
    } else {
      this.draftAccess.set([]);
    }
  }

  toggleRow(row: LawyerSubAccount): void {
    this.subAccounts.setActive(row.id, !row.active);
  }

  remove(row: LawyerSubAccount): void {
    if (this.editingUserId() === row.id) this.editingUserId.set(null);
    if (confirm(`حذف الحساب الفرعي «${row.name}»؟`)) this.subAccounts.remove(row.id);
  }

  accessSummary(row: LawyerSubAccount): string {
    return row.access.map(a => SUB_ACCOUNT_ACCESS_LABELS[a]).join('، ');
  }
}
