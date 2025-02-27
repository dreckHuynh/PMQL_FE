/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url || "http://localhost"); // Default URL fallback
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    // Check if pagination parameters are provided
    if (!searchParams.has("page") || !searchParams.has("limit")) {
      // Fetch all teams without pagination
      const allTeams = await prisma.$queryRaw<
        Array<{
          id: number;
          name: string;
          created_by: string | null;
          updated_by: string | null;
        }>
      >`
        SELECT t.*, 
               u.username AS created_by, 
               u2.username AS updated_by
        FROM "Team" t
        LEFT JOIN "User" u ON t.created_by = u.id
        LEFT JOIN "User" u2 ON t.updated_by = u2.id
      `;

      return NextResponse.json({
        data: allTeams,
        total: allTeams.length, // Return the length as total since we fetched all records
        page: 1,
        totalPages: 1,
      });
    } else {
      // Fetch teams with pagination
      const result = await prisma.$queryRaw<{ total: bigint; teams: any[] }[]>`
        WITH team_data AS (
          SELECT t.*, 
                 u.username AS created_by,
                 u2.username AS updated_by
          FROM "Team" t
          LEFT JOIN "User" u ON t.created_by = u.id
          LEFT JOIN "User" u2 ON t.updated_by = u2.id
          LIMIT ${limit} OFFSET ${skip}
        )
        SELECT CAST((SELECT COUNT(*) FROM "Team") AS INTEGER) AS total, 
               json_agg(team_data) AS teams 
        FROM team_data;
      `;

      const { total, teams } = result[0] || { total: 0, teams: [] };

      return NextResponse.json({
        data: teams,
        total: Number(total), // Convert BigInt to Number
        page,
        totalPages: Math.ceil(Number(total) / limit),
      });
    }
  } catch (err) {
    console.error("Error fetching teams:", err);
    return NextResponse.json(
      { error: "Error fetching teams", details: err },
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
    if (!body || typeof body !== "object" || !body.team_name) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { team_name } = body;
    if (!team_name || typeof team_name !== "string") {
      return NextResponse.json(
        { error: "Team name is required" },
        { status: 400 }
      );
    }

    // Check if team exists using raw query
    const existingTeam = await prisma.$queryRaw<
      any[]
    >`SELECT * FROM "Team" WHERE team_name = '${team_name}' LIMIT 1`;
    if (existingTeam.length > 0) {
      return NextResponse.json(
        { error: "Team name already exists" },
        { status: 400 }
      );
    }

    // Insert new team using raw query
    await prisma.$executeRaw`
      INSERT INTO "Team" (team_name, updated_at) 
      VALUES (${team_name}, NOW())`;

    return NextResponse.json(
      { message: "Tạo tổ thành công", data: { team_name } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating team:", error);
    return NextResponse.json(
      { error: "Failed to create team" },
      { status: 500 }
    );
  }
}
