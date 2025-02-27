// app/providers.tsx

import { HeroUIProvider } from "@heroui/react";
import { ToastProvider } from "@heroui/toast";
import { PropsWithChildren } from "react";

export default function Providers({ children }: PropsWithChildren) {
  return (
    <HeroUIProvider>
      {children}
      <ToastProvider maxVisibleToasts={1} />
    </HeroUIProvider>
  );
}
