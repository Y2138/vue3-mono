/*
  Warnings:

  - You are about to drop the column `metadata` on the `Resource` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[resCode]` on the table `Resource` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `resCode` to the `Resource` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `Resource` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Resource" DROP COLUMN "metadata",
ADD COLUMN     "resCode" TEXT NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" INTEGER NOT NULL;

-- DropEnum
DROP TYPE "public"."ResourceType";

-- CreateIndex
CREATE UNIQUE INDEX "Resource_resCode_key" ON "Resource"("resCode");

-- CreateIndex
CREATE INDEX "Resource_type_idx" ON "Resource"("type");

-- CreateIndex
CREATE INDEX "Resource_resCode_idx" ON "Resource"("resCode");
