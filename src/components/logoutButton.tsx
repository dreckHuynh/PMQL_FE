"use client";

import { Button } from "@heroui/react";
import { apiRequest } from "@/utils/apiRequest";

export default function LogoutButton() {
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
    <Button color="default" variant="ghost" onPress={handleLogout}>
      Logout
    </Button>
  );
}
