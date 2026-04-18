import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, catchError, combineLatest, map, of, tap } from 'rxjs';
import type { Permission, PermissionOverride, User, UserRole } from '../../../core/models';
import { AppEventType } from '../../../core/models/events.model';
import type {
  PermissionsUpdatedPayload,
  UserCreatedPayload,
  UserRoleChangedPayload,
  UserUpdatedPayload,
} from '../../../core/models/platform-events.model';
import { AuthStateService } from '../../../core/services/auth-state.service';
import { EventService } from '../../../core/services/event.service';
import { PermissionService } from '../../../core/services/permission.service';
import { UsersApiService, type CreateUserDto, type UpdateUserDto } from './users-api.service';

export interface UsersState {
  users: User[];
  loading: boolean;
  error: string | null;
}

const initialState: UsersState = {
  users: [],
  loading: false,
  error: null,
};

@Injectable({ providedIn: 'root' })
export class UsersStateService {
  private api = inject(UsersApiService);
  private events = inject(EventService);
  private authState = inject(AuthStateService);
  private permissionService = inject(PermissionService);

  private state = new BehaviorSubject<UsersState>(initialState);
  state$ = this.state.asObservable();
  users$ = this.state$.pipe(map(s => s.users));
  currentUser$ = combineLatest([this.users$, this.authState.selectUser()]).pipe(
    map(([users, authUser]) => users.find(u => u.id === authUser?.id) ?? null),
  );
  currentUserPermissions$ = this.currentUser$.pipe(
    map(user => this.permissionService.resolvePermissions(user)),
  );
  lawyers$ = this.usersByRole$('LAWYER');
  secretaries$ = this.usersByRole$('SECRETARY');
  clients$ = this.usersByRole$('CLIENT');
  partners$ = this.usersByRole$('PARTNER');

  selectUsers(): Observable<User[]> {
    return this.users$;
  }

  selectLoading(): Observable<boolean> {
    return this.state$.pipe(map(s => s.loading));
  }

  selectError(): Observable<string | null> {
    return this.state$.pipe(map(s => s.error));
  }

  selectUserById(id: number): Observable<User | undefined> {
    return this.state$.pipe(map(s => s.users.find(u => u.id === id)));
  }

  usersByRole$(role: UserRole): Observable<User[]> {
    return this.users$.pipe(map(users => users.filter(user => user.role === role)));
  }

  usersByRoles$(roles: UserRole[]): Observable<User[]> {
    if (roles.length === 0) return this.users$;
    const selectedRoles = new Set(roles);
    return this.users$.pipe(map(users => users.filter(user => selectedRoles.has(user.role))));
  }

  effectivePermissions$(userId: number): Observable<Permission[]> {
    return this.selectUserById(userId).pipe(
      map(user => this.permissionService.resolvePermissions(user ?? null)),
    );
  }

  loadUsers(): void {
    this.patchState({ loading: true, error: null });
    this.api.getUsers().pipe(
      tap(users => this.patchState({ users, loading: false })),
      catchError((err: { message: string }) => {
        this.patchState({ loading: false, error: err.message });
        return of([]);
      })
    ).subscribe();
  }

  createUser(dto: CreateUserDto): void {
    this.patchState({ loading: true, error: null });
    this.api.createUser(dto).pipe(
      tap(user => {
        const cur = this.state.value;
        this.patchState({ users: [...cur.users, user], loading: false });
        const payload: UserCreatedPayload = {
          userId: user.id,
          action: 'user_created',
          entity: 'user',
          entityId: user.id,
          status: 'ok',
        };
        this.events.emit(AppEventType.USER_CREATED, payload);
      }),
      catchError((err: { message: string }) => {
        this.patchState({ loading: false, error: err.message });
        return of(null);
      })
    ).subscribe();
  }

  updateUser(id: number, dto: UpdateUserDto): void {
    this.patchState({ loading: true, error: null });
    this.api.updateUser(id, dto).pipe(
      tap(user => {
        const cur = this.state.value;
        const before = cur.users.find(u => u.id === id);
        this.patchState({
          users: cur.users.map(u => (u.id === id ? user : u)),
          loading: false,
        });
        const payload: UserUpdatedPayload = {
          userId: user.id,
          action: 'user_updated',
          entity: 'user',
          entityId: user.id,
          status: 'ok',
        };
        this.events.emit(AppEventType.USER_UPDATED, payload);
        this.emitRoleChangedIfNeeded(before?.role, user);
      }),
      catchError((err: { message: string }) => {
        this.patchState({ loading: false, error: err.message });
        return of(null);
      })
    ).subscribe();
  }

  updateUserRole(userId: number, role: UserRole): void {
    this.patchState({ loading: true, error: null });
    this.api.updateUser(userId, { role }).pipe(
      tap(user => {
        const cur = this.state.value;
        const before = cur.users.find(u => u.id === userId);
        this.patchState({
          users: cur.users.map(u => (u.id === userId ? user : u)),
          loading: false,
        });
        this.emitRoleChangedIfNeeded(before?.role, user);
      }),
      catchError((err: { message: string }) => {
        this.patchState({ loading: false, error: err.message });
        return of(null);
      })
    ).subscribe();
  }

  updatePermissionsOverride(userId: number, permissionsOverride: PermissionOverride[]): void {
    this.patchState({ loading: true, error: null });
    this.api.updateUser(userId, { permissionsOverride }).pipe(
      tap(user => {
        const cur = this.state.value;
        this.patchState({
          users: cur.users.map(u => (u.id === userId ? user : u)),
          loading: false,
        });
        const payload: PermissionsUpdatedPayload = {
          userId: user.id,
          action: 'permissions_updated',
          entity: 'user_permissions',
          entityId: user.id,
          status: 'ok',
          overridesCount: user.permissionsOverride?.length ?? 0,
          overrides: user.permissionsOverride,
        };
        this.events.emit(AppEventType.PERMISSIONS_UPDATED, payload);
      }),
      catchError((err: { message: string }) => {
        this.patchState({ loading: false, error: err.message });
        return of(null);
      }),
    ).subscribe();
  }

  deleteUser(id: number): void {
    this.patchState({ loading: true, error: null });
    this.api.deleteUser(id).pipe(
      tap(() => {
        const cur = this.state.value;
        this.patchState({ users: cur.users.filter(u => u.id !== id), loading: false });
      }),
      catchError((err: { message: string }) => {
        this.patchState({ loading: false, error: err.message });
        return of(null);
      })
    ).subscribe();
  }

  private patchState(partial: Partial<UsersState>): void {
    this.state.next({ ...this.state.value, ...partial });
  }

  private emitRoleChangedIfNeeded(previousRole: UserRole | undefined, user: User): void {
    if (!previousRole || previousRole === user.role) return;
    const payload: UserRoleChangedPayload = {
      userId: user.id,
      action: 'user_role_changed',
      entity: 'user',
      entityId: user.id,
      status: user.role,
    };
    this.events.emit(AppEventType.USER_ROLE_CHANGED, payload);
  }
}
