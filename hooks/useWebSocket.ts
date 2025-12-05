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

    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001";
    const ws = new WebSocket(`${wsUrl}?userId=${userId}`);

    ws.onopen = () => {
      setIsConnected(true);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      // Send initial ping to verify connection
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "ping" }));
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
              try {
                messageHandler(message);
              } catch (error) {
                console.error("Error in message handler:", error);
              }
            }
            break;

          case "message_sent":
            // Forward to registered handlers
            const sentHandler = messageHandlersRef.current.get("message_sent");
            if (sentHandler) {
              sentHandler(message);
            }
            break;
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnected(false);
    };

    ws.onclose = (event) => {
      setIsConnected(false);
      wsRef.current = null;

      // Don't reconnect if it was a normal closure or if userId changed
      if (userId && event.code !== 1000) {
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      }
    };

    wsRef.current = ws;
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      // Clean up if userId is removed
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    // Only connect if not already connected or if connection is different
    if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
      connect();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      // Don't close on cleanup if userId hasn't changed - let it stay connected
      // Only close if component is unmounting or userId changes
    };
  }, [userId, connect]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (!wsRef.current) {
      setIsConnected(false);
      return false;
    }

    const readyState = wsRef.current.readyState;

    if (readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify(message));
        return true;
      } catch (error) {
        console.error("Error sending WebSocket message:", error);
        setIsConnected(false);
        return false;
      }
    }

    // Update connection state if WebSocket is closed
    if (readyState !== WebSocket.OPEN) {
      setIsConnected(false);
    }

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
    if (!isConnected || !wsRef.current) return;

    const interval = setInterval(() => {
      // Check connection state before sending ping
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        sendMessage({ type: "ping" });
      } else {
        setIsConnected(false);
      }
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
