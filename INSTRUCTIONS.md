# Database Setup Instructions

## The Issue

Your PostgreSQL database user "aaa" doesn't exist yet. The application is configured correctly, but needs the database user to be created.

## Quick Fix (Run these commands)

Open a terminal and run:

```bash
sudo -u postgres psql
```

Then in the PostgreSQL prompt, run these SQL commands:

```sql
CREATE USER aaa WITH PASSWORD 'aaa' CREATEDB;
CREATE DATABASE chatapp OWNER aaa;
GRANT ALL PRIVILEGES ON DATABASE chatapp TO aaa;
\q
```

## Alternative: Use the setup script

If you have sudo access without password prompt (NOPASSWD configured), run:

```bash
./scripts/final-db-setup.sh
```

## After creating the user

1. Your `.env` file already has the correct DATABASE_URL
2. Restart your Next.js dev server
3. The signup should work!

## Verify it worked

Test the connection:

```bash
node scripts/test-db-connection.js
```

Or try signing up in the app - it should work now!
