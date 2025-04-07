import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../entities/permission.entity';

@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  async findAll(): Promise<Permission[]> {
    return this.permissionRepository.find();
  }

  async findById(id: string): Promise<Permission> {
    const permission = await this.permissionRepository.findOne({
      where: { id },
      relations: ['roles'],
    });
    if (!permission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }
    return permission;
  }

  async findByName(name: string): Promise<Permission> {
    const permission = await this.permissionRepository.findOne({
      where: { name },
      relations: ['roles'],
    });
    if (!permission) {
      throw new NotFoundException(`Permission with name ${name} not found`);
    }
    return permission;
  }

  async create(data: {
    name: string;
    action: string;
    resource: string;
    description?: string;
  }): Promise<Permission> {
    const permission = this.permissionRepository.create(data);
    return this.permissionRepository.save(permission);
  }

  async update(
    id: string,
    data: {
      name?: string;
      action?: string;
      resource?: string;
      description?: string;
      isActive?: boolean;
    },
  ): Promise<Permission> {
    const permission = await this.findById(id);
    Object.assign(permission, data);
    return this.permissionRepository.save(permission);
  }

  async delete(id: string): Promise<void> {
    const permission = await this.findById(id);
    await this.permissionRepository.remove(permission);
  }

  async findByResourceAndAction(resource: string, action: string): Promise<Permission> {
    const permission = await this.permissionRepository.findOne({
      where: { resource, action },
      relations: ['roles'],
    });
    if (!permission) {
      throw new NotFoundException(`Permission for ${resource}:${action} not found`);
    }
    return permission;
  }
} 