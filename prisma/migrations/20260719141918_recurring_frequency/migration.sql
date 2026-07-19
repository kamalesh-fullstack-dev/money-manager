/*
  Warnings:

  - You are about to drop the column `interval_days` on the `recurring_transactions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "recurring_transactions" DROP COLUMN "interval_days",
ADD COLUMN     "frequency" "BudgetPeriod" NOT NULL DEFAULT 'MONTHLY';
