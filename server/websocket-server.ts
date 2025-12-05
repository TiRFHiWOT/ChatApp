import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";
import { parse } from "url";

const PORT = process.env.WS_PORT ? parseInt(process.env.WS_PORT) : 3001;

const connections = new Map<string, WebSocket>();
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

  const existingConnection = connections.get(userId);
  if (existingConnection && existingConnection.readyState === WebSocket.OPEN) {
    existingConnection.close();
  }

  connections.set(userId, ws);
  onlineUsers.set(userId, Date.now());

  broadcastUserStatus(userId, true);

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
      }
    } catch (error) {
      console.error("Error handling message:", error);
    }
  });

  ws.on("close", () => {
    if (connections.has(userId)) {
      connections.delete(userId);
      onlineUsers.delete(userId);
      broadcastUserStatus(userId, false);
    }
  });

  ws.on("error", (error) => {
    console.error(`WebSocket error for user ${userId}:`, error);
    if (connections.has(userId)) {
      connections.delete(userId);
      onlineUsers.delete(userId);
      broadcastUserStatus(userId, false);
    }
  });

  sendOnlineUsers(ws);
});

async function handleMessage(message: any, senderId: string) {
  const { sessionId, content, recipientId } = message;

  if (!sessionId || !content || !recipientId) {
    return;
  }

  const recipientWs = connections.get(recipientId);
  if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
    const messageData = {
      type: "message",
      sessionId,
      senderId,
      content,
      timestamp: new Date().toISOString(),
    };
    try {
      recipientWs.send(JSON.stringify(messageData));
    } catch (error) {
      console.error("Error sending to recipient:", error);
    }
  }

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

setInterval(() => {
  const now = Date.now();
  const staleThreshold = 5 * 60 * 1000;

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
}, 60000);

server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});
