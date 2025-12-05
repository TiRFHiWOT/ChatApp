require("dotenv").config();
const { execSync } = require("child_process");

console.log("Attempting to create database and user...\n");

const commands = [
  // Try to create database as postgres superuser
  'sudo -u postgres psql -c "CREATE DATABASE chatapp;" 2>&1 || echo "Database may already exist"',
  'sudo -u postgres psql -c "CREATE USER ' +
    (process.env.USER || "aaa") +
    " WITH PASSWORD '" +
    (process.env.DB_PASSWORD || "") +
    '\';" 2>&1 || echo "User may already exist"',
  'sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE chatapp TO ' +
    (process.env.USER || "aaa") +
    ';" 2>&1 || echo "Grant may have failed"',
];

for (const cmd of commands) {
  try {
    const result = execSync(cmd, { encoding: "utf-8", stdio: "pipe" });
    console.log(result);
  } catch (error) {
    console.log(error.message);
  }
}

console.log("\nIf the above commands worked, update your .env with:");
console.log(
  `DATABASE_URL="postgresql://${process.env.USER || "aaa"}:${
    process.env.DB_PASSWORD || "yourpassword"
  }@localhost:5432/chatapp?schema=public"`
);


