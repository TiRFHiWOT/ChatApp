"use client";

import { useState, useEffect, useCallback } from "react";

export interface Message {
  id: string;
  sessionId: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    picture?: string;
  };
}

export function useMessages(sessionId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!sessionId) {
      setMessages([]);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/sessions/${sessionId}/messages`);
      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }
      const data = await response.json();
      setMessages(data.messages || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      console.error("Error fetching messages:", err);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const addMessage = useCallback((message: Message) => {
    setMessages((prev) => {
      const existingIndex = prev.findIndex((m) => m.id === message.id);
      if (existingIndex !== -1) {
        return prev;
      }

      const isDuplicate = prev.some(
        (m) =>
          m.content === message.content &&
          m.senderId === message.senderId &&
          m.sessionId === message.sessionId &&
          Math.abs(
            new Date(m.createdAt).getTime() -
              new Date(message.createdAt).getTime()
          ) < 3000
      );
      if (isDuplicate) {
        return prev;
      }
      return [...prev, message];
    });
  }, []);

  const sendMessage = useCallback(
    async (content: string, senderId: string) => {
      if (!sessionId || !content.trim()) {
        return null;
      }

      try {
        const response = await fetch(`/api/sessions/${sessionId}/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            senderId,
            content: content.trim(),
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to send message");
        }

        const data = await response.json();
        addMessage(data.message);
        return data.message;
      } catch (err) {
        console.error("Error sending message:", err);
        throw err;
      }
    },
    [sessionId, addMessage]
  );

  return {
    messages,
    loading,
    error,
    sendMessage,
    addMessage,
    refetch: fetchMessages,
  };
}
