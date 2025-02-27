import prisma from "@/lib/prisma";
import { CallCount } from "@/types/statistical";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const roleNote = searchParams.get("role_note");
    const normalizedRoleNote = roleNote === "null" ? null : roleNote;

    // Execute raw query to get call counts
    const whereClauses: Prisma.Sql[] = [];

    if (normalizedRoleNote) {
      whereClauses.push(Prisma.sql`c.role_note = ${normalizedRoleNote}`);
    }

    const whereSQL =
      whereClauses.length > 0
        ? Prisma.sql`WHERE ${Prisma.join(whereClauses, ` AND `)}`
        : Prisma.empty;

    const callCounts = await prisma.$queryRaw<CallCount[]>(Prisma.sql`
      SELECT COUNT(1) AS call_count, c.role_note AS caller, t.team_name
      FROM "Customer" AS c
      INNER JOIN "Team" AS t ON c.team_id = t.id
      ${whereSQL} -- ✅ This is now correctly part of the query
      GROUP BY c.team_id, c.role_note, t.team_name
      ORDER BY call_count DESC
    `);

    // Convert BigInt to Number for JSON serialization
    const formattedCallCounts = callCounts.map((entry) => ({
      ...entry,
      call_count: Number(entry.call_count), // Fix BigInt serialization error
    }));

    return NextResponse.json({
      data: formattedCallCounts,
    });
  } catch (err) {
    console.error("Error fetching call counts:", err);
    return NextResponse.json(
      { error: "Error fetching call counts" },
      { status: 500 }
    );
  }
}
