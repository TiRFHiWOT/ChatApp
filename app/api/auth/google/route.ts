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
      return NextResponse.json(
        { error: "ID token is required" },
        { status: 400 }
      );
    }

    if (!GOOGLE_CLIENT_ID) {
      return NextResponse.json(
        {
          error:
            "Google OAuth not configured. Please set GOOGLE_CLIENT_ID in .env",
        },
        { status: 500 }
      );
    }

    if (process.env.NODE_ENV === "development") {
      console.log("Verifying Google token");
      console.log(
        "Client ID (first 20 chars):",
        GOOGLE_CLIENT_ID.substring(0, 20) + "..."
      );
      console.log("Token length:", idToken.length);
    }

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
      });

      const errorMessage = error?.message || "Invalid Google token";
      return NextResponse.json(
        {
          error: "Invalid Google token",
          details:
            process.env.NODE_ENV === "development" ? errorMessage : undefined,
          hint: "Make sure GOOGLE_CLIENT_ID matches the client ID used in the frontend",
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
