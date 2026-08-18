"use client";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Trash2, Edit3, ArrowUpDown } from "lucide-react";
import { useStore } from "@/lib/store";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input, Select, Textarea, FormField } from "@/components/ui/Input";
import { StatusBadge } from "@/components/ui/Badge";
import { formatIQD } from "@/lib/utils";
import { Client, PaymentStatus } from "@/lib/types";

const STATUSES: PaymentStatus[] = ["Paid", "Partial", "Pending", "Overdue"];

const emptyClient: Omit<Client, "id"> = {
  name: "",
  expectedIncome: 0,
  actualIncome: 0,
  paymentStatus: "Pending",
  date: new Date().toISOString().slice(0, 10),
  notes: "",
  headId: "",  // kept for data compat, not exposed in UI
};

export function DetailsTab() {
  const { clients, addClient, updateClient, deleteClient, addToast } = useStore();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "actualIncome" | "expectedIncome">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Client, "id">>(emptyClient);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return clients
      .filter((c) => c.name.toLowerCase().includes(q))
      .sort((a, b) => {
        const dir = sortDir === "asc" ? 1 : -1;
        if (sortBy === "name") return a.name.localeCompare(b.name) * dir;
        return (a[sortBy] - b[sortBy]) * dir;
      });
  }, [clients, search, sortBy, sortDir]);

  function openAdd() {
    setEditId(null);
    setForm(emptyClient);
    setModalOpen(true);
  }

  function openEdit(c: Client) {
    setEditId(c.id);
    setForm({ name: c.name, expectedIncome: c.expectedIncome, actualIncome: c.actualIncome, paymentStatus: c.paymentStatus, date: c.date, notes: c.notes, headId: c.headId ?? "" });
    setModalOpen(true);
  }

  function handleSave() {
    if (!form.name.trim()) return;
    if (editId) {
      updateClient(editId, form);
      addToast("Client updated", "success");
    } else {
      addClient(form);
      addToast("Client added", "success");
    }
    setModalOpen(false);
  }

  function handleDelete(id: string) {
    deleteClient(id);
    addToast("Client removed", "info");
  }

  function toggleSort(field: typeof sortBy) {
    if (sortBy === field) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortBy(field); setSortDir("asc"); }
  }

  const { totalExpected, totalActual } = useMemo(() => ({
    totalExpected: clients.reduce((s, c) => s + c.expectedIncome, 0),
    totalActual: clients.reduce((s, c) => s + c.actualIncome, 0),
  }), [clients]);

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clients…"
            className="w-full pl-9 pr-3 py-2 rounded-xl glass text-sm text-white/90 placeholder:text-white/25 border border-white/8 focus:border-[rgba(212,160,23,0.4)] transition-colors"
          />
        </div>
        <Button variant="gold" icon={<Plus size={15} />} onClick={openAdd}>
          Add Client
        </Button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: "Total Expected", value: formatIQD(totalExpected), color: "text-white/85" },
          { label: "Total Actual", value: formatIQD(totalActual), color: "text-[#d4a017]" },
          { label: "Outstanding", value: formatIQD(totalExpected - totalActual), color: "text-amber-400" },
        ].map((s, i) => (
          <GlassCard key={i} className="px-4 py-3">
            <p className="text-[10px] text-white/40 uppercase tracking-wider">{s.label}</p>
            <p className={`text-base font-bold mt-1 ${s.color}`}>{s.value}</p>
          </GlassCard>
        ))}
      </div>

      {/* Table */}
      <GlassCard className="flex-1 overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1">
          <table className="data-table">
            <thead className="sticky top-0" style={{ background: "rgba(10,22,40,0.8)", backdropFilter: "blur(20px)" }}>
              <tr>
                <th>
                  <button className="flex items-center gap-1" onClick={() => toggleSort("name")}>
                    Client <ArrowUpDown size={11} className="opacity-50" />
                  </button>
                </th>
                <th>
                  <button className="flex items-center gap-1" onClick={() => toggleSort("expectedIncome")}>
                    Expected <ArrowUpDown size={11} className="opacity-50" />
                  </button>
                </th>
                <th>
                  <button className="flex items-center gap-1" onClick={() => toggleSort("actualIncome")}>
                    Actual <ArrowUpDown size={11} className="opacity-50" />
                  </button>
                </th>
                <th>Status</th>
                <th>Date</th>
                <th>Notes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-14 text-white/25 text-sm">
                    No clients this month. Add your first client above.
                  </td>
                </tr>
              )}
              {filtered.map((c, i) => {
                return (
                  <motion.tr
                    key={c.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <td className="font-medium text-white/90">{c.name}</td>
                    <td className="text-white/65 font-mono text-xs">{formatIQD(c.expectedIncome)}</td>
                    <td className="text-[#d4a017] font-mono text-xs font-semibold">{formatIQD(c.actualIncome)}</td>
                    <td><StatusBadge status={c.paymentStatus} /></td>
                    <td className="text-white/40 text-xs">{c.date}</td>
                    <td className="text-white/40 text-xs max-w-[150px] truncate">{c.notes || "—"}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button aria-label={`Edit ${c.name}`} onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-white/8 text-white/30 hover:text-white/70 transition-colors duration-150">
                          <Edit3 size={13} aria-hidden="true" />
                        </button>
                        <button aria-label={`Delete ${c.name}`} onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg hover:bg-red-500/15 text-white/30 hover:text-red-400 transition-colors duration-150">
                          <Trash2 size={13} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? "Edit Client" : "Add Client"}>
        <div className="flex flex-col gap-4">
          <FormField label="Client Name">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Al-Majd Real Estate" />
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Expected Income (IQD)">
              <Input type="number" value={form.expectedIncome} onChange={(e) => setForm({ ...form, expectedIncome: +e.target.value })} placeholder="0" />
            </FormField>
            <FormField label="Actual Income (IQD)">
              <Input type="number" value={form.actualIncome} onChange={(e) => setForm({ ...form, actualIncome: +e.target.value })} placeholder="0" />
            </FormField>
          </div>
          <FormField label="Payment Status">
            <Select value={form.paymentStatus} onChange={(e) => setForm({ ...form, paymentStatus: e.target.value as PaymentStatus })}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </FormField>
          <FormField label="Date">
            <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </FormField>
          <FormField label="Notes">
            <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes…" />
          </FormField>
          <div className="flex gap-3 pt-2">
            <Button variant="glass" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="gold" className="flex-1" onClick={handleSave}>{editId ? "Save Changes" : "Add Client"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
