/*
  Warnings:

  - The values [NOTIFY_VM_JUPITERNOTEBOOK_INIT_START,NOTIFY_VM_JUPITERNOTEBOOK_INIT_COMPLETE] on the enum `UrlAction` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "UrlAction_new" AS ENUM ('NOTIFY_VM_INITIALIZE_START', 'NOTIFY_VM_INITIALIZE_COMPLETE', 'NOTIFY_VM_DESTROY_START', 'NOTIFY_VM_JUPYTERNOTEBOOK_INIT_START', 'NOTIFY_VM_JUPYTERNOTEBOOK_INIT_COMPLETE');
ALTER TABLE "app_url" ALTER COLUMN "action" TYPE "UrlAction_new" USING ("action"::text::"UrlAction_new");
ALTER TYPE "UrlAction" RENAME TO "UrlAction_old";
ALTER TYPE "UrlAction_new" RENAME TO "UrlAction";
DROP TYPE "UrlAction_old";
COMMIT;
