-- AlterTable
ALTER TABLE "creators" ADD COLUMN     "notifications_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "push_subscription" TEXT,
ADD COLUMN     "summary_time" TEXT NOT NULL DEFAULT '20:00';
