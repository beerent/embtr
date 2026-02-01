-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'user';

-- Set thedevdad_ as admin
UPDATE "users" SET "role" = 'admin' WHERE "username" = 'thedevdad_';
