# Vercel Environment Variables Checklist

## Required Environment Variables

Make sure ALL of these are set in Vercel:

### 1. DATABASE_URL ✅ (You already set this)

```
postgresql://neondb_owner:npg_X0KotEBbVrw7@ep-polished-firefly-a4c6828x-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### 2. JWT_SECRET ⚠️ (CRITICAL - Check this!)

This is likely missing and causing the signup error.

**How to set it:**

1. Generate a secret key:

   ```bash
   openssl rand -base64 32
   ```

   Or use any long random string (at least 32 characters)

2. In Vercel:
   - Go to Settings → Environment Variables
   - Add new variable:
     - **Key**: `JWT_SECRET`
     - **Value**: Your generated secret (paste it)
     - **Environments**: Select all (Production, Preview, Development)
   - Click **Save**

### 3. NEXT_PUBLIC_GOOGLE_CLIENT_ID (For Google Sign-In)

- **Key**: `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- **Value**: Your Google OAuth Client ID
- **Environments**: All

### 4. GOOGLE_CLIENT_ID (For Google Sign-In)

- **Key**: `GOOGLE_CLIENT_ID`
- **Value**: Same as above (your Google OAuth Client ID)
- **Environments**: All

## After Adding/Updating Variables

**IMPORTANT**: You MUST redeploy after adding environment variables!

1. Go to Vercel Dashboard → Deployments
2. Click "..." on latest deployment
3. Click "Redeploy"
4. Wait for deployment to complete

## Testing

After redeploying with all variables set:

1. Try signup again: `https://chat-app-rho-wheat.vercel.app/signup`
2. Check Vercel logs if it still fails:
   - Go to Deployments → Your deployment → Functions tab
   - Look for error messages

## Quick Fix Command

If you want to generate a JWT_SECRET quickly:

```bash
openssl rand -base64 32
```

Copy the output and paste it as the `JWT_SECRET` value in Vercel.
