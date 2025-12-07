"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { usePusher } from "./usePusher";
import { usePathname } from "next/navigation";

export function useUnreadMessages(currentUserId: string | null) {
  const [unreadCounts, setUnreadCounts] = useState<Map<string, number>>(
    new Map()
  );
  const pathname = usePathname();
  const { onMessage } = usePusher(currentUserId || null);
  const currentChatUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const match = pathname?.match(/\/chat\/([^/]+)/);
    currentChatUserIdRef.current = match ? match[1] : null;

    if (currentChatUserIdRef.current) {
      setUnreadCounts((prev) => {
        const next = new Map(prev);
        next.delete(currentChatUserIdRef.current!);
        return next;
      });
    }
  }, [pathname]);

  useEffect(() => {
    if (!currentUserId || !onMessage) return;

    const cleanup = onMessage("message", (data: any) => {
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
