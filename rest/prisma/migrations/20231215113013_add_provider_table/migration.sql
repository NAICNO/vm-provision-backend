/*
  Warnings:

  - Added the required column `provider_id` to the `vm_template` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "vm_template" ADD COLUMN     "provider_id" UUID NOT NULL;

-- CreateTable
CREATE TABLE "provider" (
    "provider_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "provider_name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provider_pkey" PRIMARY KEY ("provider_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "provider_provider_name_key" ON "provider"("provider_name");

-- AddForeignKey
ALTER TABLE "vm_template" ADD CONSTRAINT "vm_template_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "provider"("provider_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
