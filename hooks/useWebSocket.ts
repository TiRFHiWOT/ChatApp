"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export function useWebSocket(userId: string | null) {
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageHandlersRef = useRef<Map<string, (data: any) => void>>(
    new Map()
  );

  const connect = useCallback(() => {
    if (!userId) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001";
    const ws = new WebSocket(`${wsUrl}?userId=${userId}`);

    ws.onopen = () => {
      console.log("WebSocket connected for user:", userId);
      setIsConnected(true);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);

        switch (message.type) {
          case "pong":
            // Heartbeat response
            break;

          case "online_users":
            setOnlineUsers(new Set(message.userIds || []));
            break;

          case "user_status":
            setOnlineUsers((prev) => {
              const next = new Set(prev);
              if (message.isOnline) {
                next.add(message.userId);
              } else {
                next.delete(message.userId);
              }
              return next;
            });
            break;

          case "message":
            // Forward to registered handlers
            const messageHandler = messageHandlersRef.current.get("message");
            if (messageHandler) {
              messageHandler(message);
            }
            break;

          case "message_sent":
            // Forward to registered handlers
            const sentHandler = messageHandlersRef.current.get("message_sent");
            if (sentHandler) {
              sentHandler(message);
            }
            break;

          default:
            console.log("Unknown message type:", message.type);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnected(false);
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
      wsRef.current = null;

      // Attempt to reconnect after 3 seconds
      if (userId) {
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      }
    };

    wsRef.current = ws;
  }, [userId]);

  useEffect(() => {
    if (userId) {
      connect();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [userId, connect]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log("Sending WebSocket message:", message);
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    console.warn("WebSocket not connected, cannot send message:", message);
    return false;
  }, []);

  const onMessage = useCallback(
    (type: string, handler: (data: any) => void) => {
      messageHandlersRef.current.set(type, handler);
      return () => {
        messageHandlersRef.current.delete(type);
      };
    },
    []
  );

  // Heartbeat to keep connection alive
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      sendMessage({ type: "ping" });
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [isConnected, sendMessage]);

  return {
    isConnected,
    onlineUsers,
    sendMessage,
    onMessage,
  };
}
