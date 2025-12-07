import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
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

    const sessions = await prisma.chatSession.findMany({
      where: {
        OR: [{ user1Id: decoded.userId }, { user2Id: decoded.userId }],
      },
      include: {
        user1: {
          select: {
            id: true,
            name: true,
            picture: true,
            email: true,
          },
        },
        user2: {
          select: {
            id: true,
            name: true,
            picture: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user1Id, user2Id } = body;

    if (!user1Id || !user2Id) {
      return NextResponse.json(
        { error: "user1Id and user2Id are required" },
        { status: 400 }
      );
    }

    if (user1Id === user2Id) {
      return NextResponse.json(
        { error: "Cannot create session with yourself" },
        { status: 400 }
      );
    }

    const [id1, id2] = [user1Id, user2Id].sort();

    let session = await prisma.chatSession.findFirst({
      where: {
        OR: [
          { user1Id: id1, user2Id: id2 },
          { user1Id: id2, user2Id: id1 },
        ],
      },
      include: {
        user1: {
          select: {
            id: true,
            name: true,
            picture: true,
            email: true,
          },
        },
        user2: {
          select: {
            id: true,
            name: true,
            picture: true,
            email: true,
          },
        },
      },
    });

    if (!session) {
      session = await prisma.chatSession.create({
        data: {
          user1Id: id1,
          user2Id: id2,
        },
        include: {
          user1: {
            select: {
              id: true,
              name: true,
              picture: true,
              email: true,
            },
          },
          user2: {
            select: {
              id: true,
              name: true,
              picture: true,
              email: true,
            },
          },
        },
      });
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error("Error creating/finding session:", error);
    return NextResponse.json(
      { error: "Failed to create/find session" },
      { status: 500 }
    );
  }
}
