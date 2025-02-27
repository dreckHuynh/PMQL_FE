import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";
import { User } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    // Find user in the database
    const user: User[] = await prisma.$queryRaw<User[]>`
      SELECT * FROM "User" WHERE username = ${username} LIMIT 1
    `;

    // Ensure user is an array and check if it contains any result
    if (!user || user.length === 0) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    const existingUser = user[0];
    const isMatch = await bcrypt.compare(password, existingUser.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Generate JWT Token
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

    const cookie = serialize("token", token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    return NextResponse.json(
      {
        message: "Logged in successfully",
        data: {
          is_first_login: existingUser.is_first_login,
        },
      },
      {
        headers: {
          "Set-Cookie": cookie,
        },
      }
    );
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
