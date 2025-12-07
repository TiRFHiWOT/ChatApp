import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const setupSQL = `
-- Create User table if not exists
CREATE TABLE IF NOT EXISTS "User" (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password TEXT,
  picture TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add password column if User table exists but column doesn't
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'User') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'password') THEN
      ALTER TABLE "User" ADD COLUMN password TEXT;
    END IF;
  END IF;
END $$;

-- Create ChatSession table if not exists
CREATE TABLE IF NOT EXISTS "ChatSession" (
  id TEXT PRIMARY KEY,
  "user1Id" TEXT NOT NULL,
  "user2Id" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE("user1Id", "user2Id")
);

-- Add foreign keys if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'ChatSession_user1Id_fkey'
  ) THEN
    ALTER TABLE "ChatSession" 
    ADD CONSTRAINT "ChatSession_user1Id_fkey" 
    FOREIGN KEY ("user1Id") REFERENCES "User"(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'ChatSession_user2Id_fkey'
  ) THEN
    ALTER TABLE "ChatSession" 
    ADD CONSTRAINT "ChatSession_user2Id_fkey" 
    FOREIGN KEY ("user2Id") REFERENCES "User"(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create Message table if not exists
CREATE TABLE IF NOT EXISTS "Message" (
  id TEXT PRIMARY KEY,
  "sessionId" TEXT NOT NULL,
  "senderId" TEXT NOT NULL,
  content TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add foreign keys for Message if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'Message_sessionId_fkey'
  ) THEN
    ALTER TABLE "Message" 
    ADD CONSTRAINT "Message_sessionId_fkey" 
    FOREIGN KEY ("sessionId") REFERENCES "ChatSession"(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'Message_senderId_fkey'
  ) THEN
    ALTER TABLE "Message" 
    ADD CONSTRAINT "Message_senderId_fkey" 
    FOREIGN KEY ("senderId") REFERENCES "User"(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS "ChatSession_user1Id_idx" ON "ChatSession"("user1Id");
CREATE INDEX IF NOT EXISTS "ChatSession_user2Id_idx" ON "ChatSession"("user2Id");
CREATE INDEX IF NOT EXISTS "Message_sessionId_idx" ON "Message"("sessionId");
CREATE INDEX IF NOT EXISTS "Message_createdAt_idx" ON "Message"("createdAt");
`;

async function setupDatabase() {
  try {
    const statements = setupSQL
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    for (const statement of statements) {
      if (statement) {
        try {
          await prisma.$executeRawUnsafe(statement);
        } catch (error: any) {
          if (
            !error.message?.includes("already exists") &&
            !error.message?.includes("duplicate")
          ) {
            console.error("SQL error:", error.message);
          }
        }
      }
    }

    return {
      success: true,
      message: "Database setup completed successfully!",
    };
  } catch (error: any) {
    console.error("Setup error:", error);
    return {
      success: false,
      error: error.message,
      message:
        "Database setup failed. Please check your DATABASE_URL and database permissions.",
    };
  }
}

export async function GET() {
  const result = await setupDatabase();
  return NextResponse.json(result, {
    status: result.success ? 200 : 500,
  });
}

export async function POST() {
  const result = await setupDatabase();
  return NextResponse.json(result, {
    status: result.success ? 200 : 500,
  });
}
