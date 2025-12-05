-- Make password column optional for OAuth users
ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL;

