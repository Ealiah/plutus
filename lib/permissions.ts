export const ALL_TABS = [
  "overview",
  "details",
  "salaries",
  "expenses",
  "heads",
  "percentages",
  "gallery",
  "users",
] as const;

export type TabId = (typeof ALL_TABS)[number];

export const TAB_LABELS: Record<TabId, string> = {
  overview: "Overview",
  details: "Details",
  salaries: "Salaries",
  expenses: "Expenses",
  heads: "Heads",
  percentages: "Percentages",
  gallery: "Gallery",
  users: "Users",
};

export const OWNER_ONLY_TABS: TabId[] = ["users"];

export const DEFAULT_ROLES: Array<{
  name: string;
  allowedTabs: TabId[];
  isSystem: boolean;
}> = [
  {
    name: "owner",
    allowedTabs: [...ALL_TABS],
    isSystem: true,
  },
  {
    name: "accountant",
    allowedTabs: ["overview", "details", "salaries", "expenses", "heads", "percentages"],
    isSystem: false,
  },
  {
    name: "manager",
    allowedTabs: ["overview", "details", "heads", "percentages"],
    isSystem: false,
  },
  {
    name: "viewer",
    allowedTabs: ["overview"],
    isSystem: false,
  },
];
