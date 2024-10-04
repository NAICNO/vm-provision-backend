/*
  Warnings:

  - You are about to drop the column `vm_id` on the `user_activity` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "UserActivityType" ADD VALUE 'USER_DELETION_REQUESTED';

-- AlterTable
ALTER TABLE "user_activity" DROP COLUMN "vm_id",
ADD COLUMN     "metadata" JSONB DEFAULT '{}';
