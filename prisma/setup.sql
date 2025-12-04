
-- Create User table
CREATE TABLE IF NOT EXISTS "User" (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password TEXT NOT NULL,
  picture TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create ChatSession table
CREATE TABLE IF NOT EXISTS "ChatSession" (
  id TEXT PRIMARY KEY,
  "user1Id" TEXT NOT NULL,
  "user2Id" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE("user1Id", "user2Id"),
  FOREIGN KEY ("user1Id") REFERENCES "User"(id) ON DELETE CASCADE,
  FOREIGN KEY ("user2Id") REFERENCES "User"(id) ON DELETE CASCADE
);

-- Create Message table
CREATE TABLE IF NOT EXISTS "Message" (
  id TEXT PRIMARY KEY,
  "sessionId" TEXT NOT NULL,
  "senderId" TEXT NOT NULL,
  content TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY ("sessionId") REFERENCES "ChatSession"(id) ON DELETE CASCADE,
  FOREIGN KEY ("senderId") REFERENCES "User"(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "ChatSession_user1Id_idx" ON "ChatSession"("user1Id");
CREATE INDEX IF NOT EXISTS "ChatSession_user2Id_idx" ON "ChatSession"("user2Id");
CREATE INDEX IF NOT EXISTS "Message_sessionId_idx" ON "Message"("sessionId");
CREATE INDEX IF NOT EXISTS "Message_createdAt_idx" ON "Message"("createdAt");

-- Add password column if User table exists but column doesn't
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'User') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'password') THEN
      ALTER TABLE "User" ADD COLUMN password TEXT;
    END IF;
  END IF;
END $$;
