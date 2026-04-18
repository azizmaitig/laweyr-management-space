import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints';
import { ApiService } from '../../../core/services/api.service';
import type { ActivityLog } from '../../../core/models';
import { activityFromDto, type ActivityLogDto } from '../platform-dto.util';

export interface LogActivityDto {
  userId: number;
  action: string;
  entity: string;
  entityId: number;
}

@Injectable({ providedIn: 'root' })
export class ActivityApiService extends ApiService {
  private readonly base = API_ENDPOINTS.PLATFORM_ACTIVITY.BASE;

  logActivity(dto: LogActivityDto): Observable<ActivityLog> {
    return this.post<ActivityLogDto>(this.base, dto).pipe(map(activityFromDto));
  }

  getActivityLogs(): Observable<ActivityLog[]> {
    return this.get<ActivityLogDto[]>(this.base).pipe(map(rows => rows.map(activityFromDto)));
  }
}
