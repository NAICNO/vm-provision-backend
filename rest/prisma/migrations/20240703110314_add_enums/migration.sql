/*
  Warnings:

  - You are about to drop the column `action_type` on the `app_url` table. All the data in the column will be lost.
  - Added the required column `action` to the `app_url` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `status` on the `message` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `activity_type` on the `user_activity` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `status` to the `virtual_machine` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `event_type` on the `vm_event` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "UserActivityType" AS ENUM ('USER_CREATED', 'USER_LOGIN_SUCCESS', 'USER_LOGIN_FAILED', 'USER_LOGGED_OUT', 'USER_DELETED', 'USER_UPDATED', 'USER_TOKEN_REFRESHED', 'USER_TOKEN_REFRESH_FAILED', 'VM_CREATION_REQUESTED', 'VM_DESTROY_REQUESTED');

-- CreateEnum
CREATE TYPE "VmEventType" AS ENUM ('PROVISIONING_REQUESTED', 'PROVISIONING_QUEUED', 'PROVISIONING_STARTED', 'PROVISIONING_COMPLETED', 'PROVISIONING_FAILED', 'DESTROYING_REQUESTED', 'RUNNING', 'STOPPED', 'SHUTDOWN', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "VmStatus" AS ENUM ('UNKNOWN', 'TO_BE_PROVISIONED', 'PLANNING', 'PLANNING_COMPLETED', 'PROVISIONING', 'PROVISIONING_COMPLETED', 'PROVISIONING_FAILED', 'INITIALIZING', 'RUNNING', 'STOPPED', 'SHUTDOWN', 'TO_BE_DESTROYED', 'DESTROYING', 'DESTROYED');

-- CreateEnum
CREATE TYPE "MessagePublishStatus" AS ENUM ('PENDING', 'PUBLISHED', 'FAILED');

-- CreateEnum
CREATE TYPE "UrlAction" AS ENUM ('NOTIFY_VM_INITIALIZE_START', 'NOTIFY_VM_INITIALIZE_COMPLETE', 'NOTIFY_VM_DESTROY_START');

-- AlterTable
ALTER TABLE "app_url" DROP COLUMN "action_type",
ADD COLUMN     "action" "UrlAction" NOT NULL;

-- AlterTable
ALTER TABLE "message" DROP COLUMN "status",
ADD COLUMN     "status" "MessagePublishStatus" NOT NULL;

-- AlterTable
ALTER TABLE "user_activity" DROP COLUMN "activity_type",
ADD COLUMN     "activity_type" "UserActivityType" NOT NULL;

-- AlterTable
ALTER TABLE "virtual_machine" DROP COLUMN "status",
ADD COLUMN     "status" "VmStatus" NOT NULL;

-- AlterTable
ALTER TABLE "vm_event" DROP COLUMN "event_type",
ADD COLUMN     "event_type" "VmEventType" NOT NULL;
