#!/bin/bash
# 前端项目部署脚本

# 显示彩色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}开始部署 Vue3 前端应用...${NC}"

# 询问部署方式
echo -e "${YELLOW}请选择部署方式:${NC}"
echo -e "${YELLOW}1. 使用 Docker Compose 部署${NC}"
echo -e "${YELLOW}2. 使用 Kubernetes 部署${NC}"
read -r deploy_method

case $deploy_method in
  1)
    echo -e "${YELLOW}使用 Docker Compose 部署前端应用...${NC}"
    
    # 停止并删除现有容器
    echo -e "${YELLOW}停止现有容器...${NC}"
    docker-compose -f deploy/compose/docker-compose.frontend.yaml down
    
    # 构建新镜像
    echo -e "${YELLOW}构建新镜像...${NC}"
    docker-compose -f deploy/compose/docker-compose.frontend.yaml build
    
    # 启动服务
    echo -e "${YELLOW}启动服务...${NC}"
    docker-compose -f deploy/compose/docker-compose.frontend.yaml up -d
    
    # 检查服务状态
    echo -e "${YELLOW}检查服务状态...${NC}"
    docker-compose -f deploy/compose/docker-compose.frontend.yaml ps
    
    echo -e "${GREEN}部署完成！${NC}"
    echo -e "${GREEN}前端应用: http://localhost:8030${NC}"
    
    # 查看日志
    echo -e "${YELLOW}是否查看日志？ (y/n)${NC}"
    read -r view_logs
    
    if [[ $view_logs == "y" || $view_logs == "Y" ]]; then
      docker-compose -f deploy/compose/docker-compose.frontend.yaml logs -f
    fi
    ;;
    
  2)
    echo -e "${YELLOW}使用 Kubernetes 部署前端应用...${NC}"
    
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
    
    # 构建 Docker 镜像
    echo -e "${YELLOW}构建 Docker 镜像...${NC}"
    docker build -t vue3-mono-frontend:latest -f deploy/front/Dockerfile .
    
    # 检查是否使用 Minikube
    if command -v minikube &> /dev/null && minikube status &> /dev/null; then
        echo -e "${YELLOW}检测到 Minikube，加载镜像到 Minikube...${NC}"
        minikube image load vue3-mono-frontend:latest
    fi
    
    # 应用 Kubernetes 配置
    echo -e "${YELLOW}应用 Kubernetes 配置...${NC}"
    kubectl apply -f k8s/frontend-only.yaml
    
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
        kubectl port-forward service/vue-frontend 8030:80
    else
        echo -e "${GREEN}部署完成！${NC}"
        echo -e "${GREEN}请使用以下方式访问应用:${NC}"
        echo -e "${GREEN}1. 设置端口转发: kubectl port-forward service/vue-frontend 8030:80${NC}"
        echo -e "${GREEN}2. 或者通过 NodePort 访问: $(minikube ip):$(kubectl get svc vue-frontend -o jsonpath='{.spec.ports[0].nodePort}')${NC}"
    fi
    ;;
    
  *)
    echo -e "${RED}无效的选择，退出${NC}"
    exit 1
    ;;
esac
