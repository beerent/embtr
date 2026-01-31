-- AlterTable
ALTER TABLE "twitch_accounts" ADD COLUMN     "isSubscriber" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "subscriberCheckedAt" TIMESTAMP(3);
