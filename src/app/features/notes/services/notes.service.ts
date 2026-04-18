import { Injectable, inject } from '@angular/core';
import { DataService } from '../../../core/services/data.service';
import { Note } from '../../../core/models';

@Injectable({ providedIn: 'root' })
export class NotesService {
  private data = inject(DataService);

  getAll(): Note[] {
    return this.data.notes;
  }

  getByCaseId(caseId: number): Note[] {
    return this.data.getNotes(caseId);
  }

  search(query: string): Note[] {
    return this.data.searchNotes(query);
  }

  add(note: Note) {
    this.data.notes.push(note);
  }

  update(id: number, updates: Partial<Note>) {
    const note = this.data.notes.find(n => n.id === id);
    if (note) Object.assign(note, updates);
  }

  delete(id: number) {
    this.data.notes = this.data.notes.filter(n => n.id !== id);
  }
}
