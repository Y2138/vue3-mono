# Vue3 前端应用部署指南

本文档提供了仅部署前端应用的详细步骤，无需部署后端服务。

## 目录

- [前提条件](#前提条件)
- [Docker Compose 部署](#docker-compose-部署)
- [Kubernetes 部署](#kubernetes-部署)
- [API 模拟](#api-模拟)
- [常见问题排查](#常见问题排查)

## 前提条件

确保您的系统已安装以下软件：

- Docker 和 Docker Compose
- （可选）Kubernetes 集群（如 Minikube、Kind 或 Docker Desktop 的 Kubernetes）
- （可选）kubectl 命令行工具

## 快速部署

使用我们提供的脚本可以快速部署前端应用：

```bash
./deploy/scripts/deploy-frontend.sh
```

脚本会提示您选择部署方式（Docker Compose 或 Kubernetes）并自动完成部署流程。

## Docker Compose 部署

### 步骤 1：构建和启动前端服务

```bash
# 构建并启动前端服务
docker-compose -f deploy/compose/docker-compose.frontend.yaml up -d --build
```

这将启动以下服务：
- 前端应用 (Vue3)
- Nginx 服务器（用于提供静态文件和代理请求）

### 步骤 2：验证服务状态

```bash
# 检查所有容器是否正常运行
docker-compose -f deploy/compose/docker-compose.frontend.yaml ps

# 查看服务日志
docker-compose -f deploy/compose/docker-compose.frontend.yaml logs -f
```

### 步骤 3：访问前端应用

前端应用将在以下地址可用：
- http://localhost:8030

## Kubernetes 部署

### 步骤 1：构建 Docker 镜像

```bash
# 构建前端镜像
docker build -t vue3-mono-frontend:latest -f deploy/front/Dockerfile .
```

如果使用 Minikube，需要将镜像加载到 Minikube 中：

```bash
minikube image load vue3-mono-frontend:latest
```

### 步骤 2：应用 Kubernetes 配置

```bash
# 部署前端服务
kubectl apply -f k8s/frontend-only.yaml
```

### 步骤 3：验证部署

```bash
# 查看 Pod 状态
kubectl get pods

# 查看服务
kubectl get svc

# 查看 Ingress
kubectl get ingress
```

### 步骤 4：访问前端应用

#### 方法 1：端口转发

```bash
# 设置端口转发
kubectl port-forward service/vue-frontend 8030:80
```

然后访问：http://localhost:8030

#### 方法 2：NodePort

如果您使用 Minikube：

```bash
# 获取 NodePort 端口
NODE_PORT=$(kubectl get svc vue-frontend -o jsonpath='{.spec.ports[0].nodePort}')

# 获取 Minikube IP
MINIKUBE_IP=$(minikube ip)

echo "前端应用可通过以下地址访问: http://$MINIKUBE_IP:$NODE_PORT"
```

## API 模拟

由于我们只部署了前端应用，没有后端服务，所以对 API 的请求会返回 404 错误。如果您需要模拟 API 响应，可以考虑以下方案：

### 方案 1：使用 Mock 服务

修改 Nginx 配置，添加 Mock 服务：

```nginx
# 在 nginx.conf 中添加
location /api/ {
    default_type application/json;
    return 200 '{"status": "success", "message": "This is a mock API response"}';
}
```

### 方案 2：使用 Mock 数据

在前端应用中使用 Mock 数据，修改 API 请求逻辑，在开发环境中使用本地数据。

## 常见问题排查

### 1. 镜像构建失败

检查 Dockerfile 是否正确，确保所有依赖文件都存在。

```bash
# 查看构建日志
docker-compose -f deploy/compose/docker-compose.frontend.yaml logs -f vue-frontend
```

### 2. 前端应用无法访问

检查 Nginx 配置和日志：

```bash
# Docker Compose
docker-compose -f deploy/compose/docker-compose.frontend.yaml exec nginx cat /etc/nginx/nginx.conf
docker-compose -f deploy/compose/docker-compose.frontend.yaml logs -f nginx

# Kubernetes
kubectl exec -it $(kubectl get pods -l app=vue-frontend -o jsonpath="{.items[0].metadata.name}") -- cat /etc/nginx/nginx.conf
kubectl logs $(kubectl get pods -l app=vue-frontend -o jsonpath="{.items[0].metadata.name}")
```

### 3. 静态资源加载失败

检查 Nginx 是否正确配置了静态资源路径：

```bash
# 检查 Nginx 配置
docker-compose -f deploy/compose/docker-compose.frontend.yaml exec nginx ls -la /usr/share/nginx/html
```

## 更新前端应用

### Docker Compose 更新

```bash
# 拉取最新代码
git pull

# 重新构建和部署
docker-compose -f deploy/compose/docker-compose.frontend.yaml down
docker-compose -f deploy/compose/docker-compose.frontend.yaml up -d --build
```

### Kubernetes 更新

```bash
# 拉取最新代码
git pull

# 重新构建镜像
docker build -t vue3-mono-frontend:latest -f deploy/front/Dockerfile .

# 如果使用 Minikube
minikube image load vue3-mono-frontend:latest

# 重启部署
kubectl rollout restart deployment/vue-frontend
```
