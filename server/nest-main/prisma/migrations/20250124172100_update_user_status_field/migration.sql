-- 添加新的 status 字段
ALTER TABLE "User" ADD COLUMN "status" INTEGER NOT NULL DEFAULT 1;

-- 将现有的 isActive 数据迁移到 status 字段
-- isActive = true -> status = 2 (激活)
-- isActive = false -> status = 1 (待激活)
UPDATE "User" SET "status" = CASE
  WHEN "isActive" = true THEN 2
  ELSE 1
END;

-- 删除旧的 isActive 字段
ALTER TABLE "User" DROP COLUMN "isActive";
