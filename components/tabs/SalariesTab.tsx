"use client";
import { useState, useMemo } from "react";
import type { TooltipProps } from "@/lib/chart-types";
import { motion } from "framer-motion";
import { Plus, Trash2, Edit3 } from "lucide-react";
import { useStore } from "@/lib/store";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input, Select, FormField } from "@/components/ui/Input";
import { DeptBadge } from "@/components/ui/Badge";
import { formatIQD, getTotalSalaries } from "@/lib/utils";
import { Employee, Department, DEPARTMENTS } from "@/lib/types";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";

const empty: Omit<Employee, "id"> = {
  name: "",
  role: "",
  department: "Designing",
  salary: 0,
  bonus: 0,
};

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-white/50 mb-1">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex gap-2">
          <span style={{ color: p.color }}>{p.name}:</span>
          <span className="text-white font-semibold">{formatIQD(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export function SalariesTab() {
  const { employees, addEmployee, updateEmployee, deleteEmployee, addToast } = useStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Employee, "id">>(empty);

  const totalSalaries = useMemo(() => getTotalSalaries(employees), [employees]);

  const { baseSalaries, totalBonuses } = useMemo(() => ({
    baseSalaries: employees.reduce((s, e) => s + e.salary, 0),
    totalBonuses: employees.reduce((s, e) => s + e.bonus, 0),
  }), [employees]);

  const deptSalary = useMemo(() =>
    DEPARTMENTS.map((d) => {
      const dept = employees.filter((e) => e.department === d);
      return {
        name: d.split(" ")[0],
        salary: dept.reduce((s, e) => s + e.salary, 0),
        bonus: dept.reduce((s, e) => s + e.bonus, 0),
      };
    }),
    [employees]
  );

  function openAdd() { setEditId(null); setForm(empty); setModalOpen(true); }
  function openEdit(e: Employee) {
    setEditId(e.id);
    setForm({ name: e.name, role: e.role, department: e.department, salary: e.salary, bonus: e.bonus });
    setModalOpen(true);
  }
  function handleSave() {
    if (!form.name.trim()) return;
    if (editId) { updateEmployee(editId, form); addToast("Employee updated", "success"); }
    else { addEmployee(form); addToast("Employee added", "success"); }
    setModalOpen(false);
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <GlassCard variant="gold" glow className="px-4 py-3">
          <p className="text-[10px] text-white/40 uppercase tracking-wider">Total Payroll</p>
          <p className="text-xl font-bold text-[#d4a017] mt-1">{formatIQD(totalSalaries)}</p>
        </GlassCard>
        <GlassCard className="px-4 py-3">
          <p className="text-[10px] text-white/40 uppercase tracking-wider">Base Salaries</p>
          <p className="text-xl font-bold text-white/90 mt-1">{formatIQD(baseSalaries)}</p>
        </GlassCard>
        <GlassCard className="px-4 py-3">
          <p className="text-[10px] text-white/40 uppercase tracking-wider">Total Bonuses</p>
          <p className="text-xl font-bold text-amber-400 mt-1">{formatIQD(totalBonuses)}</p>
        </GlassCard>
      </div>

      {/* Chart */}
      <GlassCard className="p-5">
        <p className="text-sm font-semibold text-white/85 mb-4">Salary by Department</p>
        <ResponsiveContainer width="100%" height={130}>
          <BarChart data={deptSalary} barSize={20}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="salary" name="Salary" stackId="a" fill="#d4a017" opacity={0.8} radius={[0, 0, 0, 0]} />
            <Bar dataKey="bonus" name="Bonus" stackId="a" fill="#3b82f6" opacity={0.7} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </GlassCard>

      {/* Table */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/45">{employees.length} employees</p>
        <Button variant="gold" icon={<Plus size={15} />} onClick={openAdd}>Add Employee</Button>
      </div>

      <GlassCard className="flex-1 overflow-hidden">
        <div className="overflow-auto h-full">
          <table className="data-table">
            <thead className="sticky top-0" style={{ background: "rgba(10,22,40,0.85)", backdropFilter: "blur(20px)" }}>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Department</th>
                <th>Salary (IQD)</th>
                <th>Bonus (IQD)</th>
                <th>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 && (
                <tr><td colSpan={7} className="text-center py-14 text-white/25 text-sm">
                  No employees added yet. Use &ldquo;Add Employee&rdquo; to track salaries.
                </td></tr>
              )}
              {employees.map((e, i) => (
                <motion.tr key={e.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <td className="font-medium text-white/90">{e.name}</td>
                  <td className="text-white/55 text-xs">{e.role}</td>
                  <td><DeptBadge dept={e.department} /></td>
                  <td className="font-mono text-xs text-white/75">{formatIQD(e.salary)}</td>
                  <td className="font-mono text-xs text-amber-400">{formatIQD(e.bonus)}</td>
                  <td className="font-mono text-xs text-[#d4a017] font-semibold">{formatIQD(e.salary + e.bonus)}</td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button aria-label={`Edit ${e.name}`} onClick={() => openEdit(e)} className="p-1.5 rounded-lg hover:bg-white/8 text-white/30 hover:text-white/70 transition-colors duration-150"><Edit3 size={13} aria-hidden="true" /></button>
                      <button aria-label={`Delete ${e.name}`} onClick={() => { deleteEmployee(e.id); addToast("Employee removed", "info"); }} className="p-1.5 rounded-lg hover:bg-red-500/15 text-white/30 hover:text-red-400 transition-colors duration-150"><Trash2 size={13} aria-hidden="true" /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? "Edit Employee" : "Add Employee"}>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Name">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
            </FormField>
            <FormField label="Role / Title">
              <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="e.g. Senior Designer" />
            </FormField>
          </div>
          <FormField label="Department">
            <Select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value as Department })}>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </Select>
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Monthly Salary (IQD)">
              <Input type="number" value={form.salary} onChange={(e) => setForm({ ...form, salary: +e.target.value })} placeholder="0" />
            </FormField>
            <FormField label="Bonus (IQD)">
              <Input type="number" value={form.bonus} onChange={(e) => setForm({ ...form, bonus: +e.target.value })} placeholder="0" />
            </FormField>
          </div>
          <div className="glass-gold rounded-xl px-4 py-3">
            <p className="text-xs text-white/40">Total Salary</p>
            <p className="text-lg font-bold text-[#d4a017]">{formatIQD((form.salary || 0) + (form.bonus || 0))}</p>
          </div>
          <div className="flex gap-3 pt-1">
            <Button variant="glass" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="gold" className="flex-1" onClick={handleSave}>{editId ? "Save Changes" : "Add Employee"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
