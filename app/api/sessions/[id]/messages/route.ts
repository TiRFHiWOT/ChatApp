import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const messages = await prisma.message.findMany({
      where: { sessionId: params.id },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            picture: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { senderId, content } = body;

    if (!senderId || !content) {
      return NextResponse.json(
        { error: "senderId and content are required" },
        { status: 400 }
      );
    }

    const session = await prisma.chatSession.findUnique({
      where: { id: params.id },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Determine the recipient (the other user in the session)
    const recipientId =
      session.user1Id === senderId ? session.user2Id : session.user1Id;

    const message = await prisma.message.create({
      data: {
        sessionId: params.id,
        senderId,
        content,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            picture: true,
          },
        },
      },
    });

    // Trigger Pusher event for real-time message
    try {
      await pusherServer.trigger(
        `private-message-${params.id}`,
        "new-message",
        {
          id: message.id,
          sessionId: message.sessionId,
          senderId: message.senderId,
          recipientId: recipientId, // Add recipientId so unread count can be tracked
          content: message.content,
          createdAt: message.createdAt,
          sender: message.sender,
        }
      );
    } catch (pusherError) {
      console.error("Pusher trigger error:", pusherError);
      // Don't fail the request if Pusher fails
    }

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Error creating message:", error);
    return NextResponse.json(
      { error: "Failed to create message" },
      { status: 500 }
    );
  }
}
