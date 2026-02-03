-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('POST_LIKED', 'POST_COMMENTED');

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "recipientUserId" INTEGER NOT NULL,
    "actorUserId" INTEGER NOT NULL,
    "type" "NotificationType" NOT NULL,
    "targetId" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bug_reports" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bug_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_recipientUserId_createdAt_idx" ON "notifications"("recipientUserId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "notifications_recipientUserId_readAt_idx" ON "notifications"("recipientUserId", "readAt");

-- CreateIndex
CREATE INDEX "bug_reports_status_idx" ON "bug_reports"("status");

-- CreateIndex
CREATE INDEX "bug_reports_userId_idx" ON "bug_reports"("userId");

-- CreateIndex
CREATE INDEX "bug_reports_createdAt_idx" ON "bug_reports"("createdAt" DESC);

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bug_reports" ADD CONSTRAINT "bug_reports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
