/*
  Warnings:

  - You are about to drop the column `performedById` on the `Refund` table. All the data in the column will be lost.
  - Made the column `saleItemId` on table `Refund` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "public"."RefundStatus" AS ENUM ('pending', 'approved', 'rejected');

-- DropForeignKey
ALTER TABLE "public"."Refund" DROP CONSTRAINT "Refund_performedById_fkey";

-- DropForeignKey
ALTER TABLE "public"."Refund" DROP CONSTRAINT "Refund_saleItemId_fkey";

-- AlterTable
ALTER TABLE "public"."Refund" DROP COLUMN "performedById",
ADD COLUMN     "processedAt" TIMESTAMP(3),
ADD COLUMN     "processedById" TEXT,
ADD COLUMN     "requestedById" TEXT,
ADD COLUMN     "status" "public"."RefundStatus" NOT NULL DEFAULT 'pending',
ALTER COLUMN "saleItemId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Refund" ADD CONSTRAINT "Refund_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Refund" ADD CONSTRAINT "Refund_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Refund" ADD CONSTRAINT "Refund_saleItemId_fkey" FOREIGN KEY ("saleItemId") REFERENCES "public"."SaleItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
