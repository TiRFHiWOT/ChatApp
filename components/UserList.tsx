"use client";

import { useUsers } from "@/hooks/useUsers";
import { usePusher } from "@/hooks/usePusher";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Search, LogOut, User as UserIcon } from "lucide-react";
import { useState, useMemo } from "react";
import ThemeToggle from "./ThemeToggle";

export default function UserList({ currentUserId }: { currentUserId: string }) {
  const { users, loading } = useUsers(currentUserId);
  const { onlineUsers } = usePusher(currentUserId);
  const { getUnreadCount, clearUnreadCount } = useUnreadMessages(currentUserId);
  const router = useRouter();
  const { logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  const handleUserClick = (userId: string) => {
    clearUnreadCount(userId);
    router.push(`/chat/${userId}`);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--bg-surface)",
      }}
    >
      <div
        style={{
          padding: "var(--spacing-xl)",
          borderBottom: `1px solid var(--color-border)`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "var(--spacing-lg)",
          }}
        >
          <h2
            style={{
              fontSize: "var(--font-size-heading)",
              fontWeight: "600",
              color: "var(--color-text-dark)",
              margin: 0,
            }}
          >
            Chats
          </h2>
          <ThemeToggle />
        </div>

        <div style={{ position: "relative" }}>
          <Search
            size={18}
            style={{
              position: "absolute",
              left: "var(--spacing-md)",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--color-text-light)",
            }}
          />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding:
                "var(--spacing-md) var(--spacing-md) var(--spacing-md) 40px",
              border: `1px solid var(--color-border)`,
              borderRadius: "var(--radius-md)",
              fontSize: "var(--font-size-body)",
              background: "var(--bg-primary)",
              color: "var(--color-text-dark)",
              outline: "none",
              transition: "all var(--transition-base)",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "var(--color-primary)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "var(--color-border)";
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={{
                position: "absolute",
                right: "var(--spacing-md)",
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "var(--color-text-light)",
                padding: "var(--spacing-xs)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                transition: "all var(--transition-base)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--bg-primary)";
                e.currentTarget.style.color = "var(--color-text-dark)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--color-text-light)";
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {loading ? (
          <div style={{ padding: "var(--spacing-lg)" }}>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--spacing-md)",
                  padding: "var(--spacing-md)",
                  marginBottom: "var(--spacing-sm)",
                }}
              >
                <div
                  className="skeleton"
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "50%",
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div
                    className="skeleton"
                    style={{
                      width: "60%",
                      height: "16px",
                      borderRadius: "var(--radius-sm)",
                      marginBottom: "var(--spacing-xs)",
                    }}
                  />
                  <div
                    className="skeleton"
                    style={{
                      width: "40%",
                      height: "12px",
                      borderRadius: "var(--radius-sm)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div
            style={{
              padding: "var(--spacing-2xl)",
              textAlign: "center",
              color: "var(--color-text-light)",
            }}
          >
            {searchQuery ? (
              <>
                <UserIcon
                  size={48}
                  style={{
                    marginBottom: "var(--spacing-md)",
                    opacity: 0.5,
                  }}
                />
                <p style={{ fontSize: "var(--font-size-body)" }}>
                  No users found
                </p>
              </>
            ) : (
              <p style={{ fontSize: "var(--font-size-body)" }}>
                No other users found
              </p>
            )}
          </div>
        ) : (
          filteredUsers.map((user) => {
            const isOnline = onlineUsers.has(user.id);
            const unreadCount = getUnreadCount(user.id);
            return (
              <div
                key={user.id}
                onClick={() => handleUserClick(user.id)}
                style={{
                  padding: "var(--spacing-md) var(--spacing-xl)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--spacing-md)",
                  transition: "background-color var(--transition-base)",
                  borderBottom: `1px solid var(--color-border)`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--bg-primary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
                className="fade-in"
              >
                <div
                  style={{
                    position: "relative",
                    width: "42px",
                    height: "42px",
                    flexShrink: 0,
                  }}
                >
                  {user.picture ? (
                    <img
                      src={user.picture}
                      alt={user.name}
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
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {isOnline && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: 0,
                        right: 0,
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        background: "var(--color-online)",
                        border: `2px solid var(--bg-surface)`,
                        boxShadow: "var(--shadow-sm)",
                      }}
                    />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "var(--font-size-body)",
                      fontWeight: "600",
                      color: "var(--color-text-dark)",
                      marginBottom: "var(--spacing-xs)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {user.name}
                  </div>
                  <div
                    style={{
                      fontSize: "var(--font-size-caption)",
                      color: isOnline
                        ? "var(--color-online)"
                        : "var(--color-text-light)",
                      fontWeight: isOnline ? "500" : "400",
                    }}
                  >
                    {isOnline ? "Online" : "Offline"}
                  </div>
                </div>
                {unreadCount > 0 && (
                  <div
                    style={{
                      minWidth: "20px",
                      height: "20px",
                      borderRadius: "10px",
                      background: "var(--color-primary)",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "var(--font-size-caption)",
                      fontWeight: "600",
                      padding: "0 var(--spacing-xs)",
                    }}
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div
        style={{
          padding: "var(--spacing-xl)",
          borderTop: `1px solid var(--color-border)`,
        }}
      >
        <button
          onClick={logout}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "var(--spacing-md)",
            padding: "var(--spacing-md)",
            background: "transparent",
            border: `1px solid var(--color-border)`,
            borderRadius: "var(--radius-md)",
            color: "var(--color-error)",
            fontSize: "var(--font-size-body)",
            fontWeight: "500",
            cursor: "pointer",
            transition: "all var(--transition-base)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.1)";
            e.currentTarget.style.borderColor = "var(--color-error)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.borderColor = "var(--color-border)";
          }}
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  );
}
