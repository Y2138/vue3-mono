# 环境配置说明

本项目支持双协议（HTTP + gRPC）运行，需要配置相应的环境变量。

## 配置文件说明

请根据不同环境创建对应的配置文件：
- `.env.development` - 开发环境配置
- `.env.production` - 生产环境配置

## 开发环境配置 (.env.development)

```bash
# 开发环境配置
NODE_ENV=development
APP_ENV=development

# 服务端口配置
APP_PORT=3000
GRPC_PORT=50051

# 前端地址配置
FRONTEND_URL=http://localhost:6767

# 数据库配置
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=nest_main

# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT 安全配置
JWT_SECRET=your-development-secret-key
JWT_EXPIRES_IN=7d

# 日志配置
LOG_LEVEL=debug
ENABLE_QUERY_LOGGING=true
ENABLE_REQUEST_LOGGING=true

# gRPC 配置
GRPC_MAX_RECEIVE_MESSAGE_LENGTH=4194304
GRPC_MAX_SEND_MESSAGE_LENGTH=4194304
GRPC_KEEPALIVE_TIME_MS=30000
GRPC_KEEPALIVE_TIMEOUT_MS=5000

# 调试配置
DEBUG_MODE=true
ENABLE_SWAGGER=true
ENABLE_CORS=true

# 性能监控
ENABLE_PERFORMANCE_MONITORING=true
REQUEST_TIMEOUT=30000

# 安全配置
BCRYPT_ROUNDS=10
RATE_LIMIT_TTL=60
RATE_LIMIT_LIMIT=100
```

## 生产环境配置 (.env.production)

```bash
# 生产环境配置
NODE_ENV=production
APP_ENV=production

# 服务端口配置
APP_PORT=3000
GRPC_PORT=50051

# 前端地址配置（生产环境需要设置真实域名）
FRONTEND_URL=https://your-frontend-domain.com

# 数据库配置（生产环境需要设置真实数据库连接）
POSTGRES_HOST=your-production-db-host
POSTGRES_PORT=5432
POSTGRES_USER=your-production-db-user
POSTGRES_PASSWORD=your-production-db-password
POSTGRES_DB=nest_main_prod

# Redis 配置（生产环境需要设置真实Redis连接）
REDIS_HOST=your-production-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-production-redis-password

# JWT 安全配置（生产环境必须使用强密钥）
JWT_SECRET=your-super-secure-production-secret-key-please-change-this
JWT_EXPIRES_IN=24h

# 日志配置
LOG_LEVEL=warn
ENABLE_QUERY_LOGGING=false
ENABLE_REQUEST_LOGGING=true

# gRPC 配置
GRPC_MAX_RECEIVE_MESSAGE_LENGTH=4194304
GRPC_MAX_SEND_MESSAGE_LENGTH=4194304
GRPC_KEEPALIVE_TIME_MS=30000
GRPC_KEEPALIVE_TIMEOUT_MS=5000

# 生产配置
DEBUG_MODE=false
ENABLE_SWAGGER=false
ENABLE_CORS=true

# 性能监控
ENABLE_PERFORMANCE_MONITORING=true
REQUEST_TIMEOUT=30000

# 安全配置
BCRYPT_ROUNDS=12
RATE_LIMIT_TTL=60
RATE_LIMIT_LIMIT=50

# 生产环境安全设置
ENABLE_HELMET=true
TRUST_PROXY=true
MAX_FILE_SIZE=10485760

# 健康检查
HEALTH_CHECK_ENABLED=true
HEALTH_CHECK_INTERVAL=30000
```

## 端口分配

- **HTTP 端口**: 3000 (保持不变)
- **gRPC 端口**: 50051 (新增)

## 环境变量说明

### 基础配置
- `NODE_ENV`: Node.js 运行环境 (`development` | `production`)
- `APP_ENV`: 应用环境标识
- `APP_PORT`: HTTP 服务端口
- `GRPC_PORT`: gRPC 服务端口

### 数据库配置
- `POSTGRES_*`: PostgreSQL 数据库连接配置
- `REDIS_*`: Redis 缓存连接配置

### 安全配置
- `JWT_SECRET`: JWT 密钥（生产环境必须使用强密钥）
- `JWT_EXPIRES_IN`: JWT 过期时间
- `BCRYPT_ROUNDS`: 密码加密轮数

### 日志配置
- `LOG_LEVEL`: 日志级别 (`debug` | `info` | `warn` | `error`)
- `ENABLE_QUERY_LOGGING`: 是否启用数据库查询日志
- `ENABLE_REQUEST_LOGGING`: 是否启用请求日志

### gRPC 配置
- `GRPC_MAX_RECEIVE_MESSAGE_LENGTH`: gRPC 最大接收消息长度
- `GRPC_MAX_SEND_MESSAGE_LENGTH`: gRPC 最大发送消息长度
- `GRPC_KEEPALIVE_*`: gRPC 保活配置

## 使用方法

1. 根据当前环境复制对应的配置内容到环境变量文件
2. 修改配置中的敏感信息（密钥、数据库连接等）
3. 确保配置文件已被 `.gitignore` 忽略，避免提交敏感信息

## 安全提醒

⚠️ **重要**: 
- 生产环境必须修改所有默认密钥和敏感配置
- 不要将包含真实配置的环境变量文件提交到版本控制系统
- 定期更换生产环境的密钥和凭据 