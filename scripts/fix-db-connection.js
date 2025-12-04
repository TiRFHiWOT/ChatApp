require("dotenv").config();
const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "../.env");

async function testAndUpdateConnection() {
  console.log("Testing database connections and updating .env...\n");

  // Common PostgreSQL connection patterns to try
  const testConfigs = [
    // Peer authentication (no password, Unix socket)
    {
      user: process.env.USER || "aaa",
      host: "/var/run/postgresql",
      database: "chatapp",
    },
    { user: "postgres", host: "/var/run/postgresql", database: "chatapp" },

    // TCP with common passwords
    {
      user: process.env.USER || "aaa",
      password: "",
      host: "localhost",
      database: "chatapp",
    },
    {
      user: "postgres",
      password: "postgres",
      host: "localhost",
      database: "chatapp",
    },
    { user: "postgres", password: "", host: "localhost", database: "chatapp" },
    {
      user: process.env.USER || "aaa",
      password: process.env.USER || "aaa",
      host: "localhost",
      database: "chatapp",
    },
  ];

  for (const config of testConfigs) {
    const client = new Client(config);
    try {
      await client.connect();
      await client.query("SELECT 1");

      // Build connection string
      let connectionString = `postgresql://${config.user}`;
      if (config.password) {
        connectionString += `:${config.password}`;
      }
      connectionString += `@${
        config.host === "/var/run/postgresql" ? "localhost" : config.host
      }:5432/${config.database}?schema=public`;

      console.log(
        `✅ Found working connection: ${config.user}@${config.database}`
      );

      // Update .env file
      let envContent = "";
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, "utf-8");
      }

      // Remove old DATABASE_URL
      envContent = envContent.replace(/^DATABASE_URL=.*$/m, "");

      // Add new DATABASE_URL at the end
      envContent = envContent.trim() + `\nDATABASE_URL="${connectionString}"\n`;

      fs.writeFileSync(envPath, envContent);

      console.log(`✅ Updated .env file with working DATABASE_URL`);
      console.log(`\n📝 DATABASE_URL="${connectionString}"`);
      console.log(
        "\n✅ Please restart your dev server for changes to take effect."
      );

      await client.end();
      return true;
    } catch (error) {
      try {
        await client.end();
      } catch {}
      // Continue to next config
    }
  }

  console.log("❌ Could not find a working database connection.");
  console.log("\nPlease manually configure your database:");
  console.log(
    "1. Ensure PostgreSQL is running: sudo systemctl status postgresql"
  );
  console.log("2. Create database: sudo -u postgres createdb chatapp");
  console.log(
    '3. Update .env with: DATABASE_URL="postgresql://username:password@localhost:5432/chatapp?schema=public"'
  );
  return false;
}

testAndUpdateConnection();
