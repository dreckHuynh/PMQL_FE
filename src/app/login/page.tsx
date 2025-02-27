"use client"; // Mark as a client component

import { FormEvent, useState } from "react";
import { Form, Input } from "@heroui/react";
import { apiRequest } from "@/utils/apiRequest";

export default function LoginPage() {
  const [errors, setErrors] = useState({});

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const req = Object.fromEntries(formData.entries()) as Record<
      string,
      string
    >;
    const validationErrors: Record<string, string> = {};

    // ✅ Field Validation
    if (!req.username?.trim())
      validationErrors.username = "Username is required";
    if (!req.password?.trim())
      validationErrors.password = "Password is required";

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const result = await apiRequest<{ is_first_login: boolean }>({
        url: "/auth/login",
        method: "POST",
        body: req,
        showToast: true,
      });

      if (result.success) {
        if (result.data?.is_first_login) {
          window.location.href = "/update-password";
        } else {
          window.location.href = "/admin/customers";
        }
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
            Sign in to your account
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm space-y-10">
          <Input
            label="Username"
            labelPlacement="outside"
            name="username"
            placeholder="Enter your username"
          />

          <Input
            label="Password"
            labelPlacement="outside"
            name="password"
            type="password"
            placeholder="Enter your password"
          />

          <button
            type="submit"
            className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Sign in
          </button>
        </div>
      </div>
    </Form>
  );
}
