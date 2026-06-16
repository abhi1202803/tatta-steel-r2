"use client";

import { ReactNode } from "react";
import { ThemeProvider } from "@/context/ThemeContext";
import { Toaster } from "sonner";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "rgb(22, 30, 46)",
            border: "1px solid rgb(42, 54, 78)",
            color: "rgb(248, 250, 252)",
            borderRadius: "0.75rem",
            boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
            fontSize: "0.8125rem",
          },
        }}
      />
    </ThemeProvider>
  );
}
