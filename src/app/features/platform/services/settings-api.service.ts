import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints';
import { ApiService } from '../../../core/services/api.service';
import type { UserSettings } from '../../../core/models';

@Injectable({ providedIn: 'root' })
export class SettingsApiService extends ApiService {
  getUserSettings(userId: number): Observable<UserSettings> {
    return this.get<UserSettings>(API_ENDPOINTS.PLATFORM_SETTINGS.BY_USER(userId));
  }

  updateUserSettings(settings: UserSettings): Observable<UserSettings> {
    return this.put<UserSettings>(API_ENDPOINTS.PLATFORM_SETTINGS.BY_USER(settings.userId), settings);
  }
}
