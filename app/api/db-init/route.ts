import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const createUserSQL = `
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = 'aaa') THEN
          CREATE USER aaa WITH PASSWORD 'aaa' CREATEDB;
        END IF;
      END
      $$;
    `;

    const createDatabaseSQL = `
      SELECT 'CREATE DATABASE chatapp OWNER aaa'
      WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'chatapp')\\gexec
    `;

    try {
      await prisma.$executeRawUnsafe(createUserSQL);
    } catch (e: any) {
      if (!e.message?.includes("already exists")) {
        console.log("Could not create user (may need superuser):", e.message);
      }
    }

    try {
      await prisma.$executeRawUnsafe("SELECT 1");
      return NextResponse.json({
        success: true,
        message: "Database connection successful!",
      });
    } catch (e: any) {
      if (
        e.message?.includes("database") &&
        e.message?.includes("does not exist")
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Database 'chatapp' does not exist",
            instructions:
              'Please run: sudo -u postgres psql -c "CREATE DATABASE chatapp OWNER aaa;"',
          },
          { status: 500 }
        );
      }
      throw e;
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        instructions:
          "Please create the database user manually:\n1. Run: sudo -u postgres psql\n2. Then: CREATE USER aaa WITH PASSWORD 'aaa' CREATEDB;\n3. Then: CREATE DATABASE chatapp OWNER aaa;",
      },
      { status: 500 }
    );
  }
}
