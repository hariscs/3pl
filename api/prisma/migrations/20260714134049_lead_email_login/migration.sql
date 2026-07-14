/*
  Warnings:

  - You are about to drop the column `loginId` on the `Lead` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email]` on the table `Lead` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `Lead` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Lead_loginId_key";

-- AlterTable
ALTER TABLE "Lead" DROP COLUMN "loginId",
ADD COLUMN     "email" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Lead_email_key" ON "Lead"("email");
