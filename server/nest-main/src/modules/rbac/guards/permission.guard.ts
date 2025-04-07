import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.get<string[]>('permissions', context.getHandler());
    if (!requiredPermissions) {
      return true;
    }

    const ctx = GqlExecutionContext.create(context);
    const user = ctx.getContext().req.user as User;

    if (!user || !user.roles) {
      return false;
    }

    const userPermissions = new Set<string>();
    user.roles.forEach(role => {
      role.permissions.forEach(permission => {
        userPermissions.add(`${permission.resource}:${permission.action}`);
      });
    });

    return requiredPermissions.every(permission => userPermissions.has(permission));
  }
} 