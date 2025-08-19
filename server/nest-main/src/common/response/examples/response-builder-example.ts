import { ResponseBuilder } from '../response-builder';

/**
 * 响应构建器使用示例
 * 
 * 本示例展示了如何使用响应构建器构建各种类型的响应
 */

interface User {
  id: number;
  name: string;
  email: string;
}

// 示例数据
const user: User = {
  id: 1,
  name: '张三',
  email: 'zhangsan@example.com'
};

// 示例1：构建成功响应
const successResponse = ResponseBuilder.success(user)
  .message('获取用户信息成功')
  .build();

console.log('成功响应示例:', successResponse);
// 输出:
// {
//   success: true,
//   code: 200,
//   message: '获取用户信息成功',
//   data: { id: 1, name: '张三', email: 'zhangsan@example.com' }
// }

// 示例2：构建分页响应
const users: User[] = [
  { id: 1, name: '张三', email: 'zhangsan@example.com' },
  { id: 2, name: '李四', email: 'lisi@example.com' },
];

const paginationInfo = {
  page: 1,
  pageSize: 10,
  total: 100,
  totalPages: 10,
  hasNext: true,
  hasPrev: false
};

const paginatedResponse = ResponseBuilder.paginated(users, paginationInfo)
  .message('获取用户列表成功')
  .build();

console.log('分页响应示例:', paginatedResponse);
// 输出:
// {
//   success: true,
//   code: 200,
//   message: '获取用户列表成功',
//   data: [
//     { id: 1, name: '张三', email: 'zhangsan@example.com' },
//     { id: 2, name: '李四', email: 'lisi@example.com' }
//   ],
//   pagination: {
//     page: 1,
//     pageSize: 10,
//     total: 100,
//     totalPages: 10,
//     hasNext: true,
//     hasPrev: false
//   }
// }

// 示例3：构建错误响应
const errorResponse = ResponseBuilder.error('用户名或密码错误')
  .code(400)
  .build();

console.log('错误响应示例:', errorResponse);
// 输出:
// {
//   success: false,
//   code: 400,
//   message: '用户名或密码错误',
//   data: null,
//   error: { type: 'BUSINESS_ERROR' }
// }

// 示例4：构建"未找到"错误响应
const notFoundResponse = ResponseBuilder.notFound('用户')
  .build();

console.log('未找到响应示例:', notFoundResponse);
// 输出:
// {
//   success: false,
//   code: 404,
//   message: '用户不存在',
//   data: null,
//   error: { type: 'NOT_FOUND_ERROR', details: { resource: '用户' } }
// }

// 示例5：构建验证错误响应
const validationResponse = ResponseBuilder.validationError('请求参数验证失败', [
  { field: 'email', message: '邮箱格式不正确' },
  { field: 'password', message: '密码长度不能小于6位' }
])
.build();

console.log('验证错误响应示例:', validationResponse);
// 输出:
// {
//   success: false,
//   code: 422,
//   message: '请求参数验证失败',
//   data: null,
//   error: {
//     type: 'VALIDATION_ERROR',
//     details: [
//       { field: 'email', message: '邮箱格式不正确' },
//       { field: 'password', message: '密码长度不能小于6位' }
//     ]
//   }
// }

// 示例6：构建业务错误响应
const businessResponse = ResponseBuilder.businessError('余额不足')
  .userFriendly()
  .build();

console.log('业务错误响应示例:', businessResponse);
// 输出:
// {
//   success: false,
//   code: 400,
//   message: '余额不足',
//   data: null,
//   error: { type: 'BUSINESS_ERROR' }
// }

// 示例7：构建服务器错误响应
try {
  throw new Error('数据库连接失败');
} catch (error) {
  const serverErrorResponse = ResponseBuilder.serverError('服务器内部错误', error)
    .build();

  console.log('服务器错误响应示例:', serverErrorResponse);
  // 输出:
  // {
  //   success: false,
  //   code: 500,
  //   message: '服务器内部错误',
  //   data: null,
  //   error: {
  //     type: 'INTERNAL_ERROR',
  //     details: { ... },
  //     stack: '...' // 仅在非生产环境
  //   }
  // }
}
