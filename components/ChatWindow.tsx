"use client";

import { useState, useEffect, useRef } from "react";
import { useMessages, Message } from "@/hooks/useMessages";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useAuth } from "@/hooks/useAuth";
import MessageBubble, { MessageGroup, groupMessages } from "./MessageBubble";
import { Send, Smile, Paperclip, Wifi, WifiOff } from "lucide-react";

interface ChatWindowProps {
  sessionId: string;
  recipientId: string;
  recipientName: string;
  recipientPicture?: string;
  recipientOnline?: boolean;
}

export default function ChatWindow({
  sessionId,
  recipientId,
  recipientName,
  recipientPicture,
  recipientOnline = false,
}: ChatWindowProps) {
  const { user } = useAuth();
  const { messages, loading, sendMessage, addMessage } = useMessages(sessionId);
  const {
    sendMessage: wsSendMessage,
    onMessage,
    isConnected,
  } = useWebSocket(user?.id || null);
  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(
        inputRef.current.scrollHeight,
        120
      )}px`;
    }
  }, [inputValue]);

  // Listen for incoming WebSocket messages
  useEffect(() => {
    if (!user || !sessionId) return;

    const cleanup = onMessage("message", (data: any) => {
      console.log("Received WebSocket message:", data);
      // Check if this message is for the current session
      if (data.sessionId === sessionId && data.senderId === recipientId) {
        console.log("Adding message to chat:", data.content);
        // Add message to local state
        addMessage({
          id: `temp-${Date.now()}-${Math.random()}`,
          sessionId: data.sessionId,
          senderId: data.senderId,
          content: data.content,
          createdAt: data.timestamp || new Date().toISOString(),
          sender: {
            id: recipientId,
            name: recipientName,
            picture: recipientPicture,
          },
        });
      }
    });

    return cleanup;
  }, [
    sessionId,
    recipientId,
    recipientName,
    recipientPicture,
    user,
    onMessage,
    addMessage,
  ]);

  const handleSend = async () => {
    if (!inputValue.trim() || !user || sending) return;

    const content = inputValue.trim();
    setInputValue("");
    setSending(true);

    try {
      // Send via WebSocket first for instant delivery
      const wsSent = wsSendMessage({
        type: "message",
        sessionId,
        recipientId,
        content,
      });

      // Also send via API to save to database
      const message = await sendMessage(content, user.id);

      if (!wsSent) {
        console.warn("WebSocket not connected, message saved to DB only");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setInputValue(content); // Restore input
      alert("Failed to send message. Please try again.");
    } finally {
      setSending(false);
      // Reset textarea height
      if (inputRef.current) {
        inputRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group messages
  const messageGroups = groupMessages(messages, user?.id || "");

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          background: "var(--bg-primary)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            className="skeleton"
            style={{
              width: "200px",
              height: "20px",
              borderRadius: "var(--radius-md)",
              marginBottom: "var(--spacing-md)",
            }}
          />
          <p style={{ color: "var(--color-text-light)" }}>
            Loading messages...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--bg-primary)",
      }}
    >
      {/* Connection Status Banner */}
      {!isConnected && (
        <div
          style={{
            padding: "var(--spacing-md) var(--spacing-lg)",
            background: "var(--color-warning)",
            color: "white",
            display: "flex",
            alignItems: "center",
            gap: "var(--spacing-md)",
            fontSize: "var(--font-size-caption)",
            fontWeight: "500",
          }}
          className="fade-in"
        >
          <WifiOff size={16} />
          <span>Reconnecting...</span>
        </div>
      )}

      {/* Chat Header */}
      <div
        style={{
          padding: "var(--spacing-lg)",
          borderBottom: `1px solid var(--color-border)`,
          display: "flex",
          alignItems: "center",
          gap: "var(--spacing-md)",
          background: "var(--bg-surface)",
        }}
      >
        {recipientPicture ? (
          <img
            src={recipientPicture}
            alt={recipientName}
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "50%",
              objectFit: "cover",
            }}
          />
        ) : (
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "50%",
              background: "var(--color-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: "600",
              fontSize: "var(--font-size-body)",
            }}
          >
            {recipientName.charAt(0).toUpperCase()}
          </div>
        )}
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: "var(--font-size-body)",
              fontWeight: "600",
              color: "var(--color-text-dark)",
              marginBottom: "var(--spacing-xs)",
            }}
          >
            {recipientName}
          </div>
          <div
            style={{
              fontSize: "var(--font-size-caption)",
              color: recipientOnline
                ? "var(--color-online)"
                : "var(--color-text-light)",
              display: "flex",
              alignItems: "center",
              gap: "var(--spacing-xs)",
            }}
          >
            {recipientOnline ? (
              <>
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "var(--color-online)",
                  }}
                  className="pulse"
                />
                <span>Online</span>
              </>
            ) : (
              <span>Offline</span>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "var(--spacing-lg)",
          background: "var(--bg-primary)",
        }}
      >
        {messages.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "var(--color-text-light)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "var(--bg-surface)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "var(--spacing-lg)",
                opacity: 0.5,
              }}
            >
              <Send size={32} color="var(--color-text-light)" />
            </div>
            <p
              style={{
                fontSize: "var(--font-size-heading)",
                fontWeight: "600",
                marginBottom: "var(--spacing-xs)",
              }}
            >
              Start a conversation
            </p>
            <p style={{ fontSize: "var(--font-size-body)" }}>
              Send your first message to {recipientName}
            </p>
          </div>
        ) : (
          messageGroups.map((group, groupIndex) => {
            const firstMessage = group[0];
            const isOwn = firstMessage.senderId === user?.id;
            return (
              <MessageGroup
                key={`group-${groupIndex}-${firstMessage.id}`}
                messages={group}
                isOwn={isOwn}
              />
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div
        style={{
          padding: "var(--spacing-lg)",
          borderTop: `1px solid var(--color-border)`,
          background: "var(--bg-surface)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: "var(--spacing-md)",
            background: "var(--bg-primary)",
            borderRadius: "var(--radius-lg)",
            padding: "var(--spacing-sm) var(--spacing-md)",
            border: `1px solid var(--color-border)`,
          }}
        >
          {/* Icon buttons */}
          <button
            type="button"
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--color-text-light)",
              padding: "var(--spacing-xs)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "var(--radius-sm)",
              transition: "all var(--transition-base)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--bg-surface)";
              e.currentTarget.style.color = "var(--color-text-dark)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--color-text-light)";
            }}
            aria-label="Add emoji"
          >
            <Smile size={20} />
          </button>

          <button
            type="button"
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--color-text-light)",
              padding: "var(--spacing-xs)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "var(--radius-sm)",
              transition: "all var(--transition-base)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--bg-surface)";
              e.currentTarget.style.color = "var(--color-text-dark)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--color-text-light)";
            }}
            aria-label="Attach file"
          >
            <Paperclip size={20} />
          </button>

          {/* Text Input */}
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={sending}
            rows={1}
            style={{
              flex: 1,
              minHeight: "40px",
              maxHeight: "120px",
              padding: "var(--spacing-sm) 0",
              border: "none",
              background: "transparent",
              fontSize: "var(--font-size-body)",
              color: "var(--color-text-dark)",
              outline: "none",
              resize: "none",
              fontFamily: "inherit",
              lineHeight: "var(--line-height-base)",
            }}
          />

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || sending}
            type="button"
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background:
                inputValue.trim() && !sending
                  ? "var(--color-primary)"
                  : "var(--color-border)",
              color:
                inputValue.trim() && !sending
                  ? "white"
                  : "var(--color-text-light)",
              border: "none",
              cursor: inputValue.trim() && !sending ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all var(--transition-base)",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              if (inputValue.trim() && !sending) {
                e.currentTarget.style.background = "var(--color-primary-hover)";
                e.currentTarget.style.transform = "scale(1.05)";
              }
            }}
            onMouseLeave={(e) => {
              if (inputValue.trim() && !sending) {
                e.currentTarget.style.background = "var(--color-primary)";
                e.currentTarget.style.transform = "scale(1)";
              }
            }}
            aria-label="Send message"
          >
            {sending ? (
              <div
                className="skeleton"
                style={{
                  width: "16px",
                  height: "16px",
                  borderRadius: "50%",
                }}
              />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
