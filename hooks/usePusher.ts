"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { getPusherClient } from "@/lib/pusher-client";
import type { Channel, PresenceChannel } from "pusher-js";

export interface PusherMessage {
  type: string;
  [key: string]: any;
}

export function usePusher(userId: string | null) {
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const pusherRef = useRef<ReturnType<typeof getPusherClient> | null>(null);
  const presenceChannelRef = useRef<PresenceChannel | null>(null);
  const messageHandlersRef = useRef<Map<string, (data: any) => void>>(
    new Map()
  );

  useEffect(() => {
    if (!userId) {
      if (presenceChannelRef.current) {
        presenceChannelRef.current.unsubscribe();
        presenceChannelRef.current = null;
      }
      setIsConnected(false);
      setOnlineUsers(new Set());
      return;
    }

    const pusher = getPusherClient();
    if (!pusher) {
      console.error("Pusher client not available");
      return;
    }

    pusherRef.current = pusher;

    // Connection state
    pusher.connection.bind("connected", () => {
      setIsConnected(true);
    });

    pusher.connection.bind("disconnected", () => {
      setIsConnected(false);
    });

    pusher.connection.bind("error", (error: any) => {
      console.error("Pusher connection error:", error);
      setIsConnected(false);
    });

    // Subscribe to presence channel for online users
    // Note: For presence channels, you need to authenticate first
    const presenceChannel = pusher.subscribe(
      `presence-users`
    ) as PresenceChannel;
    presenceChannelRef.current = presenceChannel;

    presenceChannel.bind("pusher:subscription_succeeded", () => {
      setIsConnected(true);
      const members = presenceChannel.members;
      const userIds = new Set<string>();
      members.each((member: any) => {
        if (member.id) {
          userIds.add(member.id);
        }
      });
      setOnlineUsers(userIds);
    });

    presenceChannel.bind("pusher:member_added", (member: any) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        if (member.id) {
          next.add(member.id);
        }
        return next;
      });
    });

    presenceChannel.bind("pusher:member_removed", (member: any) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        if (member.id) {
          next.delete(member.id);
        }
        return next;
      });
    });

    // Handle message events from subscribed channels
    const handleMessage = (data: any) => {
      const messageHandler = messageHandlersRef.current.get("message");
      if (messageHandler) {
        try {
          messageHandler(data);
        } catch (error) {
          console.error("Error in message handler:", error);
        }
      }
    };

    return () => {
      if (presenceChannelRef.current) {
        presenceChannelRef.current.unsubscribe();
        presenceChannelRef.current = null;
      }
      setIsConnected(false);
    };
  }, [userId]);

  const sendMessage = useCallback(
    (message: PusherMessage) => {
      // For backward compatibility with useWebSocket interface
      // If message has type "message", send to the session channel
      if (message.type === "message" && message.sessionId) {
        const channelName = `private-message-${message.sessionId}`;
        const pusher = pusherRef.current;
        if (!pusher || !isConnected) {
          return false;
        }

        try {
          const channel = pusher.channel(channelName);
          if (channel) {
            channel.trigger("client-message", {
              sessionId: message.sessionId,
              senderId: message.senderId || userId,
              content: message.content,
              recipientId: message.recipientId,
            });
            return true;
          }
        } catch (error) {
          console.error("Error sending Pusher message:", error);
        }
      }
      return false;
    },
    [isConnected, userId]
  );

  const subscribeToChannel = useCallback(
    (channelName: string, eventName: string, handler: (data: any) => void) => {
      const pusher = pusherRef.current;
      if (!pusher) {
        return () => {};
      }

      const channel = pusher.subscribe(channelName);
      channel.bind(eventName, handler);

      return () => {
        channel.unbind(eventName, handler);
        pusher.unsubscribe(channelName);
      };
    },
    []
  );

  const onMessage = useCallback(
    (type: string, handler: (data: any) => void) => {
      messageHandlersRef.current.set(type, handler);
      return () => {
        messageHandlersRef.current.delete(type);
      };
    },
    []
  );

  // Subscribe to message channel when sessionId is provided
  const subscribeToSession = useCallback(
    (sessionId: string) => {
      const pusher = pusherRef.current;
      if (!pusher || !userId) {
        return () => {};
      }

      const channelName = `private-message-${sessionId}`;

      // Wait for channel to be subscribed
      const channel = pusher.subscribe(channelName);

      const handleNewMessage = (data: any) => {
        const messageHandler = messageHandlersRef.current.get("message");
        if (messageHandler) {
          messageHandler({
            type: "message",
            sessionId: data.sessionId || sessionId,
            senderId: data.senderId,
            content: data.content,
            createdAt: data.createdAt,
            timestamp: data.createdAt || data.timestamp,
            sender: data.sender,
            ...data,
          });
        }
      };

      const handleClientMessage = (data: any) => {
        const sentHandler = messageHandlersRef.current.get("message_sent");
        if (sentHandler) {
          sentHandler({
            type: "message_sent",
            sessionId: data.sessionId || sessionId,
            ...data,
          });
        }
      };

      channel.bind("new-message", handleNewMessage);
      channel.bind("client-message", handleClientMessage);

      return () => {
        channel.unbind("new-message", handleNewMessage);
        channel.unbind("client-message", handleClientMessage);
        pusher.unsubscribe(channelName);
      };
    },
    [userId]
  );

  return {
    isConnected,
    onlineUsers,
    sendMessage,
    subscribeToChannel,
    subscribeToSession,
    onMessage,
  };
}
