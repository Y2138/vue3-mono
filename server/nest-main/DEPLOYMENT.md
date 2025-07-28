# NestJS gRPC 应用部署指南

## 📋 概述

本项目是一个支持双协议（HTTP + gRPC）的 NestJS 应用，具备完整的用户认证、权限管理（RBAC）、监控和日志系统。

### 核心特性

- ✅ **双协议支持**：同时支持 HTTP RESTful API 和 gRPC 服务
- ✅ **用户认证**：JWT 基础的认证系统
- ✅ **权限管理**：基于角色的访问控制（RBAC）
- ✅ **监控系统**：Prometheus + Grafana 监控栈
- ✅ **容器化部署**：Docker + Docker Compose
- ✅ **健康检查**：完整的服务健康监控
- ✅ **安全防护**：全面的安全中间件和防护机制

## 🛠️ 环境要求

### 软件依赖

- **Node.js**: 18.x 或更高版本
- **Docker**: 20.x 或更高版本
- **Docker Compose**: 2.x 或更高版本
- **PostgreSQL**: 15.x （容器化提供）
- **Redis**: 7.x （容器化提供）

### 硬件要求

#### 最小配置
- **CPU**: 1 核
- **内存**: 2GB RAM
- **存储**: 10GB 可用空间
- **网络**: 100Mbps

#### 推荐配置
- **CPU**: 2+ 核
- **内存**: 4GB+ RAM
- **存储**: 50GB+ SSD
- **网络**: 1Gbps

#### 生产环境
- **CPU**: 4+ 核
- **内存**: 8GB+ RAM
- **存储**: 100GB+ SSD
- **网络**: 1Gbps+
- **备份**: 定期数据备份策略

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone <your-repository-url>
cd nest-main
```

### 2. 环境配置

```bash
# 复制环境变量模板
cp .env.example .env.production

# 编辑环境变量（重要：修改密码和密钥）
vim .env.production
```

### 3. 部署选择

#### 基础部署（推荐新手）
```bash
./deploy.sh basic
```

#### 带反向代理的部署
```bash
./deploy.sh with-nginx
```

#### 完整监控部署
```bash
./deploy.sh monitoring
```

#### 开发环境部署
```bash
./deploy.sh dev
```

## 📦 部署模式详解

### 1. 基础部署模式

**启动服务**：
- NestJS 应用（HTTP + gRPC）
- PostgreSQL 数据库
- Redis 缓存

**端口映射**：
- `3000`: HTTP API
- `50051`: gRPC 服务
- `5432`: PostgreSQL（开发用）
- `6379`: Redis（开发用）

**适用场景**：开发环境、内部测试

### 2. Nginx 反向代理模式

**额外服务**：
- Nginx 反向代理

**端口映射**：
- `80`: HTTP 流量（通过 Nginx）
- `50051`: gRPC 服务（直接访问或通过 Nginx）

**特性**：
- 负载均衡
- SSL 终止（需配置证书）
- 静态文件服务
- 安全防护

**适用场景**：预生产环境、小规模生产

### 3. 完整监控模式

**额外服务**：
- Prometheus（监控数据收集）
- Grafana（监控可视化）

**端口映射**：
- `9090`: Prometheus
- `3001`: Grafana（admin/admin）

**监控指标**：
- 应用性能指标
- 系统资源监控
- 业务指标监控
- 错误率和响应时间

**适用场景**：生产环境、性能调优

### 4. 开发环境模式

**服务**：
- PostgreSQL + Redis（容器）
- 应用在本地运行

**使用方式**：
```bash
# 启动基础服务
./deploy.sh dev

# 在另一个终端运行应用
npm run start:dev
```

## 🔧 环境变量配置

### 必需配置项

```bash
# 应用配置
NODE_ENV=production          # 环境模式
APP_PORT=3000               # HTTP 端口
GRPC_PORT=50051            # gRPC 端口

# 数据库配置
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-secure-password    # ⚠️ 必须修改
POSTGRES_DB=nest

# Redis 配置
REDIS_HOST=redis
REDIS_PORT=6379

# JWT 配置
JWT_SECRET=your-super-secret-jwt-key     # ⚠️ 必须修改
JWT_EXPIRES_IN=24h

# 日志配置
LOG_LEVEL=info              # error|warn|info|debug|verbose
```

### 安全配置项

```bash
# 安全密钥（生产环境必须修改）
JWT_SECRET=用于签名JWT令牌的密钥
POSTGRES_PASSWORD=数据库密码
ADMIN_PASSWORD=默认管理员密码

