"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useMessages, Message } from "@/hooks/useMessages";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useAuth } from "@/hooks/useAuth";
import MessageBubble, { MessageGroup, groupMessages } from "./MessageBubble";
import {
  Send,
  Smile,
  Paperclip,
  Wifi,
  WifiOff,
  X,
  ArrowLeft,
} from "lucide-react";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
  const { messages, loading, sendMessage, addMessage } = useMessages(sessionId);
  const {
    sendMessage: wsSendMessage,
    onMessage,
    isConnected,
  } = useWebSocket(user?.id || null);
  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const processedMessagesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(
        inputRef.current.scrollHeight,
        120
      )}px`;
    }
  }, [inputValue]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker]);

  useEffect(() => {
    if (!user || !sessionId || !onMessage) return;

    const cleanupMessage = onMessage("message", (data: any) => {
      if (data.sessionId === sessionId && data.senderId === recipientId) {
        const messageKey = `${data.sessionId}-${data.senderId}-${data.content}-${data.timestamp}`;

        if (processedMessagesRef.current.has(messageKey)) {
          return;
        }

        processedMessagesRef.current.add(messageKey);
        setTimeout(() => {
          processedMessagesRef.current.delete(messageKey);
        }, 5000);

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

    const cleanupMessageSent = onMessage("message_sent", (data: any) => {
      if (data.sessionId === sessionId) {
      }
    });

    return () => {
      if (cleanupMessage) cleanupMessage();
      if (cleanupMessageSent) cleanupMessageSent();
    };
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
    if ((!inputValue.trim() && !selectedFile) || !user || sending) return;

    const content = inputValue.trim();
    setSending(true);

    let fileUrl: string | null = null;
    let uploadedFileName: string | null = null;

    try {
      // Upload file if one is selected
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to upload file");
        }

        const uploadData = await uploadResponse.json();
        fileUrl = uploadData.url;
        uploadedFileName = uploadData.fileName;
      }

      // Prepare message content with file link if uploaded
      let messageContent = content;
      if (fileUrl && uploadedFileName) {
        const fileLink = `[📎 ${uploadedFileName}](${fileUrl})`;
        messageContent = content ? `${content}\n${fileLink}` : fileLink;
      }

      // Send via WebSocket
      wsSendMessage({
        type: "message",
        sessionId,
        recipientId,
        content: messageContent,
      });

      // Save to database
      await sendMessage(messageContent, user.id);

      setInputValue("");
      setSelectedFile(null);
    } catch (error) {
      console.error("Error sending message:", error);
      setInputValue(content); // Restore input
      alert(
        error instanceof Error
          ? error.message
          : "Failed to send message. Please try again."
      );
    } finally {
      setSending(false);
      if (inputRef.current) {
        inputRef.current.style.height = "auto";
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setInputValue((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        alert("File size exceeds 10MB limit. Please choose a smaller file.");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }
      setSelectedFile(file);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const messageGroups = useMemo(
    () => groupMessages(messages, user?.id || ""),
    [messages, user?.id || ""]
  );

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
        <button
          onClick={() => router.push("/chat")}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "var(--color-text-dark)",
            padding: "var(--spacing-xs)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "var(--radius-sm)",
            transition: "all var(--transition-base)",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--bg-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
          aria-label="Go back"
        >
          <ArrowLeft size={24} />
        </button>

        <div
          style={{
            width: "42px",
            height: "42px",
            flexShrink: 0,
          }}
        >
          {recipientPicture ? (
            <img
              src={recipientPicture}
              alt={recipientName}
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                objectFit: "cover",
                objectPosition: "center",
                display: "block",
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
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
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
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
                />
                <span>Online</span>
              </>
            ) : (
              <span>Offline</span>
            )}
          </div>
        </div>
      </div>

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

      <div
        style={{
          padding: "var(--spacing-lg)",
          borderTop: `1px solid var(--color-border)`,
          background: "var(--bg-surface)",
        }}
      >
        {selectedFile && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--spacing-md)",
              padding: "var(--spacing-md)",
              background: "var(--bg-primary)",
              borderRadius: "var(--radius-md)",
              marginBottom: "var(--spacing-md)",
            }}
            className="fade-in"
          >
            <Paperclip size={18} color="var(--color-primary)" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: "var(--font-size-body)",
                  fontWeight: "500",
                  color: "var(--color-text-dark)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {selectedFile.name}
              </div>
              <div
                style={{
                  fontSize: "var(--font-size-caption)",
                  color: "var(--color-text-light)",
                }}
              >
                {(selectedFile.size / 1024).toFixed(2)} KB
              </div>
            </div>
            <button
              type="button"
              onClick={removeSelectedFile}
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
                e.currentTarget.style.color = "var(--color-error)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--color-text-light)";
              }}
              aria-label="Remove file"
            >
              <X size={18} />
            </button>
          </div>
        )}

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
          <div style={{ position: "relative" }} ref={emojiPickerRef}>
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              style={{
                background: showEmojiPicker
                  ? "var(--bg-surface)"
                  : "transparent",
                border: "none",
                cursor: "pointer",
                color: showEmojiPicker
                  ? "var(--color-text-dark)"
                  : "var(--color-text-light)",
                padding: "var(--spacing-xs)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "var(--radius-sm)",
                transition: "all var(--transition-base)",
              }}
              onMouseEnter={(e) => {
                if (!showEmojiPicker) {
                  e.currentTarget.style.background = "var(--bg-surface)";
                  e.currentTarget.style.color = "var(--color-text-dark)";
                }
              }}
              onMouseLeave={(e) => {
                if (!showEmojiPicker) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--color-text-light)";
                }
              }}
              aria-label="Add emoji"
            >
              <Smile size={20} />
            </button>

            {showEmojiPicker && (
              <div
                style={{
                  position: "absolute",
                  bottom: "100%",
                  left: 0,
                  marginBottom: "var(--spacing-md)",
                  zIndex: 1000,
                }}
                className="fade-in"
              >
                <EmojiPicker
                  onEmojiClick={handleEmojiClick}
                  theme={
                    document.documentElement.classList.contains("dark")
                      ? ("dark" as any)
                      : ("light" as any)
                  }
                  width={350}
                  height={400}
                />
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            style={{ display: "none" }}
            onChange={handleFileSelect}
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
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

          <button
            onClick={handleSend}
            disabled={(!inputValue.trim() && !selectedFile) || sending}
            type="button"
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background:
                (inputValue.trim() || selectedFile) && !sending
                  ? "var(--color-primary)"
                  : "var(--color-border)",
              color:
                (inputValue.trim() || selectedFile) && !sending
                  ? "white"
                  : "var(--color-text-light)",
              border: "none",
              cursor:
                (inputValue.trim() || selectedFile) && !sending
                  ? "pointer"
                  : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all var(--transition-base)",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              if ((inputValue.trim() || selectedFile) && !sending) {
                e.currentTarget.style.background = "var(--color-primary-hover)";
                e.currentTarget.style.transform = "scale(1.05)";
              }
            }}
            onMouseLeave={(e) => {
              if ((inputValue.trim() || selectedFile) && !sending) {
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
