"use client";

import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/layout/TopBar";
import FullPageLoader from "@/components/layout/FullPageLoader";
import { LayoutProvider, useLayout } from "@/context/LayoutContext";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

function ShellInner({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useLayout();

  return (
    <div
      className={clsx(
        "app-layout",
        sidebarCollapsed ? "sidebar-collapsed" : "sidebar-expanded",
      )}
      data-sidebar-collapsed={sidebarCollapsed}
    >
      <Sidebar />
      <div className="main-shell">
        <TopBar />
        <main className="main-scroll" role="main" aria-label="Main content">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
      <FullPageLoader />
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <LayoutProvider>
      <ShellInner>{children}</ShellInner>
    </LayoutProvider>
  );
}