# CORS 配置
CORS_ORIGIN=https://yourdomain.com
CORS_CREDENTIALS=true

# 速率限制
RATE_LIMIT_TTL=60           # 时间窗口（秒）
RATE_LIMIT_MAX=100          # 最大请求数
```

### 可选配置项

```bash
# 外部服务
EXTERNAL_API_URL=https://api.external.com
EXTERNAL_API_KEY=your-api-key

# 邮件配置
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# 文件上传
UPLOAD_MAX_SIZE=10485760    # 10MB
UPLOAD_ALLOWED_TYPES=jpg,jpeg,png,pdf
```

## 🔨 部署脚本使用

### 脚本命令

```bash
# 查看帮助
./deploy.sh --help

# 基础部署
./deploy.sh basic

# 强制重新构建
./deploy.sh basic --build

# 拉取最新镜像
./deploy.sh basic --pull

# 详细输出
./deploy.sh basic --verbose

# 停止服务
./deploy.sh stop

# 清理环境（⚠️ 会删除数据）
./deploy.sh clean

# 查看日志
./deploy.sh logs [服务名]
```

### 常用操作

```bash
# 重启应用
docker-compose restart nest-app

# 查看服务状态
docker-compose ps

# 查看应用日志
docker-compose logs -f nest-app

# 进入应用容器
docker-compose exec nest-app sh

# 数据库备份
docker-compose exec postgres pg_dump -U postgres nest > backup.sql

# 数据库恢复
docker-compose exec -T postgres psql -U postgres nest < backup.sql
```

## 📊 监控和日志

### 监控端点

#### 应用监控
- **健康检查**: `GET /health`
- **详细健康检查**: `GET /health/detailed`
- **gRPC 健康检查**: gRPC `grpc.health.v1.Health/Check`

#### 指标端点
- **Prometheus 指标**: `GET /metrics`
- **详细指标**: `GET /metrics/detailed`
- **性能指标**: `GET /metrics/performance`
- **错误指标**: `GET /metrics/errors`
- **连接状态**: `GET /metrics/connections`

#### 系统监控
- **Prometheus**: `http://localhost:9090`
- **Grafana**: `http://localhost:3001` (admin/admin)

### 日志管理

#### 日志级别
- `error`: 错误信息
- `warn`: 警告信息
- `info`: 一般信息（默认）
- `debug`: 调试信息
- `verbose`: 详细信息

#### 日志格式

**开发环境**（彩色格式化）：
```
2024-01-28T10:30:00.000Z INFO   [RequestLogger] {12345678} HTTP GET /api/users (150ms)
```

**生产环境**（JSON格式）：
```json
{
  "timestamp": "2024-01-28T10:30:00.000Z",
  "level": "info",
  "context": "RequestLogger",
  "message": "HTTP GET /api/users",
  "requestId": "12345678-1234-5678-9abc-123456789def",
  "protocol": "http",
  "method": "GET",
  "path": "/api/users",
  "statusCode": 200,
  "responseTime": 150
}
```

## 🔐 安全配置

### SSL/TLS 配置

#### Nginx SSL 配置

1. 获取 SSL 证书（Let's Encrypt 推荐）：
```bash
# 安装 certbot
sudo apt-get install certbot

# 获取证书
sudo certbot certonly --standalone -d yourdomain.com
```

2. 更新 Nginx 配置：
```nginx
server {
    listen 443 ssl http2;
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # 其他配置...
}
```

### 防火墙配置

```bash
# Ubuntu/Debian
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw allow 50051/tcp   # gRPC（可选）
sudo ufw enable

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=22/tcp
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --permanent --add-port=50051/tcp
sudo firewall-cmd --reload
```

### 数据库安全

1. **修改默认密码**
2. **启用连接加密**
3. **配置网络访问限制**
4. **定期备份数据**

## 🔧 故障排除

### 常见问题

#### 1. 应用启动失败

**症状**：容器反复重启
**检查**：
```bash
# 查看日志
docker-compose logs nest-app

# 检查配置
docker-compose config

# 验证环境变量
docker-compose exec nest-app env
```

**常见原因**：
- 数据库连接失败
- 环境变量配置错误
- 端口被占用

#### 2. 数据库连接问题

