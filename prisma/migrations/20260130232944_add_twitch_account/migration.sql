-- AlterTable
ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;

-- CreateTable
CREATE TABLE "twitch_accounts" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "twitchId" TEXT NOT NULL,
    "twitchLogin" TEXT NOT NULL,
    "twitchDisplayName" TEXT NOT NULL,
    "twitchEmail" TEXT,
    "twitchProfileImage" TEXT,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "tokenExpiresAt" TIMESTAMP(3) NOT NULL,
    "scopes" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "twitch_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "twitch_accounts_userId_key" ON "twitch_accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "twitch_accounts_twitchId_key" ON "twitch_accounts"("twitchId");

-- AddForeignKey
ALTER TABLE "twitch_accounts" ADD CONSTRAINT "twitch_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
