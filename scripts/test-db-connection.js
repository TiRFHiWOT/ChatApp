require("dotenv").config();
const { Client } = require("pg");

const commonConfigs = [
  {
    user: "postgres",
    password: "postgres",
    database: "chatapp",
    host: "localhost",
  },
  { user: "postgres", password: "", database: "chatapp", host: "localhost" },
  {
    user: process.env.USER || "aaa",
    password: "",
    database: "chatapp",
    host: "localhost",
  },
  {
    user: process.env.USER || "aaa",
    password: process.env.USER || "aaa",
    database: "chatapp",
    host: "localhost",
  },
];

async function testConnection(config, label) {
  const client = new Client(config);
  try {
    await client.connect();
    await client.query("SELECT 1");
    console.log(`✅ ${label}: Connected successfully!`);
    console.log(`   User: ${config.user}, Database: ${config.database}`);
    await client.end();
    return config;
  } catch (error) {
    console.log(`❌ ${label}: ${error.message}`);
    try {
      await client.end();
    } catch {}
    return null;
  }
}

async function main() {
  console.log("Testing database connections...\n");

  // Try DATABASE_URL first
  if (process.env.DATABASE_URL) {
    try {
      const client = new Client({ connectionString: process.env.DATABASE_URL });
      await client.connect();
      await client.query("SELECT 1");
      console.log("✅ DATABASE_URL: Connected successfully!");
      await client.end();
      return;
    } catch (error) {
      console.log(`❌ DATABASE_URL: ${error.message}\n`);
    }
  }

  // Try common configurations
  for (const config of commonConfigs) {
    const result = await testConnection(
      config,
      `Testing ${config.user}@${config.database}`
    );
    if (result) {
      const connectionString = `postgresql://${result.user}${
        result.password ? `:${result.password}` : ""
      }@${result.host}:5432/${result.database}?schema=public`;
      console.log(`\n📝 Update your .env file with:`);
      console.log(`DATABASE_URL="${connectionString}"\n`);
      return;
    }
  }

  console.log("\n❌ Could not connect with any common configuration.");
  console.log("Please update your .env file with correct DATABASE_URL:");
  console.log(
    'DATABASE_URL="postgresql://username:password@localhost:5432/chatapp?schema=public"'
  );
}

main();


