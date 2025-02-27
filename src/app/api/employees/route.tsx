/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url || "http://localhost"); // Default URL fallback
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    // Fetch users and total count in one query
    const result = await prisma.$queryRaw<{ total: bigint; users: any[] }[]>`
      WITH user_data AS (
        SELECT u.*,
               c.username AS created_by_username,
               u2.username AS updated_by_username
        FROM "User" u
        LEFT JOIN "User" c ON u.created_by = c.id
        LEFT JOIN "User" u2 ON u.updated_by = u2.id
        LIMIT ${limit} OFFSET ${skip}
      )
      SELECT CAST((SELECT COUNT(*) FROM "User") AS INTEGER) AS total, 
             json_agg(user_data) AS users 
      FROM user_data WHERE is_admin = FALSE;
    `;

    const { total, users } = result[0] || { total: 0, users: [] };

    return NextResponse.json({
      data: users,
      total: Number(total), // Convert BigInt to Number
      page,
      totalPages: Math.ceil(Number(total) / limit),
    });
  } catch (err) {
    console.error("Error fetching users:", err);
    return NextResponse.json(
      { error: "Error fetching users", details: err },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    if (req.method !== "POST") {
      return NextResponse.json(
        { error: "Method not allowed" },
        { status: 405 }
      );
    }

    const body = await req.json();
    if (
      !body ||
      typeof body !== "object" ||
      !body.username ||
      !body.name ||
      !body.team_id
    ) {
      return NextResponse.json(
        { error: "Username, name, and team_id are required" },
        { status: 400 }
      );
    }

    const { username, name, user_role, status, team_id } = body;
    const hashedPassword = await bcrypt.hash(username, 10);

    const isAdmin = user_role === "0";
    const isTeamLead = user_role === "1";

    // Convert team_id to integer
    const teamIdAsInt = parseInt(team_id, 10);

    if (isNaN(teamIdAsInt)) {
      return NextResponse.json(
        { error: "Invalid team_id, it must be a valid integer" },
        { status: 400 }
      );
    }

    // Insert user using raw query, including team_id as an integer
    await prisma.$executeRaw`
      INSERT INTO "User" (
        username, 
        name, 
        password, 
        is_admin, 
        is_team_lead, 
        is_first_login, 
        status, 
        team_id, 
        updated_at
      )
      VALUES (
        ${username}, 
        ${name}, 
        ${hashedPassword}, 
        ${isAdmin}, 
        ${isTeamLead}, 
        true, 
        ${status || "1"}, 
        ${teamIdAsInt},  -- team_id is now ensured to be an integer
        NOW()
      )
    `;

    return NextResponse.json(
      {
        message: "User created successfully",
        data: { username, name, team_id: teamIdAsInt },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error creating user:", err);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Check if the user exists
    const userExists = await prisma.$queryRawUnsafe<{ count: number }[]>(
      `SELECT COUNT(*)::int AS count FROM "User" WHERE id = $1`,
      id
    );

    if (!userExists[0]?.count) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Deactivate the user using a raw query
    await prisma.$executeRawUnsafe(
      `UPDATE "User" SET is_first_login = TRUE WHERE id = $1`,
      id
    );

    return NextResponse.json({ message: "Reset password successfully" });
  } catch (error) {
    console.error("Error deactivating user:", error);
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
}
