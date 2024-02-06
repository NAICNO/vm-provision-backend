-- AlterTable
ALTER TABLE "virtual_machine" ADD COLUMN     "metadata" JSONB;

-- AlterTable
ALTER TABLE "vm_template" ADD COLUMN     "enabled" BOOLEAN NOT NULL DEFAULT true;
