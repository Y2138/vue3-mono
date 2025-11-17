import { ApiProperty } from '@nestjs/swagger';

export class RoleResourceEntity {
  @ApiProperty({
    description: '角色资源关联ID',
    example: 'clp1234567890'
  })
  id: string;

  @ApiProperty({
    description: '角色ID',
    example: 'clp1234567890'
  })
  roleId: string;

  @ApiProperty({
    description: '资源ID',
    example: 'clp1234567890'
  })
  resourceId: string;

  @ApiProperty({
    description: '创建时间',
    example: '2024-01-01T00:00:00.000Z'
  })
  createdAt: Date;
}

export class RolePermissionTreeNodeEntity {
  @ApiProperty({
    description: '资源ID',
    example: 'clp1234567890'
  })
  resourceId: string;

  @ApiProperty({
    description: '资源名称',
    example: '用户管理'
  })
  resourceName: string;

  @ApiProperty({
    description: '资源类型',
    example: 'PAGE'
  })
  resourceType: string;

  @ApiProperty({
    description: '资源路径',
    example: '/admin/users'
  })
  resourceUrl: string;

  @ApiProperty({
    description: '是否已分配',
    example: true
  })
  isAssigned: boolean;

  @ApiProperty({
    description: '是否部分分配',
    example: false
  })
  isIndeterminate: boolean;

  @ApiProperty({
    description: '子节点',
    type: [RolePermissionTreeNodeEntity]
  })
  children: RolePermissionTreeNodeEntity[];

  @ApiProperty({
    description: '层级深度',
    example: 0
  })
  level: number;

  @ApiProperty({
    description: '父级ID',
    example: null,
    required: false
  })
  parentId?: string;
}