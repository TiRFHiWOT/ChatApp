# Setting Up Neon Database for Vercel Deployment

This guide will walk you through creating a Neon PostgreSQL database and connecting it to your Vercel deployment.

## Step 1: Create a Neon Account and Database

1. **Sign up for Neon**

   - Go to [https://neon.tech](https://neon.tech)
   - Sign up with your GitHub account (recommended) or email

2. **Create a New Project**

   - Click "Create Project" or "New Project"
   - Choose a project name (e.g., "chatapp")
   - Select a region closest to your Vercel deployment region
   - Choose PostgreSQL version (14 or 15 recommended)
   - Click "Create Project"

3. **Get Your Connection String**
   - After creating the project, you'll see a connection string that looks like:
     ```
     postgresql://username:password@ep-xxxx-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
     ```
   - **Copy this connection string** - you'll need it for Vercel

## Step 2: Set Up Database Schema

You have two options to set up your database schema:

### Option A: Using Prisma (Recommended)

1. **Set DATABASE_URL locally** (temporarily):

   ```bash
   # In your project root, create or update .env.local
   DATABASE_URL="your-neon-connection-string-here"
   ```

2. **Push the schema to Neon**:

   ```bash
   npx prisma db push
   ```

3. **Verify the tables were created**:
   ```bash
   npx prisma studio
   ```
   This will open Prisma Studio where you can see your tables.

### Option B: Using the Setup API Endpoint

After deploying to Vercel with the DATABASE_URL set, call:

```bash
curl -X POST https://your-app.vercel.app/api/setup
```

## Step 3: Configure Vercel Environment Variables

1. **Go to Vercel Dashboard**

   - Navigate to [https://vercel.com/dashboard](https://vercel.com/dashboard)
   - Select your project

2. **Add Environment Variables**

   - Go to **Settings** → **Environment Variables**
   - Add the following variables:

   **Variable Name:** `DATABASE_URL`
   **Value:** Your Neon connection string (the one you copied in Step 1)
   **Environment:** Select all (Production, Preview, Development)

   Click **Save**

3. **Add Other Required Environment Variables** (if not already set):
   - `JWT_SECRET` - A random secret string for JWT tokens (generate one: `openssl rand -base64 32`)
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID` - Your Google OAuth Client ID
   - `GOOGLE_CLIENT_ID` - Your Google OAuth Client ID (same as above)

## Step 4: Redeploy Your Application

1. **Trigger a new deployment**:

   - Go to **Deployments** tab in Vercel
   - Click the **"..."** menu on the latest deployment
   - Select **"Redeploy"**
   - Or push a new commit to trigger automatic deployment

2. **Wait for deployment to complete**

## Step 5: Initialize the Database (if using Option B)

After deployment, initialize your database by calling the setup endpoint:

```bash
curl -X POST https://your-app.vercel.app/api/setup
```

Or visit in your browser:

```
https://your-app.vercel.app/api/setup
```

You should see:

```json
{
  "success": true,
  "message": "Database setup completed successfully!"
}
```

## Step 6: Verify Everything Works

1. **Test the database connection**:

   - Try signing up a new user on your deployed app
   - Check if the user appears in Neon's SQL Editor or Prisma Studio

2. **Check Neon Dashboard**:
   - Go back to Neon dashboard
   - Click on your project
   - Use the **SQL Editor** to run:
     ```sql
     SELECT * FROM "User";
     ```
   - You should see any users you've created

## Troubleshooting

### Connection Issues

If you get connection errors:

1. **Check the connection string format**:

   - Make sure it includes `?sslmode=require` at the end
   - Neon requires SSL connections

2. **Verify environment variables in Vercel**:

   - Go to Settings → Environment Variables
   - Make sure `DATABASE_URL` is set for all environments
   - Check that there are no extra spaces or quotes

3. **Check Neon project status**:
   - In Neon dashboard, make sure your project is active
   - Check if there are any usage limits reached

### Schema Issues

If tables aren't created:

1. **Use Prisma locally** (Option A) - This is more reliable:

   ```bash
   DATABASE_URL="your-neon-connection-string" npx prisma db push
   ```

2. **Check Prisma schema**:
   - Make sure `prisma/schema.prisma` is correct
   - Run `npx prisma generate` before pushing

### Performance Tips

1. **Connection Pooling**: Neon provides connection pooling. For serverless environments like Vercel, use the pooled connection string:

   - In Neon dashboard, look for "Connection pooling" or "Pooler" settings
   - Use the pooled connection string (usually has `-pooler` in the hostname)

2. **Region Selection**: Choose a Neon region close to your Vercel deployment region for better latency

## Additional Resources

- [Neon Documentation](https://neon.tech/docs)
- [Prisma with Neon](https://neon.tech/docs/integrations/prisma)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
