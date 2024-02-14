-- AlterTable
ALTER TABLE "message" ALTER COLUMN "metadata" SET DEFAULT '{}';

-- AlterTable
ALTER TABLE "virtual_machine" ALTER COLUMN "metadata" SET DEFAULT '{}';

-- AlterTable
ALTER TABLE "vm_template" ALTER COLUMN "metadata" SET DEFAULT '{}';
