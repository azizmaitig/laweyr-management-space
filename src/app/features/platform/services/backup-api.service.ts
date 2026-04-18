import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints';
import { ApiService } from '../../../core/services/api.service';
import type { Backup } from '../../../core/models';
import { backupFromDto, type BackupDto } from '../platform-dto.util';

export interface TriggerBackupRequest {
  /** Request AES-256 (or server-side equivalent) encrypted backup artifact */
  encrypted: boolean;
}

@Injectable({ providedIn: 'root' })
export class BackupApiService extends ApiService {
  private readonly base = API_ENDPOINTS.PLATFORM_BACKUPS.BASE;

  triggerBackup(body: TriggerBackupRequest): Observable<Backup> {
    return this.post<BackupDto>(API_ENDPOINTS.PLATFORM_BACKUPS.TRIGGER, body).pipe(map(backupFromDto));
  }

  getBackups(): Observable<Backup[]> {
    return this.get<BackupDto[]>(this.base).pipe(map(rows => rows.map(backupFromDto)));
  }

  restoreBackup(id: number): Observable<void> {
    return this.post<void>(API_ENDPOINTS.PLATFORM_BACKUPS.RESTORE(id), {});
  }
}
