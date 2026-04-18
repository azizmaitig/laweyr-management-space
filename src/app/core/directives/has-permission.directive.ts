import { Directive, Input, OnDestroy, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import type { EntityAccessContext, PermissionAction, PermissionResource, User } from '../models';
import { PermissionService } from '../services/permission.service';
import { UsersStateService } from '../../features/platform/services/users-state.service';

@Directive({
  selector: '[hasPermission]',
  standalone: true,
})
export class HasPermissionDirective implements OnDestroy {
  private templateRef = inject(TemplateRef<unknown>);
  private viewContainer = inject(ViewContainerRef);
  private permissionService = inject(PermissionService);
  private usersState = inject(UsersStateService);

  private permissionExpr: string | null = null;
  private context: EntityAccessContext = {};
  private sub: Subscription;
  private currentUser: User | null = null;
  private rendered = false;

  constructor() {
    this.sub = this.usersState.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.render();
    });
  }

  @Input('hasPermission')
  set hasPermission(value: string) {
    this.permissionExpr = value;
    this.render();
  }

  @Input('hasPermissionContext')
  set hasPermissionContext(value: EntityAccessContext | null | undefined) {
    this.context = value ?? {};
    this.render();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  private render(): void {
    if (!this.permissionExpr) {
      this.clear();
      return;
    }
    const parsed = this.parsePermissionExpr(this.permissionExpr);
    if (!parsed) {
      this.clear();
      return;
    }

    const canShow = this.permissionService.hasPermission(this.currentUser, parsed.resource, parsed.action, this.context);
    if (canShow && !this.rendered) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.rendered = true;
      return;
    }
    if (!canShow) this.clear();
  }

  private clear(): void {
    if (!this.rendered) return;
    this.viewContainer.clear();
    this.rendered = false;
  }

  private parsePermissionExpr(expr: string): { resource: PermissionResource; action: PermissionAction } | null {
    const [resource, action] = expr.split(':');
    if (!resource || !action) return null;
    return { resource: resource as PermissionResource, action: action as PermissionAction };
  }
}
