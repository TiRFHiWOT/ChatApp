# Pusher WebSocket Setup Guide

## Pusher Free Tier

- ✅ **200,000 messages/day** - Perfect for small to medium apps
- ✅ **100 concurrent connections** - Good for most use cases
- ✅ **Unlimited channels** - No limits on channels
- ✅ **Free forever** - No credit card required for free tier

## Step 1: Create Pusher Account

1. Go to [https://pusher.com](https://pusher.com)
2. Sign up for a free account
3. Create a new app (or use existing)
4. Go to **App Keys** tab
5. Copy these values:
   - `app_id`
   - `key` (this is your `PUSHER_KEY`)
   - `secret` (this is your `PUSHER_SECRET`)
   - `cluster` (e.g., `us2`, `eu`, `ap1`)

## Step 2: Install Pusher Packages

```bash
npm install pusher pusher-js
```

## Step 3: Set Environment Variables

### In Vercel:

1. Go to **Settings** → **Environment Variables**
2. Add these variables:

**Required:**

- `PUSHER_APP_ID` - Your Pusher App ID
- `PUSHER_KEY` - Your Pusher Key (public)
- `PUSHER_SECRET` - Your Pusher Secret (server-side only)
- `PUSHER_CLUSTER` - Your cluster (e.g., `us2`)

**Optional:**

- `PUSHER_ENCRYPTED` - Set to `true` (default) for encrypted connections

### In Local `.env`:

```env
PUSHER_APP_ID=your-app-id
PUSHER_KEY=your-key
PUSHER_SECRET=your-secret
PUSHER_CLUSTER=us2
NEXT_PUBLIC_PUSHER_KEY=your-key
NEXT_PUBLIC_PUSHER_CLUSTER=us2
```

## Step 4: Pusher Configuration Files

The code includes:

- `lib/pusher.ts` - Server-side Pusher instance
- `lib/pusher-client.ts` - Client-side Pusher instance
- `hooks/usePusher.ts` - React hook for Pusher (replaces useWebSocket)
- `app/api/pusher/auth/route.ts` - Authentication endpoint for private channels

## Step 5: Update Components

Replace `useWebSocket` with `usePusher` in:

- `components/ChatWindow.tsx`
- `components/UserList.tsx`
- `hooks/useUnreadMessages.ts`
- `app/chat/[userId]/page.tsx`

## Step 6: Deploy

1. Push your changes
2. Set environment variables in Vercel
3. Redeploy

## Channels Used

- `presence-users` - Presence channel for online users
- `private-message-{sessionId}` - Private channel for each chat session

## Benefits Over Custom WebSocket

✅ **No server to maintain** - Pusher handles everything
✅ **Automatic reconnection** - Built-in reconnection logic
✅ **Scalable** - Handles millions of connections
✅ **Presence channels** - Built-in user presence tracking
✅ **Private channels** - Built-in authentication
✅ **Free tier** - Perfect for development and small apps

## Monitoring

Check your Pusher dashboard for:

- Message count
- Connection count
- Channel activity
- Error logs
