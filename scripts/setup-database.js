require("dotenv").config();
const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

const schemaSQL = `
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
`;

async function tryConnection(config, label) {
  const client = new Client(config);
  try {
    await client.connect();
    console.log(`✅ Connected using ${label}`);

    // Execute schema
    await client.query(schemaSQL);
    console.log("✅ Database schema created/updated successfully!");

    await client.end();
    return true;
  } catch (error) {
    console.log(`❌ ${label} failed: ${error.message}`);
    try {
      await client.end();
    } catch {}
    return false;
  }
}

async function main() {
  // Parse DATABASE_URL if it exists
  let dbConfig = null;
  if (process.env.DATABASE_URL) {
    try {
      const url = new URL(process.env.DATABASE_URL);
      dbConfig = {
        host: url.hostname,
        port: parseInt(url.port) || 5432,
        database: url.pathname.slice(1).split("?")[0],
        user: url.username,
        password: url.password,
      };
    } catch (e) {
      // Invalid URL format, will try other methods
    }
  }

  // Try DATABASE_URL first
  if (process.env.DATABASE_URL && dbConfig) {
    const success = await tryConnection(dbConfig, "DATABASE_URL");
    if (success) {
      console.log("\n✅ Database setup complete! You can now use the app.");
      return;
    }
  }

  // Try direct connection string
  if (process.env.DATABASE_URL) {
    const success = await tryConnection(
      { connectionString: process.env.DATABASE_URL },
      "DATABASE_URL (direct)"
    );
    if (success) {
      console.log("\n✅ Database setup complete! You can now use the app.");
      return;
    }
  }

  // Save SQL to file as fallback
  const sqlPath = path.join(__dirname, "../prisma/setup.sql");
  fs.writeFileSync(sqlPath, schemaSQL);
  console.log("\n❌ Could not connect to database automatically.");
  console.log(`\n📄 SQL schema saved to: ${sqlPath}`);
  console.log("Please run this SQL in your PostgreSQL database client.");
  console.log(
    "\nOr update your .env file with correct DATABASE_URL and run this script again."
  );
  process.exit(1);
}

main();
