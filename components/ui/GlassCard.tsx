"use client";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/cn";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  variant?: "default" | "strong" | "gold";
  glow?: boolean;
}

export function GlassCard({
  variant = "default",
  glow = false,
  className,
  children,
  ...props
}: GlassCardProps) {
  const base =
    "rounded-2xl overflow-hidden relative";
  const variants = {
    default: "glass",
    strong: "glass-strong",
    gold: "glass-gold",
  };

  return (
    <motion.div
      className={cn(base, variants[variant], glow && "gold-ring", className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
