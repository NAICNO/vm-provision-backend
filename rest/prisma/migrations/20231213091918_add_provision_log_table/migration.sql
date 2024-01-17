-- CreateTable
CREATE TABLE "provision_log" (
    "log_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "queue_name" TEXT NOT NULL,
    "vm_id" UUID,
    "log_message" TEXT NOT NULL,
    "timestamp" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provision_log_pkey" PRIMARY KEY ("log_id")
);

-- AddForeignKey
ALTER TABLE "provision_log" ADD CONSTRAINT "provision_log_vm_id_fkey" FOREIGN KEY ("vm_id") REFERENCES "virtual_machine"("vm_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
