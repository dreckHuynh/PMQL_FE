"use client";

import { Button } from "@heroui/react";
import Cookies from "js-cookie";

export default function LogoutButton() {
  const clearAllCookies = () => {
    const allCookies = Cookies.get(); // Get all cookies
    Object.keys(allCookies).forEach((cookieName) => {
      Cookies.remove(cookieName, { path: "/" }); // Remove each cookie
    });
  };

  const handleLogout = async () => {
    clearAllCookies();
    window.location.href = "/login"; // Redirect after logout
  };

  return (
    <Button color="default" variant="ghost" onPress={handleLogout}>
      Logout
    </Button>
  );
}
