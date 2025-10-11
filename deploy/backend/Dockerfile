# 使用多阶段构建优化镜像大小
FROM node:22-alpine AS builder

# 设置工作目录
WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制根目录的依赖文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# 复制后端项目相关文件
COPY server/nest-main/package.json ./server/nest-main/
COPY server/nest-main/tsconfig.json ./server/nest-main/
COPY server/nest-main/tsconfig.build.json ./server/nest-main/
COPY packages/ ./packages/
COPY protos/ ./protos/

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制后端源代码
COPY server/nest-main/ ./server/nest-main/

# 构建应用
RUN pnpm run -C server/nest-main build

# 生产镜像
FROM node:22-alpine AS production

# 安装系统依赖
RUN apk add --no-cache \
    curl \
    tini \
    && rm -rf /var/cache/apk/*

# 创建应用用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# 设置工作目录
WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制根目录的依赖文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY server/nest-main/package.json ./server/nest-main/

# 安装生产依赖
RUN pnpm install --frozen-lockfile --prod && \
    pnpm store prune && \
    rm -rf ~/.pnpm-store

# 从构建阶段复制构建产物
COPY --from=builder /app/server/nest-main/dist ./server/nest-main/dist
COPY --from=builder /app/server/nest-main/src/shared ./server/nest-main/src/shared

# 复制配置文件
COPY server/nest-main/env-config.md ./server/nest-main/

# 设置文件权限
RUN chown -R nestjs:nodejs /app
USER nestjs

# 设置环境变量
ENV NODE_ENV=production
ENV APP_PORT=3000
ENV GRPC_PORT=50051

# 暴露端口
EXPOSE 3000 50051

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# 使用 tini 作为 init 进程
ENTRYPOINT ["/sbin/tini", "--"]

# 启动应用
CMD ["node", "server/nest-main/dist/main.js"]

# 元数据标签
LABEL maintainer="NestJS gRPC Team"
LABEL version="1.0.0"
LABEL description="NestJS application with dual protocol support (HTTP + gRPC)"
