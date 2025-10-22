#!/bin/bash

# NestJS 开发环境启动脚本
# 用于安全地启动和管理开发服务

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

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查端口是否被占用
check_port() {
    local port=$1
    if lsof -ti:$port > /dev/null 2>&1; then
        return 0  # 端口被占用
    else
        return 1  # 端口空闲
    fi
}

# 终止占用端口的进程
kill_port() {
    local port=$1
    local pids=$(lsof -ti:$port 2>/dev/null)

    if [ -n "$pids" ]; then
        log_warn "端口 $port 被占用，正在终止相关进程..."
        echo "$pids" | xargs kill -9 2>/dev/null || true
        sleep 2

        # 再次检查
        if check_port $port; then
            log_error "无法释放端口 $port，请手动检查"
            return 1
        else
            log_success "端口 $port 已释放"
        fi
    fi
    return 0
}

# 清理所有相关进程
cleanup_processes() {
    log_info "清理所有 NestJS 相关进程..."

    # 查找并终止所有相关进程
    pkill -f "nest.*start.*watch" 2>/dev/null || true
    pkill -f "node.*main.js" 2>/dev/null || true
    pkill -f "nodemon.*proto" 2>/dev/null || true

    sleep 2
    log_success "进程清理完成"
}

# 启动开发服务
start_dev() {
    log_info "启动 NestJS 开发服务..."

    # 检查并清理端口
    if check_port 3030; then
        log_warn "端口 3030 被占用"
        kill_port 3030 || exit 1
    fi

    # 清理旧进程
    cleanup_processes

    # 启动服务
    log_info "使用 concurrently 启动服务..."
    npm run dev
}

# 停止开发服务
stop_dev() {
    log_info "停止 NestJS 开发服务..."
    cleanup_processes
    kill_port 3030
    log_success "开发服务已停止"
}

# 重启开发服务
restart_dev() {
    log_info "重启 NestJS 开发服务..."
    stop_dev
    sleep 2
    start_dev
}

# 显示帮助信息
show_help() {
    echo "NestJS 开发环境管理脚本"
    echo ""
    echo "用法: $0 [命令]"
    echo ""
    echo "命令:"
    echo "  start     启动开发服务"
    echo "  stop      停止开发服务"
    echo "  restart   重启开发服务"
    echo "  status    查看服务状态"
    echo "  clean     清理所有相关进程"
    echo "  help      显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 start    # 启动开发服务"
    echo "  $0 stop     # 停止开发服务"
    echo "  $0 restart  # 重启开发服务"
}

# 查看服务状态
show_status() {
    log_info "检查服务状态..."

    echo ""
    echo "端口占用情况:"
    if check_port 3030; then
        echo "  ✗ 端口 3030: 被占用"
        lsof -i:3030 | head -2
    else
        echo "  ✓ 端口 3030: 空闲"
    fi

    echo ""
    echo "相关进程:"
    local processes=$(ps aux | grep -E "(nest|node.*main)" | grep -v grep | grep -v "$0")
    if [ -n "$processes" ]; then
        echo "$processes"
    else
        echo "  无相关进程运行"
    fi
}

# 主函数
main() {
    case "${1:-help}" in
        start)
            start_dev
            ;;
        stop)
            stop_dev
            ;;
        restart)
            restart_dev
            ;;
        status)
            show_status
            ;;
        clean)
            cleanup_processes
            kill_port 3030
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log_error "未知命令: $1"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"
