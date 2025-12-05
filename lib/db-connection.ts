export function getDatabaseUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const user = process.env.USER || "postgres";
  const db = process.env.DB_NAME || "chatapp";

  return `postgresql://${user}@localhost:5432/${db}?schema=public`;
}
