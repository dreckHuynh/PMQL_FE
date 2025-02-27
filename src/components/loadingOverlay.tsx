"use client";

import { useLoading } from "@/context/LoadingContext";
import { Loader2 } from "lucide-react";

const LoadingOverlay = () => {
  const { loading } = useLoading();

  if (!loading) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
      <div className="flex flex-col items-center">
        <Loader2 className="animate-spin text-white w-12 h-12" />
        <p className="text-white mt-2 text-lg">Loading...</p>
      </div>
    </div>
  );
};

export default LoadingOverlay;
