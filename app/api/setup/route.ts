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
    // First, verify connection
    await prisma.$connect();

    // Check if tables already exist
    const existingTables = await prisma.$queryRaw<
      Array<{ table_name: string }>
    >`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `;

    const tableNames = existingTables.map((t) => t.table_name);
    const hasUserTable = tableNames.includes("User");

    if (
      hasUserTable &&
      tableNames.includes("ChatSession") &&
      tableNames.includes("Message")
    ) {
      return {
        success: true,
        message: "Database tables already exist. Setup skipped.",
        existingTables: tableNames,
      };
    }

    // Split SQL statements properly, handling DO $$ blocks
    const statements: string[] = [];
    let currentStatement = "";
    let inDoBlock = false;
    let dollarTag = "";

    const lines = setupSQL.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();

      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith("--")) {
        continue;
      }

      // Check for DO $$ blocks (can be on same line or separate)
      const doMatch = trimmed.match(/DO\s+\$\$(\w*)/i);
      if (doMatch && !inDoBlock) {
        inDoBlock = true;
        dollarTag = doMatch[1] || "";
        currentStatement += (currentStatement ? "\n" : "") + line;
        continue;
      }

      // Check for END of DO block
      if (inDoBlock) {
        currentStatement += (currentStatement ? "\n" : "") + line;
        const endMatch = trimmed.match(
          new RegExp(`END\\s+\\$\\$${dollarTag}\\s*;?`, "i")
        );
        if (endMatch) {
          inDoBlock = false;
          dollarTag = "";
          if (trimmed.endsWith(";")) {
            statements.push(currentStatement.trim());
            currentStatement = "";
          }
        }
        continue;
      }

      // Regular statement
      currentStatement += (currentStatement ? "\n" : "") + line;

      if (trimmed.endsWith(";")) {
        // Regular statement ending with semicolon
        statements.push(currentStatement.trim());
        currentStatement = "";
      }
    }

    // Add any remaining statement
    if (currentStatement.trim()) {
      statements.push(currentStatement.trim());
    }

    // Filter out empty statements
    const validStatements = statements.filter((s) => s.length > 0);

    const errors: string[] = [];
    for (const statement of validStatements) {
      if (statement) {
        try {
          await prisma.$executeRawUnsafe(statement);
        } catch (error: any) {
          const errorMsg = error.message || String(error);
          if (
            !errorMsg.includes("already exists") &&
            !errorMsg.includes("duplicate") &&
            !errorMsg.includes("does not exist")
          ) {
            errors.push(
              `Statement failed: ${statement.substring(
                0,
                50
              )}... Error: ${errorMsg}`
            );
            console.error("SQL error:", errorMsg);
          }
        }
      }
    }

    // Verify tables were created
    const finalTables = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `;

    const finalTableNames = finalTables.map((t) => t.table_name);
    const allTablesExist = ["User", "ChatSession", "Message"].every((table) =>
      finalTableNames.includes(table)
    );

    if (!allTablesExist && errors.length === 0) {
      errors.push(`Tables not created. Found: ${finalTableNames.join(", ")}`);
    }

    return {
      success: allTablesExist,
      message: allTablesExist
        ? "Database setup completed successfully!"
        : "Database setup completed with errors",
      tables: finalTableNames,
      errors: errors.length > 0 ? errors : undefined,
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
