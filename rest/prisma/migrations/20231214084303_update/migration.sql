/*
  Warnings:

  - Changed the type of `log_message` on the `provision_log` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "provision_log" DROP COLUMN "log_message",
ADD COLUMN     "log_message" JSONB NOT NULL;
