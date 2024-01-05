/*
  Warnings:

  - Added the required column `duration` to the `virtual_machine` table without a default value. This is not possible if the table is not empty.
  - Made the column `template_id` on table `virtual_machine` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `virtual_machine` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `virtual_machine` required. This step will fail if there are existing NULL values in that column.
  - Made the column `public_key_id` on table `virtual_machine` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "virtual_machine" DROP CONSTRAINT "virtual_machine_public_key_id_fkey";

-- DropForeignKey
ALTER TABLE "virtual_machine" DROP CONSTRAINT "virtual_machine_template_id_fkey";

-- DropForeignKey
ALTER TABLE "virtual_machine" DROP CONSTRAINT "virtual_machine_user_id_fkey";

-- AlterTable
ALTER TABLE "virtual_machine" ADD COLUMN     "duration" INTEGER NOT NULL,
ADD COLUMN     "started_at" TIMESTAMP(6),
ALTER COLUMN "template_id" SET NOT NULL,
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "updated_at" SET NOT NULL,
ALTER COLUMN "public_key_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "virtual_machine" ADD CONSTRAINT "virtual_machine_public_key_id_fkey" FOREIGN KEY ("public_key_id") REFERENCES "vm_public_key"("key_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "virtual_machine" ADD CONSTRAINT "virtual_machine_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "vm_template"("template_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "virtual_machine" ADD CONSTRAINT "virtual_machine_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profile"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
