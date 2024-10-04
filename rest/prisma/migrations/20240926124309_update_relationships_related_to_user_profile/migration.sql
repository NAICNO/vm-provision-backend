-- DropForeignKey
ALTER TABLE "message" DROP CONSTRAINT "message_user_id_fkey";

-- DropForeignKey
ALTER TABLE "message" DROP CONSTRAINT "message_vm_id_fkey";

-- DropForeignKey
ALTER TABLE "provision_log" DROP CONSTRAINT "provision_log_vm_id_fkey";

-- DropForeignKey
ALTER TABLE "virtual_machine" DROP CONSTRAINT "virtual_machine_user_id_fkey";

-- AddForeignKey
ALTER TABLE "virtual_machine" ADD CONSTRAINT "virtual_machine_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profile"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_vm_id_fkey" FOREIGN KEY ("vm_id") REFERENCES "virtual_machine"("vm_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profile"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "provision_log" ADD CONSTRAINT "provision_log_vm_id_fkey" FOREIGN KEY ("vm_id") REFERENCES "virtual_machine"("vm_id") ON DELETE CASCADE ON UPDATE NO ACTION;
