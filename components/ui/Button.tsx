"use client";
import { motion, type MotionProps } from "framer-motion";
import { cn } from "@/lib/cn";
import { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  MotionProps & {
    variant?: "gold" | "glass" | "ghost" | "danger";
    size?: "sm" | "md" | "lg";
    icon?: React.ReactNode;
  };

export function Button({
  variant = "glass",
  size = "md",
  icon,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-colors duration-150 cursor-pointer select-none disabled:opacity-40 disabled:cursor-not-allowed";

  const variants = {
    gold: "bg-[#d4a017] text-black hover:bg-[#f0c040] shadow-[0_0_20px_rgba(212,160,23,0.25)]",
    glass: "glass hover:bg-white/10 text-white/90",
    ghost: "hover:bg-white/6 text-white/70 hover:text-white",
    danger: "bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-sm font-semibold",
  };

  return (
    <motion.button
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={{ duration: 0.1 }}
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="flex-shrink-0" aria-hidden="true">{icon}</span>}
      {children}
    </motion.button>
  );
}
