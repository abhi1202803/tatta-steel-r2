"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, MessageSquare, Cpu, Activity, GitBranch, Bell,
  Calendar, Package, BookOpen, FileText, ThumbsUp, Shield, Wrench,
  ChevronRight, Upload, BookMarked, Download, Settings, CalendarDays,
  PanelLeftClose, PanelLeftOpen, Zap, Search,
} from "lucide-react";
import clsx from "clsx";
import { useLayout } from "@/context/LayoutContext";
import { motion, AnimatePresence } from "framer-motion";

const NAV = [
  { section: "Overview" },
  { href: "/dashboard",            label: "Executive Dashboard",    icon: LayoutDashboard },
  { href: "/command-center",        label: "Command Center",         icon: Zap },
  { href: "/input-center",         label: "Input Center",           icon: Upload },
  { href: "/alerts",               label: "Alert Command Center",   icon: Bell },
  { section: "Intelligence" },
  { href: "/copilot",              label: "AI Maintenance Copilot", icon: MessageSquare },
  { href: "/equipment",            label: "Equipment Center",       icon: Cpu },
  { href: "/predictive",           label: "Predictive Maintenance", icon: Activity },
  { href: "/rca",                  label: "Root Cause Analysis",    icon: GitBranch },
  { section: "Operations" },
  { href: "/planner",              label: "Maintenance Planner",    icon: Calendar },
  { href: "/maintenance-calendar", label: "Maintenance Calendar",   icon: CalendarDays },
  { href: "/inventory",            label: "Inventory & Procurement",icon: Package },
  { href: "/knowledge",            label: "Knowledge Center",       icon: BookOpen },
  { href: "/logbook",              label: "Maintenance Logbook",    icon: BookMarked },
  { section: "Governance" },
  { href: "/reports",              label: "Reports Center",         icon: FileText },
  { href: "/feedback",             label: "Feedback Center",        icon: ThumbsUp },
  { href: "/equipment-management", label: "Equipment Management",   icon: Settings },
  { href: "/export",               label: "Export Hub",             icon: Download },
  { href: "/admin",                label: "Admin Dashboard",        icon: Shield },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard" || pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useLayout();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredNav = searchQuery
    ? NAV.filter(item => !("section" in item) && item.label!.toLowerCase().includes(searchQuery.toLowerCase()))
    : NAV;

  return (
    <aside
      className={clsx("sidebar-shell", sidebarCollapsed && "sidebar-collapsed")}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div className={clsx("sidebar-header", sidebarCollapsed && "sidebar-header-collapsed")}>
        <div className={clsx("flex items-center", sidebarCollapsed ? "justify-center" : "gap-3")}>
          <div
            className="sidebar-logo shrink-0"
            title="Tata Steel – Agentic Maintenance AI"
          >
            <Wrench className="w-5 h-5 text-accent" />
          </div>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div
                className="min-w-0"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
              >
                <h2 className="font-bold text-sm leading-tight tracking-tight text-steel-50 truncate">Tata Steel</h2>
                <p className="text-[9px] text-accent-light uppercase tracking-[0.2em] mt-0.5 font-medium truncate">Agentic Maintenance AI</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
            >
              <div className="flex items-center gap-2 mt-4 px-1">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "rgb(var(--risk-low-rgb))" }} />
                  <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "rgb(var(--risk-low-rgb))" }} />
                </span>
                <span className="text-[10px] text-steel-400 font-medium">Systems Online · Plant A</span>
              </div>

              {/* Quick search */}
              <div className="mt-3 relative">
                <button
                  onClick={() => setSearchOpen(!searchOpen)}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[11px] text-steel-400 border border-panel-border/50 hover:border-panel-border hover:bg-panel-hover/50 transition-all"
                  aria-label="Search navigation"
                >
                  <Search className="w-3 h-3" />
                  <span>Quick search...</span>
                  <kbd className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-panel-hover/80 text-steel-500 font-mono border border-panel-border/40">/</kbd>
                </button>
                <AnimatePresence>
                  {searchOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="absolute inset-x-0 top-0 z-10"
                    >
                      <input
                        autoFocus
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onBlur={() => { if (!searchQuery) setSearchOpen(false); }}
                        placeholder="Search pages..."
                        className="w-full px-2.5 py-2 rounded-lg text-[11px] border border-accent/50 bg-surface-1 outline-none focus:shadow-[var(--glow-accent)]"
                        style={{ color: "rgb(var(--steel-50-rgb))" }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className={clsx("sidebar-nav flex-1 overflow-y-auto", sidebarCollapsed ? "px-1.5 py-2" : "px-2 py-2")}>
        {filteredNav.map((item, i) =>
          "section" in item ? (
            sidebarCollapsed ? (
              <div key={i} className="sidebar-divider my-2" />
            ) : (
              <p key={i} className="nav-section">{item.section}</p>
            )
          ) : (
            <div
              key={item.href}
              className="relative"
              onMouseEnter={() => setHoveredItem(item.href!)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <Link
                href={item.href!}
                title={sidebarCollapsed ? item.label : undefined}
                className={clsx(
                  "sidebar-link group",
                  sidebarCollapsed && "sidebar-link-collapsed",
                  isActive(pathname, item.href!)
                    ? "sidebar-link-active"
                    : "sidebar-link-inactive"
                )}
                aria-current={isActive(pathname, item.href!) ? "page" : undefined}
              >
                <item.icon className={clsx(
                  "sidebar-link-icon",
                  isActive(pathname, item.href!) ? "text-accent-light" : "text-steel-400 group-hover:text-steel-200"
                )} />
                <AnimatePresence>
                  {!sidebarCollapsed && (
                    <motion.span
                      className="flex-1 leading-none truncate"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.1 }}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {!sidebarCollapsed && isActive(pathname, item.href!) && (
                  <ChevronRight className="w-3 h-3 text-accent/60 shrink-0" />
                )}
              </Link>

              {/* Tooltip for collapsed sidebar */}
              <AnimatePresence>
                {sidebarCollapsed && hoveredItem === item.href && (
                  <motion.div
                    className="sidebar-tooltip"
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -4 }}
                    transition={{ duration: 0.1 }}
                  >
                    {item.label}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        )}
      </nav>

      {/* Footer & collapse toggle */}
      <div className={clsx("sidebar-footer", sidebarCollapsed && "sidebar-footer-collapsed")}>
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
            >
              <div className="text-[10px] text-steel-500 leading-relaxed mb-3">
                <p className="text-steel-400 font-semibold">Industrial Agentic AI v1.0</p>
                <p className="mt-0.5">Multi-Agent Orchestration · 9-Layer ML</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          type="button"
          onClick={toggleSidebar}
          className="sidebar-toggle"
          title={sidebarCollapsed ? "Expand sidebar" : "Minimize sidebar"}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Minimize sidebar"}
        >
          {sidebarCollapsed
            ? <PanelLeftOpen className="w-4 h-4" />
            : <PanelLeftClose className="w-4 h-4" />}
          {!sidebarCollapsed && <span>Minimize</span>}
        </button>
      </div>
    </aside>
  );
}
