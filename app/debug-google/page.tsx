"use client";

import { useEffect, useState } from "react";

export default function DebugGooglePage() {
  const [checks, setChecks] = useState<Record<string, any>>({});

  useEffect(() => {
    const runChecks = () => {
      const results: Record<string, any> = {};

      // Check 1: Environment variable
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      results.envVar = {
        exists: !!clientId,
        value: clientId
          ? `${clientId.substring(0, 20)}...${clientId.substring(
              clientId.length - 10
            )}`
          : "NOT SET",
        fullValue: clientId || "NOT SET",
      };

      // Check 2: Google script loaded
      results.googleScript = {
        loaded: !!window.google,
        accounts: !!window.google?.accounts,
        id: !!window.google?.accounts?.id,
      };

      // Check 3: Test API endpoint
      fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: "test" }),
      })
        .then((res) => res.json())
        .then((data) => {
          results.apiEndpoint = {
            reachable: true,
            response: data,
          };
          setChecks({ ...results });
        })
        .catch((err) => {
          results.apiEndpoint = {
            reachable: false,
            error: err.message,
          };
          setChecks({ ...results });
        });

      setChecks(results);
    };

    runChecks();

    // Re-check Google script after a delay
    const timeout = setTimeout(() => {
      runChecks();
    }, 2000);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <div
      style={{
        padding: "2rem",
        maxWidth: "800px",
        margin: "0 auto",
        fontFamily: "monospace",
      }}
    >
      <h1>Google OAuth Debug Page</h1>
      <p>Use this page to diagnose Google Sign-In issues in production.</p>

      <div style={{ marginTop: "2rem" }}>
        <h2>Environment Check</h2>
        <pre
          style={{
            background: "#f5f5f5",
            padding: "1rem",
            borderRadius: "4px",
            overflow: "auto",
          }}
        >
          {JSON.stringify(checks, null, 2)}
        </pre>
      </div>

      <div style={{ marginTop: "2rem" }}>
        <h2>Quick Checks</h2>
        <ul>
          <li>
            <strong>Environment Variable:</strong>{" "}
            {checks.envVar?.exists ? "✅ Set" : "❌ Not Set"}
          </li>
          <li>
            <strong>Google Script:</strong>{" "}
            {checks.googleScript?.loaded ? "✅ Loaded" : "❌ Not Loaded"}
          </li>
          <li>
            <strong>Google Accounts API:</strong>{" "}
            {checks.googleScript?.accounts
              ? "✅ Available"
              : "❌ Not Available"}
          </li>
          <li>
            <strong>Google ID API:</strong>{" "}
            {checks.googleScript?.id ? "✅ Available" : "❌ Not Available"}
          </li>
          <li>
            <strong>API Endpoint:</strong>{" "}
            {checks.apiEndpoint?.reachable
              ? "✅ Reachable"
              : "❌ Not Reachable"}
          </li>
        </ul>
      </div>

      <div style={{ marginTop: "2rem" }}>
        <h2>Instructions</h2>
        <ol>
          <li>Check if environment variable is set</li>
          <li>Check if Google script loads</li>
          <li>Check browser console for errors</li>
          <li>Check Vercel logs for API errors</li>
          <li>Verify Google Cloud Console settings</li>
        </ol>
      </div>

      <div style={{ marginTop: "2rem" }}>
        <h2>Common Issues</h2>
        <ul>
          <li>
            <strong>Environment variable not set:</strong> Add{" "}
            <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> to Vercel environment
            variables
          </li>
          <li>
            <strong>Google script not loading:</strong> Check browser console
            and network tab
          </li>
          <li>
            <strong>API endpoint error:</strong> Check Vercel function logs
          </li>
        </ul>
      </div>
    </div>
  );
}
