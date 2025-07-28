-- 数据库初始化脚本
-- 用于 Docker 容器启动时初始化数据库

-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 设置时区
SET timezone = 'UTC';

-- 创建数据库表（如果使用 TypeORM，通常会自动创建）
-- 这里可以添加一些基础配置

-- 创建索引（性能优化）
-- 这些索引将在 TypeORM 迁移后添加

-- 设置默认参数
ALTER DATABASE nest SET log_statement = 'none';
ALTER DATABASE nest SET log_min_duration_statement = 1000;

-- 创建只读用户（可选）
-- CREATE ROLE readonly WITH LOGIN PASSWORD 'readonly_password';
-- GRANT CONNECT ON DATABASE nest TO readonly;
-- GRANT USAGE ON SCHEMA public TO readonly;
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO readonly; 