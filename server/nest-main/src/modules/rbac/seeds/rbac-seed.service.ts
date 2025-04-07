import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../entities/permission.entity';
import { Role } from '../entities/role.entity';
import { ACTIONS, RESOURCES, initialPermissions, initialRoles } from './initial-data';

@Injectable()
export class RbacSeedService {
  private readonly logger = new Logger(RbacSeedService.name);

  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  async seed() {
    await this.seedPermissions();
    await this.seedRoles();
    await this.assignPermissionsToRoles();
  }

  private async seedPermissions() {
    this.logger.log('开始初始化权限数据...');
    
    for (const permissionData of initialPermissions) {
      const existingPermission = await this.permissionRepository.findOne({
        where: {
          resource: permissionData.resource,
          action: permissionData.action,
        },
      });

      if (!existingPermission) {
        await this.permissionRepository.save(permissionData);
        this.logger.log(`创建权限: ${permissionData.name}`);
      }
    }
  }

  private async seedRoles() {
    this.logger.log('开始初始化角色数据...');
    
    for (const roleData of initialRoles) {
      const existingRole = await this.roleRepository.findOne({
        where: { name: roleData.name },
      });

      if (!existingRole) {
        await this.roleRepository.save(roleData);
        this.logger.log(`创建角色: ${roleData.name}`);
      }
    }
  }

  private async assignPermissionsToRoles() {
    this.logger.log('开始分配角色权限...');

    // 获取所有权限
    const allPermissions = await this.permissionRepository.find();
    
    // 为超级管理员分配所有权限
    const superAdmin = await this.roleRepository.findOne({
      where: { name: '超级管理员' },
    });
    if (superAdmin) {
      superAdmin.permissions = allPermissions;
      await this.roleRepository.save(superAdmin);
      this.logger.log('已为超级管理员分配所有权限');
    }

    // 为管理员分配除系统管理外的所有权限
    const admin = await this.roleRepository.findOne({
      where: { name: '管理员' },
    });
    if (admin) {
      admin.permissions = allPermissions.filter(
        p => p.resource !== RESOURCES.SYSTEM
      );
      await this.roleRepository.save(admin);
      this.logger.log('已为管理员分配权限');
    }

    // 为普通用户分配基本查看权限
    const normalUser = await this.roleRepository.findOne({
      where: { name: '普通用户' },
    });
    if (normalUser) {
      normalUser.permissions = allPermissions.filter(
        p => p.action === ACTIONS.READ && p.resource !== RESOURCES.SYSTEM
      );
      await this.roleRepository.save(normalUser);
      this.logger.log('已为普通用户分配权限');
    }
  }
} 