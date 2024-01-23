-- CreateTable
CREATE TABLE "user_activity" (
    "activity_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "vm_id" UUID,
    "activity_type" TEXT NOT NULL,
    "description" TEXT,
    "timestamp" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_activity_pkey" PRIMARY KEY ("activity_id")
);

-- CreateTable
CREATE TABLE "user_profile" (
    "user_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "user_type" TEXT NOT NULL DEFAULT 'User',
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_profile_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "virtual_machine" (
    "vm_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "template_id" UUID NOT NULL,
    "vm_name" TEXT NOT NULL,
    "ipv4_address" TEXT,
    "ipv6_address" TEXT,
    "status" TEXT,
    "public_key_id" UUID NOT NULL,
    "duration" INTEGER NOT NULL,
    "started_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "virtual_machine_pkey" PRIMARY KEY ("vm_id")
);

-- CreateTable
CREATE TABLE "vm_event" (
    "event_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vm_id" UUID,
    "event_type" TEXT NOT NULL,
    "description" TEXT,
    "timestamp" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vm_event_pkey" PRIMARY KEY ("event_id")
);

-- CreateTable
CREATE TABLE "vm_template" (
    "template_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "template_name" TEXT NOT NULL,
    "flavor_name" TEXT NOT NULL DEFAULT '',
    "provider_id" UUID NOT NULL,
    "cpu" INTEGER NOT NULL,
    "ram" INTEGER NOT NULL,
    "storage" INTEGER NOT NULL,
    "os" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vm_template_pkey" PRIMARY KEY ("template_id")
);

-- CreateTable
CREATE TABLE "provider" (
    "provider_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "provider_name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provider_pkey" PRIMARY KEY ("provider_id")
);

-- CreateTable
CREATE TABLE "vm_public_key" (
    "key_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "public_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "user_id" UUID,
    "name" TEXT NOT NULL,

    CONSTRAINT "vm_public_key_pkey" PRIMARY KEY ("key_id")
);

-- CreateTable
CREATE TABLE "message" (
    "message_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "queue_name" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "user_id" UUID,
    "vm_id" UUID,
    "metadata" TEXT,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_pkey" PRIMARY KEY ("message_id")
);

-- CreateTable
CREATE TABLE "provision_log" (
    "log_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "queue_name" TEXT NOT NULL,
    "vm_id" UUID,
    "action" TEXT NOT NULL,
    "log_message" JSONB NOT NULL,
    "timestamp" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provision_log_pkey" PRIMARY KEY ("log_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_profile_email_key" ON "user_profile"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_profile_username_key" ON "user_profile"("username");

-- CreateIndex
CREATE UNIQUE INDEX "provider_provider_name_key" ON "provider"("provider_name");

-- AddForeignKey
ALTER TABLE "virtual_machine" ADD CONSTRAINT "virtual_machine_public_key_id_fkey" FOREIGN KEY ("public_key_id") REFERENCES "vm_public_key"("key_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "virtual_machine" ADD CONSTRAINT "virtual_machine_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "vm_template"("template_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "virtual_machine" ADD CONSTRAINT "virtual_machine_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profile"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vm_event" ADD CONSTRAINT "vm_event_vm_id_fkey" FOREIGN KEY ("vm_id") REFERENCES "virtual_machine"("vm_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vm_template" ADD CONSTRAINT "vm_template_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "provider"("provider_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vm_public_key" ADD CONSTRAINT "vm_public_key_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profile"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_vm_id_fkey" FOREIGN KEY ("vm_id") REFERENCES "virtual_machine"("vm_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profile"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "provision_log" ADD CONSTRAINT "provision_log_vm_id_fkey" FOREIGN KEY ("vm_id") REFERENCES "virtual_machine"("vm_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
