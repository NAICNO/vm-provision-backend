/*
  Warnings:

  - The `user_type` column on the `user_profile` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'USER');

-- AlterTable
ALTER TABLE "user_profile" DROP COLUMN "user_type",
ADD COLUMN     "user_type" "UserType" NOT NULL DEFAULT 'USER';
