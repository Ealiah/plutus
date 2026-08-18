"use client";
import React, { useMemo } from "react";
import { motion } from "framer-motion";
import type { TooltipProps } from "@/lib/chart-types";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertCircle,
  Star,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useStore } from "@/lib/store";
import { useShallow } from "zustand/shallow";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  getTotalExpectedIncome,
  getTotalActualIncome,
  getRecurringCosts,
  getNetDistributable,
  getOutstanding,
  getDepartmentRevenue,
  getHeadSectionNet,
  formatIQD,
} from "@/lib/utils";
import { DEPARTMENTS } from "@/lib/types";

const DEPT_COLORS = [
  "#d4a017", "#3b82f6", "#10b981", "#8b5cf6",
  "#f59e0b", "#ef4444", "#06b6d4",
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, type: "spring" as const, stiffness: 300, damping: 28 },
  }),
};

const KPICard = React.memo(function KPICard({
  label,
  value,
  sub,
  icon: Icon,
  gold,
  negative,
  index,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  gold?: boolean;
  negative?: boolean;
  index: number;
}) {
  return (
    <motion.div
      custom={index}
      variants={fadeUp}
      initial="hidden"
      animate="show"
    >
      <GlassCard
        variant={gold ? "gold" : "default"}
        glow={gold}
        className="p-5"
      >
        <div className="flex items-start justify-between mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: gold
                ? "rgba(212,160,23,0.15)"
                : negative
                ? "rgba(239,68,68,0.12)"
                : "rgba(255,255,255,0.06)",
            }}
          >
            <Icon
              size={18}
              style={{ color: gold ? "#d4a017" : negative ? "#f87171" : "rgba(255,255,255,0.6)" }}
            />
          </div>
          {sub && (
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{
                background: negative ? "rgba(239,68,68,0.12)" : "rgba(16,185,129,0.12)",
                color: negative ? "#f87171" : "#34d399",
              }}
            >
              {sub}
            </span>
          )}
        </div>
        <p className="text-xs text-white/40 uppercase tracking-wider font-medium mb-1">{label}</p>
        <p
          className="text-2xl font-bold tracking-tight"
          style={{ color: gold ? "#d4a017" : negative ? "#f87171" : "rgba(255,255,255,0.95)" }}
        >
          {value}
        </p>
      </GlassCard>
    </motion.div>
  );
});

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong rounded-xl px-4 py-3 text-sm shadow-xl">
      <p className="text-white/50 text-xs mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-white/70 text-xs">{p.name}:</span>
          <span className="text-white font-semibold text-xs">{formatIQD(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export function OverviewTab() {
  const { clients, employees, expenses, heads, percentages, sectionHeads, monthlyData, currentMonth } = useStore(
    useShallow((s) => ({
      clients: s.clients,
      employees: s.employees,
      expenses: s.expenses,
      heads: s.heads,
      percentages: s.percentages,
      sectionHeads: s.sectionHeads,
      monthlyData: s.monthlyData,
      currentMonth: s.currentMonth,
    }))
  );

  const totalExpected = useMemo(() => getTotalExpectedIncome(clients), [clients]);
  const totalActual = useMemo(() => getTotalActualIncome(clients), [clients]);
  const recurringCosts = useMemo(() => getRecurringCosts(expenses, employees), [expenses, employees]);
  const netDistributable = useMemo(() => getNetDistributable(clients, expenses, employees), [clients, expenses, employees]);
  const outstanding = useMemo(() => getOutstanding(clients), [clients]);

  const deptData = useMemo(() =>
    DEPARTMENTS.map((d, i) => ({
      name: d,
      revenue: getDepartmentRevenue(clients, percentages, d),
      color: DEPT_COLORS[i],
    })).sort((a, b) => b.revenue - a.revenue),
    [clients, percentages]
  );

  const headData = useMemo(() =>
    heads.map((h) => ({
      name: h.name,
      net: getHeadSectionNet(h.id, clients, sectionHeads, percentages, expenses, employees),
    })),
    [heads, clients, sectionHeads, percentages, expenses, employees]
  );

  const revenueVsExpenses = useMemo(() => {
    const pastMonths = Object.keys(monthlyData)
      .filter((m) => m !== currentMonth)
      .sort()
      .slice(-5);
    const points = pastMonths.map((m) => {
      const d = monthlyData[m];
      return {
        month: new Date(m + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        income: getTotalActualIncome(d.clients),
        recurring: getRecurringCosts(d.expenses, employees),
      };
    });
    points.push({
      month: new Date(currentMonth + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      income: totalActual,
      recurring: recurringCosts,
    });
    return points;
  }, [monthlyData, currentMonth, totalActual, recurringCosts, employees]);

  return (
    <div className="flex flex-col gap-5 h-full overflow-y-auto pr-1 pb-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard index={0} label="Expected Income" value={formatIQD(totalExpected)} icon={TrendingUp} sub="+12%" />
        <KPICard index={1} label="Actual Income" value={formatIQD(totalActual)} icon={DollarSign} gold />
        <KPICard index={2} label="Recurring Costs" value={formatIQD(recurringCosts)} icon={TrendingDown} negative />
        <KPICard
          index={3}
          label="Net Distributable"
          value={formatIQD(netDistributable)}
          icon={netDistributable >= 0 ? Star : AlertCircle}
          sub={netDistributable >= 0 ? "Distributable" : "Deficit"}
          negative={netDistributable < 0}
        />
      </div>

      {/* Outstanding */}
      <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show">
        <GlassCard className="px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle size={18} className="text-amber-400" />
            <div>
              <p className="text-xs text-white/45 uppercase tracking-wider">Outstanding Payments</p>
              <p className="text-lg font-bold text-amber-400 mt-0.5">{formatIQD(outstanding)}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/35">
              {clients.filter((c) => c.paymentStatus !== "Paid").length} clients pending
            </p>
          </div>
        </GlassCard>
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Revenue vs Expenses */}
        <motion.div custom={5} variants={fadeUp} initial="hidden" animate="show">
          <GlassCard className="p-5">
            <p className="text-sm font-semibold text-white/85 mb-4">Revenue vs Expenses</p>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={revenueVsExpenses}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d4a017" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#d4a017" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="income" name="Income" stroke="#d4a017" strokeWidth={2} fill="url(#incomeGrad)" dot={false} />
                <Area type="monotone" dataKey="recurring" name="Recurring Costs" stroke="#ef4444" strokeWidth={2} fill="url(#expGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </GlassCard>
        </motion.div>

        {/* Department Pie */}
        <motion.div custom={6} variants={fadeUp} initial="hidden" animate="show">
          <GlassCard className="p-5">
            <p className="text-sm font-semibold text-white/85 mb-4">Department Revenue Split</p>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={deptData} dataKey="revenue" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2}>
                    {deptData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} opacity={0.85} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-1.5 flex-1">
                {deptData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                    <span className="text-xs text-white/55 flex-1 truncate">{d.name}</span>
                    <span className="text-xs text-white/85 font-medium tabular-nums">
                      {formatIQD(d.revenue)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Head Net Distribution */}
      <motion.div custom={7} variants={fadeUp} initial="hidden" animate="show">
        <GlassCard className="p-5">
          <p className="text-sm font-semibold text-white/85 mb-4">Head Net Distribution</p>
          {headData.length === 0 ? (
            <p className="text-xs text-white/30 text-center py-4">No heads assigned yet</p>
          ) : (
            <div className="flex flex-col gap-2">
              {headData.map((h, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: "rgba(212,160,23,0.12)", color: "#d4a017" }}
                    >
                      {h.name.charAt(0)}
                    </div>
                    <span className="text-sm text-white/80 font-medium">{h.name}</span>
                  </div>
                  <span
                    className="text-sm font-semibold tabular-nums"
                    style={{ color: h.net >= 0 ? "#34d399" : "#f87171" }}
                  >
                    {formatIQD(h.net)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </motion.div>
    </div>
  );
}
