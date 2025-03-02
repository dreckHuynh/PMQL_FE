/* eslint-disable @typescript-eslint/no-explicit-any */
import { addToast } from "@heroui/react";
import Cookies from "js-cookie"; // Import js-cookie

export interface ApiRequestParams<T> {
  url: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: T | null;
  showToast?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  totalPages?: number;
  total?: number;
  error?: string;
  message?: string;
}

// Define error response type
interface ErrorResponse {
  error: string;
}

export const apiRequest = async <R, T = any>({
  url,
  method = "GET",
  body,
  showToast = false,
}: ApiRequestParams<T>): Promise<ApiResponse<R>> => {
  try {
    // Retrieve token from cookies
    const token = Cookies.get("token"); // Make sure the token name matches what’s stored in cookies
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    // If token exists, add it to headers
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const options: RequestInit = {
      method,
      headers,
      ...(body ? { body: JSON.stringify(body) } : {}),
    };

    const response = await fetch(
      process.env.NEXT_PUBLIC_API_URL + url,
      options
    );
    const data: R | ErrorResponse = await response.json();

    if (!response.ok) {
      const errorMessage =
        (data as ErrorResponse).error || "Something went wrong";
      throw new Error(errorMessage);
    }

    if (showToast) {
      addToast({
        title: "Success",
        description: "Request completed successfully",
        color: "success",
      });
    }

    return { success: true, ...(data as R) };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("API Request Error:", errorMessage);

    if (showToast) {
      addToast({
        title: "Error",
        description: errorMessage,
        color: "danger",
      });
    }

    return { success: false, error: errorMessage };
  }
};
