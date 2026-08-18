"use client";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Table2,
  Users,
  Receipt,
  UserCircle,
  Percent,
  ImageIcon,
  Shield,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { useState } from "react";
import { formatMonth } from "@/lib/utils";
import { cn } from "@/lib/cn";
import type { TabId } from "@/lib/permissions";

const ALL_TABS: Array<{ id: TabId; label: string; icon: typeof LayoutDashboard }> = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "details", label: "Details", icon: Table2 },
  { id: "salaries", label: "Salaries", icon: Users },
  { id: "expenses", label: "Expenses", icon: Receipt },
  { id: "heads", label: "Heads", icon: UserCircle },
  { id: "percentages", label: "Percentages", icon: Percent },
  { id: "gallery", label: "Gallery", icon: ImageIcon },
  { id: "users", label: "Users", icon: Shield },
];

const SPRING = { type: "spring" as const, stiffness: 400, damping: 35 };

function shiftMonth(monthKey: string, delta: number): string {
  const [year, month] = monthKey.split("-").map(Number);
  const d = new Date(year, month - 1 + delta);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

interface SidebarProps {
  drawer?: boolean;
  onClose?: () => void;
}

export function Sidebar({ drawer = false, onClose }: SidebarProps) {
  const activeTab = useStore((s) => s.activeTab);
  const setActiveTab = useStore((s) => s.setActiveTab);
  const currentMonth = useStore((s) => s.currentMonth);
  const setCurrentMonth = useStore((s) => s.setCurrentMonth);
  const currentUser = useStore((s) => s.currentUser);
  const [collapsed, setCollapsed] = useState(false);

  const allowed = new Set<string>(currentUser?.allowedTabs ?? []);
  const visibleTabs = ALL_TABS.filter((t) => allowed.has(t.id));

  const FINANCE_TABS = new Set([
    "overview",
    "details",
    "salaries",
    "expenses",
    "heads",
    "percentages",
  ]);
  const hasFinance = visibleTabs.some((t) => FINANCE_TABS.has(t.id));

  // In drawer mode (mobile): always full width, never collapse
  const showLabels = drawer || !collapsed;
  const width = drawer ? "100%" : (collapsed ? 72 : 220);

  return (
    <motion.aside
      animate={drawer ? undefined : { width }}
      transition={SPRING}
      style={drawer ? { width: "100%" } : undefined}
      aria-label="Main navigation"
      className="h-full w-full flex-shrink-0 glass-strong rounded-2xl flex flex-col relative overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px opacity-60"
        style={{ background: "linear-gradient(90deg, transparent, rgba(212,160,23,0.5), transparent)" }}
      />

      <div className="px-4 pt-6 pb-5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div aria-hidden="true" className="w-9 h-9 flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Plutus logo" width={36} height={36} className="w-full h-full object-cover" />
          </div>
          <AnimatePresence>
            {showLabels && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              >
                <p className="text-sm font-bold text-white/95 leading-none">Plutus</p>
                <p className="text-[10px] text-[#d4a017] font-medium mt-0.5 tracking-wide">Finance OS</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {drawer && onClose && (
          <button
            type="button"
            aria-label="Close navigation"
            onClick={onClose}
            className="-mr-1 w-11 h-11 flex items-center justify-center rounded-xl text-white/45 hover:bg-white/8 hover:text-white/80 transition-colors"
          >
            <X size={18} aria-hidden="true" />
          </button>
        )}
      </div>

      {hasFinance && (
        <AnimatePresence>
          {showLabels && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="px-3 py-3"
            >
              <div className="glass-gold rounded-xl px-3 py-2">
                <p className="text-[10px] text-white/40 uppercase tracking-wider font-medium mb-1.5">Current Month</p>
                <div className="flex items-center justify-between gap-1">
                  <button
                    onClick={() => setCurrentMonth(shiftMonth(currentMonth, -1))}
                    aria-label="Previous month"
                    className="w-9 h-9 flex items-center justify-center rounded-md text-white/35 hover:text-[#d4a017] transition-colors duration-150"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <p className="text-xs text-[#d4a017] font-semibold text-center flex-1">{formatMonth(currentMonth)}</p>
                  <button
                    onClick={() => setCurrentMonth(shiftMonth(currentMonth, 1))}
                    aria-label="Next month"
                    className="w-9 h-9 flex items-center justify-center rounded-md text-white/35 hover:text-[#d4a017] transition-colors duration-150"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      <nav aria-label="Sections" className="flex-1 px-2 py-2 flex flex-col gap-0.5 overflow-y-auto">
        {visibleTabs.map((tab, i) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <motion.button
              key={tab.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => setActiveTab(tab.id)}
              aria-label={showLabels ? undefined : tab.label}
              aria-current={active ? "page" : undefined}
              className={cn(
                "w-full min-h-[44px] flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors duration-150 text-left relative group",
                active
                  ? "text-black font-semibold"
                  : "text-white/55 hover:text-white/90 hover:bg-white/5"
              )}
            >
              {active && (
                <motion.div
                  layoutId="active-tab"
                  aria-hidden="true"
                  className="absolute inset-0 rounded-xl"
                  style={{
                    background: "linear-gradient(135deg, #d4a017 0%, #b8860b 100%)",
                    boxShadow: "0 4px 15px rgba(212,160,23,0.35)",
                  }}
                  transition={SPRING}
                />
              )}
              <Icon
                size={18}
                aria-hidden="true"
                className={cn("relative z-10 flex-shrink-0", active ? "text-black" : "")}
              />
              <AnimatePresence>
                {showLabels && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.12 }}
                    className="relative z-10 text-sm whitespace-nowrap"
                  >
                    {tab.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </nav>

      {!drawer && (
        <div className="px-2 pb-4 border-t border-white/10 pt-3">
          <button
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="w-full flex items-center justify-center py-2 rounded-xl hover:bg-white/6 text-white/30 hover:text-white/60 transition-colors duration-150"
          >
            {collapsed
              ? <ChevronRight size={16} aria-hidden="true" />
              : <ChevronLeft size={16} aria-hidden="true" />
            }
          </button>
        </div>
      )}
    </motion.aside>
  );
}
