-- CreateEnum
CREATE TYPE "TimelinePostType" AS ENUM ('USER_POST', 'DAY_RESULT');

-- CreateTable
CREATE TABLE "timeline_posts" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" "TimelinePostType" NOT NULL,
    "body" TEXT,
    "plannedDayId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "timeline_posts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "timeline_posts_createdAt_idx" ON "timeline_posts"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "timeline_posts_userId_idx" ON "timeline_posts"("userId");

-- AddForeignKey
ALTER TABLE "timeline_posts" ADD CONSTRAINT "timeline_posts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_posts" ADD CONSTRAINT "timeline_posts_plannedDayId_fkey" FOREIGN KEY ("plannedDayId") REFERENCES "planned_days"("id") ON DELETE SET NULL ON UPDATE CASCADE;
