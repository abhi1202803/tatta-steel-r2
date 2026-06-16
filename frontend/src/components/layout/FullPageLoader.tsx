"use client";

import { useLayoutEffect } from "react";
import AppSplash from "@/components/layout/AppSplash";
import { useLayout } from "@/context/LayoutContext";
import { removeBootScreen } from "@/lib/app-loading";

/**
 * FullPageLoader — renders the introductory splash animation on:
 * 1. First app visit
 * 2. When user clicks refresh button on dashboard
 * All other page-level loading is handled by inline skeleton components 
 * inside each page so that the Sidebar and Topbar remain fully visible and 
 * interactive at all times.
 */
export default function FullPageLoader() {
  const { loadingMode, splashConfig, setLoadingMode } = useLayout();

  useLayoutEffect(() => {
    if (loadingMode !== "splash") removeBootScreen();
  }, [loadingMode]);

  // Only "splash" mode renders anything here.
  // "skeleton" mode is obsolete — pages have their own inline skeletons.
  if (loadingMode !== "splash") return null;

  const handleSplashComplete = () => {
    splashConfig.onComplete?.();
    setLoadingMode(null);
  };

  return (
    <div className="full-page-loader" aria-live="polite" aria-busy="true">
      <AppSplash
        onComplete={handleSplashComplete}
        minDuration={splashConfig.minDuration ?? 2400}
      />
    </div>
  );
}
