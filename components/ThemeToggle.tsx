"use client";

import { useTheme } from "@/hooks/useTheme";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      style={{
        width: "40px",
        height: "40px",
        borderRadius: "var(--radius-md)",
        background: "var(--bg-primary)",
        border: `1px solid var(--color-border)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        color: "var(--color-text-dark)",
        transition: "all var(--transition-base)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--bg-surface)";
        e.currentTarget.style.borderColor = "var(--color-primary)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "var(--bg-primary)";
        e.currentTarget.style.borderColor = "var(--color-border)";
      }}
    >
      {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
    </button>
  );
}
