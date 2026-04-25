"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AlertCircle, Loader2, Mail, Lock, User } from "lucide-react";

type Mode = "login" | "signup";
type Status = "idle" | "loading" | "error" | "success";

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });
      if (error) {
        setStatus("error");
        setMessage(error.message);
        return;
      }
      setStatus("success");
      setMessage("Account created! Check your email to confirm, then sign in.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setStatus("error");
        setMessage(error.message);
        return;
      }
      window.location.href = "/dashboard";
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-yellow-500 tracking-tight">
            OGMJ Brands
          </h1>
          <p className="text-gray-400 text-sm mt-2">Business Management Platform</p>
        </div>

        <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-8">
          {/* Tab toggle */}
          <div className="flex bg-[#111] rounded-xl p-1 mb-6">
            {(["login", "signup"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setStatus("idle"); setMessage(""); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === m
                    ? "bg-yellow-500 text-black"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {m === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          {/* Alerts */}
          {status === "error" && (
            <div className="mb-4 bg-red-950/50 border border-red-800 rounded-xl p-3 flex gap-2 items-start">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-red-300 text-sm">{message}</p>
            </div>
          )}
          {status === "success" && (
            <div className="mb-4 bg-green-950/50 border border-green-800 rounded-xl p-3">
              <p className="text-green-300 text-sm">{message}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="text-gray-400 text-xs font-medium mb-1.5 block">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full bg-[#111] border border-gray-700 rounded-xl pl-10 pr-4 py-3
                      text-white text-sm placeholder-gray-600
                      focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/30 transition"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-gray-400 text-xs font-medium mb-1.5 block">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full bg-[#111] border border-gray-700 rounded-xl pl-10 pr-4 py-3
                    text-white text-sm placeholder-gray-600
                    focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/30 transition"
                />
              </div>
            </div>

            <div>
              <label className="text-gray-400 text-xs font-medium mb-1.5 block">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full bg-[#111] border border-gray-700 rounded-xl pl-10 pr-4 py-3
                    text-white text-sm placeholder-gray-600
                    focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/30 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-60
                text-black font-bold rounded-xl flex items-center justify-center gap-2
                transition-all mt-2"
            >
              {status === "loading" && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              {mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
