/*
  Warnings:

  - You are about to drop the `one_time_url` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "one_time_url";

-- CreateTable
CREATE TABLE "app_url" (
    "url_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "action_type" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(6),
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB DEFAULT '{}',

    CONSTRAINT "app_url_pkey" PRIMARY KEY ("url_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "app_url_token_key" ON "app_url"("token");
