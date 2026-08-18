import { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const base =
  "w-full px-3.5 py-2.5 rounded-xl glass border-white/10 text-white/90 text-sm placeholder:text-white/25 focus:border-[rgba(212,160,23,0.4)] focus:bg-white/6 transition-colors duration-150";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(base, className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(base, "resize-none", className)} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(base, "appearance-none cursor-pointer", className)}
      style={{ background: "var(--navy)" }}
      {...props}
    >
      {children}
    </select>
  );
}

export function FormField({
  label,
  children,
  error,
  htmlFor,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
  htmlFor?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="text-xs font-medium text-white/50 uppercase tracking-wider"
      >
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-red-400" role="alert">{error}</p>}
    </div>
  );
}
