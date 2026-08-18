"use client";
import { useState, useId } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useStore } from "@/lib/store";

export function LoginPage() {
  const { login, addToast } = useStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const usernameId = useId();
  const passwordId = useId();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login(username, password);
    if (!result.ok) {
      setError(result.error || "Invalid username or password.");
      setLoading(false);
    } else {
      addToast("Welcome back!", "success");
    }
  }

  return (
    <div
      className="h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: "var(--navy)" }}
    >
      <div
        aria-hidden="true"
        className="absolute top-[-180px] left-[-120px] w-[520px] h-[520px] rounded-full pointer-events-none opacity-25"
        style={{
          background: "radial-gradient(circle, rgba(212,160,23,0.18) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute bottom-[-160px] right-[-80px] w-[420px] h-[420px] rounded-full pointer-events-none opacity-20"
        style={{
          background: "radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute top-[40%] right-[15%] w-[280px] h-[280px] rounded-full pointer-events-none opacity-10"
        style={{
          background: "radial-gradient(circle, rgba(212,160,23,0.2) 0%, transparent 70%)",
          filter: "blur(50px)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-sm mx-4"
      >
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px rounded-full opacity-70"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(212,160,23,0.6), transparent)",
          }}
        />

        <div
          className="rounded-2xl p-8"
          style={{
            background: "rgba(255,255,255,0.055)",
            backdropFilter: "blur(28px)",
            WebkitBackdropFilter: "blur(28px)",
            border: "1px solid rgba(255,255,255,0.11)",
            boxShadow: "0 40px 80px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.06) inset",
          }}
        >
          <div className="flex flex-col items-center mb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="w-14 h-14 mb-4"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Plutus logo" width={56} height={56} className="w-full h-full object-cover" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="text-center"
            >
              <h1 className="text-xl font-bold text-white/95 tracking-tight">Agency Finance</h1>
              <p className="text-xs text-white/35 mt-1 tracking-wide uppercase">Finance Operating System</p>
            </motion.div>
          </div>

          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.35 }}
            onSubmit={handleSubmit}
            className="flex flex-col gap-4"
            aria-label="Login form"
          >
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor={usernameId}
                className="text-xs font-medium text-white/45 uppercase tracking-wider"
              >
                Username
              </label>
              <input
                id={usernameId}
                type="text"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(""); }}
                placeholder="Enter username"
                className="w-full px-4 py-3 rounded-xl text-sm text-white/90 placeholder:text-white/20 transition-colors duration-150"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  outline: "none",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(212,160,23,0.45)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor={passwordId}
                className="text-xs font-medium text-white/45 uppercase tracking-wider"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id={passwordId}
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="Enter password"
                  className="w-full px-4 py-3 pr-11 rounded-xl text-sm text-white/90 placeholder:text-white/20 transition-colors duration-150"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    outline: "none",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(212,160,23,0.45)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/30 hover:text-white/60 transition-colors duration-150"
                >
                  {showPassword
                    ? <EyeOff size={15} aria-hidden="true" />
                    : <Eye size={15} aria-hidden="true" />
                  }
                </button>
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                role="alert"
                className="text-xs text-red-400 text-center px-2 py-1.5 rounded-lg"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
              >
                {error}
              </motion.p>
            )}

            <motion.button
              type="submit"
              disabled={loading || !username || !password}
              whileTap={loading ? undefined : { scale: 0.98 }}
              transition={{ duration: 0.1 }}
              className="mt-1 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg, #d4a017 0%, #b8860b 100%)",
                color: "#000",
                boxShadow: "0 0 24px rgba(212,160,23,0.3)",
              }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span
                    className="w-4 h-4 rounded-full border-2 border-[#000]/25 border-t-[#000] animate-spin"
                    aria-hidden="true"
                  />
                  Signing in…
                </span>
              ) : (
                <>
                  <LogIn size={15} aria-hidden="true" />
                  Sign In
                </>
              )}
            </motion.button>
          </motion.form>

        </div>
      </motion.div>
    </div>
  );
}
