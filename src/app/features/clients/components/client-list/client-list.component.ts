import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Client } from '../../../../core/models';

@Component({
  selector: 'app-client-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="client-list">
      @if (clients().length === 0) {
        <div class="client-list__empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <p>لا يوجد عملاء</p>
        </div>
      } @else {
        @for (client of clients(); track client.id) {
          <div class="client-list__item" (click)="selectRequested.emit(client.id)" role="button" tabindex="0" [attr.aria-label]="'اختيار العميل: ' + client.name" (keydown)="onKeydown($event, client.id)">
            <div class="client-list__avatar" aria-hidden="true">{{ getInitials(client.name) }}</div>
            <div class="client-list__info">
              <h4>{{ client.name }}</h4>
              <span class="client-list__sub">{{ client.address || client.cin }}</span>
            </div>
            <div class="client-list__meta">
              @if (client.cases) {
                <span class="client-list__badge">{{ client.cases.length }} ملف</span>
              }
              @if (client.financial) {
                <span class="client-list__badge client-list__badge--paid">{{ client.financial.paid }} د.ت</span>
              }
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .client-list { display: flex; flex-direction: column; gap: var(--space-2); }
    .client-list__empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: var(--space-16) var(--space-8); color: var(--clr-text-muted); text-align: center; }
    .client-list__empty svg { width: 48px; height: 48px; margin-bottom: var(--space-4); opacity: .35; }
    .client-list__empty p { font-size: var(--text-md); margin: 0; }
    .client-list__item { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-4) var(--space-5); border: 1px solid var(--clr-border); border-radius: var(--radius-lg); background: var(--clr-white); cursor: pointer; transition: all var(--transition); }
    .client-list__item:hover { box-shadow: var(--shadow-sm); border-color: var(--clr-primary); }
    .client-list__item:focus-visible { outline: 2px solid var(--clr-primary); outline-offset: 2px; }
    .client-list__avatar { width: 40px; height: 40px; border-radius: var(--radius-md); background: linear-gradient(135deg, var(--clr-accent-green), #14b8a6); color: white; display: flex; align-items: center; justify-content: center; font-size: var(--text-sm); font-weight: var(--font-bold); flex-shrink: 0; }
    .client-list__info { flex: 1; min-width: 0; }
    .client-list__info h4 { font-size: var(--text-md); font-weight: var(--font-semibold); color: var(--clr-secondary); margin: 0; line-height: var(--leading-tight); }
    .client-list__sub { font-size: var(--text-sm); color: var(--clr-text-muted); }
    .client-list__meta { display: flex; gap: var(--space-2); flex-shrink: 0; }
    .client-list__badge { font-size: var(--text-xs); font-weight: var(--font-bold); padding: var(--space-1) var(--space-2); border-radius: var(--radius-sm); background: var(--clr-secondary-light); color: var(--clr-text-secondary); white-space: nowrap; }
    .client-list__badge--paid { background: var(--clr-accent-green-light); color: var(--clr-accent-green); }

    /* Tablet */
    @media (max-width: 1023px) {
      .client-list__item { padding: var(--space-3) var(--space-4); }
    }

    /* Mobile */
    @media (max-width: 767px) {
      .client-list__item { flex-direction: column; align-items: flex-start; gap: var(--space-2); padding: var(--space-3) var(--space-4); }
      .client-list__meta { align-self: flex-end; }
      .client-list__empty { padding: var(--space-12) var(--space-4); }
      .client-list__empty svg { width: 40px; height: 40px; }
      .client-list__empty p { font-size: var(--text-base); }
    }
  `],
})
export class ClientListComponent {
  clients = input.required<Client[]>();
  selectRequested = output<number>();

  onKeydown(event: KeyboardEvent, clientId: number) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.selectRequested.emit(clientId);
    }
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }
}
