#!/bin/bash
# Kubernetes 部署脚本

# 显示彩色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}开始部署 Vue3 + NestJS 全栈应用到 Kubernetes...${NC}"

# 检查 kubectl 是否可用
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}错误: kubectl 命令未找到，请安装 kubectl${NC}"
    exit 1
fi

# 检查 Kubernetes 集群是否可用
if ! kubectl cluster-info &> /dev/null; then
    echo -e "${RED}错误: 无法连接到 Kubernetes 集群${NC}"
    echo -e "${YELLOW}请确保您的 Kubernetes 集群已启动并配置正确${NC}"
    exit 1
fi

# 创建数据目录
echo -e "${YELLOW}创建数据目录...${NC}"
mkdir -p /data/postgres /data/redis
chmod -R 777 /data/postgres /data/redis

# 构建 Docker 镜像
echo -e "${YELLOW}构建 Docker 镜像...${NC}"
docker build -t vue3-mono-frontend:latest -f deploy/front/Dockerfile .
docker build -t vue3-mono-backend:latest -f deploy/backend/Dockerfile .

# 检查是否使用 Minikube
if command -v minikube &> /dev/null && minikube status &> /dev/null; then
    echo -e "${YELLOW}检测到 Minikube，加载镜像到 Minikube...${NC}"
    minikube image load vue3-mono-frontend:latest
    minikube image load vue3-mono-backend:latest
fi

# 应用 Kubernetes 配置
echo -e "${YELLOW}应用 Kubernetes 配置...${NC}"

# 创建 ConfigMap
echo -e "${YELLOW}创建 ConfigMap...${NC}"
kubectl apply -f server/nest-main/k8s-configmap.yaml

# 部署数据库和 Redis
echo -e "${YELLOW}部署数据库和 Redis...${NC}"
kubectl apply -f k8s/database.yaml

# 等待数据库和 Redis 就绪
echo -e "${YELLOW}等待数据库和 Redis 就绪...${NC}"
kubectl wait --for=condition=ready pod -l app=postgres --timeout=120s || true
kubectl wait --for=condition=ready pod -l app=redis --timeout=120s || true

# 部署后端服务
echo -e "${YELLOW}部署后端服务...${NC}"
kubectl apply -f k8s/backend-deployment.yaml

# 部署前端服务
echo -e "${YELLOW}部署前端服务...${NC}"
kubectl apply -f k8s/frontend-deployment.yaml

# 创建 Ingress
echo -e "${YELLOW}创建 Ingress...${NC}"
kubectl apply -f k8s/ingress.yaml

# 验证部署
echo -e "${YELLOW}验证部署...${NC}"
kubectl get pods
kubectl get svc
kubectl get ingress

# 设置端口转发
echo -e "${YELLOW}是否设置端口转发？ (y/n)${NC}"
read -r setup_portforward

if [[ $setup_portforward == "y" || $setup_portforward == "Y" ]]; then
    echo -e "${YELLOW}设置端口转发...${NC}"
    echo -e "${YELLOW}按 Ctrl+C 停止端口转发${NC}"
    
    # 检查 ingress-nginx 是否存在
    if kubectl get svc -n ingress-nginx ingress-nginx-controller &> /dev/null; then
        kubectl port-forward service/ingress-nginx-controller 8030:80 -n ingress-nginx
    else
        echo -e "${YELLOW}未找到 ingress-nginx-controller 服务，尝试直接转发前端服务...${NC}"
        kubectl port-forward service/vue-frontend 8030:80
    fi
else
    echo -e "${GREEN}部署完成！${NC}"
    echo -e "${GREEN}请使用以下方式访问应用:${NC}"
    echo -e "${GREEN}1. 设置端口转发: kubectl port-forward service/vue-frontend 8030:80${NC}"
    echo -e "${GREEN}2. 或者配置本地 hosts 文件，添加: 127.0.0.1 vue3-mono.local${NC}"
    echo -e "${GREEN}   然后访问: http://vue3-mono.local:8030${NC}"
fi
