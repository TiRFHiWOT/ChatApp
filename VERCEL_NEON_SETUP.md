# Setting Up Neon Database on Vercel - Step by Step

## Step 1: Get Your Neon Connection String

1. **Go to Neon Dashboard**

   - Visit [https://console.neon.tech](https://console.neon.tech)
   - Log in to your account

2. **Select Your Project**

   - Click on the project you created (or create a new one if needed)

3. **Get Connection String**

   - In your project dashboard, look for **"Connection Details"** or **"Connection String"**
   - You'll see something like:
     ```
     postgresql://username:password@ep-xxxx-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
     ```
   - **Copy this entire connection string** - you'll need it for Vercel

   **Important**: For serverless environments like Vercel, you may want to use the **pooled connection string** (if available). Look for "Connection pooling" or "Pooler" in the Neon dashboard.

## Step 2: Set Up Database Schema Locally (Recommended)

Before deploying to Vercel, set up your database schema:

1. **Create a local `.env.local` file** (or update your existing `.env`):

   ```bash
   DATABASE_URL="your-neon-connection-string-here"
   ```

2. **Push Prisma schema to Neon**:

   ```bash
   npx prisma db push
   ```

3. **Verify tables were created**:
   ```bash
   npx prisma studio
   ```
   This opens a browser where you can see your database tables.

## Step 3: Configure Vercel Environment Variables

1. **Go to Vercel Dashboard**

   - Visit [https://vercel.com/dashboard](https://vercel.com/dashboard)
   - Select your ChatApp project

2. **Navigate to Environment Variables**

   - Click on **Settings** (in the top menu)
   - Click on **Environment Variables** (in the left sidebar)

3. **Add DATABASE_URL**

   - Click **"Add New"** button
   - **Key**: `DATABASE_URL`
   - **Value**: Paste your Neon connection string (the one you copied in Step 1)
   - **Environments**: Check all three boxes:
     - ✅ Production
     - ✅ Preview
     - ✅ Development
   - Click **"Save"**

4. **Verify Other Required Variables**
   Make sure these are also set (add them if missing):

   - **JWT_SECRET**: A random secret string

     - Generate one: `openssl rand -base64 32`
     - Or use any long random string

   - **NEXT_PUBLIC_GOOGLE_CLIENT_ID**: Your Google OAuth Client ID

   - **GOOGLE_CLIENT_ID**: Same as above (your Google OAuth Client ID)

## Step 4: Redeploy Your Application

After setting environment variables, you need to redeploy:

1. **Option A: Automatic Redeploy**

   - Push a new commit to your repository:
     ```bash
     git add .
     git commit -m "Configure Neon database"
     git push
     ```
   - Vercel will automatically deploy

2. **Option B: Manual Redeploy**
   - Go to Vercel Dashboard → **Deployments** tab
   - Click the **"..."** menu (three dots) on your latest deployment
   - Select **"Redeploy"**
   - Confirm the redeploy

## Step 5: Initialize Database (If Not Done Locally)

If you didn't run `prisma db push` locally, initialize the database after deployment:

1. **Call the setup endpoint**:

   ```bash
   curl -X POST https://your-app.vercel.app/api/setup
   ```

   Replace `your-app.vercel.app` with your actual Vercel deployment URL.

2. **Or visit in browser**:

   ```
   https://your-app.vercel.app/api/setup
   ```

3. **Expected Response**:
   ```json
   {
     "success": true,
     "message": "Database setup completed successfully!"
   }
   ```

## Step 6: Verify Everything Works

1. **Test User Signup**

   - Go to your deployed app: `https://your-app.vercel.app/signup`
   - Try creating a new user account
   - If it works, the database is connected!

2. **Check Neon Dashboard**

   - Go back to Neon console
   - Click on your project → **SQL Editor**
   - Run this query:
     ```sql
     SELECT * FROM "User";
     ```
   - You should see the user you just created

3. **Check Vercel Logs** (if issues)
   - In Vercel Dashboard → **Deployments** → Click on your deployment
   - Go to **"Functions"** tab to see server logs
   - Look for any database connection errors

## Troubleshooting

### "Database connection failed" errors

1. **Check connection string format**:

   - Must include `?sslmode=require` at the end
   - No extra spaces or quotes
   - Example: `postgresql://user:pass@host/db?sslmode=require`

2. **Verify environment variables**:

   - Go to Vercel → Settings → Environment Variables
   - Make sure `DATABASE_URL` is set for all environments
   - Check for typos

3. **Use pooled connection** (for serverless):
   - In Neon dashboard, look for "Connection pooling"
   - Use the pooled connection string instead of direct connection
   - Pooled strings usually have `-pooler` in the hostname

### "Tables don't exist" errors

1. **Run Prisma push locally**:

   ```bash
   DATABASE_URL="your-neon-connection-string" npx prisma db push
   ```

2. **Or call setup endpoint**:
   ```bash
   curl -X POST https://your-app.vercel.app/api/setup
   ```

### "Internal server error" on signup/login

1. **Check Vercel function logs**:

   - Vercel Dashboard → Deployments → Your deployment → Functions tab
   - Look for error messages

2. **Verify JWT_SECRET is set**:

   - Go to Vercel → Settings → Environment Variables
   - Make sure `JWT_SECRET` exists

3. **Check database permissions**:
   - In Neon dashboard, verify your project is active
   - Check if you've hit any usage limits

## Quick Reference

**Neon Dashboard**: [https://console.neon.tech](https://console.neon.tech)
**Vercel Dashboard**: [https://vercel.com/dashboard](https://vercel.com/dashboard)

**Required Vercel Environment Variables**:

- `DATABASE_URL` - Your Neon connection string
- `JWT_SECRET` - Random secret for JWT tokens
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` - Google OAuth Client ID
- `GOOGLE_CLIENT_ID` - Google OAuth Client ID

**Useful Commands**:

```bash
# Push schema to Neon (local)
DATABASE_URL="your-connection-string" npx prisma db push

# Initialize database (after deployment)
curl -X POST https://your-app.vercel.app/api/setup

# Open Prisma Studio (local)
DATABASE_URL="your-connection-string" npx prisma studio
```
