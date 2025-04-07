import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { RequirePermissions } from '../decorators/require-permissions.decorator';
import { CreatePermissionInput, UpdatePermissionInput } from '../dto/permission.input';
import { Permission } from '../entities/permission.entity';
import { PermissionGuard } from '../guards/permission.guard';
import { PermissionService } from '../services/permission.service';

@Resolver(() => Permission)
@UseGuards(PermissionGuard)
export class PermissionResolver {
  constructor(private readonly permissionService: PermissionService) {}

  @Query(() => [Permission])
  @RequirePermissions('permissions:read')
  async permissions(): Promise<Permission[]> {
    return this.permissionService.findAll();
  }

  @Query(() => Permission)
  @RequirePermissions('permissions:read')
  async permission(@Args('id') id: string): Promise<Permission> {
    return this.permissionService.findById(id);
  }

  @Mutation(() => Permission)
  @RequirePermissions('permissions:create')
  async createPermission(
    @Args('input') input: CreatePermissionInput,
  ): Promise<Permission> {
    return this.permissionService.create(input);
  }

  @Mutation(() => Permission)
  @RequirePermissions('permissions:update')
  async updatePermission(
    @Args('id') id: string,
    @Args('input') input: UpdatePermissionInput,
  ): Promise<Permission> {
    return this.permissionService.update(id, input);
  }

  @Mutation(() => Boolean)
  @RequirePermissions('permissions:delete')
  async deletePermission(@Args('id') id: string): Promise<boolean> {
    await this.permissionService.delete(id);
    return true;
  }

  @Query(() => Permission)
  @RequirePermissions('permissions:read')
  async findPermissionByResourceAndAction(
    @Args('resource') resource: string,
    @Args('action') action: string,
  ): Promise<Permission> {
    return this.permissionService.findByResourceAndAction(resource, action);
  }
} 