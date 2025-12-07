# Google OAuth Production Fix Guide

## Common Issues and Solutions

### 1. **Check Environment Variables in Vercel**

Make sure these are set correctly in Vercel:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify these variables exist:
   - `GOOGLE_CLIENT_ID` - Your Google OAuth Client ID
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID` - Same value as above
3. **IMPORTANT**: Make sure they're set for **Production**, **Preview**, and **Development** environments
4. After adding/updating, **redeploy** your application

### 2. **Check Google Cloud Console Settings**

Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials) and verify:

#### Authorized JavaScript origins:

Add these URLs (replace with your actual Vercel URL):

```
https://chat-app-rho-wheat.vercel.app
https://*.vercel.app
```

#### Authorized redirect URIs:

Add these URLs:

```
https://chat-app-rho-wheat.vercel.app
https://chat-app-rho-wheat.vercel.app/api/auth/google
https://*.vercel.app
```

**Note**: The wildcard `*.vercel.app` covers preview deployments.

### 3. **Verify Client ID Match**

The `GOOGLE_CLIENT_ID` and `NEXT_PUBLIC_GOOGLE_CLIENT_ID` must:

- Be exactly the same value
- Match the Client ID in Google Cloud Console
- Be from the same OAuth 2.0 Client ID (not different projects)

### 4. **Check Browser Console**

In production, open browser DevTools (F12) and check:

1. **Console tab**: Look for errors like:

   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set`
   - `Failed to load Google Sign-In script`
   - `Google Sign-In script failed to load`

2. **Network tab**: Check if:
   - `https://accounts.google.com/gsi/client` loads successfully
   - The `/api/auth/google` endpoint is called and what response it returns

### 5. **Common Error Messages**

#### "Access blocked: Authorization Error"

- **Cause**: Production URL not in Google Cloud Console authorized origins
- **Fix**: Add your Vercel URL to "Authorized JavaScript origins"

#### "Invalid token" or "Invalid Google token"

- **Cause**: Client ID mismatch between frontend and backend
- **Fix**: Ensure `GOOGLE_CLIENT_ID` and `NEXT_PUBLIC_GOOGLE_CLIENT_ID` are identical

#### "Google Sign-In script failed to load"

- **Cause**: Script blocked by CSP or network issue
- **Fix**: Check browser console and network tab for blocked requests

#### Button doesn't appear

- **Cause**: `NEXT_PUBLIC_GOOGLE_CLIENT_ID` not set or script not loaded
- **Fix**: Check environment variables and browser console

### 6. **Debugging Steps**

1. **Check if script loads**:

   ```javascript
   // In browser console
   console.log(window.google?.accounts?.id);
   // Should show an object, not undefined
   ```

2. **Check environment variable**:

   ```javascript
   // In browser console (only works if NEXT_PUBLIC_ prefix)
   console.log(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
   // Note: This won't work in console, but check Network tab for script requests
   ```

3. **Check API response**:
   - Open Network tab
   - Try Google sign-in
   - Check `/api/auth/google` request
   - Look at response for error details

### 7. **Quick Fix Checklist**

- [ ] `GOOGLE_CLIENT_ID` set in Vercel (Production, Preview, Development)
- [ ] `NEXT_PUBLIC_GOOGLE_CLIENT_ID` set in Vercel (Production, Preview, Development)
- [ ] Both values are identical
- [ ] Production URL added to Google Cloud Console authorized origins
- [ ] Redeployed after changing environment variables
- [ ] Cleared browser cache and tried again
- [ ] Checked browser console for errors
- [ ] Verified Google script loads (check Network tab)

### 8. **Testing in Production**

After making changes:

1. **Redeploy** your Vercel application
2. **Clear browser cache** or use incognito mode
3. **Test Google Sign-In** on production URL
4. **Check browser console** for any errors
5. **Check Vercel logs** for backend errors

### 9. **If Still Not Working**

1. Check Vercel Function Logs:

   - Go to Vercel Dashboard → Your Project → Functions
   - Look for `/api/auth/google` function logs
   - Check for error messages

2. Add temporary logging:

   - The API route already logs errors in development
   - Check Vercel logs for production errors

3. Verify token verification:
   - The backend verifies the token with Google
   - If verification fails, check the error message in Vercel logs

### 10. **Environment Variable Format**

Make sure there are no extra spaces or quotes:

**Correct**:

```
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
NEXT_PUBLIC_GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
```

**Incorrect** (don't do this):

```
GOOGLE_CLIENT_ID="123456789-abcdefghijklmnop.apps.googleusercontent.com"
GOOGLE_CLIENT_ID= 123456789-abcdefghijklmnop.apps.googleusercontent.com
```
