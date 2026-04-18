import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CourtSessionsWorkspaceComponent } from '../../features/court-sessions/components/court-sessions-workspace/court-sessions-workspace.component';

@Component({
  selector: 'app-ea-hearings',
  standalone: true,
  imports: [CommonModule, CourtSessionsWorkspaceComponent],
  template: `<app-court-sessions-workspace />`,
})
export class EAHearingsPage {}
