import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { User } from "./types/user";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  debugger;

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const user = jwt.decode(token) as User | null; // ✅ Decode JWT

    if (!user) {
      throw new Error();
    }
    if (
      req.nextUrl.pathname.endsWith("/employees") &&
      !user?.is_admin &&
      !user?.is_team_lead
    ) {
      return NextResponse.redirect(new URL("/forbidden", req.url)); // Forbidden page
    }

    // if (req.nextUrl.pathname.endsWith("/statistical") && !user?.is_admin) {
    //   return NextResponse.redirect(new URL("/forbidden", req.url)); // Forbidden page
    // }

    return NextResponse.next();
  } catch {
    console.log("1313213232");

    return NextResponse.redirect(new URL("/login", req.url));
  }
}

// Protect routes under "/dashboard" (adjust as needed)
export const config = {
  matcher: ["/admin/:path*"],
};
