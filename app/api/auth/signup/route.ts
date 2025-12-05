import { NextRequest, NextResponse } from "next/server";
import { createUser, generateToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
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

    return NextResponse.json(
      {
        error: "Internal server error",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
