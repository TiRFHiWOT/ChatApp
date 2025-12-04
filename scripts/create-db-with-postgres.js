require("dotenv").config();
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Try to create database and user using postgres superuser
// This will work if the user has sudo access without password (NOPASSWD)

console.log("Attempting to create database and user...\n");

try {
  // Create user
  execSync(
    "sudo -u postgres psql -c \"CREATE USER aaa WITH PASSWORD 'aaa' CREATEDB;\" 2>&1",
    { stdio: "inherit" }
  );
} catch (e) {
  console.log("User may already exist or creation failed");
}

try {
  // Create database
  execSync(
    'sudo -u postgres psql -c "CREATE DATABASE chatapp OWNER aaa;" 2>&1',
    { stdio: "inherit" }
  );
} catch (e) {
  console.log("Database may already exist or creation failed");
}

// Update .env
const envPath = path.join(__dirname, "../.env");
let envContent = "";
if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, "utf-8");
}

envContent = envContent.replace(/^DATABASE_URL=.*$/m, "");
envContent =
  envContent.trim() +
  '\nDATABASE_URL="postgresql://aaa:aaa@localhost:5432/chatapp?schema=public"\n';

fs.writeFileSync(envPath, envContent);
console.log("\n✅ Updated .env file");
console.log(
  'DATABASE_URL="postgresql://aaa:aaa@localhost:5432/chatapp?schema=public"'
);
