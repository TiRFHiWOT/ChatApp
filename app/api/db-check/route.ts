import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Test connection
    await prisma.$connect();

    // Check database name
    const dbInfo = await prisma.$queryRaw<Array<{ current_database: string }>>`
      SELECT current_database()
    `;

    // Check existing tables
    const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;

    const tableNames = tables.map((t) => t.table_name);
    const requiredTables = ["User", "ChatSession", "Message"];
    const missingTables = requiredTables.filter((t) => !tableNames.includes(t));

    return NextResponse.json({
      success: true,
      database: dbInfo[0]?.current_database || "unknown",
      connection: "OK",
      tables: {
        found: tableNames,
        required: requiredTables,
        missing: missingTables,
        allExist: missingTables.length === 0,
      },
      databaseUrl: process.env.DATABASE_URL
        ? `${process.env.DATABASE_URL.substring(0, 30)}...`
        : "NOT SET",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        databaseUrl: process.env.DATABASE_URL
          ? `${process.env.DATABASE_URL.substring(0, 30)}...`
          : "NOT SET",
      },
      { status: 500 }
    );
  }
}