**检查数据库状态**：
```bash
# 检查数据库容器
docker-compose ps postgres

# 检查数据库日志
docker-compose logs postgres

# 测试连接
docker-compose exec postgres psql -U postgres -d nest -c "SELECT 1;"
```

#### 3. gRPC 服务无法访问

**检查 gRPC 端口**：
```bash
# 检查端口监听
netstat -tlnp | grep 50051

# 测试 gRPC 连接（需要 grpcurl）
grpcurl -plaintext localhost:50051 grpc.health.v1.Health/Check
```

#### 4. 性能问题

**监控系统资源**：
```bash
# 查看容器资源使用
docker stats

# 查看系统负载
top
htop

# 查看内存使用
free -h
```

**检查应用指标**：
- 访问 `/metrics/performance` 查看性能指标
- 检查 Grafana 仪表板（如果启用）

### 日志分析

#### 关键日志位置
- **应用日志**: `docker-compose logs nest-app`
- **数据库日志**: `docker-compose logs postgres`
- **Nginx 日志**: `docker-compose logs nginx`

#### 错误模式识别
```bash
# 查找错误日志
docker-compose logs nest-app | grep -i error

# 查找慢查询
docker-compose logs nest-app | grep "slow"

# 查找认证失败
docker-compose logs nest-app | grep "authentication"
```

## 🔄 备份和恢复

### 数据备份

#### 自动备份脚本
```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup"

# 数据库备份
docker-compose exec postgres pg_dump -U postgres nest > $BACKUP_DIR/db_$DATE.sql

# 压缩备份
gzip $BACKUP_DIR/db_$DATE.sql

echo "Backup completed: db_$DATE.sql.gz"
```

#### 定期备份（crontab）
```bash
# 每天凌晨2点备份
0 2 * * * /path/to/backup.sh
```

### 数据恢复

```bash
# 停止应用
docker-compose stop nest-app

# 恢复数据库
gunzip -c backup.sql.gz | docker-compose exec -T postgres psql -U postgres nest

# 重启应用
docker-compose start nest-app
```

## 📈 扩展部署

### 负载均衡

#### Nginx 负载均衡配置
```nginx
upstream nest_backend {
    server nest-app-1:3000;
    server nest-app-2:3000;
    server nest-app-3:3000;
}
```

#### Docker Swarm 集群
```bash
# 初始化 Swarm
docker swarm init

# 部署服务栈
docker stack deploy -c docker-compose.yml nest-stack
```

### 水平扩展

```bash
# 扩展应用实例
docker-compose up -d --scale nest-app=3

# 扩展数据库（读副本）
docker-compose up -d --scale postgres-slave=2
```

## 🛡️ 生产环境检查清单

### 部署前检查

- [ ] **环境变量**：所有密码和密钥已修改
- [ ] **SSL 证书**：已配置有效的 SSL 证书
- [ ] **防火墙**：已配置适当的防火墙规则
- [ ] **监控**：监控系统正常工作
- [ ] **备份**：备份策略已配置并测试
- [ ] **日志**：日志系统正常收集和轮转
- [ ] **健康检查**：所有健康检查端点正常
- [ ] **性能测试**：已完成负载测试

### 部署后验证

- [ ] **服务状态**：所有服务容器正常运行
- [ ] **API 可用性**：HTTP 和 gRPC 接口正常响应
- [ ] **数据库连接**：数据库连接正常，数据一致
- [ ] **认证系统**：登录和权限验证正常
- [ ] **监控指标**：监控数据正常收集
- [ ] **日志输出**：日志正常输出且格式正确
- [ ] **性能指标**：响应时间和吞吐量符合预期

### 运维监控

- [ ] **磁盘空间**：定期检查磁盘使用情况
- [ ] **内存使用**：监控内存泄漏和使用情况
- [ ] **CPU 负载**：监控 CPU 使用率
- [ ] **网络连接**：监控网络连接数和质量
- [ ] **错误率**：监控错误率和异常情况
- [ ] **备份验证**：定期验证备份完整性

---

## 📞 技术支持

### 获取帮助

1. **查看日志**：首先查看应用和系统日志
2. **检查配置**：验证环境变量和配置文件
3. **官方文档**：参考 NestJS 和相关技术文档
4. **社区支持**：搜索相关技术社区和论坛

### 联系方式

- **项目地址**：[GitHub Repository URL]
- **问题反馈**：[GitHub Issues URL]
- **文档更新**：[Documentation URL]

---

*最后更新：2024-01-28* 