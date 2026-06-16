"use client";

import { Bell, Search, User, Activity, Settings, Sun, Moon, Wifi, WifiOff, Command } from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";

export default function TopBar() {
  const [search, setSearch] = useState("");
  const { theme, toggleTheme } = useTheme();
  const [isOnline, setIsOnline] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOnline(navigator.onLine);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const timeSinceRefresh = () => {
    const seconds = Math.floor((Date.now() - lastRefreshed.getTime()) / 1000);
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  return (
    <header className="topbar-shell mb-6">
      {/* Search */}
      <div
        className="flex items-center gap-2.5 flex-1 max-w-lg rounded-xl border border-panel-border/70 px-4 py-2.5 focus-within:border-accent/50 focus-within:shadow-[var(--glow-accent)] transition-all group"
        style={{ background: "rgb(var(--panel-hover-rgb)/0.5)" }}
      >
        <Search className="w-3.5 h-3.5 text-steel-400 shrink-0 group-focus-within:text-accent transition-colors" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search equipment, alerts, SOPs..."
          className="flex-1 bg-transparent text-sm focus:outline-none text-steel-50 placeholder:text-steel-500"
          style={{ color: "rgb(var(--steel-50-rgb))" }}
          aria-label="Search"
        />
        <kbd className="hidden sm:flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded bg-panel-hover/80 text-steel-500 font-mono border border-panel-border/40">
          <Command className="w-2.5 h-2.5" />K
        </kbd>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1.5 ml-4">
        {/* Connection status */}
        <div
          className="hidden lg:flex items-center gap-1.5 text-[10px] font-medium px-2 py-1"
          title={isOnline ? "Connected to plant systems" : "Connection lost"}
        >
          {isOnline ? (
            <Wifi className="w-3 h-3 text-risk-low" />
          ) : (
            <WifiOff className="w-3 h-3 text-risk-critical" />
          )}
        </div>

        {/* Pipeline status pill */}
        <div
          className="hidden md:flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border font-medium"
          style={{
            color: "rgb(var(--risk-low-rgb))",
            background: "rgb(var(--risk-low-rgb)/0.08)",
            borderColor: "rgb(var(--risk-low-rgb)/0.2)",
          }}
        >
          <span className="relative flex h-1.5 w-1.5">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ background: "rgb(var(--risk-low-rgb))" }}
            />
            <span
              className="relative inline-flex rounded-full h-1.5 w-1.5"
              style={{ background: "rgb(var(--risk-low-rgb))" }}
            />
          </span>
          <Activity className="w-3 h-3" />
          <span>9-Layer ML Active</span>
        </div>

        {/* Data freshness */}
        <div className="hidden xl:flex items-center gap-1.5 text-[10px] text-steel-500 font-medium px-2">
          <div className="w-1.5 h-1.5 rounded-full bg-risk-low" />
          <span>{timeSinceRefresh()}</span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            id="topbar-notifications"
            onClick={() => setNotifOpen(!notifOpen)}
            className="btn-icon relative"
            aria-label="Notifications"
            aria-expanded={notifOpen}
          >
            <Bell className="w-4 h-4" />
            <span
              className="absolute top-1 right-1 w-2 h-2 rounded-full border border-surface-1"
              style={{ background: "rgb(var(--risk-critical-rgb))" }}
            />
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-panel-border overflow-hidden z-50"
                style={{
                  background: "var(--card-bg)",
                  boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
                }}
              >
                <div className="px-4 py-3 border-b border-panel-border flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-steel-300">Notifications</h3>
                  <span className="badge-critical text-[9px]">3 New</span>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {[
                    { title: "Critical: Compressor vibration threshold exceeded", time: "2m ago", severity: "critical" },
                    { title: "Predictive model retrained successfully", time: "15m ago", severity: "low" },
                    { title: "Scheduled maintenance due for Boiler #3", time: "1h ago", severity: "medium" },
                  ].map((n, i) => (
                    <div key={i} className="px-4 py-3 border-b border-panel-border/40 hover:bg-panel-hover/50 cursor-pointer transition-colors">
                      <div className="flex items-start gap-2.5">
                        <div className={`badge-dot mt-1.5 badge-dot-${n.severity === "critical" ? "critical" : n.severity === "medium" ? "medium" : "low"} ${n.severity === "critical" ? "badge-dot-pulse" : ""}`} />
                        <div>
                          <p className="text-xs text-steel-100 leading-relaxed">{n.title}</p>
                          <p className="text-[10px] text-steel-500 mt-1">{n.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2.5 text-center">
                  <button className="text-xs font-medium text-accent hover:text-accent-light transition-colors">
                    View all notifications
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Settings */}
        <button type="button" className="btn-icon" aria-label="Settings">
          <Settings className="w-4 h-4" />
        </button>

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          className="btn-icon relative overflow-hidden"
          style={{
            background: theme === "dark" ? "rgb(var(--risk-medium-rgb)/0.1)" : "rgb(var(--accent-rgb)/0.08)",
          }}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={theme}
              initial={{ y: 12, opacity: 0, rotate: -90 }}
              animate={{ y: 0, opacity: 1, rotate: 0 }}
              exit={{ y: -12, opacity: 0, rotate: 90 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-center"
            >
              {theme === "dark"
                ? <Sun className="w-4 h-4 text-amber-400" />
                : <Moon className="w-4 h-4 text-accent" />
              }
            </motion.span>
          </AnimatePresence>
        </button>

        {/* Divider */}
        <div className="w-px h-6 mx-1 bg-panel-border/60" />

        {/* User */}
        <div className="flex items-center gap-2.5 cursor-pointer rounded-xl px-2 py-1 hover:bg-panel-hover/50 transition-colors">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center border border-accent/25 relative"
            style={{ background: "rgb(var(--accent-rgb)/0.12)" }}
          >
            <User className="w-4 h-4 text-accent-light" />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 connection-dot-online connection-dot" />
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold leading-none text-steel-50">Reliability Engineer</p>
            <p className="text-[10px] text-steel-400 mt-0.5">Plant A – Steel Ops</p>
          </div>
        </div>
      </div>
    </header>
  );
}
