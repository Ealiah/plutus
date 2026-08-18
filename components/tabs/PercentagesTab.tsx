"use client";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useStore } from "@/lib/store";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { formatIQD, getDepartmentRevenue } from "@/lib/utils";
import { DEPARTMENTS } from "@/lib/types";

const DEPT_COLORS: Record<string, string> = {
  Designing: "#d4a017",
  Photographer: "#3b82f6",
  "Video Editing": "#10b981",
  Copywriting: "#8b5cf6",
  Coordinator: "#f59e0b",
  Marketing: "#ef4444",
  Posting: "#06b6d4",
};

export function PercentagesTab() {
  const { clients, percentages, setClientPercentage, addToast } = useStore();
  const [expanded, setExpanded] = useState<string | null>(clients[0]?.id || null);
  const [drafts, setDrafts] = useState<Record<string, Record<string, number>>>({});

  function getDraft(clientId: string): Record<string, number> {
    if (drafts[clientId]) return drafts[clientId];
    const existing = percentages.find((p) => p.clientId === clientId);
    if (existing) return { ...existing.percentages };
    return Object.fromEntries(DEPARTMENTS.map((d) => [d, 0]));
  }

  function setDraftValue(clientId: string, dept: string, value: number) {
    setDrafts((prev) => ({
      ...prev,
      [clientId]: { ...getDraft(clientId), [dept]: value },
    }));
  }

  function getTotal(clientId: string): number {
    const d = getDraft(clientId);
    return Object.values(d).reduce((s, v) => s + (v || 0), 0);
  }

  function handleSave(clientId: string) {
    const draft = getDraft(clientId);
    const total = getTotal(clientId);
    if (Math.abs(total - 100) > 0.01) {
      addToast(`Total must equal 100% (currently ${total}%)`, "error");
      return;
    }
    setClientPercentage(clientId, draft);
    setDrafts((prev) => { const n = { ...prev }; delete n[clientId]; return n; });
    addToast("Percentages saved", "success");
  }

  const DEFAULT_PCTS = [25, 20, 25, 5, 5, 15, 5];

  function applyDefault(clientId: string) {
    const preset = Object.fromEntries(DEPARTMENTS.map((d, i) => [d, DEFAULT_PCTS[i]]));
    setDrafts((prev) => ({ ...prev, [clientId]: preset }));
  }

  const { deptSummary, totalRevenue } = useMemo(() => {
    const deptSummary = DEPARTMENTS.map((d) => ({
      dept: d,
      revenue: getDepartmentRevenue(clients, percentages, d),
      color: DEPT_COLORS[d],
    }));
    return { deptSummary, totalRevenue: deptSummary.reduce((s, d) => s + d.revenue, 0) };
  }, [clients, percentages]);

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto pr-1 pb-6">
      {/* Department summary */}
      <GlassCard className="p-5">
        <p className="text-sm font-semibold text-white/85 mb-4">Department Revenue Summary</p>
        <div className="flex flex-col gap-2.5">
          {deptSummary.map((d, i) => {
            const pct = totalRevenue > 0 ? (d.revenue / totalRevenue) * 100 : 0;
            return (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-white/55 w-28 flex-shrink-0">{d.dept}</span>
                <div className="flex-1 h-1.5 rounded-full bg-white/6 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ delay: i * 0.06, type: "spring", stiffness: 200, damping: 25 }}
                    className="h-full rounded-full"
                    style={{ background: d.color }}
                  />
                </div>
                <span className="text-xs font-mono text-white/70 w-24 text-right">{formatIQD(d.revenue)}</span>
                <span className="text-xs text-white/35 w-10 text-right">{pct.toFixed(0)}%</span>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Per-client percentage editors */}
      <p className="text-xs text-white/40 uppercase tracking-wider px-1">Client Revenue Distribution</p>

      {clients.length === 0 && (
        <GlassCard className="p-10 text-center">
          <p className="text-sm text-white/25">Add clients in the Details tab first</p>
        </GlassCard>
      )}

      {clients.map((client, ci) => {
        const draft = getDraft(client.id);
        const total = getTotal(client.id);
        const isValid = Math.abs(total - 100) < 0.01;
        const isOpen = expanded === client.id;
        const isDirty = !!drafts[client.id];

        return (
          <motion.div
            key={client.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: ci * 0.05 }}
          >
            <GlassCard className="overflow-hidden">
              {/* Header */}
              <button
                className="w-full flex items-center gap-3 px-5 py-4 hover:bg-white/3 transition-colors text-left"
                onClick={() => setExpanded(isOpen ? null : client.id)}
              >
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white/90">{client.name}</p>
                  <p className="text-xs text-white/40 mt-0.5">
                    {formatIQD(client.actualIncome)} actual · {formatIQD(client.expectedIncome)} expected
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {isValid ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-400">
                      <CheckCircle size={13} /> 100%
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-amber-400">
                      <AlertCircle size={13} /> {total}%
                    </span>
                  )}
                  {isDirty && <span className="text-[10px] text-[#d4a017] px-2 py-0.5 rounded-full bg-[rgba(212,160,23,0.1)]">Unsaved</span>}
                  {isOpen ? <ChevronUp size={15} className="text-white/30" /> : <ChevronDown size={15} className="text-white/30" />}
                </div>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                    className="overflow-hidden border-t border-white/6"
                  >
                    <div className="p-5 flex flex-col gap-3">
                      {DEPARTMENTS.map((dept) => {
                        const val = draft[dept] || 0;
                        const deptRevenue = (client.actualIncome * val) / 100;
                        const color = DEPT_COLORS[dept];
                        return (
                          <div key={dept} className="flex items-center gap-4">
                            <div className="flex items-center gap-2 w-36 flex-shrink-0">
                              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                              <span className="text-xs text-white/65">{dept}</span>
                            </div>
                            <div className="flex-1 flex items-center gap-3">
                              <input
                                type="range"
                                min={0}
                                max={100}
                                step={1}
                                value={val}
                                onChange={(e) => setDraftValue(client.id, dept, +e.target.value)}
                                className="flex-1 h-1.5 rounded-full cursor-pointer appearance-none"
                                style={{
                                  background: `linear-gradient(to right, ${color} ${val}%, rgba(255,255,255,0.08) ${val}%)`,
                                  accentColor: color,
                                }}
                              />
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={val}
                                onChange={(e) => setDraftValue(client.id, dept, +e.target.value)}
                                className="w-14 text-center py-1 rounded-lg text-xs font-bold border border-white/10 focus:border-[rgba(212,160,23,0.4)] transition-colors"
                                style={{ background: "rgba(255,255,255,0.04)", color }}
                              />
                              <span className="text-[10px] text-white/30 w-24 text-right font-mono">{formatIQD(deptRevenue)}</span>
                            </div>
                          </div>
                        );
                      })}

                      {/* Total indicator */}
                      <div
                        className="flex items-center justify-between px-4 py-2.5 rounded-xl mt-2"
                        style={{
                          background: isValid
                            ? "rgba(16,185,129,0.08)"
                            : "rgba(245,158,11,0.08)",
                          border: `1px solid ${isValid ? "rgba(16,185,129,0.2)" : "rgba(245,158,11,0.25)"}`,
                        }}
                      >
                        <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: isValid ? "#34d399" : "#fbbf24" }}>
                          {isValid
                            ? <><CheckCircle size={12} /> Valid distribution</>
                            : <><AlertCircle size={12} /> Total: {total}% — must equal 100%</>
                          }
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => applyDefault(client.id)}
                            className="text-xs text-white/40 hover:text-white/70 transition-colors"
                          >
                            Default
                          </button>
                          <Button
                            size="sm"
                            variant={isValid ? "gold" : "glass"}
                            onClick={() => handleSave(client.id)}
                            disabled={!isValid}
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>
          </motion.div>
        );
      })}
    </div>
  );
}
