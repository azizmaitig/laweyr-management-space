import { Injectable, inject } from '@angular/core';
import { DataService } from '../../../core/services/data.service';
import { CaseDocument } from '../../../core/models';

@Injectable({ providedIn: 'root' })
export class DocumentsService {
  private data = inject(DataService);

  getAll(): CaseDocument[] {
    return this.data.caseDocuments;
  }

  getByCaseId(caseId: number): CaseDocument[] {
    return this.data.getDocuments(caseId);
  }

  add(doc: CaseDocument) {
    this.data.caseDocuments.push(doc);
  }

  delete(id: number) {
    this.data.caseDocuments = this.data.caseDocuments.filter(d => d.id !== id);
  }
}
