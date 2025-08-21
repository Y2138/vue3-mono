/*
  Warnings:

  - Added the required column `action` to the `Permission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `resource` to the `Permission` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Permission" ADD COLUMN     "action" TEXT NOT NULL,
ADD COLUMN     "resource" TEXT NOT NULL;
