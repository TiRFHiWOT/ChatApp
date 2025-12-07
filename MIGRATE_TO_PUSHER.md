# Migrating from WebSocket to Pusher

## Quick Migration Steps

### 1. Install Pusher Packages

```bash
npm install pusher pusher-js
```

### 2. Set Environment Variables

**In Vercel:**

- `PUSHER_APP_ID` - Your Pusher App ID
- `PUSHER_KEY` - Your Pusher Key
- `PUSHER_SECRET` - Your Pusher Secret
- `PUSHER_CLUSTER` - Your cluster (e.g., `us2`)
- `NEXT_PUBLIC_PUSHER_KEY` - Same as PUSHER_KEY (for client)
- `NEXT_PUBLIC_PUSHER_CLUSTER` - Same as PUSHER_CLUSTER (for client)

**In Local `.env`:**

```env
PUSHER_APP_ID=your-app-id
PUSHER_KEY=your-key
PUSHER_SECRET=your-secret
PUSHER_CLUSTER=us2
NEXT_PUBLIC_PUSHER_KEY=your-key
NEXT_PUBLIC_PUSHER_CLUSTER=us2
```

### 3. Update Components

Replace `useWebSocket` with `usePusher`:

**In `components/ChatWindow.tsx`:**

```typescript
// Change this:
import { useWebSocket } from "@/hooks/useWebSocket";
const {
  sendMessage: wsSendMessage,
  onMessage,
  isConnected,
} = useWebSocket(user?.id || null);

// To this:
import { usePusher } from "@/hooks/usePusher";
const {
  sendMessage: wsSendMessage,
  subscribeToSession,
  onMessage,
  isConnected,
} = usePusher(user?.id || null);

// Then subscribe to session messages:
useEffect(() => {
  if (!sessionId || !subscribeToSession) return;
  const cleanup = subscribeToSession(sessionId);
  return cleanup;
}, [sessionId, subscribeToSession]);
```

**In `components/UserList.tsx`:**

```typescript
// Change:
import { useWebSocket } from "@/hooks/useWebSocket";
const { onlineUsers } = useWebSocket(currentUserId);

// To:
import { usePusher } from "@/hooks/usePusher";
const { onlineUsers } = usePusher(currentUserId);
```

**In `hooks/useUnreadMessages.ts`:**

```typescript
// Change:
import { useWebSocket } from "./useWebSocket";
const { onMessage } = useWebSocket(currentUserId || null);

// To:
import { usePusher } from "./usePusher";
const { subscribeToSession, onMessage } = usePusher(currentUserId || null);
```

### 4. Remove WebSocket Server

You can remove or keep the WebSocket server code - it won't be used anymore:

- `server/websocket-server.ts` - Can be deleted
- `package.json` - Can remove `ws` dependency (optional)

### 5. Update Message Sending

The message API route (`app/api/sessions/[id]/messages/route.ts`) already triggers Pusher events. No changes needed there.

### 6. Test

1. Start your app: `npm run dev`
2. Open two browser windows
3. Sign in as different users
4. Send messages - they should appear in real-time
5. Check online status - users should show as online/offline

## Benefits

✅ **No server to maintain** - Pusher handles everything  
✅ **Automatic scaling** - Handles millions of connections  
✅ **Built-in reconnection** - Automatic reconnection logic  
✅ **Presence channels** - Built-in user presence tracking  
✅ **Free tier** - 200k messages/day, 100 concurrent connections  
✅ **Works on Vercel** - No need for separate WebSocket server

## Pusher Free Tier Limits

- **200,000 messages/day** - Perfect for small to medium apps
- **100 concurrent connections** - Good for most use cases
- **Unlimited channels** - No limits
- **Free forever** - No credit card required

## Monitoring

Check your Pusher dashboard for:

- Message count
- Connection count
- Channel activity
- Error logs
