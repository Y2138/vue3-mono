import { ApiProperty } from '@nestjs/swagger';

export class RoleEntity {
  @ApiProperty({
    description: '角色ID',
    example: 'clp1234567890'
  })
  id: string;

  @ApiProperty({
    description: '角色名称',
    example: '管理员'
  })
  name: string;

  @ApiProperty({
    description: '角色描述',
    example: '系统管理员角色，拥有所有权限',
    required: false
  })
  description?: string;

  @ApiProperty({ description: '是否激活', example: true })
  isActive: boolean;

  @ApiProperty({ description: '是否为超级管理员', example: false })
  isSuperAdmin: boolean;

  @ApiProperty({ description: '创建时间', example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间', example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;
}