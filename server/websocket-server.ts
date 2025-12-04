import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";
import { parse } from "url";

const PORT = process.env.WS_PORT ? parseInt(process.env.WS_PORT) : 3001;

// Store active connections: userId -> WebSocket
const connections = new Map<string, WebSocket>();
// Store online users: userId -> timestamp
const onlineUsers = new Map<string, number>();

const server = createServer();
const wss = new WebSocketServer({ server });

wss.on("connection", (ws: WebSocket, req) => {
  const { query } = parse(req.url || "", true);
  const userId = query.userId as string;

  if (!userId) {
    ws.close(1008, "UserId required");
    return;
  }

  // Store connection
  connections.set(userId, ws);
  onlineUsers.set(userId, Date.now());

  // Broadcast user online status to all clients
  broadcastUserStatus(userId, true);

  console.log(
    `User ${userId} connected. Total connections: ${connections.size}`
  );

  ws.on("message", async (data: Buffer) => {
    try {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case "ping":
          ws.send(JSON.stringify({ type: "pong" }));
          break;

        case "message":
          await handleMessage(message, userId);
          break;

        default:
          console.log("Unknown message type:", message.type);
      }
    } catch (error) {
      console.error("Error handling message:", error);
    }
  });

  ws.on("close", () => {
    connections.delete(userId);
    onlineUsers.delete(userId);
    broadcastUserStatus(userId, false);
    console.log(
      `User ${userId} disconnected. Total connections: ${connections.size}`
    );
  });

  ws.on("error", (error) => {
    console.error(`WebSocket error for user ${userId}:`, error);
  });

  // Send initial online users list
  sendOnlineUsers(ws);
});

async function handleMessage(message: any, senderId: string) {
  const { sessionId, content, recipientId } = message;

  if (!sessionId || !content || !recipientId) {
    console.log("Invalid message format:", message);
    return;
  }

  console.log(
    `Forwarding message from ${senderId} to ${recipientId} in session ${sessionId}`
  );

  // Forward message to recipient if online
  const recipientWs = connections.get(recipientId);
  if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
    const messageData = {
      type: "message",
      sessionId,
      senderId,
      content,
      timestamp: new Date().toISOString(),
    };
    console.log("Sending to recipient:", messageData);
    recipientWs.send(JSON.stringify(messageData));
  } else {
    console.log(
      `Recipient ${recipientId} is not online or connection not open`
    );
  }

  // Also send confirmation back to sender
  const senderWs = connections.get(senderId);
  if (senderWs && senderWs.readyState === WebSocket.OPEN) {
    senderWs.send(
      JSON.stringify({
        type: "message_sent",
        sessionId,
        content,
        timestamp: new Date().toISOString(),
      })
    );
  }
}

function broadcastUserStatus(userId: string, isOnline: boolean) {
  const statusMessage = JSON.stringify({
    type: "user_status",
    userId,
    isOnline,
  });

  // Broadcast to all connected clients
  connections.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(statusMessage);
    }
  });
}

function sendOnlineUsers(ws: WebSocket) {
  const onlineUserIds = Array.from(onlineUsers.keys());
  ws.send(
    JSON.stringify({
      type: "online_users",
      userIds: onlineUserIds,
    })
  );
}

// Cleanup: Remove stale connections (older than 5 minutes)
setInterval(() => {
  const now = Date.now();
  const staleThreshold = 5 * 60 * 1000; // 5 minutes

  onlineUsers.forEach((timestamp, userId) => {
    if (now - timestamp > staleThreshold) {
      const ws = connections.get(userId);
      if (ws) {
        ws.close();
      }
      connections.delete(userId);
      onlineUsers.delete(userId);
    }
  });
}, 60000); // Check every minute

server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});
