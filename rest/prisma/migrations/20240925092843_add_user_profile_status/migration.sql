/*
  Warnings:

  - Added the required column `status` to the `user_profile` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserProfileStatus" AS ENUM ('ACTIVE', 'DISABLED', 'PENDING_DELETION', 'DELETED');

-- AlterTable
ALTER TABLE "user_profile" ADD COLUMN     "status" "UserProfileStatus" NOT NULL;
