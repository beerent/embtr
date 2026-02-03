-- AlterTable
ALTER TABLE "habits" ADD COLUMN     "bucketId" INTEGER,
ADD COLUMN     "waterCost" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "buckets" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#4E73DF',
    "iconName" TEXT NOT NULL DEFAULT 'Droplets',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "buckets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "buckets_userId_isArchived_idx" ON "buckets"("userId", "isArchived");

-- AddForeignKey
ALTER TABLE "habits" ADD CONSTRAINT "habits_bucketId_fkey" FOREIGN KEY ("bucketId") REFERENCES "buckets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buckets" ADD CONSTRAINT "buckets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
