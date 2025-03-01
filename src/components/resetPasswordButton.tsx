"use client";

import { Button } from "@heroui/react";
import { apiRequest } from "@/utils/apiRequest";
import { useAuth } from "@/context/AuthContext";
import Cookies from "js-cookie";

export default function ResetPasswordButton() {
  const user = useAuth();
  const handleResetPassword = async () => {
    try {
      const result = await apiRequest({
        url: "/employees/reset",
        method: "PUT",
        body: { id: user?.id },
        showToast: true,
      });

      if (result.success) {
        await handleLogout();
      }
    } finally {
    }
  };

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
    <Button
      color="danger"
      variant="ghost"
      onPress={handleResetPassword}
      className="mr-4"
    >
      Reset mật khẩu
    </Button>
  );
}
