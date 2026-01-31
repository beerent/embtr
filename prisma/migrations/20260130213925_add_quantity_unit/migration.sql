-- AlterTable
ALTER TABLE "habits" ADD COLUMN     "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
ADD COLUMN     "unit" TEXT;

-- AlterTable
ALTER TABLE "planned_tasks" ADD COLUMN     "completedQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
ADD COLUMN     "unit" TEXT;

-- DataFix: set completedQuantity=1 for existing complete tasks
UPDATE "planned_tasks" SET "completedQuantity" = 1 WHERE status = 'complete';
