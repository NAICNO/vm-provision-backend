/*
  Warnings:

  - You are about to drop the `message_queue` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "message_queue" DROP CONSTRAINT "message_queue_user_id_fkey";

-- DropForeignKey
ALTER TABLE "message_queue" DROP CONSTRAINT "message_queue_vm_id_fkey";

-- DropTable
DROP TABLE "message_queue";

-- CreateTable
CREATE TABLE "message" (
    "request_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "queue_name" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "user_id" UUID,
    "vm_id" UUID,
    "metadata" TEXT,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_pkey" PRIMARY KEY ("request_id")
);

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_vm_id_fkey" FOREIGN KEY ("vm_id") REFERENCES "virtual_machine"("vm_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profile"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
