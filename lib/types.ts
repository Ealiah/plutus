export type Department =
  | "Designing"
  | "Photographer"
  | "Video Editing"
  | "Copywriting"
  | "Coordinator"
  | "Marketing"
  | "Posting";

export const DEPARTMENTS: Department[] = [
  "Designing",
  "Photographer",
  "Video Editing",
  "Copywriting",
  "Coordinator",
  "Marketing",
  "Posting",
];

export type PaymentStatus = "Paid" | "Partial" | "Pending" | "Overdue";

export type ExpenseCategory =
  | "Software"
  | "Equipment"
  | "Ads"
  | "Rent"
  | "Internet"
  | "Miscellaneous";

export type ExpenseType = "Recurring" | "One-time";

export interface Client {
  id: string;
  name: string;
  expectedIncome: number;
  actualIncome: number;
  paymentStatus: PaymentStatus;
  date: string;
  notes: string;
  headId: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  department: Department;
  salary: number;
  bonus: number;
}

export interface Expense {
  id: string;
  name: string;
  type: ExpenseType;
  amount: number;
  category: ExpenseCategory;
  head: string;
  date: string;
  notes: string;
}

export interface Head {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface DepartmentPercentage {
  [dept: string]: number;
}

export interface ClientPercentage {
  clientId: string;
  percentages: DepartmentPercentage;
}

export interface ClientSectionHead {
  clientId: string;
  sections: Record<string, string>; // Department -> Head ID
}

export interface MonthData {
  clients: Client[];
  expenses: Expense[];
  percentages: ClientPercentage[];
  sectionHeads: ClientSectionHead[];
  heads: Head[];
  employees: Employee[];
}

export interface CurrentUser {
  id: string;
  username: string;
  roleName: string;
  allowedTabs: string[];
  isOwner: boolean;
}

export interface AppState {
  currentMonth: string;
  monthlyData: Record<string, MonthData>;
  clients: Client[];
  employees: Employee[];
  expenses: Expense[];
  heads: Head[];
  percentages: ClientPercentage[];
  sectionHeads: ClientSectionHead[];
  activeTab: string;
  theme: "dark" | "light";
  toasts: Toast[];
  currentUser: CurrentUser | null;
  authLoading: boolean;
}

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}
