# Database Setup Guide

## Quick Setup

Your `.env` file currently has placeholder database credentials. Follow these steps to fix it:

### Option 1: Using existing PostgreSQL user

If you already have PostgreSQL installed and a user configured:

1. Find your PostgreSQL username:

   ```bash
   whoami
   ```

2. Test connection:

   ```bash
   psql -d postgres -c "SELECT version();"
   ```

3. Create the database:

   ```bash
   createdb chatapp
   ```

4. Update `.env`:
   ```env
   DATABASE_URL="postgresql://YOUR_USERNAME@localhost:5432/chatapp?schema=public"
   ```
   (Remove password if using peer authentication)

### Option 2: Create new PostgreSQL user

1. Switch to postgres user:

   ```bash
   sudo -u postgres psql
   ```

2. In PostgreSQL prompt:

   ```sql
   CREATE DATABASE chatapp;
   CREATE USER your_username WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE chatapp TO your_username;
   \q
   ```

3. Update `.env`:
   ```env
   DATABASE_URL="postgresql://your_username:your_password@localhost:5432/chatapp?schema=public"
   ```

### Option 3: Use Docker PostgreSQL

```bash
docker run --name chatapp-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=chatapp -p 5432:5432 -d postgres
```

Then update `.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/chatapp?schema=public"
```

### After updating .env

1. Run database setup:

   ```bash
   curl -X POST http://localhost:3000/api/setup
   ```

2. Restart your dev server

## Verify Connection

Test your connection:

```bash
node scripts/test-db-connection.js
```

Fix connection automatically (if possible):

```bash
node scripts/fix-db-connection.js
```
