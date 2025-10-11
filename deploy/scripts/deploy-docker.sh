#!/bin/bash
# Docker Compose 部署脚本

# 显示彩色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}开始部署 Vue3 + NestJS 全栈应用...${NC}"

# 停止并删除现有容器
echo -e "${YELLOW}停止现有容器...${NC}"
docker-compose -f deploy/compose/docker-compose.yaml down

# 构建新镜像
echo -e "${YELLOW}构建新镜像...${NC}"
docker-compose -f deploy/compose/docker-compose.yaml build

# 启动服务
echo -e "${YELLOW}启动服务...${NC}"
docker-compose -f deploy/compose/docker-compose.yaml up -d

# 检查服务状态
echo -e "${YELLOW}检查服务状态...${NC}"
docker-compose -f deploy/compose/docker-compose.yaml ps

echo -e "${GREEN}部署完成！${NC}"
echo -e "${GREEN}前端应用: http://localhost:8030${NC}"
echo -e "${GREEN}后端 API: http://localhost:8030/api${NC}"

# 查看日志
echo -e "${YELLOW}是否查看日志？ (y/n)${NC}"
read -r view_logs

if [[ $view_logs == "y" || $view_logs == "Y" ]]; then
  docker-compose -f deploy/compose/docker-compose.yaml logs -f
fi
