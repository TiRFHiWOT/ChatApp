"use client";

import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, MessageCircle } from "lucide-react";

export default function LoginPage() {
  const { user, loading, login, signup } = useAuth();
  const router = useRouter();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/chat");
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      if (isSignup) {
        await signup(email, name, password);
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "var(--bg-primary)",
        }}
      >
        <div
          className="skeleton"
          style={{ width: "200px", height: "20px", borderRadius: "8px" }}
        />
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        padding: "var(--spacing-lg)",
        background: "var(--bg-primary)",
      }}
      className="fade-in"
    >
      {/* App Logo/Title */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--spacing-md)",
          marginBottom: "var(--spacing-2xl)",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "var(--radius-lg)",
            background: "var(--color-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
          }}
        >
          <MessageCircle size={28} />
        </div>
        <h1
          style={{
            fontSize: "var(--font-size-title)",
            fontWeight: "700",
            color: "var(--color-text-dark)",
            letterSpacing: "-0.2px",
            margin: 0,
          }}
        >
          Chat App
        </h1>
      </div>

      {/* Auth Card */}
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          padding: "var(--spacing-2xl)",
          background: "var(--bg-surface)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-lg)",
        }}
        className="slide-up"
      >
        {/* Tab Switcher */}
        <div
          style={{
            display: "flex",
            gap: "var(--spacing-sm)",
            marginBottom: "var(--spacing-xl)",
            padding: "var(--spacing-xs)",
            background: "var(--bg-primary)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <button
            onClick={() => {
              setIsSignup(false);
              setError("");
              setEmail("");
              setPassword("");
              setName("");
            }}
            type="button"
            style={{
              flex: 1,
              padding: "var(--spacing-md) var(--spacing-lg)",
              fontSize: "var(--font-size-body)",
              fontWeight: "600",
              color: !isSignup ? "white" : "var(--color-text-light)",
              background: !isSignup ? "var(--color-primary)" : "transparent",
              border: "none",
              borderRadius: "var(--radius-sm)",
              cursor: "pointer",
              transition: "all var(--transition-base)",
            }}
          >
            Login
          </button>
          <button
            onClick={() => {
              setIsSignup(true);
              setError("");
              setEmail("");
              setPassword("");
              setName("");
            }}
            type="button"
            style={{
              flex: 1,
              padding: "var(--spacing-md) var(--spacing-lg)",
              fontSize: "var(--font-size-body)",
              fontWeight: "600",
              color: isSignup ? "white" : "var(--color-text-light)",
              background: isSignup ? "var(--color-primary)" : "transparent",
              border: "none",
              borderRadius: "var(--radius-sm)",
              cursor: "pointer",
              transition: "all var(--transition-base)",
            }}
          >
            Sign Up
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--spacing-lg)",
          }}
        >
          {isSignup && (
            <div>
              <label
                htmlFor="name"
                style={{
                  display: "block",
                  marginBottom: "var(--spacing-xs)",
                  fontSize: "var(--font-size-body)",
                  fontWeight: "500",
                  color: "var(--color-text-dark)",
                }}
              >
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "var(--spacing-md) var(--spacing-lg)",
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
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              style={{
                display: "block",
                marginBottom: "var(--spacing-xs)",
                fontSize: "var(--font-size-body)",
                fontWeight: "500",
                color: "var(--color-text-dark)",
              }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "var(--spacing-md) var(--spacing-lg)",
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
          </div>

          <div>
            <label
              htmlFor="password"
              style={{
                display: "block",
                marginBottom: "var(--spacing-xs)",
                fontSize: "var(--font-size-body)",
                fontWeight: "500",
                color: "var(--color-text-dark)",
              }}
            >
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                style={{
                  width: "100%",
                  padding: "var(--spacing-md) var(--spacing-lg)",
                  paddingRight: "48px",
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
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "var(--spacing-md)",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-text-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "var(--spacing-xs)",
                }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <div
              style={{
                padding: "var(--spacing-md)",
                background: "rgba(239, 68, 68, 0.1)",
                color: "var(--color-error)",
                borderRadius: "var(--radius-md)",
                fontSize: "var(--font-size-body)",
                border: `1px solid rgba(239, 68, 68, 0.2)`,
              }}
              className="fade-in"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: "100%",
              padding: "var(--spacing-md) var(--spacing-xl)",
              fontSize: "var(--font-size-body)",
              fontWeight: "600",
              background: submitting
                ? "var(--color-secondary)"
                : "var(--color-primary)",
              color: "white",
              border: "none",
              borderRadius: "var(--radius-md)",
              cursor: submitting ? "not-allowed" : "pointer",
              transition: "all var(--transition-base)",
            }}
            onMouseEnter={(e) => {
              if (!submitting) {
                e.currentTarget.style.background = "var(--color-primary-hover)";
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "var(--shadow-md)";
              }
            }}
            onMouseLeave={(e) => {
              if (!submitting) {
                e.currentTarget.style.background = "var(--color-primary)";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }
            }}
          >
            {submitting ? "Please wait..." : isSignup ? "Sign Up" : "Login"}
          </button>
        </form>

        {!isSignup && (
          <p
            style={{
              marginTop: "var(--spacing-lg)",
              textAlign: "center",
              fontSize: "var(--font-size-caption)",
              color: "var(--color-text-light)",
            }}
          >
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => {
                setIsSignup(true);
                setError("");
              }}
              style={{
                background: "none",
                border: "none",
                color: "var(--color-primary)",
                cursor: "pointer",
                fontWeight: "500",
                textDecoration: "underline",
              }}
            >
              Sign up
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
