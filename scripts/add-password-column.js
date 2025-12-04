require("dotenv").config();
const { Client } = require("pg");

async function tryConnection(connectionConfig, label) {
  const client = new Client(connectionConfig);
  try {
    await client.connect();
    console.log(`✅ Connected using ${label}`);

    // Check if column exists
    const checkResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='User' AND column_name='password';
    `);

    if (checkResult.rows.length === 0) {
      // Add password column
      await client.query('ALTER TABLE "User" ADD COLUMN password TEXT;');
      console.log("✅ Password column added successfully!");
    } else {
      console.log("✅ Password column already exists!");
    }

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
  // Try from DATABASE_URL first
  if (process.env.DATABASE_URL) {
    const success = await tryConnection(
      { connectionString: process.env.DATABASE_URL },
      "DATABASE_URL"
    );
    if (success) return;
  }

  // Try common local PostgreSQL connections
  const attempts = [
    { user: "postgres", database: "chatapp", host: "localhost" },
    { user: process.env.USER || "aaa", database: "chatapp", host: "localhost" },
    { user: "postgres", database: "postgres", host: "localhost" },
  ];

  for (const config of attempts) {
    const success = await tryConnection(
      config,
      `user: ${config.user}, db: ${config.database}`
    );
    if (success) return;
  }

  console.error("\n❌ Could not connect to database.");
  console.error("Please update your .env file with correct DATABASE_URL:");
  console.error(
    'DATABASE_URL="postgresql://username:password@localhost:5432/chatapp?schema=public"'
  );
  process.exit(1);
}

main();
