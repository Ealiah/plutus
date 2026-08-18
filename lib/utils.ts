import {
  Client, Employee, Expense,
  ClientPercentage, ClientSectionHead, Department,
} from "./types";

export function formatIQD(amount: number): string {
  return new Intl.NumberFormat("en-IQ", {
    style: "currency",
    currency: "IQD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// ── Income ────────────────────────────────────────────────────────────────────

export function getTotalExpectedIncome(clients: Client[]): number {
  return clients.reduce((sum, c) => sum + c.expectedIncome, 0);
}

export function getTotalActualIncome(clients: Client[]): number {
  return clients.reduce((sum, c) => sum + c.actualIncome, 0);
}

export function getOutstanding(clients: Client[]): number {
  return getTotalExpectedIncome(clients) - getTotalActualIncome(clients);
}

// ── Costs ─────────────────────────────────────────────────────────────────────

export function getTotalSalaries(employees: Employee[]): number {
  return employees.reduce((sum, e) => sum + e.salary + e.bonus, 0);
}

/** Recurring expenses (type="Recurring") + all salaries — what's deducted before distributing. */
export function getRecurringCosts(expenses: Expense[], employees: Employee[]): number {
  const recurringExp = expenses
    .filter((e) => e.type === "Recurring")
    .reduce((sum, e) => sum + e.amount, 0);
  return recurringExp + getTotalSalaries(employees);
}

/** All expenses (recurring + one-time) + salaries — full cost picture. */
export function getTotalExpenses(expenses: Expense[], employees: Employee[]): number {
  return expenses.reduce((sum, e) => sum + e.amount, 0) + getTotalSalaries(employees);
}

// ── Net / Distributable ───────────────────────────────────────────────────────

/**
 * What remains after paying recurring costs (recurring expenses + salaries).
 * This is the amount distributed to heads.
 */
export function getNetDistributable(
  clients: Client[],
  expenses: Expense[],
  employees: Employee[]
): number {
  return getTotalActualIncome(clients) - getRecurringCosts(expenses, employees);
}

/** Full net profit = actual income − all expenses − salaries. */
export function getNetProfit(
  clients: Client[],
  expenses: Expense[],
  employees: Employee[]
): number {
  return getTotalActualIncome(clients) - getTotalExpenses(expenses, employees);
}

// ── Head calculations (section-based) ────────────────────────────────────────

/**
 * Gross revenue managed by a head:
 * Σ (client.actualIncome × deptPercentage / 100)
 * for every (client, department) pair where this head is assigned.
 */
export function getHeadSectionGross(
  headId: string,
  clients: Client[],
  sectionHeads: ClientSectionHead[],
  percentages: ClientPercentage[]
): number {
  let total = 0;
  for (const client of clients) {
    const sh = sectionHeads.find((s) => s.clientId === client.id);
    if (!sh) continue;
    const cp = percentages.find((p) => p.clientId === client.id);
    if (!cp) continue;
    for (const [dept, assignedHeadId] of Object.entries(sh.sections)) {
      if (assignedHeadId !== headId) continue;
      const pct = cp.percentages[dept] ?? 0;
      total += (client.actualIncome * pct) / 100;
    }
  }
  return total;
}

/**
 * Head's net share after recurring costs are deducted proportionally.
 * headNet = headGross × (netDistributable / totalActualIncome)
 */
export function getHeadSectionNet(
  headId: string,
  clients: Client[],
  sectionHeads: ClientSectionHead[],
  percentages: ClientPercentage[],
  expenses: Expense[],
  employees: Employee[]
): number {
  const gross = getHeadSectionGross(headId, clients, sectionHeads, percentages);
  const totalIncome = getTotalActualIncome(clients);
  if (totalIncome === 0) return 0;
  const net = getNetDistributable(clients, expenses, employees);
  return gross * (net / totalIncome);
}

// ── Department revenue ────────────────────────────────────────────────────────

export function getDepartmentRevenue(
  clients: Client[],
  percentages: ClientPercentage[],
  department: Department
): number {
  return clients.reduce((sum, client) => {
    const cp = percentages.find((p) => p.clientId === client.id);
    if (!cp) return sum;
    const pct = cp.percentages[department] || 0;
    return sum + (client.actualIncome * pct) / 100;
  }, 0);
}

export function getDepartmentExpectedRevenue(
  clients: Client[],
  percentages: ClientPercentage[],
  department: Department
): number {
  return clients.reduce((sum, client) => {
    const cp = percentages.find((p) => p.clientId === client.id);
    if (!cp) return sum;
    const pct = cp.percentages[department] || 0;
    return sum + (client.expectedIncome * pct) / 100;
  }, 0);
}

// ── Misc ──────────────────────────────────────────────────────────────────────

export function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function formatMonth(monthKey: string): string {
  const [year, month] = monthKey.split("-");
  return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}
