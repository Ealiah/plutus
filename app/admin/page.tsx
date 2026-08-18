"use client";
import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { Dashboard } from "@/components/Dashboard";
import { LoginPage } from "@/components/LoginPage";

export default function Home() {
  const currentUser = useStore((s) => s.currentUser);
  const authLoading = useStore((s) => s.authLoading);
  const hydrateAuth = useStore((s) => s.hydrateAuth);

  useEffect(() => {
    hydrateAuth();
  }, [hydrateAuth]);

  if (authLoading) {
    return (
      <div
        className="h-screen flex items-center justify-center"
        style={{ background: "var(--navy)" }}
      >
        <div className="w-6 h-6 rounded-full border-2 border-[#d4a017]/25 border-t-[#d4a017] animate-spin" />
      </div>
    );
  }

  return currentUser ? <Dashboard /> : <LoginPage />;
}
