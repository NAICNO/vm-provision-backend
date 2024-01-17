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
    "user_id" UUID,
    "template_id" UUID,
    "vm_name" TEXT NOT NULL,
    "ipv4_address" TEXT,
    "ipv6_address" TEXT,
    "status" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "public_key_id" UUID,

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
CREATE TABLE "vm_public_key" (
    "key_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "public_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "user_id" UUID,
    "name" TEXT NOT NULL,

    CONSTRAINT "vm_public_key_pkey" PRIMARY KEY ("key_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_profile_email_key" ON "user_profile"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_profile_username_key" ON "user_profile"("username");

-- CreateIndex
CREATE UNIQUE INDEX "vm_template_template_name_key" ON "vm_template"("template_name");

-- AddForeignKey
ALTER TABLE "virtual_machine" ADD CONSTRAINT "virtual_machine_public_key_id_fkey" FOREIGN KEY ("public_key_id") REFERENCES "vm_public_key"("key_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "virtual_machine" ADD CONSTRAINT "virtual_machine_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "vm_template"("template_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "virtual_machine" ADD CONSTRAINT "virtual_machine_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profile"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vm_event" ADD CONSTRAINT "vm_event_vm_id_fkey" FOREIGN KEY ("vm_id") REFERENCES "virtual_machine"("vm_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vm_public_key" ADD CONSTRAINT "vm_public_key_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profile"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

