import { cn } from "@/lib/cn";
import { PaymentStatus } from "@/lib/types";

const statusConfig: Record<PaymentStatus, { label: string; classes: string }> = {
  Paid: { label: "Paid", classes: "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400" },
  Partial: { label: "Partial", classes: "bg-amber-500/15 border border-amber-500/30 text-amber-400" },
  Pending: { label: "Pending", classes: "bg-blue-500/15 border border-blue-500/30 text-blue-400" },
  Overdue: { label: "Overdue", classes: "bg-red-500/15 border border-red-500/30 text-red-400" },
};

export function StatusBadge({ status }: { status: PaymentStatus }) {
  const cfg = statusConfig[status];
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium", cfg.classes)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80" />
      {cfg.label}
    </span>
  );
}

export function DeptBadge({ dept }: { dept: string }) {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white/6 border border-white/10 text-white/70">
      {dept}
    </span>
  );
}
