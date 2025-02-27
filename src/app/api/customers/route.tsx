import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Customer } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url || "http://localhost"); // Default URL fallback
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    // Fetch customers and total count in one query
    const result = await prisma.$queryRaw<
      { total: string; customers: Customer[] }[]
    >`
      WITH customer_data AS (
        SELECT c.*,
              u.username AS created_by,
              u2.username AS updated_by
        FROM "Customer" c
        LEFT JOIN "User" u ON c.created_by = u.id
        LEFT JOIN "User" u2 ON c.updated_by = u2.id
        ORDER BY c.id ASC -- Order by ID before applying LIMIT
        LIMIT ${limit} OFFSET ${skip}
      )
      SELECT CAST((SELECT COUNT(*) FROM "Customer") AS INTEGER) AS total, 
            json_agg(customer_data) AS customers 
      FROM customer_data;
    `;

    const { total, customers } = result[0] || { total: "0", customers: [] };

    return NextResponse.json({
      data: customers,
      total: Number(total), // Convert string to Number
      page,
      totalPages: Math.ceil(Number(total) / limit),
    });
  } catch (err) {
    console.error("Error fetching customers:", err);
    return NextResponse.json(
      { error: "Error fetching customers", details: err },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Check if body is null or undefined
    if (!body || typeof body !== "object") {
      throw new Error("Invalid or empty request body");
    }

    // Ensure the required field 'phone_number' exists
    if (!body.phone_number) {
      throw new Error("Phone number is required");
    }

    // Continue with your logic...
    const existingCustomer = await prisma.$queryRawUnsafe<Customer[]>(
      `
      SELECT * FROM "Customer" WHERE phone_number = $1 LIMIT 1
    `,
      body.phone_number
    );

    if (existingCustomer.length > 0) {
      return NextResponse.json(
        { error: "Phone number already exists" },
        { status: 400 }
      );
    }

    await prisma.$executeRaw`
      INSERT INTO "Customer" (
        full_name, 
        year_of_birth, 
        phone_number, 
        note, 
        role_note, 
        status, 
        team_id, 
        created_by, 
        updated_by, 
        updated_at
      ) 
      VALUES (
        ${body.full_name || null},
        ${body.year_of_birth || null},
        ${body.phone_number},
        ${body.note || null},
        ${body.role_note || null},
        ${body.status || null},
        ${body.team_id ? parseInt(body.team_id, 10) : null},
        ${body.created_by || null},
        ${body.updated_by || null},
        NOW()
      )
    `;

    return NextResponse.json(
      { message: "Customer Created Successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating customer:", error);

    return NextResponse.json(
      { error: "Failed to create customer" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const { id, status, is_admin, updated_by } = await req.json();

    if (!id || status === undefined || !updated_by) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    let updatedByInt: number | null = parseInt(updated_by, 10);
    const statusInt = parseInt(status, 10); // Convert status to an integer

    if (isNaN(updatedByInt) || isNaN(statusInt)) {
      return NextResponse.json(
        { error: "Invalid updated_by or status value" },
        { status: 400 }
      );
    }

    // Fetch current status
    const currentStatusResult = await prisma.$queryRawUnsafe<
      { status: string }[]
    >(`SELECT status FROM "Customer" WHERE id = $1`, id);

    if (!currentStatusResult.length) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    const currentStatus = currentStatusResult[0].status;

    if (currentStatus === "2") {
      updatedByInt = null;
    }

    // Ensure valid status transitions
    if (
      (currentStatus === "0" && (status === "1" || status === "2")) || // 0 → 1 or 0 → 2
      (currentStatus === "1" && status === "2") || // 1 → 2
      (currentStatus === "2" && status === "1" && is_admin) // 2 → 1 (Admin only)
    ) {
      await prisma.$executeRawUnsafe(
        `UPDATE "Customer" 
         SET status = $1, updated_by = $2, updated_at = NOW() 
         WHERE id = $3`,
        status,
        updatedByInt,
        id
      );

      return NextResponse.json({ message: "Status updated successfully" });
    }

    return NextResponse.json(
      { error: "Invalid status transition" },
      { status: 400 }
    );
  } catch (err) {
    console.error("Error updating status:", err);
    return NextResponse.json(
      { error: "Error updating status", details: err },
      { status: 500 }
    );
  }
}
