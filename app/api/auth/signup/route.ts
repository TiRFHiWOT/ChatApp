import { NextRequest, NextResponse } from "next/server";
import { createUser, generateToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Validate JWT_SECRET
    const jwtSecret = process.env.JWT_SECRET?.trim();
    if (!jwtSecret || jwtSecret.length < 32) {
      console.error("JWT_SECRET validation failed:", {
        exists: !!process.env.JWT_SECRET,
        length: process.env.JWT_SECRET?.length || 0,
        firstChars: process.env.JWT_SECRET?.substring(0, 10) || "none",
      });
      return NextResponse.json(
        {
          error: "Server configuration error",
          details: "JWT_SECRET environment variable is not properly configured",
          hint:
            process.env.NODE_ENV === "development"
              ? `JWT_SECRET length: ${
                  process.env.JWT_SECRET?.length || 0
                } (minimum 32 required)`
              : "JWT_SECRET must be at least 32 characters long",
        },
        { status: 500 }
      );
    }

    if (!process.env.DATABASE_URL) {
      console.error("DATABASE_URL is not set");
      return NextResponse.json(
        {
          error: "Server configuration error",
          details: "DATABASE_URL environment variable is not set",
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { email, name, password } = body;

    if (!email || !name || !password) {
      return NextResponse.json(
        { error: "Email, name, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    try {
      const user = await createUser({ email, name, password });
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
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "Email already exists" },
          { status: 400 }
        );
      }
      throw error;
    }
  } catch (error: any) {
    console.error("Signup error:", error);
    console.error("Error stack:", error.stack);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);

    if (
      error.message?.includes("Authentication failed") ||
      error.message?.includes("database credentials")
    ) {
      return NextResponse.json(
        {
          error: "Database connection failed",
          details:
            process.env.NODE_ENV === "development"
              ? "Your DATABASE_URL in .env has invalid credentials. PostgreSQL is running. See DATABASE_SETUP.md for setup instructions. Quick fix: Run 'node scripts/fix-db-connection.js' to auto-detect working credentials."
              : "Database configuration error",
          help: "See DATABASE_SETUP.md for detailed setup instructions",
        },
        { status: 500 }
      );
    }

    // More detailed error for debugging
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message || "Unknown error",
        code: error.code || "UNKNOWN",
        // Only show full error in development or if explicitly enabled
        ...(process.env.NODE_ENV === "development" ||
        process.env.VERCEL_ENV === "preview"
          ? { stack: error.stack }
          : {}),
      },
      { status: 500 }
    );
  }
}
