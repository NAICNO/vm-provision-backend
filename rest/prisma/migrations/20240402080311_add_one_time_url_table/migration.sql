/*
  Warnings:

  - You are about to drop the `vm_url` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "vm_url";

-- CreateTable
CREATE TABLE "one_time_url" (
    "url_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "action_type" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB DEFAULT '{}',

    CONSTRAINT "one_time_url_pkey" PRIMARY KEY ("url_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "one_time_url_token_key" ON "one_time_url"("token");
