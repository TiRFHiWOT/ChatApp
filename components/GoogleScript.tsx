"use client";

import Script from "next/script";

export default function GoogleScript() {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  if (!googleClientId) {
    return null;
  }

  return (
    <Script
      src="https://accounts.google.com/gsi/client"
      strategy="afterInteractive"
      onLoad={() => {
        // Script loaded, components can now initialize Google Sign-In
        window.dispatchEvent(new Event("google-script-loaded"));
      }}
      onError={(e) => {
        console.error("Failed to load Google Sign-In script:", e);
      }}
    />
  );
}
