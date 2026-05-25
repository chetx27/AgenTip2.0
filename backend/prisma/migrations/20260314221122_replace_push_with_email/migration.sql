/*
  Warnings:

  - You are about to drop the column `push_subscription` on the `creators` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "creators" DROP COLUMN "push_subscription",
ADD COLUMN     "email" TEXT;
