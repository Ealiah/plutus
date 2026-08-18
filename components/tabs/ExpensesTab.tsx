"use client";
import { useState, useMemo } from "react";
import type { TooltipProps } from "@/lib/chart-types";
import { motion } from "framer-motion";
import { Plus, Trash2, Edit3 } from "lucide-react";
import { useStore } from "@/lib/store";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input, Select, Textarea, FormField } from "@/components/ui/Input";
import { formatIQD } from "@/lib/utils";
import { Expense, ExpenseCategory, ExpenseType } from "@/lib/types";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
} from "recharts";

const CATEGORIES: ExpenseCategory[] = ["Software", "Equipment", "Ads", "Rent", "Internet", "Miscellaneous"];
const TYPES: ExpenseType[] = ["Recurring", "One-time"];
const CAT_COLORS: Record<ExpenseCategory, string> = {
  Software: "#3b82f6",
  Equipment: "#8b5cf6",
  Ads: "#d4a017",
  Rent: "#ef4444",
  Internet: "#10b981",
  Miscellaneous: "#6b7280",
};

const empty: Omit<Expense, "id"> = {
  name: "",
  type: "Recurring",
  amount: 0,
  category: "Software",
  head: "",
  date: new Date().toISOString().slice(0, 10),
  notes: "",
};

const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-white font-semibold">{payload[0].name}</p>
      <p className="text-[#d4a017]">{formatIQD(payload[0].value)}</p>
    </div>
  );
};

export function ExpensesTab() {
  const { expenses, addExpense, updateExpense, deleteExpense, addToast } = useStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Expense, "id">>(empty);
  const [filterType, setFilterType] = useState<"All" | ExpenseType>("All");

  const { filtered, total, recurring, oneTime, catData } = useMemo(() => {
    const filtered = filterType === "All" ? expenses : expenses.filter((e) => e.type === filterType);
    let total = 0, recurring = 0, oneTime = 0;
    const catTotals: Record<string, number> = {};
    for (const e of expenses) {
      total += e.amount;
      if (e.type === "Recurring") recurring += e.amount;
      else oneTime += e.amount;
      catTotals[e.category] = (catTotals[e.category] || 0) + e.amount;
    }
    const catData = CATEGORIES
      .map((cat) => ({ name: cat, value: catTotals[cat] || 0, color: CAT_COLORS[cat] }))
      .filter((d) => d.value > 0);
    return { filtered, total, recurring, oneTime, catData };
  }, [expenses, filterType]);

  function openAdd() { setEditId(null); setForm(empty); setModalOpen(true); }
  function openEdit(e: Expense) {
    setEditId(e.id);
    setForm({ name: e.name, type: e.type, amount: e.amount, category: e.category, head: e.head, date: e.date, notes: e.notes });
    setModalOpen(true);
  }
  function handleSave() {
    if (!form.name.trim()) return;
    if (editId) { updateExpense(editId, form); addToast("Expense updated", "success"); }
    else { addExpense(form); addToast("Expense added", "success"); }
    setModalOpen(false);
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <GlassCard variant="gold" glow className="px-4 py-3">
          <p className="text-[10px] text-white/40 uppercase tracking-wider">Total Expenses</p>
          <p className="text-xl font-bold text-[#d4a017] mt-1">{formatIQD(total)}</p>
        </GlassCard>
        <GlassCard className="px-4 py-3">
          <p className="text-[10px] text-white/40 uppercase tracking-wider">Recurring</p>
          <p className="text-xl font-bold text-red-400 mt-1">{formatIQD(recurring)}</p>
        </GlassCard>
        <GlassCard className="px-4 py-3">
          <p className="text-[10px] text-white/40 uppercase tracking-wider">One-time</p>
          <p className="text-xl font-bold text-blue-400 mt-1">{formatIQD(oneTime)}</p>
        </GlassCard>
      </div>

      {/* Chart + Categories */}
      {catData.length > 0 && (
        <GlassCard className="p-5">
          <p className="text-sm font-semibold text-white/85 mb-4">Expense Breakdown</p>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie data={catData} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3}>
                  {catData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} opacity={0.85} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 flex-1">
              {catData.map((d, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                  <span className="text-xs text-white/55">{d.name}</span>
                  <span className="text-xs text-white/80 font-medium ml-auto">{formatIQD(d.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      )}

      {/* Filter + Add */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 glass rounded-xl p-1">
          {(["All", "Recurring", "One-time"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150 ${
                filterType === t
                  ? "bg-[#d4a017] text-black"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <Button variant="gold" icon={<Plus size={15} />} onClick={openAdd}>Add Expense</Button>
      </div>

      {/* Table */}
      <GlassCard className="flex-1 overflow-hidden">
        <div className="overflow-auto h-full">
          <table className="data-table">
            <thead className="sticky top-0" style={{ background: "rgba(10,22,40,0.85)", backdropFilter: "blur(20px)" }}>
              <tr>
                <th>Expense</th>
                <th>Category</th>
                <th>Type</th>
                <th>Amount (IQD)</th>
                <th>Date</th>
                <th>Notes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-14 text-white/25 text-sm">
                  {filterType === "All" ? "No expenses recorded. Add your first expense above." : `No ${filterType.toLowerCase()} expenses this month.`}
                </td></tr>
              )}
              {filtered.map((e, i) => (
                <motion.tr key={e.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <td className="font-medium text-white/90">{e.name}</td>
                  <td>
                    <span className="badge text-[11px]" style={{ background: `${CAT_COLORS[e.category]}18`, border: `1px solid ${CAT_COLORS[e.category]}35`, color: CAT_COLORS[e.category] }}>
                      {e.category}
                    </span>
                  </td>
                  <td>
                    <span className={`badge text-[11px] ${e.type === "Recurring" ? "bg-red-500/12 border border-red-500/25 text-red-400" : "bg-blue-500/12 border border-blue-500/25 text-blue-400"}`}>
                      {e.type}
                    </span>
                  </td>
                  <td className="font-mono text-xs text-[#d4a017] font-semibold">{formatIQD(e.amount)}</td>
                  <td className="text-white/40 text-xs">{e.date}</td>
                  <td className="text-white/40 text-xs max-w-[150px] truncate">{e.notes || "—"}</td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button aria-label={`Edit ${e.name}`} onClick={() => openEdit(e)} className="p-1.5 rounded-lg hover:bg-white/8 text-white/30 hover:text-white/70 transition-colors duration-150"><Edit3 size={13} aria-hidden="true" /></button>
                      <button aria-label={`Delete ${e.name}`} onClick={() => { deleteExpense(e.id); addToast("Expense removed", "info"); }} className="p-1.5 rounded-lg hover:bg-red-500/15 text-white/30 hover:text-red-400 transition-colors duration-150"><Trash2 size={13} aria-hidden="true" /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? "Edit Expense" : "Add Expense"}>
        <div className="flex flex-col gap-4">
          <FormField label="Expense Name">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Adobe Creative Cloud" />
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Category">
              <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as ExpenseCategory })}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </FormField>
            <FormField label="Type">
              <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as ExpenseType })}>
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
            </FormField>
          </div>
          <FormField label="Amount (IQD)">
            <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: +e.target.value })} placeholder="0" />
          </FormField>
          <FormField label="Date">
            <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </FormField>
          <FormField label="Notes">
            <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes…" />
          </FormField>
          <div className="flex gap-3 pt-1">
            <Button variant="glass" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="gold" className="flex-1" onClick={handleSave}>{editId ? "Save Changes" : "Add Expense"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
