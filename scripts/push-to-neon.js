#!/usr/bin/env node
/**
 * Push Prisma schema to Neon database
 * Usage: DATABASE_URL="your-neon-url" node scripts/push-to-neon.js
 */

const { execSync } = require("child_process");

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("❌ DATABASE_URL environment variable is required");
  console.error(
    'Usage: DATABASE_URL="your-neon-url" node scripts/push-to-neon.js'
  );
  process.exit(1);
}

if (!databaseUrl.includes("neon.tech")) {
  console.warn("⚠️  Warning: DATABASE_URL does not appear to be a Neon URL");
  console.warn("Continuing anyway...\n");
}

console.log("🚀 Pushing Prisma schema to database...");
console.log(`Database: ${databaseUrl.substring(0, 50)}...\n`);

try {
  execSync("npx prisma db push --skip-generate --accept-data-loss", {
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
    },
  });

  console.log("\n✅ Schema pushed successfully!");
  console.log("📋 Tables created: User, ChatSession, Message");
} catch (error) {
  console.error("\n❌ Failed to push schema");
  console.error("Error:", error.message);
  process.exit(1);
}
