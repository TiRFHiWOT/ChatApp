"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

let authInitialized = false;
let globalUser: User | null = null;
let globalLoading = true;

export function useAuth() {
  const [user, setUser] = useState<User | null>(globalUser);
  const [loading, setLoading] = useState(globalLoading);
  const router = useRouter();

  const initAuth = useCallback(async () => {
    if (authInitialized) {
      setUser(globalUser);
      setLoading(false);
      return;
    }

    authInitialized = true;

    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");

    if (!storedUser || !storedToken) {
      globalUser = null;
      globalLoading = false;
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${storedToken}` },
      });

      if (response.ok) {
        const data = await response.json();
        globalUser = data.user;
        setUser(data.user);
      } else {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        globalUser = null;
        setUser(null);
      }
    } catch {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      globalUser = null;
      setUser(null);
    } finally {
      globalLoading = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const login = async (email: string, password: string) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Login failed");
    }

    const data = await response.json();
    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("token", data.token);
    globalUser = data.user;
    setUser(data.user);
  };

  const signup = async (email: string, name: string, password: string) => {
    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Signup failed");
    }

    const data = await response.json();
    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("token", data.token);
    globalUser = data.user;
    setUser(data.user);
  };

  const loginWithGoogle = async (idToken: string) => {
    const response = await fetch("/api/auth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Google login failed");
    }

    const data = await response.json();
    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("token", data.token);
    globalUser = data.user;
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    globalUser = null;
    authInitialized = false;
    setUser(null);
    router.replace("/login");
  };

  return { user, loading, login, signup, loginWithGoogle, logout };
}
