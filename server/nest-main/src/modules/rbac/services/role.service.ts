import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Permission } from '../entities/permission.entity';
import { Role } from '../entities/role.entity';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  async findAll(): Promise<Role[]> {
    return this.roleRepository.find({
      relations: ['permissions'],
    });
  }

  async findById(id: string): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['permissions', 'users'],
    });
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
    return role;
  }

  async findByName(name: string): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { name },
      relations: ['permissions', 'users'],
    });
    if (!role) {
      throw new NotFoundException(`Role with name ${name} not found`);
    }
    return role;
  }

  async create(data: {
    name: string;
    description?: string;
    permissionIds?: string[];
  }): Promise<Role> {
    const { permissionIds, ...roleData } = data;
    const role = this.roleRepository.create(roleData);

    if (permissionIds?.length) {
      const permissions = await this.permissionRepository.find({
        where: { id: In(permissionIds) },
      });
      role.permissions = permissions;
    }

    return this.roleRepository.save(role);
  }

  async update(
    id: string,
    data: {
      name?: string;
      description?: string;
      isActive?: boolean;
      permissionIds?: string[];
    },
  ): Promise<Role> {
    const { permissionIds, ...roleData } = data;
    const role = await this.findById(id);
    
    Object.assign(role, roleData);

    if (permissionIds) {
      const permissions = await this.permissionRepository.find({
        where: { id: In(permissionIds) },
      });
      role.permissions = permissions;
    }

    return this.roleRepository.save(role);
  }

  async delete(id: string): Promise<void> {
    const role = await this.findById(id);
    await this.roleRepository.remove(role);
  }

  async addPermissions(roleId: string, permissionIds: string[]): Promise<Role> {
    const role = await this.findById(roleId);
    const permissions = await this.permissionRepository.find({
      where: { id: In(permissionIds) },
    });
    
    const existingPermissionIds = new Set(role.permissions.map(p => p.id));
    const newPermissions = permissions.filter(p => !existingPermissionIds.has(p.id));
    
    role.permissions = [...role.permissions, ...newPermissions];
    return this.roleRepository.save(role);
  }

  async removePermissions(roleId: string, permissionIds: string[]): Promise<Role> {
    const role = await this.findById(roleId);
    const permissionIdSet = new Set(permissionIds);
    role.permissions = role.permissions.filter(p => !permissionIdSet.has(p.id));
    return this.roleRepository.save(role);
  }

  async setPermissions(roleId: string, permissionIds: string[]): Promise<Role> {
    const role = await this.findById(roleId);
    const permissions = await this.permissionRepository.find({
      where: { id: In(permissionIds) },
    });
    role.permissions = permissions;
    return this.roleRepository.save(role);
  }
} 