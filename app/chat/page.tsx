"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import UserList from "@/components/UserList";

export default function ChatPage() {
  const { user } = useAuth();
  const router = useRouter();
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
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        flexDirection: "column",
        background: "var(--bg-primary)",
      }}
    >
      <div
        style={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: isMobile ? "100%" : "320px",
            borderRight: isMobile ? "none" : `1px solid var(--color-border)`,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <UserList currentUserId={user.id} />
        </div>

        {!isMobile && (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--bg-primary)",
            }}
          >
            <div
              style={{
                textAlign: "center",
                color: "var(--color-text-light)",
                maxWidth: "400px",
                padding: "var(--spacing-2xl)",
              }}
              className="fade-in"
            >
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  background: "var(--bg-surface)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto var(--spacing-lg)",
                  opacity: 0.6,
                }}
              >
                💬
              </div>
              <h2
                style={{
                  fontSize: "var(--font-size-heading)",
                  fontWeight: "600",
                  color: "var(--color-text-dark)",
                  marginBottom: "var(--spacing-md)",
                }}
              >
                Welcome to Chat App!
              </h2>
              <p
                style={{
                  fontSize: "var(--font-size-body)",
                  lineHeight: "var(--line-height-base)",
                }}
              >
                Select a user from the list to start chatting
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
