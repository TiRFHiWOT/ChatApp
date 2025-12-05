require("dotenv").config();
const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

async function tryCreateDatabase() {
  // Try to connect as postgres superuser via peer auth (Unix socket)
  const superuserClient = new Client({
    user: "postgres",
    host: "/var/run/postgresql", // Unix socket path
    database: "postgres",
  });

  try {
    await superuserClient.connect();
    console.log("✅ Connected as postgres superuser");

    // Create database if it doesn't exist
    await superuserClient.query("CREATE DATABASE chatapp;").catch(() => {
      console.log("Database 'chatapp' may already exist");
    });

    // Create user if it doesn't exist
    const currentUser = process.env.USER || "aaa";
    await superuserClient
      .query(`CREATE USER ${currentUser} WITH PASSWORD '${currentUser}';`)
      .catch(() => {
        console.log(`User '${currentUser}' may already exist`);
      });

    // Grant privileges
    await superuserClient.query(
      `GRANT ALL PRIVILEGES ON DATABASE chatapp TO ${currentUser};`
    );

    await superuserClient.end();

    // Test new connection
    const testClient = new Client({
      user: currentUser,
      password: currentUser,
      host: "localhost",
      database: "chatapp",
    });

    await testClient.connect();
    await testClient.query("SELECT 1");
    await testClient.end();

    const newUrl = `postgresql://${currentUser}:${currentUser}@localhost:5432/chatapp?schema=public`;
    console.log(`✅ Database setup successful!`);
    console.log(`\n📝 Update your .env file with:`);
    console.log(`DATABASE_URL="${newUrl}"\n`);

    return newUrl;
  } catch (error) {
    console.log(`❌ Superuser access failed: ${error.message}`);
    try {
      await superuserClient.end();
    } catch {}
    return null;
  }
}

async function updateEnvFile(newUrl) {
  const envPath = path.join(__dirname, "../.env");
  let envContent = "";

  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, "utf-8");
  }

  // Remove old DATABASE_URL if exists
  envContent = envContent.replace(/^DATABASE_URL=.*$/m, "");

  // Add new DATABASE_URL
  if (!envContent.includes("DATABASE_URL")) {
    envContent += `\nDATABASE_URL="${newUrl}"\n`;
  } else {
    envContent = envContent.replace(/(DATABASE_URL=)(.*)/, `$1"${newUrl}"`);
  }

  fs.writeFileSync(envPath, envContent.trim() + "\n");
  console.log("✅ .env file updated!");
}

async function main() {
  console.log("Attempting automatic database setup...\n");

  // Try to create database and user
  const newUrl = await tryCreateDatabase();

  if (newUrl) {
    // Update .env file
    try {
      await updateEnvFile(newUrl);
      console.log("\n✅ Setup complete! Restart your dev server.");
    } catch (error) {
      console.log("\n⚠️  Could not update .env automatically.");
      console.log(
        "Please manually update .env with the DATABASE_URL shown above."
      );
    }
  } else {
    console.log("\n❌ Automatic setup failed.");
    console.log("Please manually:");
    console.log("1. Create database: sudo -u postgres createdb chatapp");
    console.log("2. Create user: sudo -u postgres createuser -P your_username");
    console.log(
      '3. Update .env with: DATABASE_URL="postgresql://user:pass@localhost:5432/chatapp?schema=public"'
    );
  }
}

main();


