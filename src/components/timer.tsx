"use client";

import { useEffect, useState } from "react";

export default function CurrentTime() {
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setDateTime(new Date());
    }, 1000);

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  return (
    <div className="flex flex-col items-center justify-center text-lg font-semibold text-gray-800">
      <p>
        {dateTime.toLocaleDateString("vi-VN", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>
      <p>🕒 {dateTime.toLocaleTimeString("vi-VN")}</p>
    </div>
  );
}
