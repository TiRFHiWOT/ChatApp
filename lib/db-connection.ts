// Helper to get database connection string with fallbacks
export function getDatabaseUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  // Try peer authentication (no password, uses system user)
  const user = process.env.USER || "postgres";
  const db = process.env.DB_NAME || "chatapp";

  return `postgresql://${user}@localhost:5432/${db}?schema=public`;
}
