import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { createOrUpdateGoogleUser, generateToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { idToken } = body;

    if (!idToken) {
      console.error("Google OAuth: No ID token provided");
      return NextResponse.json(
        { error: "ID token is required" },
        { status: 400 }
      );
    }

    if (!GOOGLE_CLIENT_ID) {
      console.error("Google OAuth: GOOGLE_CLIENT_ID not configured");
      return NextResponse.json(
        {
          error:
            "Google OAuth not configured. Please set GOOGLE_CLIENT_ID in environment variables",
        },
        { status: 500 }
      );
    }

    // Log in both development and production for debugging
    console.log("Google OAuth: Verifying token");
    console.log("Client ID configured:", GOOGLE_CLIENT_ID ? "Yes" : "No");
    console.log(
      "Client ID (first 20 chars):",
      GOOGLE_CLIENT_ID.substring(0, 20) + "..."
    );
    console.log("Token length:", idToken.length);
    console.log("Environment:", process.env.NODE_ENV || "unknown");

    const client = new OAuth2Client(GOOGLE_CLIENT_ID);

    try {
      const frontendClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (frontendClientId && frontendClientId !== GOOGLE_CLIENT_ID) {
        console.warn(
          "WARNING: GOOGLE_CLIENT_ID and NEXT_PUBLIC_GOOGLE_CLIENT_ID don't match!"
        );
        console.warn("Backend:", GOOGLE_CLIENT_ID.substring(0, 20) + "...");
        console.warn("Frontend:", frontendClientId.substring(0, 20) + "...");
      }

      const ticket = await client.verifyIdToken({
        idToken,
        audience: [GOOGLE_CLIENT_ID, frontendClientId].filter(
          Boolean
        ) as string[],
      });

      const payload = ticket.getPayload();

      if (!payload) {
        console.error("No payload in Google token");
        return NextResponse.json(
          { error: "Invalid token payload - no payload" },
          { status: 400 }
        );
      }

      if (!payload.email) {
        console.error("No email in Google token payload:", payload);
        return NextResponse.json(
          { error: "Invalid token payload - no email" },
          { status: 400 }
        );
      }

      if (!payload.name) {
        console.error("No name in Google token payload:", payload);
        payload.name = payload.email.split("@")[0];
      }

      const user = await createOrUpdateGoogleUser(
        payload.email,
        payload.name,
        payload.picture || undefined
      );

      const token = generateToken(user.id);

      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          picture: user.picture,
        },
        token,
      });
    } catch (error: any) {
      console.error("Google token verification error:", error);
      console.error("Error details:", {
        message: error?.message,
        code: error?.code,
        stack: error?.stack,
        name: error?.name,
      });

      // Check for specific error types
      let errorMessage = "Invalid Google token";
      let hint =
        "Make sure GOOGLE_CLIENT_ID matches the client ID used in the frontend";

      if (error?.message?.includes("Invalid token signature")) {
        errorMessage = "Token signature verification failed";
        hint = "The token may be expired or invalid. Try signing in again.";
      } else if (error?.message?.includes("Wrong number of segments")) {
        errorMessage = "Invalid token format";
        hint = "The token format is incorrect. Please try again.";
      } else if (error?.message?.includes("Token used too early")) {
        errorMessage = "Token timing error";
        hint = "Please try again in a moment.";
      }

      return NextResponse.json(
        {
          error: errorMessage,
          details: error?.message || "Unknown error",
          hint: hint,
          // Include more details in production for debugging
          debug: {
            hasClientId: !!GOOGLE_CLIENT_ID,
            clientIdPrefix: GOOGLE_CLIENT_ID?.substring(0, 20) + "...",
            tokenLength: idToken?.length,
          },
        },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Google auth error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
