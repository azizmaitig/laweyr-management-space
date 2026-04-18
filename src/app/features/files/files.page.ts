import { Component, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslationService } from '../../core/services/translation.service';

interface LocalFile {
  name: string;
  size: string;
}

@Component({
  selector: 'app-files',
  standalone: true,
  imports: [CommonModule, MatSnackBarModule],
  template: `
    <div class="files-page" [class.files-page--embedded]="embedded()">
      @if (!embedded()) {
        <h1 class="files-page__title">{{ t('files.title') }}</h1>
      } @else if (!hideEmbeddedTitle()) {
        <h3 class="files-page__embedded-title">{{ t('files.title') }}</h3>
      }

      <!-- Cloud Cards -->
      <div class="cloud-grid">
        <div class="cloud-card" [class.cloud-card--connected]="isDriveConnected()">
          <div class="cloud-card__accent cloud-card__accent--drive"></div>
          <div class="cloud-card__body">
            <div class="cloud-card__head">
              <div class="cloud-card__icon cloud-card__icon--drive">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>
              </div>
              <div class="cloud-card__info">
                <h3>{{ t('files.googleDrive') }}</h3>
                <p>{{ isDriveConnected() ? 'متصل' : 'غير متصل' }}</p>
              </div>
            </div>
            <button class="cloud-card__toggle" [class.cloud-card__toggle--on]="isDriveConnected()" (click)="toggleDrive()">
              <span class="cloud-card__toggle-knob"></span>
            </button>
          </div>
        </div>

        <div class="cloud-card" [class.cloud-card--connected]="isDropboxConnected()">
          <div class="cloud-card__accent cloud-card__accent--dropbox"></div>
          <div class="cloud-card__body">
            <div class="cloud-card__head">
              <div class="cloud-card__icon cloud-card__icon--dropbox">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
              </div>
              <div class="cloud-card__info">
                <h3>{{ t('files.dropbox') }}</h3>
                <p>{{ isDropboxConnected() ? 'متصل' : 'غير متصل' }}</p>
              </div>
            </div>
            <button class="cloud-card__toggle" [class.cloud-card__toggle--on]="isDropboxConnected()" (click)="toggleDropbox()">
              <span class="cloud-card__toggle-knob"></span>
            </button>
          </div>
        </div>
      </div>

      <!-- Local Files -->
      <div class="local-files">
        <div class="local-files__head">
          <div class="local-files__title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            {{ t('files.localFiles') }}
          </div>
          <button class="local-files__btn" (click)="selectFolder()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            {{ t('files.selectFolder') }}
          </button>
        </div>

        @if (files().length === 0) {
          <div class="empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            <p>لا توجد ملفات محلية</p>
          </div>
        } @else {
          <table class="files-table">
            <thead>
              <tr>
                <th>{{ t('files.fileName') }}</th>
                <th>{{ t('files.size') }}</th>
                <th>{{ t('files.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              @for (file of files(); track file.name) {
                <tr>
                  <td class="files-table__name">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    <span>{{ file.name }}</span>
                  </td>
                  <td class="files-table__size">{{ file.size }}</td>
                  <td class="files-table__actions">
                    <button class="files-table__delete" (click)="removeFile(file.name)">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
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
      --clr-teal-light: #ccfbf1;
      --clr-drive: #34a853;
      --clr-drive-light: #e6f4ea;
      --clr-dropbox: #0061ff;
      --clr-dropbox-light: #e8f0fe;
      --radius-sm: 8px;
      --radius-md: 12px;
      --radius-lg: 16px;
      --shadow-card: 0 1px 3px rgba(0,0,0,.04), 0 1px 2px rgba(0,0,0,.06);
      --shadow-card-hover: 0 4px 12px rgba(0,0,0,.06);
      --transition: .2s cubic-bezier(.4,0,.2,1);
    }

    .files-page {
      max-width: 900px;
      margin: 0 auto;
      font-family: 'Cairo', system-ui, -apple-system, sans-serif;
      color: var(--clr-text);
    }
    .files-page__title {
      font-size: 1.35rem;
      font-weight: 800;
      margin: 0 0 1.25rem;
      color: var(--clr-text);
    }
    .files-page--embedded { max-width: none; margin: 0; }
    .files-page__embedded-title {
      font-size: .9rem;
      font-weight: 700;
      margin: 0 0 1rem;
      color: var(--clr-text);
    }

    /* Cloud Grid */
    .cloud-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      margin-bottom: 1.25rem;
    }
    .cloud-card {
      position: relative;
      background: var(--clr-surface);
      border: 1.5px solid var(--clr-border);
      border-radius: var(--radius-lg);
      overflow: hidden;
      box-shadow: var(--shadow-card);
      transition: all var(--transition);
    }
    .cloud-card--connected { border-color: var(--clr-teal); }
    .cloud-card__accent {
      height: 3px;
    }
    .cloud-card__accent--drive { background: linear-gradient(90deg, var(--clr-drive), #1e8e3e); }
    .cloud-card__accent--dropbox { background: linear-gradient(90deg, var(--clr-dropbox), #0040b3); }
    .cloud-card__body {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.1rem;
    }
    .cloud-card__head {
      display: flex;
      align-items: center;
      gap: .75rem;
    }
    .cloud-card__icon {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .cloud-card__icon svg { width: 20px; height: 20px; }
    .cloud-card__icon--drive { background: var(--clr-drive-light); color: var(--clr-drive); }
    .cloud-card__icon--dropbox { background: var(--clr-dropbox-light); color: var(--clr-dropbox); }
    .cloud-card__info h3 {
      font-size: .88rem;
      font-weight: 700;
      margin: 0;
      color: var(--clr-text);
    }
    .cloud-card__info p {
      font-size: .72rem;
      color: var(--clr-text-muted);
      margin: .05rem 0 0;
    }
    .cloud-card__toggle {
      width: 44px;
      height: 24px;
      border-radius: 12px;
      border: 2px solid var(--clr-border);
      background: var(--clr-bg);
      cursor: pointer;
      position: relative;
      transition: all var(--transition);
      flex-shrink: 0;
    }
    .cloud-card__toggle--on {
      background: var(--clr-teal);
      border-color: var(--clr-teal);
    }
    .cloud-card__toggle-knob {
      position: absolute;
      top: 2px;
      right: 2px;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: white;
      box-shadow: 0 1px 3px rgba(0,0,0,.15);
      transition: all var(--transition);
    }
    .cloud-card__toggle--on .cloud-card__toggle-knob {
      right: calc(100% - 18px);
    }

    /* Local Files */
    .local-files {
      background: var(--clr-surface);
      border: 1px solid var(--clr-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-card);
      overflow: hidden;
    }
    .local-files__head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: .9rem 1.1rem;
      border-bottom: 1px solid var(--clr-border);
    }
    .local-files__title {
      display: flex;
      align-items: center;
      gap: .5rem;
      font-size: .9rem;
      font-weight: 700;
      color: var(--clr-text);
    }
    .local-files__title svg { width: 18px; height: 18px; color: var(--clr-text-muted); }
    .local-files__btn {
      display: inline-flex;
      align-items: center;
      gap: .35rem;
      padding: .4rem .75rem;
      border: 1.5px solid var(--clr-border);
      border-radius: var(--radius-sm);
      background: transparent;
      font-family: inherit;
      font-size: .75rem;
      font-weight: 600;
      color: var(--clr-text-secondary);
      cursor: pointer;
      transition: all var(--transition);
    }
    .local-files__btn:hover {
      border-color: var(--clr-brand);
      color: var(--clr-brand);
    }
    .local-files__btn svg { width: 14px; height: 14px; }

    .empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem 1rem;
      color: var(--clr-text-muted);
    }
    .empty svg { width: 40px; height: 40px; margin-bottom: .4rem; opacity: .35; }
    .empty p { font-size: .8rem; margin: 0; }

    .files-table {
      width: 100%;
      border-collapse: collapse;
    }
    .files-table thead { background: var(--clr-bg); }
    .files-table th {
      padding: .65rem 1rem;
      font-size: .7rem;
      font-weight: 700;
      color: var(--clr-text-muted);
      text-align: right;
      text-transform: uppercase;
      letter-spacing: .3px;
    }
    .files-table td {
      padding: .65rem 1rem;
      font-size: .82rem;
      border-bottom: 1px solid var(--clr-border);
    }
    .files-table tbody tr { transition: background var(--transition); }
    .files-table tbody tr:hover { background: #fafbfc; }
    .files-table tbody tr:last-child td { border-bottom: none; }
    .files-table__name {
      display: flex;
      align-items: center;
      gap: .5rem;
      font-weight: 600;
      color: var(--clr-text);
    }
    .files-table__name svg { width: 16px; height: 16px; color: var(--clr-text-muted); flex-shrink: 0; }
    .files-table__size {
      color: var(--clr-text-muted);
      font-family: 'SF Mono', 'Fira Code', monospace;
      font-size: .75rem;
    }
    .files-table__actions { text-align: center; }
    .files-table__delete {
      width: 30px;
      height: 30px;
      border-radius: var(--radius-sm);
      border: none;
      background: transparent;
      color: var(--clr-text-muted);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all var(--transition);
    }
    .files-table__delete:hover {
      background: var(--clr-red-light, #fef2f2);
      color: var(--clr-brand);
    }
    .files-table__delete svg { width: 15px; height: 15px; }

    @media (max-width: 640px) {
      .cloud-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class FilesPage {
  embedded = input(false);
  /** When embedded inside settings, parent may supply the section heading. */
  hideEmbeddedTitle = input(false);

  private translation = inject(TranslationService);
  private snackBar = inject(MatSnackBar);

  isDriveConnected = signal(false);
  isDropboxConnected = signal(false);

  files = signal<LocalFile[]>([
    { name: 'Mémoire_en_défense.pdf', size: '2.4 MB' },
    { name: 'Contrat_de_partenariat.docx', size: '1.1 MB' },
    { name: 'Pièces_justificatives.zip', size: '15.7 MB' },
  ]);

  toggleDrive() {
    this.isDriveConnected.update(v => !v);
    this.snackBar.open(
      this.isDriveConnected() ? 'Google Drive متصل' : 'Google Drive غير متصل',
      'OK', { duration: 2000 });
  }

  toggleDropbox() {
    this.isDropboxConnected.update(v => !v);
    this.snackBar.open(
      this.isDropboxConnected() ? 'Dropbox متصل' : 'Dropbox غير متصل',
      'OK', { duration: 2000 });
  }

  selectFolder() {
    this.files.update(f => [...f, { name: 'Nouveau_document.pdf', size: '3.2 MB' }]);
  }

  removeFile(name: string) {
    this.files.update(f => f.filter(file => file.name !== name));
    this.snackBar.open('تم حذف الملف', 'OK', { duration: 2000 });
  }

  t(key: string): string {
    return this.translation.t(key);
  }
}
