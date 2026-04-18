import { Injectable, inject } from '@angular/core';
import { Observable, of, map } from 'rxjs';
import { DataService } from '../../../core/services/data.service';
import { Case, Client, CaseDocument, Note, Task } from '../../../core/models';

export interface SearchResult {
  type: 'case' | 'client' | 'document' | 'note' | 'task';
  id: number;
  title: string;
  subtitle: string;
  icon?: string;
  caseId?: number;
}

export interface SearchFilters {
  caseId?: number;
  type?: 'CASE' | 'DOCUMENT' | 'TASK' | 'NOTE';
  status?: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  dateFrom?: string;
  dateTo?: string;
}

export interface SavedSearch {
  id: number;
  query: string;
  filters: SearchFilters;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class SearchService {
  private data = inject(DataService);

  /**
   * Search across all entities (mock data version)
   * Replace with SearchApiService when backend is ready
   */
  search(query: string, filters?: SearchFilters): Observable<SearchResult[]> {
    const q = query.toLowerCase();
    const results: SearchResult[] = [];

    // Search cases
    this.data.getCases().forEach(c => {
      if (filters?.type && filters.type !== 'CASE') return;
      if (filters?.dateFrom && c.hearingDate && c.hearingDate < filters.dateFrom) return;
      if (filters?.dateTo && c.hearingDate && c.hearingDate > filters.dateTo) return;
      if (!q || (c.number || '').toLowerCase().includes(q) || c.clientName.toLowerCase().includes(q) || c.court.toLowerCase().includes(q)) {
        results.push({ type: 'case', id: c.id, title: `${c.number} - ${c.clientName}`, subtitle: c.court, icon: '📁', caseId: c.id });
      }
    });

    // Search clients
    this.data.getClients().forEach(cl => {
      if (filters?.type && filters.type !== 'CASE') return; // Clients grouped with cases
      if (!q || cl.name.toLowerCase().includes(q) || cl.phone.includes(q) || cl.email.toLowerCase().includes(q)) {
        const idHint = cl.cin || cl.taxId || cl.vatNumber || '';
        results.push({ type: 'case', id: cl.id, title: cl.name, subtitle: cl.address || idHint, icon: '👤' });
      }
    });

    // Search documents
    this.data.caseDocuments.forEach(d => {
      if (filters?.type && filters.type !== 'DOCUMENT') return;
      if (filters?.caseId && d.caseId !== filters.caseId) return;
      if (!q || d.name.toLowerCase().includes(q) || d.tags.some(t => t.toLowerCase().includes(q))) {
        const case_ = this.data.getCases().find(c => c.id === d.caseId);
        results.push({ type: 'document', id: d.id, title: d.name, subtitle: `${case_?.clientName || ''} · ${d.size}`, icon: '📄', caseId: d.caseId });
      }
    });

    // Search notes
    this.data.notes.forEach(n => {
      if (filters?.type && filters.type !== 'NOTE') return;
      if (filters?.caseId && n.caseId !== filters.caseId) return;
      if (!q || (n.title ?? '').toLowerCase().includes(q) || n.content.toLowerCase().includes(q)) {
        const case_ = this.data.getCases().find(c => c.id === n.caseId);
        results.push({ type: 'note', id: n.id, title: n.title ?? 'ملاحظة', subtitle: `${case_?.clientName || ''} · ${n.updatedAt ?? n.createdAt}`, icon: '📝', caseId: n.caseId });
      }
    });

    // Search tasks
    this.data.tasks.forEach(t => {
      if (filters?.type && filters.type !== 'TASK') return;
      if (filters?.caseId && t.caseId !== filters.caseId) return;
      if (filters?.priority && t.priority !== filters.priority) return;
      if (filters?.status && t.status !== filters.status) return;
      if (filters?.dateFrom && t.dueDate && t.dueDate < filters.dateFrom) return;
      if (filters?.dateTo && t.dueDate && t.dueDate > filters.dateTo) return;
      if (!q || t.title.toLowerCase().includes(q) || (t.description ?? '').toLowerCase().includes(q)) {
        const case_ = this.data.getCases().find(c => c.id === t.caseId);
        results.push({ type: 'task', id: t.id, title: t.title, subtitle: `${case_?.clientName || ''} · ${t.dueDate}`, icon: '✅', caseId: t.caseId });
      }
    });

    return of(results.slice(0, 50));
  }

  /**
   * Get search result counts by type
   */
  getCounts(query: string): Observable<Record<string, number>> {
    return this.search(query).pipe(
      map(results => {
        const counts: Record<string, number> = { all: results.length };
        results.forEach(r => {
          counts[r.type] = (counts[r.type] || 0) + 1;
        });
        return counts;
      })
    );
  }
}
