import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    // Verify session exists
    const session = await prisma.chatSession.findUnique({
      where: { id: params.id },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Create message
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

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Error creating message:", error);
    return NextResponse.json(
      { error: "Failed to create message" },
      { status: 500 }
    );
  }
}


