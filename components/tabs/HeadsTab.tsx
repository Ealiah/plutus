"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, Edit3, UserCircle, Mail, Phone,
  ChevronDown, ChevronUp, CheckCircle,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input, FormField } from "@/components/ui/Input";
import { formatIQD } from "@/lib/utils";
import { Head, DEPARTMENTS } from "@/lib/types";

const empty: Omit<Head, "id"> = { name: "", email: "", phone: "" };

const DEPT_COLORS: Record<string, string> = {
  Designing: "#d4a017",
  Photographer: "#3b82f6",
  "Video Editing": "#10b981",
  Copywriting: "#8b5cf6",
  Coordinator: "#f59e0b",
  Marketing: "#ef4444",
  Posting: "#06b6d4",
};

export function HeadsTab() {
  const {
    heads, clients, sectionHeads,
    addHead, updateHead, deleteHead,
    setClientSectionHeads, addToast,
  } = useStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Head, "id">>(empty);
  const [expanded, setExpanded] = useState<string | null>(clients[0]?.id ?? null);
  const [drafts, setDrafts] = useState<Record<string, Record<string, string>>>({});

  function openAdd() { setEditId(null); setForm(empty); setModalOpen(true); }
  function openEdit(h: Head) {
    setEditId(h.id);
    setForm({ name: h.name, email: h.email, phone: h.phone });
    setModalOpen(true);
  }
  function handleSave() {
    if (!form.name.trim()) return;
    if (editId) { updateHead(editId, form); addToast("Head updated", "success"); }
    else { addHead(form); addToast("Head added", "success"); }
    setModalOpen(false);
  }

  function getDraft(clientId: string): Record<string, string> {
    if (drafts[clientId]) return drafts[clientId];
    const existing = sectionHeads.find((sh) => sh.clientId === clientId);
    return existing ? { ...existing.sections } : {};
  }

  function setDraftSection(clientId: string, dept: string, headId: string) {
    setDrafts((prev) => ({
      ...prev,
      [clientId]: { ...getDraft(clientId), [dept]: headId },
    }));
  }

  function handleSaveSections(clientId: string) {
    const sections = getDraft(clientId);
    setClientSectionHeads(clientId, sections);
    setDrafts((prev) => { const n = { ...prev }; delete n[clientId]; return n; });
    addToast("Assignments saved", "success");
  }

  function getAssignedCount(clientId: string): number {
    const d = getDraft(clientId);
    return DEPARTMENTS.filter((dept) => !!d[dept]).length;
  }

  return (
    <div className="flex flex-col md:flex-row gap-4 md:h-full md:overflow-hidden">

      {/* ── Left: Head management ── */}
      <div className="w-full md:w-56 flex-shrink-0 flex flex-col gap-3 md:overflow-y-auto">
        <Button variant="gold" icon={<Plus size={14} />} onClick={openAdd} className="w-full">
          Add Head
        </Button>

        {heads.length === 0 && (
          <GlassCard className="p-6 text-center">
            <UserCircle size={28} className="text-white/20 mx-auto mb-2" />
            <p className="text-xs text-white/25">No heads yet</p>
          </GlassCard>
        )}

        {heads.map((h, i) => (
          <motion.div
            key={h.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05, duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <GlassCard className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ background: "rgba(212,160,23,0.12)", color: "#d4a017" }}
                >
                  {h.name.charAt(0)}
                </div>
                <div className="flex gap-0.5">
                  <button
                    aria-label={`Edit ${h.name}`}
                    onClick={() => openEdit(h)}
                    className="p-1.5 rounded-lg hover:bg-white/8 text-white/30 hover:text-white/70 transition-colors duration-150"
                  >
                    <Edit3 size={12} aria-hidden="true" />
                  </button>
                  <button
                    aria-label={`Delete ${h.name}`}
                    onClick={() => { deleteHead(h.id); addToast("Head removed", "info"); }}
                    className="p-1.5 rounded-lg hover:bg-red-500/15 text-white/30 hover:text-red-400 transition-colors duration-150"
                  >
                    <Trash2 size={12} aria-hidden="true" />
                  </button>
                </div>
              </div>
              <p className="text-sm font-semibold text-white/90 truncate">{h.name}</p>
              {h.email && (
                <div className="flex items-center gap-1 mt-1">
                  <Mail size={10} aria-hidden="true" className="text-white/25 flex-shrink-0" />
                  <p className="text-[11px] text-white/35 truncate">{h.email}</p>
                </div>
              )}
              {h.phone && (
                <div className="flex items-center gap-1 mt-0.5">
                  <Phone size={10} aria-hidden="true" className="text-white/25 flex-shrink-0" />
                  <p className="text-[11px] text-white/35">{h.phone}</p>
                </div>
              )}
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* ── Right: Section assignments per client ── */}
      <div className="flex-1 flex flex-col gap-3 md:overflow-y-auto pb-6">
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-white/40 uppercase tracking-wider font-medium">
            Assign heads to each department per client
          </p>
        </div>

        {clients.length === 0 && (
          <GlassCard className="flex-1 flex items-center justify-center p-10">
            <p className="text-sm text-white/25 text-center">
              Add clients in the Details tab first
            </p>
          </GlassCard>
        )}

        {heads.length === 0 && clients.length > 0 && (
          <GlassCard className="p-5">
            <p className="text-sm text-white/35 text-center">
              Add at least one head on the left before assigning sections
            </p>
          </GlassCard>
        )}

        {heads.length > 0 && clients.map((client, ci) => {
          const draft = getDraft(client.id);
          const assigned = getAssignedCount(client.id);
          const isOpen = expanded === client.id;
          const isDirty = !!drafts[client.id];
          const isComplete = assigned === DEPARTMENTS.length;

          return (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: ci * 0.04, duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <GlassCard className="overflow-hidden">
                {/* Client header row */}
                <button
                  className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-white/3 transition-colors duration-150 text-left"
                  onClick={() => setExpanded(isOpen ? null : client.id)}
                  aria-expanded={isOpen}
                >
                  {/* Completion ring */}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                    style={{
                      background: isComplete
                        ? "rgba(16,185,129,0.15)"
                        : "rgba(255,255,255,0.06)",
                      color: isComplete ? "#34d399" : "rgba(255,255,255,0.4)",
                      border: `1px solid ${isComplete ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.08)"}`,
                    }}
                  >
                    {isComplete ? <CheckCircle size={14} aria-hidden="true" /> : assigned}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white/90 truncate">{client.name}</p>
                    <p className="text-xs text-white/35 mt-0.5">
                      {assigned}/{DEPARTMENTS.length} sections assigned
                      {" · "}
                      {formatIQD(client.actualIncome)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isDirty && (
                      <span className="text-[10px] text-[#d4a017] px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(212,160,23,0.1)" }}>
                        Unsaved
                      </span>
                    )}
                    {isOpen
                      ? <ChevronUp size={14} className="text-white/30" aria-hidden="true" />
                      : <ChevronDown size={14} className="text-white/30" aria-hidden="true" />
                    }
                  </div>
                </button>

                {/* Expanded section assignments */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 35 }}
                      className="overflow-hidden border-t border-white/6"
                    >
                      <div className="px-5 py-4 flex flex-col gap-2.5">
                        {DEPARTMENTS.map((dept) => {
                          const selectedHeadId = draft[dept] || "";
                          const selectedHead = heads.find((h) => h.id === selectedHeadId);
                          const color = DEPT_COLORS[dept];

                          return (
                            <div key={dept} className="flex items-center gap-4">
                              {/* Dept label */}
                              <div className="flex items-center gap-2 w-36 flex-shrink-0">
                                <span
                                  className="w-2 h-2 rounded-full flex-shrink-0"
                                  style={{ background: color }}
                                  aria-hidden="true"
                                />
                                <span className="text-xs text-white/65">{dept}</span>
                              </div>

                              {/* Head selector */}
                              <div className="flex-1 relative">
                                <select
                                  aria-label={`Head for ${dept} — ${client.name}`}
                                  value={selectedHeadId}
                                  onChange={(e) => setDraftSection(client.id, dept, e.target.value)}
                                  className="w-full pl-3 pr-8 py-2 rounded-xl text-xs font-medium appearance-none cursor-pointer transition-colors duration-150"
                                  style={{
                                    background: selectedHeadId
                                      ? `${color}12`
                                      : "rgba(255,255,255,0.04)",
                                    border: `1px solid ${selectedHeadId ? `${color}30` : "rgba(255,255,255,0.09)"}`,
                                    color: selectedHeadId ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)",
                                    outline: "none",
                                  }}
                                >
                                  <option value="" style={{ background: "#0f2d42" }}>
                                    — Unassigned —
                                  </option>
                                  {heads.map((h) => (
                                    <option key={h.id} value={h.id} style={{ background: "#0f2d42" }}>
                                      {h.name}
                                    </option>
                                  ))}
                                </select>
                                {/* Chevron */}
                                <ChevronDown
                                  size={12}
                                  aria-hidden="true"
                                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none"
                                />
                              </div>

                              {/* Selected head name pill */}
                              {selectedHead && (
                                <div
                                  className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                                  style={{ background: `${color}18`, color }}
                                  title={selectedHead.name}
                                >
                                  {selectedHead.name.charAt(0)}
                                </div>
                              )}
                              {!selectedHead && <div className="w-7 flex-shrink-0" />}
                            </div>
                          );
                        })}

                        {/* Save row */}
                        <div className="flex justify-end pt-2 border-t border-white/6 mt-1">
                          <Button
                            size="sm"
                            variant={isDirty ? "gold" : "glass"}
                            onClick={() => handleSaveSections(client.id)}
                          >
                            {isDirty ? "Save Assignments" : "Saved"}
                          </Button>
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

      {/* Add/Edit Head modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? "Edit Head" : "Add Head"}>
        <div className="flex flex-col gap-4">
          <FormField label="Full Name">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Ahmed Al-Rashid" />
          </FormField>
          <FormField label="Email">
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@agency.iq" />
          </FormField>
          <FormField label="Phone">
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+964 7xx xxx xxxx" />
          </FormField>
          <div className="flex gap-3 pt-1">
            <Button variant="glass" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="gold" className="flex-1" onClick={handleSave}>{editId ? "Save Changes" : "Add Head"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
