"use client";

import { Message } from "@/hooks/useMessages";
import { useMemo } from "react";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showTimestamp?: boolean;
  isGrouped?: boolean;
}

export default function MessageBubble({
  message,
  isOwn,
  showTimestamp = true,
  isGrouped = false,
}: MessageBubbleProps) {
  const date = new Date(message.createdAt);
  const timeString = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isOwn ? "flex-end" : "flex-start",
        marginBottom: isGrouped ? "var(--spacing-xs)" : "var(--spacing-md)",
        paddingLeft: isOwn ? "20%" : "0",
        paddingRight: isOwn ? "0" : "20%",
      }}
      className="slide-up"
    >
      <div
        style={{
          maxWidth: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: isOwn ? "flex-end" : "flex-start",
        }}
      >
        <div
          style={{
            maxWidth: "100%",
            padding: "var(--spacing-md) var(--spacing-lg)",
            borderRadius: isOwn ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
            background: isOwn ? "var(--color-primary)" : "var(--bg-surface)",
            border: isOwn ? "none" : `1px solid var(--color-border)`,
            color: isOwn ? "white" : "var(--color-text-dark)",
            boxShadow: isOwn ? "var(--shadow-sm)" : "none",
            position: "relative",
            wordWrap: "break-word",
            wordBreak: "break-word",
          }}
          className="scale-in"
        >
          <div
            style={{
              fontSize: "var(--font-size-body)",
              lineHeight: "var(--line-height-base)",
              whiteSpace: "pre-wrap",
            }}
          >
            {message.content}
          </div>
          {showTimestamp && (
            <div
              style={{
                fontSize: "var(--font-size-caption)",
                marginTop: "var(--spacing-xs)",
                opacity: 0.7,
                textAlign: "right",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: "var(--spacing-xs)",
              }}
            >
              <span>{timeString}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper component to render grouped messages
export function MessageGroup({
  messages,
  isOwn,
}: {
  messages: Message[];
  isOwn: boolean;
}) {
  if (messages.length === 0) return null;
  if (messages.length === 1) {
    return (
      <MessageBubble message={messages[0]} isOwn={isOwn} showTimestamp={true} />
    );
  }

  return (
    <div>
      {messages.map((message, index) => (
        <MessageBubble
          key={message.id}
          message={message}
          isOwn={isOwn}
          showTimestamp={index === messages.length - 1}
          isGrouped={index !== messages.length - 1}
        />
      ))}
    </div>
  );
}

// Helper function to group messages
export function groupMessages(
  messages: Message[],
  currentUserId: string,
  timeThreshold: number = 300000 // 5 minutes in milliseconds
): Message[][] {
  if (messages.length === 0) return [];

  const groups: Message[][] = [];
  let currentGroup: Message[] = [messages[0]];

  for (let i = 1; i < messages.length; i++) {
    const prevMessage = messages[i - 1];
    const currentMessage = messages[i];

    const prevTime = new Date(prevMessage.createdAt).getTime();
    const currentTime = new Date(currentMessage.createdAt).getTime();
    const timeDiff = currentTime - prevTime;

    const sameSender = prevMessage.senderId === currentMessage.senderId;
    const withinTimeThreshold = timeDiff < timeThreshold;

    if (sameSender && withinTimeThreshold) {
      currentGroup.push(currentMessage);
    } else {
      groups.push(currentGroup);
      currentGroup = [currentMessage];
    }
  }

  groups.push(currentGroup);
  return groups;
}
