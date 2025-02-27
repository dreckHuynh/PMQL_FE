"use client";

import { Button } from "@heroui/react";
import { apiRequest } from "@/utils/apiRequest";
import { useAuth } from "@/context/AuthContext";

export default function ResetPasswordButton() {
  const user = useAuth();
  const handleResetPassword = async () => {
    try {
      const result = await apiRequest({
        url: "/users",
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

  const handleLogout = async () => {
    const result = await apiRequest({
      url: "/auth/logout",
      method: "POST",
      showToast: true,
    });

    if (result.success) {
      window.location.href = "/login"; // Redirect after logout
    }
  };

  return (
    <Button color="danger" variant="ghost" onPress={handleResetPassword} className="mr-4">
      Reset mật khẩu
    </Button>
  );
}
