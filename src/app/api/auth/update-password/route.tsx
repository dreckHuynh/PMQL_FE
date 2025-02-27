import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";

export async function PUT(req: Request) {
  try {
    const { username, password } = await req.json();

    // Find user in the database using raw query
    const user = await prisma.$queryRawUnsafe(
      `SELECT * FROM "User" WHERE username = $1 LIMIT 1`,
      username
    );

    // Ensure user is an array or an object
    const existingUser = Array.isArray(user) ? user[0] : user;

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password using raw query
    await prisma.$executeRawUnsafe(
      `UPDATE "User" SET password = $1, is_first_login = false WHERE username = $2`,
      hashedPassword,
      username
    );

    // Generate a new JWT Token
    const token = jwt.sign(
      {
        ...existingUser,
        id: existingUser.id.toString(),
        updated_by: existingUser.updated_by?.toString(),
        created_by: existingUser.created_by?.toString(),
      },
      process.env.JWT_SECRET || "your_secret_key",
      { expiresIn: "24h" }
    );

    // Set a new cookie with the updated token
    const cookie = serialize("token", token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    return NextResponse.json(
      {
        message: "Password updated successfully",
      },
      {
        headers: {
          "Set-Cookie": cookie,
        },
      }
    );
  } catch (err) {
    console.error("Error updating password:", err);
    return NextResponse.json(
      { error: "Failed to update password" },
      { status: 500 }
    );
  }
}
