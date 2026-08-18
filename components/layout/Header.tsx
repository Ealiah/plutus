"use client";
import { LogOut, Menu } from "lucide-react";
import { useStore } from "@/lib/store";
import { formatMonth } from "@/lib/utils";
import { TAB_LABELS, type TabId } from "@/lib/permissions";

const TAB_TITLES: Record<string, string> = {
  ...TAB_LABELS,
  details: "Client Details",
  heads: "Account Heads",
  percentages: "Revenue Percentages",
};

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const activeTab = useStore((s) => s.activeTab);
  const currentMonth = useStore((s) => s.currentMonth);
  const currentUser = useStore((s) => s.currentUser);
  const logout = useStore((s) => s.logout);
  const addToast = useStore((s) => s.addToast);

  async function handleLogout() {
    await logout();
    addToast("Signed out.", "info");
  }

  const title = TAB_TITLES[activeTab as TabId] || "Dashboard";

  return (
    <header className="flex items-center justify-between gap-2 px-3 sm:px-6 py-3 sm:py-4 flex-shrink-0 border-b border-white/5">
      <div className="flex items-center gap-2 min-w-0">
        {onMenuClick && (
          <button
            type="button"
            aria-label="Open navigation"
            onClick={onMenuClick}
            className="md:hidden -ml-1 w-11 h-11 flex items-center justify-center rounded-xl text-white/55 hover:bg-white/6 hover:text-white/90 transition-colors"
          >
            <Menu size={18} aria-hidden="true" />
          </button>
        )}
        <div className="min-w-0">
          <h1 className="text-base sm:text-xl font-bold text-white/95 tracking-tight truncate">
            {title}
          </h1>
          <p className="text-[11px] sm:text-xs text-white/35 mt-0.5">{formatMonth(currentMonth)}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {currentUser && (
          <div className="hidden sm:flex flex-col items-end leading-tight">
            <span className="text-xs font-medium text-white/80">{currentUser.username}</span>
            <span className="text-[10px] text-white/35 uppercase tracking-wider">
              {currentUser.roleName}
            </span>
          </div>
        )}

        <button
          aria-label="Sign out"
          onClick={handleLogout}
          className="w-11 h-11 flex items-center justify-center rounded-xl glass hover:bg-red-500/15 text-white/45 hover:text-red-400 transition-colors duration-150"
        >
          <LogOut size={16} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
