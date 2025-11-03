#!/bin/bash

# NestJS gRPC 应用部署脚本
# 支持多种部署模式

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 显示帮助信息
show_help() {
    cat << EOF
NestJS gRPC 应用部署脚本

用法: $0 [选项] <模式>

模式:
  basic       基础部署（应用 + 数据库 + Redis）
  with-nginx  带 Nginx 反向代理的部署
  monitoring  完整监控部署（包含 Prometheus + Grafana）
  dev         开发模式部署
  stop        停止所有服务
  clean       清理所有容器和数据

选项:
  -h, --help     显示此帮助信息
  -v, --verbose  详细输出
  -b, --build    强制重新构建镜像
  -p, --pull     拉取最新的基础镜像

示例:
  $0 basic                    # 基础部署
  $0 monitoring --build      # 监控部署并重新构建
  $0 with-nginx --verbose    # Nginx部署并显示详细输出
  $0 stop                     # 停止服务
  $0 clean                    # 清理环境

EOF
}

# 检查 Docker 是否安装
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装。请先安装 Docker。"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose 未安装。请先安装 Docker Compose。"
        exit 1
    fi

    log_info "Docker 环境检查通过"
}

# 检查环境变量文件
check_env_files() {
    if [[ ! -f ".env.production" ]]; then
        log_warning ".env.production 文件不存在，创建示例文件..."
        cat > .env.production << EOF
# 生产环境配置
NODE_ENV=production
APP_PORT=3000
GRPC_PORT=50051

# 数据库配置
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=change-this-password
POSTGRES_DB=nest

# Redis 配置
REDIS_HOST=redis
REDIS_PORT=6379

# JWT 配置
JWT_SECRET=change-this-jwt-secret-to-something-secure
JWT_EXPIRES_IN=7d

# 日志配置
LOG_LEVEL=info
EOF
        log_warning "请编辑 .env.production 文件，修改密码和密钥！"
    fi
}

# 构建镜像
build_images() {
    log_info "构建应用镜像..."

    if [[ $BUILD_FLAG == true ]]; then
        log_info "强制重新构建镜像（--no-cache）"
        docker-compose build --no-cache
    else
        docker-compose build
    fi

    log_success "镜像构建完成"
}

# 拉取基础镜像
pull_images() {
    if [[ $PULL_FLAG == true ]]; then
        log_info "拉取最新基础镜像..."
        docker-compose pull postgres redis nginx prometheus grafana
        log_success "基础镜像更新完成"
    fi
}

# 基础部署
deploy_basic() {
    log_info "开始基础部署..."

    check_env_files
    pull_images
    build_images

    # 启动基础服务
    docker-compose up -d postgres redis nest-app

    log_info "等待服务启动..."
    sleep 10

    # 检查服务状态
    check_services

    log_success "基础部署完成！"
    log_info "HTTP 端口: 3000"
    log_info "gRPC 端口: 50051"
    log_info "数据库端口: 5432"
    log_info "Redis 端口: 6379"
}

# 带 Nginx 的部署
deploy_with_nginx() {
    log_info "开始带 Nginx 的部署..."

    check_env_files
    pull_images
    build_images

    # 启动服务（包含 Nginx）
    docker-compose --profile with-nginx up -d

    log_info "等待服务启动..."
    sleep 15

    # 检查服务状态
    check_services

    log_success "Nginx 部署完成！"
    log_info "HTTP 端口: 80"
    log_info "gRPC 端口: 50051"
    log_info "Nginx 状态: http://localhost/nginx_status（仅内网）"
}

# 监控部署
deploy_monitoring() {
    log_info "开始完整监控部署..."

    check_env_files
    pull_images
    build_images

    # 启动所有服务（包含监控）
    docker-compose --profile monitoring up -d

    log_info "等待服务启动..."
    sleep 20

    # 检查服务状态
    check_services

    log_success "监控部署完成！"
    log_info "应用端口: 3000"
    log_info "gRPC 端口: 50051"
    log_info "Prometheus: http://localhost:9090"
    log_info "Grafana: http://localhost:3001 (admin/admin)"
}

# 开发模式部署
deploy_dev() {
    log_info "开始开发模式部署..."

    # 创建开发环境配置
    if [[ ! -f ".env.development" ]]; then
        cp .env.production .env.development
        sed -i 's/NODE_ENV=production/NODE_ENV=development/' .env.development
        sed -i 's/LOG_LEVEL=info/LOG_LEVEL=debug/' .env.development
    fi

    # 使用开发配置启动
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres redis

    log_success "开发环境部署完成！"
    log_info "数据库端口: 5432"
    log_info "Redis 端口: 6379"
    log_info "请在本地运行: npm run start:dev"
}

# 检查服务状态
check_services() {
    log_info "检查服务状态..."

    # 检查容器状态
    if [[ $VERBOSE == true ]]; then
        docker-compose ps
    fi

    # 检查健康状态
    local retry_count=0
    local max_retries=30

    while [[ $retry_count -lt $max_retries ]]; do
        if curl -f http://localhost:3000/health &> /dev/null; then
            log_success "应用健康检查通过"
            break
        else
            log_info "等待应用启动... ($((retry_count + 1))/$max_retries)"
            sleep 2
            ((retry_count++))
        fi
    done

    if [[ $retry_count -eq $max_retries ]]; then
        log_error "应用启动超时，请检查日志"
        docker-compose logs nest-app
        exit 1
    fi
}

# 停止服务
stop_services() {
    log_info "停止所有服务..."
    docker-compose --profile with-nginx --profile monitoring down
    log_success "服务已停止"
}

# 清理环境
clean_environment() {
    log_warning "这将删除所有容器、网络和数据卷！"
    read -p "确定要继续吗？(y/N): " -n 1 -r
    echo

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "清理环境..."
        docker-compose --profile with-nginx --profile monitoring down -v --remove-orphans
        docker system prune -f
        log_success "环境清理完成"
    else
        log_info "取消清理操作"
    fi
}

# 显示日志
show_logs() {
    local service=${1:-nest-app}
    log_info "显示 $service 服务日志..."
    docker-compose logs -f $service
}

# 主函数
main() {
    # 解析参数
    VERBOSE=false
    BUILD_FLAG=false
    PULL_FLAG=false
    MODE=""

    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -b|--build)
                BUILD_FLAG=true
                shift
                ;;
            -p|--pull)
                PULL_FLAG=true
                shift
                ;;
            basic|with-nginx|monitoring|dev|stop|clean|logs)
                MODE=$1
                shift
                ;;
            *)
                log_error "未知参数: $1"
                show_help
                exit 1
                ;;
        esac
    done

    # 检查模式
    if [[ -z $MODE ]]; then
        log_error "请指定部署模式"
        show_help
        exit 1
    fi

    # 检查 Docker 环境
    check_docker

    # 根据模式执行相应操作
    case $MODE in
        basic)
            deploy_basic
            ;;
        with-nginx)
            deploy_with_nginx
            ;;
        monitoring)
            deploy_monitoring
            ;;
        dev)
            deploy_dev
            ;;
        stop)
            stop_services
            ;;
        clean)
            clean_environment
            ;;
        logs)
            show_logs $2
            ;;
        *)
            log_error "不支持的模式: $MODE"
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"
