"use client";

import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, MessageCircle } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          prompt: () => void;
        };
      };
    };
  }
}

export default function SignupPage() {
  const { user, loading, signup, loginWithGoogle } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const hiddenGoogleButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/chat");
    }
  }, [user, loading, router]);

  const handleGoogleSignIn = useCallback(
    async (response: { credential: string }) => {
      try {
        setError("");
        setSubmitting(true);

        if (!response.credential) {
          throw new Error("No credential received from Google");
        }

        console.log(
          "Google sign-in credential received, length:",
          response.credential.length
        );
        await loginWithGoogle(response.credential);
      } catch (err) {
        console.error("Google sign-in error:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Google sign-in failed";
        setError(errorMessage);
      } finally {
        setSubmitting(false);
      }
    },
    [loginWithGoogle]
  );

  useEffect(() => {
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    if (!googleClientId) {
      console.warn("NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set");
      return;
    }

    if (!hiddenGoogleButtonRef.current) return;

    const initGoogleSignIn = () => {
      if (!window.google?.accounts?.id) {
        console.warn("Google Sign-In script not loaded yet");
        return false;
      }

      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleSignIn,
        });

        if (hiddenGoogleButtonRef.current) {
          // Clear any existing button first
          hiddenGoogleButtonRef.current.innerHTML = "";

          window.google.accounts.id.renderButton(
            hiddenGoogleButtonRef.current,
            {
              type: "standard",
              theme: "outline",
              size: "large",
              text: "signup_with",
              width: "100%",
            }
          );
        }
        return true;
      } catch (error) {
        console.error("Error initializing Google Sign-In:", error);
        return false;
      }
    };

    // Try to initialize immediately if script is already loaded
    if (window.google?.accounts?.id) {
      initGoogleSignIn();
    } else {
      // Listen for script load event
      const handleScriptLoad = () => {
        if (initGoogleSignIn()) {
          window.removeEventListener("google-script-loaded", handleScriptLoad);
        }
      };

      window.addEventListener("google-script-loaded", handleScriptLoad);

      // Also poll as fallback
      const checkGoogle = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(checkGoogle);
          window.removeEventListener("google-script-loaded", handleScriptLoad);
          initGoogleSignIn();
        }
      }, 100);

      // Cleanup after 10 seconds
      const timeout = setTimeout(() => {
        clearInterval(checkGoogle);
        window.removeEventListener("google-script-loaded", handleScriptLoad);
        if (!window.google?.accounts?.id) {
          console.error(
            "Google Sign-In script failed to load after 10 seconds"
          );
        }
      }, 10000);

      return () => {
        clearInterval(checkGoogle);
        clearTimeout(timeout);
        window.removeEventListener("google-script-loaded", handleScriptLoad);
      };
    }
  }, [handleGoogleSignIn]);

  const handleGoogleButtonClick = () => {
    if (submitting || !hiddenGoogleButtonRef.current) return;
    const googleButton = hiddenGoogleButtonRef.current.querySelector(
      'div[role="button"], iframe'
    ) as HTMLElement;
    if (googleButton) {
      googleButton.click();
    } else {
      const container = hiddenGoogleButtonRef.current
        .firstElementChild as HTMLElement;
      if (container) {
        container.click();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await signup(email, name, password);
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
        position: "relative",
      }}
      className="fade-in"
    >
      <div
        style={{
          position: "absolute",
          top: "var(--spacing-lg)",
          right: "var(--spacing-lg)",
        }}
      >
        <ThemeToggle />
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "var(--spacing-md)",
          marginBottom: "var(--spacing-2xl)",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "var(--radius-lg)",
            background: "var(--color-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            marginBottom: "var(--spacing-md)",
          }}
        >
          <MessageCircle size={36} />
        </div>
        <h1
          style={{
            fontSize: "var(--font-size-title)",
            fontWeight: "700",
            color: "var(--color-text-dark)",
            letterSpacing: "-0.2px",
            margin: 0,
            textAlign: "center",
          }}
        >
          Create your account
        </h1>
        <p
          style={{
            fontSize: "var(--font-size-body)",
            color: "var(--color-text-light)",
            margin: 0,
            textAlign: "center",
          }}
        >
          Sign up to get started with Chat App
        </p>
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          padding: "var(--spacing-2xl)",
          background: "var(--bg-surface)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--color-border)",
        }}
        className="slide-up"
      >
        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--spacing-lg)",
          }}
        >
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
              placeholder="Enter your name"
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
              placeholder="Enter your email"
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
                placeholder="Enter your password (min. 6 characters)"
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

          {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--spacing-md)",
                marginTop: "var(--spacing-md)",
              }}
            >
              <div
                style={{
                  flex: 1,
                  height: "1px",
                  background: "var(--color-border)",
                }}
              />
              <span
                style={{
                  fontSize: "var(--font-size-caption)",
                  color: "var(--color-text-light)",
                  padding: "0 var(--spacing-sm)",
                }}
              >
                OR
              </span>
              <div
                style={{
                  flex: 1,
                  height: "1px",
                  background: "var(--color-border)",
                }}
              />
            </div>
          )}

          {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
            <div
              style={{ position: "relative", marginTop: "var(--spacing-md)" }}
            >
              <div
                ref={hiddenGoogleButtonRef}
                style={{
                  position: "absolute",
                  opacity: 0,
                  zIndex: 1,
                  width: "100%",
                  height: "48px",
                }}
              />
              <button
                type="button"
                onClick={handleGoogleButtonClick}
                disabled={submitting}
                style={{
                  width: "100%",
                  padding: "var(--spacing-md) var(--spacing-xl)",
                  fontSize: "var(--font-size-body)",
                  fontWeight: "500",
                  background: submitting
                    ? "var(--bg-primary)"
                    : "var(--bg-surface)",
                  color: submitting
                    ? "var(--color-text-light)"
                    : "var(--color-text-dark)",
                  border: `1px solid ${
                    submitting ? "var(--color-border)" : "var(--color-border)"
                  }`,
                  borderRadius: "var(--radius-md)",
                  cursor: submitting ? "not-allowed" : "pointer",
                  transition: "all var(--transition-base)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "var(--spacing-md)",
                  opacity: submitting ? 0.6 : 1,
                  position: "relative",
                  zIndex: 2,
                  pointerEvents: submitting ? "none" : "auto",
                }}
                onMouseEnter={(e) => {
                  if (!submitting) {
                    e.currentTarget.style.borderColor = "var(--color-border)";
                    e.currentTarget.style.background = "var(--bg-primary)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!submitting) {
                    e.currentTarget.style.borderColor = "var(--color-border)";
                    e.currentTarget.style.background = "var(--bg-surface)";
                  }
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  style={{ flexShrink: 0 }}
                >
                  <path
                    fill="#4285F4"
                    d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
                  />
                  <path
                    fill="#34A853"
                    d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.348 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"
                  />
                  <path
                    fill="#EA4335"
                    d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"
                  />
                </svg>
                <span>Sign up with Google</span>
              </button>
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
            {submitting ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <p
          style={{
            marginTop: "var(--spacing-xl)",
            textAlign: "center",
            fontSize: "var(--font-size-body)",
            color: "var(--color-text-light)",
          }}
        >
          Already have an account?{" "}
          <a
            href="/login"
            style={{
              color: "var(--color-primary)",
              fontWeight: "500",
              textDecoration: "none",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.textDecoration = "underline";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.textDecoration = "none";
            }}
          >
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
