"use client"; // Mark as a client component

import { FormEvent, useState } from "react";
import { Form, Input } from "@heroui/react";
import { apiRequest } from "@/utils/apiRequest";
import { useAuth } from "@/context/AuthContext";
import { Eye, EyeOff } from "lucide-react";

export default function UpdatePasswordPage() {
  const user = useAuth();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isVisible, setIsVisible] = useState(false);
  const [isVisibleConfirm, setIsVisibleConfirm] = useState(false);

  const toggleVisibility = () => setIsVisible(!isVisible);
  const toggleVisibilityConfirm = () => setIsVisibleConfirm(!isVisibleConfirm);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const req = Object.fromEntries(formData.entries()) as Record<
      string,
      string
    >;
    const validationErrors: Record<string, string> = {};

    // ✅ Field Validation
    if (!req.password?.trim())
      validationErrors.password = "Password is required";
    if (!req.confirmPassword?.trim())
      validationErrors.confirmPassword = "Please confirm your password";
    if (req.password !== req.confirmPassword)
      validationErrors.confirmPassword = "Passwords do not match";

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const result = await apiRequest<{ token: string }>({
        url: "/auth/update-password",
        method: "PUT",
        body: { username: user?.username, password: req.password },
        showToast: true,
      });

      if (result.success) {
        window.location.href = "/admin/customers"; // ✅ Redirect after update
      }
    } finally {
      setErrors({ general: "An unexpected error occurred. Please try again." });
    }
  };

  return (
    <Form
      className="w-screen h-screen"
      onSubmit={onSubmit}
      validationErrors={errors}
    >
      <div className="flex w-screen h-screen flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <h2 className="mt-10 text-center text-2xl font-bold tracking-tight text-gray-900">
            Cập nhật mật khẩu
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm space-y-10">
          <Input
            label="Mật khẩu"
            labelPlacement="outside"
            name="password"
            placeholder="Enter your password"
            endContent={
              <button
                aria-label="toggle password visibility"
                className="focus:outline-none"
                type="button"
                onClick={toggleVisibility}
              >
                {isVisible ? (
                  <Eye className="text-2xl text-default-400 pointer-events-none" />
                ) : (
                  <EyeOff className="text-2xl text-default-400 pointer-events-none" />
                )}
              </button>
            }
            type={isVisible ? "text" : "password"}
          />

          <Input
            label="Nhập lại mật khẩu"
            labelPlacement="outside"
            name="confirmPassword"
            placeholder="Re-enter your password"
            endContent={
              <button
                aria-label="toggle password visibility"
                className="focus:outline-none"
                type="button"
                onClick={toggleVisibilityConfirm}
              >
                {isVisibleConfirm ? (
                  <Eye className="text-2xl text-default-400 pointer-events-none" />
                ) : (
                  <EyeOff className="text-2xl text-default-400 pointer-events-none" />
                )}
              </button>
            }
            type={isVisibleConfirm ? "text" : "password"}
          />

          <div>
            <button
              type="submit"
              className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Cập nhật
            </button>
          </div>
        </div>
      </div>
    </Form>
  );
}
