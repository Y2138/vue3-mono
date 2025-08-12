import { Prisma } from '@prisma/client';

/**
 * 处理用户角色关系
 * 将 userRoles 转换为 roles，并删除 userRoles 属性
 */
function processUserRoles(user: any): void {
  if (user.userRoles) {
    // 提取角色信息
    user.roles = user.userRoles.map((ur: any) => ur.role);
    // 删除中间表数据，避免返回冗余信息
    delete user.userRoles;
  }
}

/**
 * Prisma 扩展：处理用户角色关系转换
 * 将 userRoles 转换为 roles，使代码更符合领域模型
 */
export const userRoleExtension = Prisma.defineExtension({
  name: 'userRoleTransformer',
  query: {
    $allModels: {
      async $allOperations({ model, operation: _, args, query }) {
        // 执行原始查询
        const result = await query(args);

        // 如果是用户相关查询，处理角色关系
        if (model === 'User' && result) {
          // 处理单个用户对象
          if (!Array.isArray(result) && typeof result === 'object' && result !== null && 'userRoles' in result) {
            processUserRoles(result);
          }
          // 处理用户数组
          else if (Array.isArray(result)) {
            result.forEach((user) => {
              if (user && typeof user === 'object' && 'userRoles' in user) {
                processUserRoles(user);
              }
            });
          }
        }

        return result;
      }
    }
  }
});
