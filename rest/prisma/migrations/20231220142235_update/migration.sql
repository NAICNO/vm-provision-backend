/*
  Warnings:

  - Made the column `user_id` on table `virtual_machine` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "virtual_machine" ALTER COLUMN "user_id" SET NOT NULL;
