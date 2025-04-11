import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { RequirePermissions } from '../decorators/require-permissions.decorator';
import { CreateRoleInput, RolePermissionsInput, UpdateRoleInput } from '../dto/role.input';
import { Role } from '../entities/role.entity';
import { GqlAuthGuard } from '../guards/gql-auth.guard';
import { PermissionGuard } from '../guards/permission.guard';
import { RoleService } from '../services/role.service';

@Resolver(() => Role)
@UseGuards(GqlAuthGuard, PermissionGuard)
export class RoleResolver {
  constructor(private readonly roleService: RoleService) {}

  @Query(() => [Role])
  @RequirePermissions('roles:read')
  async roles(): Promise<Role[]> {
    return this.roleService.findAll();
  }

  @Query(() => Role)
  @RequirePermissions('roles:read')
  async role(@Args('id') id: string): Promise<Role> {
    return this.roleService.findById(id);
  }

  @Mutation(() => Role)
  @RequirePermissions('roles:create')
  async createRole(
    @Args('input') input: CreateRoleInput,
  ): Promise<Role> {
    return this.roleService.create(input);
  }

  @Mutation(() => Role)
  @RequirePermissions('roles:update')
  async updateRole(
    @Args('id') id: string,
    @Args('input') input: UpdateRoleInput,
  ): Promise<Role> {
    return this.roleService.update(id, input);
  }

  @Mutation(() => Boolean)
  @RequirePermissions('roles:delete')
  async deleteRole(@Args('id') id: string): Promise<boolean> {
    await this.roleService.delete(id);
    return true;
  }

  @Mutation(() => Role)
  @RequirePermissions('roles:update')
  async addPermissionsToRole(
    @Args('input') input: RolePermissionsInput,
  ): Promise<Role> {
    return this.roleService.addPermissions(input.roleId, input.permissionIds);
  }

  @Mutation(() => Role)
  @RequirePermissions('roles:update')
  async removePermissionsFromRole(
    @Args('input') input: RolePermissionsInput,
  ): Promise<Role> {
    return this.roleService.removePermissions(input.roleId, input.permissionIds);
  }

  @Mutation(() => Role)
  @RequirePermissions('roles:update')
  async setRolePermissions(
    @Args('input') input: RolePermissionsInput,
  ): Promise<Role> {
    return this.roleService.setPermissions(input.roleId, input.permissionIds);
  }
} 