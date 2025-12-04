"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import UserList from "@/components/UserList";
import ChatWindow from "@/components/ChatWindow";
import { MessageCircle, ArrowLeft } from "lucide-react";

interface Session {
  id: string;
  user1: {
    id: string;
    name: string;
    picture?: string;
    email: string;
  };
  user2: {
    id: string;
    name: string;
    picture?: string;
    email: string;
  };
}

export default function ChatWithUserPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const userId = params.userId as string;
  const { onlineUsers } = useWebSocket(user?.id || null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!user || !userId) {
      return;
    }

    if (userId === user.id) {
      router.push("/chat");
      return;
    }

    const createOrGetSession = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/sessions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user1Id: user.id,
            user2Id: userId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to create/get session");
        }

        const data = await response.json();
        setSession(data.session);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        console.error("Error creating/getting session:", err);
      } finally {
        setLoading(false);
      }
    };

    createOrGetSession();
  }, [user, userId, router]);

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          height: "100vh",
          flexDirection: "column",
          background: "var(--bg-primary)",
        }}
      >
        <header
          style={{
            padding: "var(--spacing-lg)",
            borderBottom: `1px solid var(--color-border)`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "var(--bg-surface)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--spacing-md)",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "var(--radius-lg)",
                background: "var(--color-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
              }}
            >
              <MessageCircle size={24} />
            </div>
            <h1
              style={{
                margin: 0,
                fontSize: "var(--font-size-heading)",
                fontWeight: "600",
                color: "var(--color-text-dark)",
              }}
            >
              Chat App
            </h1>
          </div>
        </header>
        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
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
            <p style={{ color: "var(--color-text-light)" }}>Loading chat...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          height: "100vh",
          flexDirection: "column",
          background: "var(--bg-primary)",
        }}
      >
        <header
          style={{
            padding: "var(--spacing-lg)",
            borderBottom: `1px solid var(--color-border)`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "var(--bg-surface)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--spacing-md)",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "var(--radius-lg)",
                background: "var(--color-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
              }}
            >
              <MessageCircle size={24} />
            </div>
            <h1
              style={{
                margin: 0,
                fontSize: "var(--font-size-heading)",
                fontWeight: "600",
                color: "var(--color-text-dark)",
              }}
            >
              Chat App
            </h1>
          </div>
        </header>
        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            background: "var(--bg-primary)",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <p
              style={{
                color: "var(--color-error)",
                marginBottom: "var(--spacing-lg)",
                fontSize: "var(--font-size-body)",
              }}
            >
              {error}
            </p>
            <button
              onClick={() => router.push("/chat")}
              style={{
                padding: "var(--spacing-md) var(--spacing-xl)",
                background: "var(--color-primary)",
                color: "white",
                border: "none",
                borderRadius: "var(--radius-md)",
                cursor: "pointer",
                fontSize: "var(--font-size-body)",
                fontWeight: "500",
                transition: "all var(--transition-base)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--color-primary-hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--color-primary)";
              }}
            >
              Back to Users
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  // Determine recipient (the other user in the session)
  const recipient =
    session.user1.id === user.id ? session.user2 : session.user1;
  const recipientOnline = onlineUsers.has(recipient.id);

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        flexDirection: "column",
        background: "var(--bg-primary)",
      }}
    >
      {/* Header */}
      <header
        style={{
          padding: "var(--spacing-lg)",
          borderBottom: `1px solid var(--color-border)`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "var(--bg-surface)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--spacing-md)",
          }}
        >
          {isMobile && (
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
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--bg-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <ArrowLeft size={24} />
            </button>
          )}
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "var(--radius-lg)",
              background: "var(--color-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
            }}
          >
            <MessageCircle size={24} />
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: "var(--font-size-heading)",
              fontWeight: "600",
              color: "var(--color-text-dark)",
            }}
          >
            Chat App
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <div
        style={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
        }}
      >
        {/* Sidebar - Hidden on mobile */}
        {!isMobile && (
          <div
            style={{
              width: "320px",
              borderRight: `1px solid var(--color-border)`,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <UserList currentUserId={user.id} />
          </div>
        )}

        {/* Chat Window */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <ChatWindow
            sessionId={session.id}
            recipientId={recipient.id}
            recipientName={recipient.name}
            recipientPicture={recipient.picture}
            recipientOnline={recipientOnline}
          />
        </div>
      </div>
    </div>
  );
}
