"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/lib/store";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { ToastContainer } from "@/components/ui/Toast";
import { OverviewTab } from "@/components/tabs/OverviewTab";
import { DetailsTab } from "@/components/tabs/DetailsTab";
import { SalariesTab } from "@/components/tabs/SalariesTab";
import { ExpensesTab } from "@/components/tabs/ExpensesTab";
import { HeadsTab } from "@/components/tabs/HeadsTab";
import { PercentagesTab } from "@/components/tabs/PercentagesTab";
import { UsersTab } from "@/components/tabs/UsersTab";
import { GalleryTab } from "@/components/tabs/GalleryTab";
import { ShieldOff } from "lucide-react";

const TABS: Record<string, React.ComponentType> = {
  overview: OverviewTab,
  details: DetailsTab,
  salaries: SalariesTab,
  expenses: ExpensesTab,
  heads: HeadsTab,
  percentages: PercentagesTab,
  gallery: GalleryTab,
  users: UsersTab,
};

export function Dashboard() {
  const activeTab = useStore((s) => s.activeTab);
  const setActiveTab = useStore((s) => s.setActiveTab);
  const currentUser = useStore((s) => s.currentUser);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const allowed = new Set<string>(currentUser?.allowedTabs ?? []);
  const isAllowed = allowed.has(activeTab);
  const TabComponent = isAllowed ? TABS[activeTab] || OverviewTab : null;

  useEffect(() => {
    if (!currentUser) return;
    if (!allowed.has(activeTab) && currentUser.allowedTabs.length > 0) {
      setActiveTab(currentUser.allowedTabs[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, activeTab]);

  // Close drawer when tab changes
  useEffect(() => {
    setDrawerOpen(false);
  }, [activeTab]);

  return (
    <div
      className="min-h-[100dvh] md:h-[100dvh] flex flex-col md:flex-row md:overflow-hidden"
      style={{ background: "var(--navy)" }}
    >
      <div
        aria-hidden="true"
        className="fixed top-[-200px] left-[-100px] w-[500px] h-[500px] rounded-full pointer-events-none z-0 opacity-30"
        style={{ background: "radial-gradient(circle, rgba(212,160,23,0.12) 0%, transparent 70%)", filter: "blur(60px)" }}
      />
      <div
        aria-hidden="true"
        className="fixed bottom-[-150px] right-[-50px] w-[400px] h-[400px] rounded-full pointer-events-none z-0 opacity-20"
        style={{ background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)", filter: "blur(80px)" }}
      />

      <div className="relative z-10 flex flex-1 w-full md:h-full p-2 sm:p-3 gap-2 sm:gap-3 min-h-0">
        {/* Desktop sidebar — inline */}
        <div className="hidden md:flex">
          <Sidebar />
        </div>

        {/* Mobile drawer — overlay */}
        <AnimatePresence>
          {drawerOpen && (
            <>
              <motion.div
                className="md:hidden fixed inset-0 z-40 bg-black/55"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                onClick={() => setDrawerOpen(false)}
                aria-hidden="true"
              />
              <motion.div
                className="md:hidden fixed inset-y-0 left-0 z-50 w-[260px] max-w-[80vw] p-2"
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", stiffness: 420, damping: 38 }}
                role="dialog"
                aria-label="Navigation"
              >
                <Sidebar drawer onClose={() => setDrawerOpen(false)} />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <div className="flex-1 flex flex-col min-w-0 md:overflow-hidden">
          <div
            className="flex-1 flex flex-col rounded-2xl md:overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.025)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.07)",
              boxShadow: "0 0 40px rgba(0,0,0,0.25)",
            }}
          >
            <Header onMenuClick={() => setDrawerOpen(true)} />
            <main
              className="flex-1 md:overflow-hidden p-4 sm:p-5"
              aria-label="Content area"
            >
              <AnimatePresence mode="wait">
                {TabComponent ? (
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full"
                  >
                    <TabComponent />
                  </motion.div>
                ) : (
                  <motion.div
                    key="forbidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full flex flex-col items-center justify-center text-center px-6"
                  >
                    <ShieldOff size={36} className="text-white/20 mb-3" />
                    <p className="text-sm text-white/40">You don&apos;t have access to this section.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </main>
          </div>
        </div>
      </div>

      <ToastContainer />
    </div>
  );
}
