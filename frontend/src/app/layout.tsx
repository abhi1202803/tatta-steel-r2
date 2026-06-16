import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Tata Steel – Agentic Maintenance AI",
  description: "Enterprise predictive maintenance platform with multi-agent orchestration",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="app-booting" data-theme="light">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');document.documentElement.setAttribute('data-theme',t||'light');var p=location.pathname;if(p!=='/'&&p!=='/dashboard'){document.documentElement.classList.remove('app-booting');}}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <div id="app-boot-screen" aria-hidden="true" />
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
