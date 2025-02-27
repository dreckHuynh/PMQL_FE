/* eslint-disable @typescript-eslint/no-explicit-any */
import { addToast } from "@heroui/react";

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
    const options: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
      },
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
