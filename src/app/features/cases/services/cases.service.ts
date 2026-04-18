import { Injectable, inject, signal, computed } from '@angular/core';
import { Case } from '../../../core/models';
import { CasesApiService, CreateCaseDto, UpdateCaseDto } from './cases-api.service';

@Injectable({ providedIn: 'root' })
export class CasesService {
  private api = inject(CasesApiService);

  cases = signal<Case[]>([]);

  filteredCases = computed(() => {
    return this.cases();
  });

  constructor() {
    this.load();
  }

  load() {
    this.api.getAll().subscribe(cases => this.cases.set(cases));
  }

  getById(id: number): Case | undefined {
    return this.cases().find(c => c.id === id);
  }

  add(dto: CreateCaseDto) {
    this.api.create(dto).subscribe(newCase => {
      this.cases.update(cases => [...cases, newCase]);
    });
  }

  update(id: number, updates: UpdateCaseDto) {
    this.api.update(id, updates).subscribe(updated => {
      this.cases.update(cases => cases.map(c => (c.id === id ? updated : c)));
    });
  }

  delete(id: number) {
    this.api.remove(id).subscribe(() => {
      this.cases.update(cases => cases.filter(c => c.id !== id));
    });
  }
}
