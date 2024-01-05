/*
  Warnings:

  - Added the required column `action` to the `provision_log` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "provision_log" ADD COLUMN     "action" TEXT NOT NULL;
