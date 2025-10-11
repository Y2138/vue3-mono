# 多阶段构建 - 构建阶段
FROM node:22-alpine AS builder

# 设置工作目录
WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制 package.json 和 pnpm-lock.yaml 文件
# 首先复制根目录的文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# 复制前端项目相关文件
COPY apps/naive-admin/package.json ./apps/naive-admin/
COPY packages/ ./packages/
COPY protos/ ./protos/

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制前端源代码
COPY apps/naive-admin/ ./apps/naive-admin/

# 构建前端应用
RUN pnpm run -C apps/naive-admin build

# 多阶段构建 - 生产阶段
FROM nginx:alpine

# 复制构建产物
COPY --from=builder /app/apps/naive-admin/dist /usr/share/nginx/html

# 复制 nginx 配置
COPY deploy/front/nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]
