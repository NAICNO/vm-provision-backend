-- AlterTable
ALTER TABLE "virtual_machine" ADD COLUMN     "ip_ranges" TEXT[];

-- AlterTable
ALTER TABLE "vm_template" ADD COLUMN     "metadata" JSONB;
