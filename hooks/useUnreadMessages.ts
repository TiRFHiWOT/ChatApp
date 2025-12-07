"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { usePusher } from "./usePusher";
import { usePathname } from "next/navigation";
import { useAuth } from "./useAuth";

export function useUnreadMessages(currentUserId: string | null) {
  const [unreadCounts, setUnreadCounts] = useState<Map<string, number>>(
    new Map()
  );
  const pathname = usePathname();
  const { subscribeToSession, onMessage } = usePusher(currentUserId || null);
  const currentChatUserIdRef = useRef<string | null>(null);
  const sessionSubscriptionsRef = useRef<Map<string, () => void>>(new Map());
  const { user } = useAuth();

  // Track which chat is currently open (by userId, not sessionId)
  useEffect(() => {
    const match = pathname?.match(/\/chat\/([^/]+)/);
    currentChatUserIdRef.current = match ? match[1] : null;

    // Clear unread count for the currently open chat
    if (currentChatUserIdRef.current) {
      setUnreadCounts((prev) => {
        const next = new Map(prev);
        next.delete(currentChatUserIdRef.current!);
        return next;
      });
    }
  }, [pathname]);

  // Subscribe to all session channels for the current user
  useEffect(() => {
    if (!currentUserId || !subscribeToSession || !user) return;

    const fetchAndSubscribeToSessions = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await fetch("/api/sessions", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) return;

        const data = await response.json();
        const sessions = data.sessions || [];

        // Subscribe to all session channels
        sessions.forEach((session: any) => {
          const sessionId = session.id;

          // Skip if already subscribed
          if (sessionSubscriptionsRef.current.has(sessionId)) {
            return;
          }

          // Subscribe to this session channel
          const cleanup = subscribeToSession(sessionId);
          sessionSubscriptionsRef.current.set(sessionId, cleanup);
        });
      } catch (error) {
        console.error("Error fetching sessions for unread messages:", error);
      }
    };

    fetchAndSubscribeToSessions();

    // Cleanup on unmount
    return () => {
      sessionSubscriptionsRef.current.forEach((cleanup) => cleanup());
      sessionSubscriptionsRef.current.clear();
    };
  }, [currentUserId, subscribeToSession, user]);

  // Listen for messages from Pusher via onMessage
  // This will catch messages from all subscribed session channels
  useEffect(() => {
    if (!currentUserId || !onMessage) return;

    const cleanup = onMessage("message", (data: any) => {
      // Only count as unread if:
      // 1. The message is for the current user (recipientId matches currentUserId)
      // 2. The chat is not currently open (senderId !== currentChatUserIdRef.current)
      // 3. The sender is not the current user
      if (
        data.senderId &&
        data.recipientId === currentUserId &&
        data.senderId !== currentChatUserIdRef.current &&
        data.senderId !== currentUserId
      ) {
        console.log(
          "Incrementing unread count for:",
          data.senderId,
          "from session:",
          data.sessionId
        );
        setUnreadCounts((prev) => {
          const next = new Map(prev);
          const currentCount = next.get(data.senderId) || 0;
          next.set(data.senderId, currentCount + 1);
          return next;
        });
      }
    });

    return cleanup;
  }, [currentUserId, onMessage]);

  const getUnreadCount = useCallback(
    (userId: string) => {
      return unreadCounts.get(userId) || 0;
    },
    [unreadCounts]
  );

  const clearUnreadCount = useCallback((userId: string) => {
    setUnreadCounts((prev) => {
      const next = new Map(prev);
      next.delete(userId);
      return next;
    });
  }, []);

  return {
    unreadCounts,
    getUnreadCount,
    clearUnreadCount,
  };
}
