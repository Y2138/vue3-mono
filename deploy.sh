#!/bin/bash
# 部署入口脚本

# 显示彩色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Vue3 + NestJS 全栈应用部署工具${NC}"
echo -e "${YELLOW}============================${NC}"
echo -e ""
echo -e "${YELLOW}请选择部署选项:${NC}"
echo -e "${YELLOW}1. 部署完整应用 (前端 + 后端 + 数据库)${NC}"
echo -e "${YELLOW}2. 仅部署前端应用${NC}"
echo -e "${YELLOW}3. 使用 Kubernetes 部署${NC}"
echo -e "${YELLOW}4. 查看部署文档${NC}"
echo -e "${YELLOW}0. 退出${NC}"
echo -e ""
read -r -p "请输入选项 [0-4]: " option

case $option in
  1)
    echo -e "${YELLOW}启动完整应用部署...${NC}"
    ./deploy/scripts/deploy-docker.sh
    ;;
  2)
    echo -e "${YELLOW}启动前端应用部署...${NC}"
    ./deploy/scripts/deploy-frontend.sh
    ;;
  3)
    echo -e "${YELLOW}启动 Kubernetes 部署...${NC}"
    ./deploy/scripts/deploy-k8s.sh
    ;;
  4)
    echo -e "${YELLOW}查看部署文档...${NC}"
    echo -e "${GREEN}完整部署文档: ./deploy/docs/DEPLOYMENT.md${NC}"
    echo -e "${GREEN}前端部署文档: ./deploy/docs/FRONTEND_DEPLOYMENT.md${NC}"
    
    read -r -p "是否查看完整部署文档? (y/n): " view_docs
    
    if [[ $view_docs == "y" || $view_docs == "Y" ]]; then
      if command -v less &> /dev/null; then
        less ./deploy/docs/DEPLOYMENT.md
      else
        cat ./deploy/docs/DEPLOYMENT.md
      fi
    fi
    ;;
  0)
    echo -e "${GREEN}退出部署工具${NC}"
    exit 0
    ;;
  *)
    echo -e "${RED}无效的选项，退出${NC}"
    exit 1
    ;;
esac
