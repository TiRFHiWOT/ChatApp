"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useWebSocket } from "./useWebSocket";
import { usePathname } from "next/navigation";

export function useUnreadMessages(currentUserId: string | null) {
  const [unreadCounts, setUnreadCounts] = useState<Map<string, number>>(
    new Map()
  );
  const pathname = usePathname();
  const { onMessage } = useWebSocket(currentUserId || null);
  const currentChatUserIdRef = useRef<string | null>(null);

  // Extract current chat user ID from pathname
  useEffect(() => {
    const match = pathname?.match(/\/chat\/([^/]+)/);
    currentChatUserIdRef.current = match ? match[1] : null;

    // Clear unread count when opening a chat
    if (currentChatUserIdRef.current) {
      setUnreadCounts((prev) => {
        const next = new Map(prev);
        next.delete(currentChatUserIdRef.current!);
        return next;
      });
    }
  }, [pathname]);

  // Listen for incoming messages
  useEffect(() => {
    if (!currentUserId || !onMessage) return;

    const cleanup = onMessage("message", (data: any) => {
      // Only count messages that are not from the currently open chat
      if (
        data.senderId &&
        data.senderId !== currentChatUserIdRef.current &&
        data.senderId !== currentUserId
      ) {
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
