"use client";

import Script from "next/script";

export default function GoogleScript() {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  if (!googleClientId) {
    if (typeof window !== "undefined") {
      console.warn(
        "GoogleScript: NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set. Google Sign-In will not work."
      );
    }
    return null;
  }

  return (
    <Script
      src="https://accounts.google.com/gsi/client"
      strategy="afterInteractive"
      onLoad={() => {
        // Script loaded, components can now initialize Google Sign-In
        console.log("Google Sign-In script loaded successfully");
        window.dispatchEvent(new Event("google-script-loaded"));
      }}
      onError={(e) => {
        console.error("Failed to load Google Sign-In script:", e);
        // Dispatch error event so components can handle it
        window.dispatchEvent(
          new CustomEvent("google-script-error", { detail: e })
        );
      }}
      onReady={() => {
        console.log("Google Sign-In script ready");
      }}
    />
  );
}
