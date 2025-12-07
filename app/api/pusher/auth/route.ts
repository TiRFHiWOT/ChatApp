import { NextRequest, NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher";
import { verifyToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await request.json();
    const { socket_id, channel_name } = body;

    if (!socket_id || !channel_name) {
      return NextResponse.json(
        { error: "socket_id and channel_name are required" },
        { status: 400 }
      );
    }

    // Authorize presence channels
    if (channel_name.startsWith("presence-")) {
      const auth = pusherServer.authorizeChannel(socket_id, channel_name, {
        user_id: decoded.userId,
        user_info: {
          id: decoded.userId,
        },
      });

      return NextResponse.json(auth);
    }

    // Authorize private channels
    if (channel_name.startsWith("private-")) {
      const auth = pusherServer.authorizeChannel(socket_id, channel_name);
      return NextResponse.json(auth);
    }

    // Public channels don't need auth
    return NextResponse.json({});
  } catch (error: any) {
    console.error("Pusher auth error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
