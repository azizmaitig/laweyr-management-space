import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExportStateService } from '../../services/export-state.service';

@Component({
  selector: 'app-export-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './export-panel.component.html',
  styleUrl: './export-panel.component.scss',
})
export class ExportPanelComponent {
  private readonly exportState = inject(ExportStateService);

  /** Active dossier for export/archive; buttons disabled when null. */
  @Input() caseId: number | null = null;

  @Output() readonly archiveRequested = new EventEmitter<number>();

  exportPdf(): void {
    if (this.caseId != null) this.exportState.exportCasePDF(this.caseId);
  }

  exportJson(): void {
    if (this.caseId != null) this.exportState.exportCaseJSON(this.caseId);
  }

  archive(): void {
    if (this.caseId != null) this.archiveRequested.emit(this.caseId);
  }
}
