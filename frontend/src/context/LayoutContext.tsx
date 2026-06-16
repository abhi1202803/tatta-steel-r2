"use client";

import { createContext, useContext, useState, useCallback, useLayoutEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { isDashboardPath, removeBootScreen, SPLASH_KEY } from "@/lib/app-loading";

export type LoadingMode = "splash" | "skeleton" | null;

interface SplashConfig {
  minDuration?: number;
  onComplete?: () => void;
}

interface LayoutContextValue {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  loadingMode: LoadingMode;
  setLoadingMode: (mode: LoadingMode) => void;
  splashConfig: SplashConfig;
  setSplashConfig: (config: SplashConfig) => void;
  triggerSplash: () => void;
}

const LayoutContext = createContext<LayoutContextValue | null>(null);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [loadingMode, setLoadingMode] = useState<LoadingMode>(null);
  const [splashConfig, setSplashConfig] = useState<SplashConfig>({});
  const isFirstRender = useRef(true);

  // Trigger splash programmatically
  const triggerSplash = useCallback(() => {
    setLoadingMode("splash");
  }, []);

  // Main loading mode logic
  useLayoutEffect(() => {
    if (!isDashboardPath(pathname)) {
      setLoadingMode(null);
      removeBootScreen();
      return;
    }

    if (isFirstRender.current) {
      // Always show splash on first render (initial load / tab refresh)
      isFirstRender.current = false;
      setLoadingMode("splash");
      return;
    }
  }, [pathname]);

  useLayoutEffect(() => {
    if (loadingMode === null) removeBootScreen();
  }, [loadingMode]);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((c) => !c);
  }, []);

  return (
    <LayoutContext.Provider value={{
      sidebarCollapsed, toggleSidebar, loadingMode, setLoadingMode, splashConfig, setSplashConfig, triggerSplash,
    }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const ctx = useContext(LayoutContext);
  if (!ctx) throw new Error("useLayout must be used within LayoutProvider");
  return ctx;
}
