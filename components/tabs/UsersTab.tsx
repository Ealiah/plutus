"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Edit3, Shield, UserPlus, KeyRound } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input, Select, FormField } from "@/components/ui/Input";
import { useStore } from "@/lib/store";

type User = {
  id: string;
  username: string;
  disabled: boolean;
  createdAt: number;
  roleId: string;
  roleName: string;
};

type Role = {
  id: string;
  name: string;
  allowedTabs: string[];
  isSystem: boolean;
};

const emptyForm = { username: "", password: "", roleId: "" };

export function UsersTab() {
  const addToast = useStore((s) => s.addToast);
  const currentUserId = useStore((s) => s.currentUser?.id);

  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function reload() {
    setLoading(true);
    try {
      const [u, r] = await Promise.all([
        fetch("/api/users").then((res) => res.json()),
        fetch("/api/roles").then((res) => res.json()),
      ]);
      setUsers(u.users || []);
      setRoles(r.roles || []);
    } catch {
      addToast("Failed to load users", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function openAdd() {
    setEditId(null);
    setForm({ ...emptyForm, roleId: roles[0]?.id || "" });
    setShowPassword(false);
    setError("");
    setModalOpen(true);
  }

  function openEdit(u: User) {
    setEditId(u.id);
    setForm({ username: u.username, password: "", roleId: u.roleId });
    setShowPassword(false);
    setError("");
    setModalOpen(true);
  }

  async function handleSave() {
    setError("");
    setSaving(true);
    try {
      let res: Response;
      if (editId) {
        const body: Record<string, unknown> = {};
        if (form.username) body.username = form.username;
        if (form.password) body.password = form.password;
        if (form.roleId) body.roleId = form.roleId;
        res = await fetch(`/api/users/${editId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Save failed");
        return;
      }
      addToast(editId ? "User updated" : "User created", "success");
      setModalOpen(false);
      await reload();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  async function toggleDisabled(u: User) {
    const res = await fetch(`/api/users/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ disabled: !u.disabled }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      addToast(data.error || "Failed", "error");
      return;
    }
    addToast(u.disabled ? "User enabled" : "User disabled", "success");
    await reload();
  }

  async function handleDelete(u: User) {
    if (!confirm(`Delete user "${u.username}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/users/${u.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      addToast(data.error || "Delete failed", "error");
      return;
    }
    addToast("User deleted", "info");
    await reload();
  }

  return (
    <div className="flex flex-col gap-4 md:h-full md:overflow-hidden">
      <div className="flex items-center justify-between px-1">
        <div>
          <p className="text-xs text-white/40 uppercase tracking-wider font-medium">
            Team & access
          </p>
          <p className="text-sm text-white/60 mt-0.5">
            Manage users and assign roles that gate access to each section
          </p>
        </div>
        <Button variant="gold" icon={<UserPlus size={14} />} onClick={openAdd}>
          Add User
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 pb-4">
        {loading && (
          <GlassCard className="p-10 text-center text-white/30 text-sm">Loading…</GlassCard>
        )}

        {!loading && users.length === 0 && (
          <GlassCard className="p-10 text-center">
            <Shield size={28} className="text-white/20 mx-auto mb-2" />
            <p className="text-sm text-white/40">No users yet</p>
          </GlassCard>
        )}

        {!loading &&
          users.map((u, i) => {
            const role = roles.find((r) => r.id === u.roleId);
            const isSelf = u.id === currentUserId;
            return (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              >
                <GlassCard className="flex items-center gap-4 px-5 py-3.5">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: "rgba(212,160,23,0.12)", color: "#d4a017" }}
                  >
                    {u.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-white/90 truncate">{u.username}</p>
                      {isSelf && (
                        <span className="text-[10px] text-white/40 px-1.5 py-0.5 rounded bg-white/5">
                          you
                        </span>
                      )}
                      {u.disabled && (
                        <span className="text-[10px] text-red-400 px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20">
                          disabled
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/40 mt-0.5">
                      {u.roleName}
                      {role && role.allowedTabs.length > 0 && (
                        <span className="text-white/25"> · {role.allowedTabs.length} sections</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      aria-label={`Edit ${u.username}`}
                      onClick={() => openEdit(u)}
                      className="p-2 rounded-lg hover:bg-white/8 text-white/40 hover:text-white/80 transition-colors duration-150"
                    >
                      <Edit3 size={14} aria-hidden="true" />
                    </button>
                    <button
                      aria-label={u.disabled ? `Enable ${u.username}` : `Disable ${u.username}`}
                      onClick={() => toggleDisabled(u)}
                      disabled={isSelf}
                      className="p-2 rounded-lg hover:bg-white/8 text-white/40 hover:text-white/80 transition-colors duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <KeyRound size={14} aria-hidden="true" />
                    </button>
                    <button
                      aria-label={`Delete ${u.username}`}
                      onClick={() => handleDelete(u)}
                      disabled={isSelf}
                      className="p-2 rounded-lg hover:bg-red-500/15 text-white/40 hover:text-red-400 transition-colors duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
      </div>

      {/* Role legend */}
      {!loading && roles.length > 0 && (
        <div className="px-1 pb-2">
          <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Roles</p>
          <div className="flex flex-wrap gap-2">
            {roles.map((r) => (
              <div
                key={r.id}
                className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] text-white/60"
                title={r.allowedTabs.join(", ")}
              >
                <span className="font-medium text-white/85">{r.name}</span>
                <span className="text-white/35"> · {r.allowedTabs.length} tabs</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editId ? "Edit User" : "Add User"}
      >
        <div className="flex flex-col gap-4">
          <FormField label="Username">
            <Input
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="e.g. accountant"
              autoComplete="off"
            />
          </FormField>
          <FormField label={editId ? "New password (leave blank to keep)" : "Password"}>
            <Input
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={editId ? "Unchanged" : "Min 8 characters"}
              autoComplete="new-password"
            />
            <label className="flex items-center gap-2 text-[11px] text-white/40 cursor-pointer mt-1 select-none">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
              />
              Show password
            </label>
          </FormField>
          <FormField label="Role">
            <Select
              value={form.roleId}
              onChange={(e) => setForm({ ...form, roleId: e.target.value })}
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.allowedTabs.length} sections)
                </option>
              ))}
            </Select>
          </FormField>

          {error && (
            <p className="text-xs text-red-400 px-2 py-1.5 rounded-lg" role="alert"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <Button variant="glass" className="flex-1" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="gold"
              className="flex-1"
              onClick={handleSave}
              disabled={saving || !form.username || (!editId && !form.password) || !form.roleId}
              icon={<Plus size={14} />}
            >
              {saving ? "Saving…" : editId ? "Save Changes" : "Create User"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
