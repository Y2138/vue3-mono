# Vue3 + NestJS 全栈应用部署指南

本文档提供了在本地环境中使用 Docker、Kubernetes 和 Nginx 部署前后端应用的详细步骤。

## 目录

- [前提条件](#前提条件)
- [Docker Compose 部署](#docker-compose-部署)
- [Kubernetes 部署](#kubernetes-部署)
- [访问应用](#访问应用)
- [常见问题排查](#常见问题排查)

## 前提条件

确保您的系统已安装以下软件：

- Docker 和 Docker Compose
- Kubernetes 集群（如 Minikube、Kind 或 Docker Desktop 的 Kubernetes）
- kubectl 命令行工具
- Git

## Docker Compose 部署

使用 Docker Compose 是最简单的部署方式，适合本地开发和测试。

### 步骤 1：克隆代码库

```bash
git clone <repository-url>
cd vue3-mono
```

### 步骤 2：构建和启动服务

```bash
# 构建并启动所有服务
./deploy/scripts/deploy-docker.sh
```

或者手动执行：

```bash
# 构建并启动所有服务
docker-compose -f deploy/compose/docker-compose.yaml up -d --build
```

这将启动以下服务：

- 前端应用 (Vue3)
- 后端服务 (NestJS)
- PostgreSQL 数据库
- Redis 缓存
- Nginx 反向代理

### 步骤 3：验证服务状态

```bash
# 检查所有容器是否正常运行
docker-compose -f deploy/compose/docker-compose.yaml ps

# 查看服务日志
docker-compose -f deploy/compose/docker-compose.yaml logs -f
```

## Kubernetes 部署

对于更接近生产环境的部署，可以使用 Kubernetes。

### 步骤 1：启动本地 Kubernetes 集群

如果您使用 Minikube：

```bash
minikube start
```

如果您使用 Docker Desktop 的 Kubernetes：

```bash
# 在 Docker Desktop 设置中启用 Kubernetes
```

### 步骤 2：使用部署脚本

```bash
./deploy/scripts/deploy-k8s.sh
```

或者手动执行以下步骤：

### 步骤 3：构建 Docker 镜像

```bash
# 构建前端镜像
docker build -t vue3-mono-frontend:latest -f deploy/front/Dockerfile .

# 构建后端镜像
docker build -t vue3-mono-backend:latest -f deploy/backend/Dockerfile .
```

如果使用 Minikube，需要将镜像加载到 Minikube 中：

```bash
minikube image load vue3-mono-frontend:latest
minikube image load vue3-mono-backend:latest
```

### 步骤 4：创建持久卷目录

```bash
# 创建数据目录
mkdir -p /data/postgres /data/redis

# 设置适当的权限
chmod -R 777 /data/postgres /data/redis
```

### 步骤 5：应用 Kubernetes 配置

```bash
# 创建 ConfigMap
kubectl apply -f server/nest-main/k8s-configmap.yaml

# 部署数据库和 Redis
kubectl apply -f k8s/database.yaml

# 等待数据库和 Redis 就绪
kubectl wait --for=condition=ready pod -l app=postgres --timeout=120s
kubectl wait --for=condition=ready pod -l app=redis --timeout=120s

# 部署后端服务
kubectl apply -f k8s/backend-deployment.yaml

# 部署前端服务
kubectl apply -f k8s/frontend-deployment.yaml

# 创建 Ingress
kubectl apply -f k8s/ingress.yaml
```

### 步骤 6：验证部署

```bash
# 查看所有资源
kubectl get all

# 查看 Pod 状态
kubectl get pods

# 查看服务
kubectl get svc

# 查看 Ingress
kubectl get ingress
```

## 访问应用

### Docker Compose 部署

应用将在以下地址可用：

- 前端应用：http://localhost:8030
- 后端 API：http://localhost:8030/api

### Kubernetes 部署

#### 方法 1：端口转发

```bash
# 设置端口转发到 Nginx Ingress Controller
kubectl port-forward service/ingress-nginx-controller 8030:80 -n ingress-nginx
```

然后访问：

- 前端应用：http://localhost:8030
- 后端 API：http://localhost:8030/api

#### 方法 2：配置本地 hosts

编辑 `/etc/hosts` 文件，添加：

```
127.0.0.1 vue3-mono.local
```

然后访问：

- 前端应用：http://vue3-mono.local:8030
- 后端 API：http://vue3-mono.local:8030/api

## 常见问题排查

### 1. 镜像构建失败

检查 Dockerfile 是否正确，确保所有依赖文件都存在。

```bash
# 查看构建日志
docker-compose -f deploy/compose/docker-compose.yaml logs -f <service-name>
```

### 2. 服务无法启动

检查服务的日志：

```bash
# Docker Compose
docker-compose -f deploy/compose/docker-compose.yaml logs -f <service-name>

# Kubernetes
kubectl logs <pod-name>
```

### 3. 数据库连接问题

确保数据库配置正确：

```bash
# 检查环境变量
kubectl describe configmap nestjs-config

# 检查数据库 Pod 状态
kubectl describe pod -l app=postgres
```

### 4. Nginx 代理问题

检查 Nginx 配置和日志：

```bash
# Docker Compose
docker-compose -f deploy/compose/docker-compose.yaml exec nginx cat /etc/nginx/nginx.conf
docker-compose -f deploy/compose/docker-compose.yaml logs -f nginx

# Kubernetes
kubectl exec -it <nginx-pod> -- cat /etc/nginx/nginx.conf
kubectl logs <nginx-ingress-controller-pod> -n ingress-nginx
```

## 维护和更新

### 更新应用

```bash
# Docker Compose
git pull
docker-compose -f deploy/compose/docker-compose.yaml down
docker-compose -f deploy/compose/docker-compose.yaml up -d --build

# Kubernetes
git pull
docker build -t vue3-mono-frontend:latest -f deploy/front/Dockerfile .
docker build -t vue3-mono-backend:latest -f deploy/backend/Dockerfile .
kubectl rollout restart deployment/vue-frontend
kubectl rollout restart deployment/nestjs-backend
```

### 数据备份

```bash
# 备份 PostgreSQL 数据
docker-compose -f deploy/compose/docker-compose.yaml exec postgres pg_dump -U postgres nestjs > backup.sql

# 恢复 PostgreSQL 数据
cat backup.sql | docker-compose -f deploy/compose/docker-compose.yaml exec -T postgres psql -U postgres nestjs
```
