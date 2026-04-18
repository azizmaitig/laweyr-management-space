import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints';
import { ApiService } from '../../../core/services/api.service';
import type { PermissionOverride, User, UserRole } from '../../../core/models';
import { userFromDto, type UserDto } from '../platform-dto.util';

export interface CreateUserDto {
  name: string;
  email: string;
  role: UserRole;
  permissionsOverride?: PermissionOverride[];
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  role?: UserRole;
  permissionsOverride?: PermissionOverride[];
}

@Injectable({ providedIn: 'root' })
export class UsersApiService extends ApiService {
  private readonly base = API_ENDPOINTS.PLATFORM_USERS.BASE;

  getUsers(): Observable<User[]> {
    return this.get<UserDto[]>(this.base).pipe(map(rows => rows.map(userFromDto)));
  }

  createUser(dto: CreateUserDto): Observable<User> {
    return this.post<UserDto>(this.base, dto).pipe(map(userFromDto));
  }

  updateUser(id: number, dto: UpdateUserDto): Observable<User> {
    return this.put<UserDto>(API_ENDPOINTS.PLATFORM_USERS.BY_ID(id), dto).pipe(map(userFromDto));
  }

  deleteUser(id: number): Observable<void> {
    return this.delete<void>(API_ENDPOINTS.PLATFORM_USERS.BY_ID(id));
  }
}
