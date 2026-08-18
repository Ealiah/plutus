import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  Client,
  Employee,
  Expense,
  Head,
  Toast,
  AppState,
  CurrentUser,
} from "./types";
import { generateId } from "./utils";

function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

interface StoreActions {
  setActiveTab: (tab: string) => void;
  setTheme: (theme: "dark" | "light") => void;
  setCurrentMonth: (month: string) => Promise<void>;

  addClient: (client: Omit<Client, "id">) => Promise<void>;
  updateClient: (id: string, client: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;

  addEmployee: (employee: Omit<Employee, "id">) => Promise<void>;
  updateEmployee: (id: string, employee: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;

  addExpense: (expense: Omit<Expense, "id">) => Promise<void>;
  updateExpense: (id: string, expense: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;

  addHead: (head: Omit<Head, "id">) => Promise<void>;
  updateHead: (id: string, head: Partial<Head>) => Promise<void>;
  deleteHead: (id: string) => Promise<void>;

  setClientPercentage: (clientId: string, percentages: { [dept: string]: number }) => Promise<void>;
  setClientSectionHeads: (clientId: string, sections: Record<string, string>) => Promise<void>;

  addToast: (message: string, type: Toast["type"]) => void;
  removeToast: (id: string) => void;

  hydrateAuth: () => Promise<void>;
  hydrateFinanceData: () => Promise<void>;
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
}

async function api(path: string, init: RequestInit = {}) {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `${res.status} ${res.statusText}`);
  }
  return res.json().catch(() => ({}));
}

export const useStore = create<AppState & StoreActions>()(
  persist(
    (set, get) => ({
      currentMonth: getCurrentMonthKey(),
      monthlyData: {},
      clients: [],
      employees: [],
      expenses: [],
      heads: [],
      percentages: [],
      sectionHeads: [],
      activeTab: "overview",
      theme: "dark",
      toasts: [],
      currentUser: null,
      authLoading: true,

      setActiveTab: (tab) => set({ activeTab: tab }),
      setTheme: (theme) => set({ theme }),

      setCurrentMonth: async (month) => {
        set({
          currentMonth: month,
          clients: [],
          employees: [],
          expenses: [],
          heads: [],
          percentages: [],
          sectionHeads: [],
        });
        await get().hydrateFinanceData();
      },

      addClient: async (client) => {
        const id = generateId();
        const month = get().currentMonth;
        set((s) => ({ clients: [...s.clients, { ...client, id }] }));
        try {
          await api("/api/clients", {
            method: "POST",
            body: JSON.stringify({ id, month, ...client }),
          });
        } catch (e) {
          get().addToast(`Save failed: ${(e as Error).message}`, "error");
          set((s) => ({ clients: s.clients.filter((c) => c.id !== id) }));
        }
      },
      updateClient: async (id, patch) => {
        const prev = get().clients.find((c) => c.id === id);
        set((s) => ({ clients: s.clients.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
        try {
          await api(`/api/clients/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
        } catch (e) {
          get().addToast(`Save failed: ${(e as Error).message}`, "error");
          if (prev) set((s) => ({ clients: s.clients.map((c) => (c.id === id ? prev : c)) }));
        }
      },
      deleteClient: async (id) => {
        const prev = get().clients.find((c) => c.id === id);
        set((s) => ({
          clients: s.clients.filter((c) => c.id !== id),
          percentages: s.percentages.filter((p) => p.clientId !== id),
        }));
        try {
          await api(`/api/clients/${id}`, { method: "DELETE" });
        } catch (e) {
          get().addToast(`Delete failed: ${(e as Error).message}`, "error");
          if (prev) set((s) => ({ clients: [...s.clients, prev] }));
        }
      },

      addEmployee: async (employee) => {
        const id = generateId();
        const month = get().currentMonth;
        set((s) => ({ employees: [...s.employees, { ...employee, id }] }));
        try {
          await api("/api/employees", { method: "POST", body: JSON.stringify({ id, month, ...employee }) });
        } catch (e) {
          get().addToast(`Save failed: ${(e as Error).message}`, "error");
          set((s) => ({ employees: s.employees.filter((x) => x.id !== id) }));
        }
      },
      updateEmployee: async (id, patch) => {
        const prev = get().employees.find((e) => e.id === id);
        set((s) => ({ employees: s.employees.map((e) => (e.id === id ? { ...e, ...patch } : e)) }));
        try {
          await api(`/api/employees/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
        } catch (e) {
          get().addToast(`Save failed: ${(e as Error).message}`, "error");
          if (prev) set((s) => ({ employees: s.employees.map((x) => (x.id === id ? prev : x)) }));
        }
      },
      deleteEmployee: async (id) => {
        const prev = get().employees.find((e) => e.id === id);
        set((s) => ({ employees: s.employees.filter((e) => e.id !== id) }));
        try {
          await api(`/api/employees/${id}`, { method: "DELETE" });
        } catch (e) {
          get().addToast(`Delete failed: ${(e as Error).message}`, "error");
          if (prev) set((s) => ({ employees: [...s.employees, prev] }));
        }
      },

      addExpense: async (expense) => {
        const id = generateId();
        const month = get().currentMonth;
        set((s) => ({ expenses: [...s.expenses, { ...expense, id }] }));
        try {
          await api("/api/expenses", { method: "POST", body: JSON.stringify({ id, month, ...expense }) });
        } catch (e) {
          get().addToast(`Save failed: ${(e as Error).message}`, "error");
          set((s) => ({ expenses: s.expenses.filter((x) => x.id !== id) }));
        }
      },
      updateExpense: async (id, patch) => {
        const prev = get().expenses.find((e) => e.id === id);
        set((s) => ({ expenses: s.expenses.map((e) => (e.id === id ? { ...e, ...patch } : e)) }));
        try {
          await api(`/api/expenses/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
        } catch (e) {
          get().addToast(`Save failed: ${(e as Error).message}`, "error");
          if (prev) set((s) => ({ expenses: s.expenses.map((x) => (x.id === id ? prev : x)) }));
        }
      },
      deleteExpense: async (id) => {
        const prev = get().expenses.find((e) => e.id === id);
        set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) }));
        try {
          await api(`/api/expenses/${id}`, { method: "DELETE" });
        } catch (e) {
          get().addToast(`Delete failed: ${(e as Error).message}`, "error");
          if (prev) set((s) => ({ expenses: [...s.expenses, prev] }));
        }
      },

      addHead: async (head) => {
        const id = generateId();
        const month = get().currentMonth;
        set((s) => ({ heads: [...s.heads, { ...head, id }] }));
        try {
          await api("/api/heads", { method: "POST", body: JSON.stringify({ id, month, ...head }) });
        } catch (e) {
          get().addToast(`Save failed: ${(e as Error).message}`, "error");
          set((s) => ({ heads: s.heads.filter((x) => x.id !== id) }));
        }
      },
      updateHead: async (id, patch) => {
        const prev = get().heads.find((h) => h.id === id);
        set((s) => ({ heads: s.heads.map((h) => (h.id === id ? { ...h, ...patch } : h)) }));
        try {
          await api(`/api/heads/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
        } catch (e) {
          get().addToast(`Save failed: ${(e as Error).message}`, "error");
          if (prev) set((s) => ({ heads: s.heads.map((x) => (x.id === id ? prev : x)) }));
        }
      },
      deleteHead: async (id) => {
        const prev = get().heads.find((h) => h.id === id);
        set((s) => ({ heads: s.heads.filter((h) => h.id !== id) }));
        try {
          await api(`/api/heads/${id}`, { method: "DELETE" });
        } catch (e) {
          get().addToast(`Delete failed: ${(e as Error).message}`, "error");
          if (prev) set((s) => ({ heads: [...s.heads, prev] }));
        }
      },

      setClientPercentage: async (clientId, percentages) => {
        const month = get().currentMonth;
        set((s) => {
          const existing = s.percentages.find((p) => p.clientId === clientId);
          if (existing) {
            return {
              percentages: s.percentages.map((p) =>
                p.clientId === clientId ? { ...p, percentages } : p
              ),
            };
          }
          return { percentages: [...s.percentages, { clientId, percentages }] };
        });
        try {
          await api("/api/percentages", {
            method: "PUT",
            body: JSON.stringify({ month, clientId, percentages }),
          });
        } catch (e) {
          get().addToast(`Save failed: ${(e as Error).message}`, "error");
        }
      },

      setClientSectionHeads: async (clientId, sections) => {
        const month = get().currentMonth;
        set((s) => {
          const existing = s.sectionHeads.find((sh) => sh.clientId === clientId);
          if (existing) {
            return {
              sectionHeads: s.sectionHeads.map((sh) =>
                sh.clientId === clientId ? { ...sh, sections } : sh
              ),
            };
          }
          return { sectionHeads: [...s.sectionHeads, { clientId, sections }] };
        });
        try {
          await api("/api/section-heads", {
            method: "PUT",
            body: JSON.stringify({ month, clientId, sections }),
          });
        } catch (e) {
          get().addToast(`Save failed: ${(e as Error).message}`, "error");
        }
      },

      addToast: (message, type) => {
        const id = generateId();
        set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
        setTimeout(() => get().removeToast(id), 3500);
      },
      removeToast: (id) =>
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

      hydrateAuth: async () => {
        try {
          const res = await fetch("/api/auth/me", { cache: "no-store" });
          const data = (await res.json()) as { user: CurrentUser | null };
          set({ currentUser: data.user, authLoading: false });
          if (data.user) {
            await get().hydrateFinanceData();
          }
        } catch {
          set({ currentUser: null, authLoading: false });
        }
      },

      hydrateFinanceData: async () => {
        const month = get().currentMonth;
        try {
          const res = await fetch(`/api/state?month=${encodeURIComponent(month)}`, {
            cache: "no-store",
          });
          if (!res.ok) return;
          const data = await res.json();
          set({
            clients: data.clients || [],
            employees: data.employees || [],
            expenses: data.expenses || [],
            heads: data.heads || [],
            percentages: data.percentages || [],
            sectionHeads: data.sectionHeads || [],
          });
        } catch {
          /* keep whatever was already there */
        }
      },

      login: async (username, password) => {
        try {
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
          });
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            return { ok: false, error: data.error || "Login failed" };
          }
          await get().hydrateAuth();
          const u = get().currentUser;
          const active = get().activeTab;
          if (u && !u.allowedTabs.includes(active)) {
            set({ activeTab: u.allowedTabs[0] || "overview" });
          }
          return { ok: true };
        } catch {
          return { ok: false, error: "Network error" };
        }
      },

      logout: async () => {
        try {
          await fetch("/api/auth/logout", { method: "POST" });
        } catch {}
        set({
          currentUser: null,
          authLoading: false,
          clients: [],
          employees: [],
          expenses: [],
          heads: [],
          percentages: [],
          sectionHeads: [],
        });
      },
    }),
    {
      name: "agency-finance-store",
      // Only persist UI preferences; finance data + auth are always fetched from server
      partialize: (state) => ({
        currentMonth: state.currentMonth,
        activeTab: state.activeTab,
        theme: state.theme,
      }),
    }
  )
);
