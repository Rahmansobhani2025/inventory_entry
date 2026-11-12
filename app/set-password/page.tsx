"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Lock, Eye, EyeOff, Check, AlertTriangle, ArrowLeft, KeyRound } from "lucide-react";

export default function SetPasswordPage() {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let resolved = false;

    // 1. Initial check
    const checkInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          resolved = true;
          setHasSession(true);
        }
      } catch (err) {
        console.error("Session verification error:", err);
      }
    };
    checkInitialSession();

    // 2. Listen for PASSWORD_RECOVERY and SIGNED_IN events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN")) {
        resolved = true;
        setHasSession(true);
      }
    });

    // 3. 3-second fallback timer if no session is resolved
    const timer = setTimeout(() => {
      if (!resolved) {
        setHasSession(false);
      }
    }, 3000);

    return () => {
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validate at least 10 characters
    if (password.length < 10) {
      setErrorMsg("Password must be at least 10 characters long.");
      return;
    }

    // Validate match
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match. Please ensure both fields are identical.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Never log the password
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setErrorMsg(error.message || "Failed to update password. Please try again.");
        setIsSubmitting(false);
        return;
      }

      setSuccessMsg("Password updated. You can now sign in.");

      // Sign out and redirect to "/" after 2 seconds
      setTimeout(async () => {
        try {
          await supabase.auth.signOut();
        } catch {
          // Ignore signOut errors during redirect
        }
        startTransition(() => {
          router.push("/");
        });
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err?.message || "An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen text-gray-100 bg-[#121212] font-sans items-center justify-center p-6 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-[-30%] left-[-20%] w-[60%] h-[60%] rounded-full bg-[#D4AF37]/5 blur-[220px]" />
      <div className="absolute bottom-[-30%] right-[-20%] w-[60%] h-[60%] rounded-full bg-neutral-900/40 blur-[200px]" />

      <div className="w-full max-w-xl z-10">
        {/* Brand header */}
        <div className="flex flex-col items-center mb-8">
          <img
            src="https://i.imgur.com/wf6xiJJ.png"
            alt="Envision AI Logo"
            className="h-28 w-auto object-contain mb-3"
          />
          <div className="text-center">
            <h2 className="text-lg font-mono tracking-[0.25em] text-[#D4AF37] uppercase">
              SECURITY CREDENTIAL PORTAL
            </h2>
            <p className="text-xs font-mono text-neutral-400 uppercase tracking-widest mt-1">
              Operator Access Authorization
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-neutral-950/80 backdrop-blur-md rounded-2xl border border-neutral-800/80 p-8 md:p-10 shadow-2xl relative">
          <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent" />

          {/* Loading state (checking session during the first 3 seconds) */}
          {hasSession === null && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="inline-block p-4 rounded-xl bg-neutral-900 border border-neutral-800">
                <KeyRound className="h-8 w-8 text-[#D4AF37] animate-pulse" />
              </div>
              <h3 className="text-lg font-bold font-mono text-white uppercase tracking-wider">
                Verifying recovery credentials...
              </h3>
              <p className="text-sm font-mono text-neutral-400">
                Please wait while we establish your secure session.
              </p>
            </div>
          )}

          {/* Invalid / expired session */}
          {hasSession === false && (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-6">
              <div className="p-4 rounded-xl bg-red-950/30 border border-red-900/40 text-red-400">
                <AlertTriangle className="h-10 w-10 text-red-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold font-mono text-white">
                  Link Invalid or Expired
                </h3>
                <p className="text-sm font-mono text-neutral-400 max-w-sm">
                  This link is invalid or has expired. Please ask for a new one.
                </p>
              </div>
              <button
                type="button"
                onClick={() => router.push("/")}
                className="bg-[#D4AF37] hover:bg-[#c49e2e] text-black font-bold font-mono tracking-wider text-sm uppercase py-3 px-6 rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-[0_4px_20px_rgba(212,175,55,0.15)]"
              >
                <ArrowLeft className="h-4 w-4 text-black" />
                <span>Return to Sign In</span>
              </button>
            </div>
          )}

          {/* Active session - Create new password form */}
          {hasSession === true && (
            <>
              <div className="mb-8 text-center">
                <span className="inline-block p-4 rounded-xl bg-neutral-900 border border-neutral-800 mb-3">
                  <Lock className="h-8 w-8 text-[#D4AF37]" />
                </span>
                <h3 className="text-xl font-bold tracking-widest text-white uppercase font-display">
                  Create your new password
                </h3>
                <p className="text-sm text-neutral-400 mt-1">
                  Enter and confirm your new secure operational password.
                </p>
              </div>

              {errorMsg && (
                <div className="p-4 bg-red-950/30 border border-red-900/40 text-red-400 rounded-lg text-sm font-mono mb-6 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg ? (
                <div className="py-6 flex flex-col items-center text-center space-y-4">
                  <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-900/40 text-emerald-400">
                    <Check className="h-8 w-8 text-emerald-400" />
                  </div>
                  <h4 className="text-lg font-bold font-mono text-white">
                    {successMsg}
                  </h4>
                  <p className="text-xs font-mono text-neutral-400 animate-pulse">
                    Redirecting to the login portal in a moment...
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* New Password */}
                  <div>
                    <label className="text-xs font-mono uppercase tracking-wider text-neutral-300 block mb-2">
                      New Password (min. 10 characters)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-neutral-500">
                        <Lock className="h-5 w-5" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#D4AF37] rounded-xl py-3 pl-12 pr-12 text-sm font-mono text-white placeholder-neutral-600 outline-none transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-4 flex items-center text-neutral-500 hover:text-neutral-300 transition-colors focus:outline-none cursor-pointer"
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="text-xs font-mono uppercase tracking-wider text-neutral-300 block mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-neutral-500">
                        <Lock className="h-5 w-5" />
                      </div>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#D4AF37] rounded-xl py-3 pl-12 pr-12 text-sm font-mono text-white placeholder-neutral-600 outline-none transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-4 flex items-center text-neutral-500 hover:text-neutral-300 transition-colors focus:outline-none cursor-pointer"
                        title={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#D4AF37] hover:bg-[#c49e2e] disabled:bg-neutral-800 text-black disabled:text-neutral-500 font-bold font-mono tracking-widest text-sm uppercase py-3.5 px-6 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(212,175,55,0.15)] hover:shadow-[0_4px_25px_rgba(212,175,55,0.25)] mt-6"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="inline-block animate-spin h-5 w-5 border-2 border-black border-t-transparent rounded-full" />
                        <span>UPDATING PASSWORD...</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-5 w-5 text-black" />
                        <span>UPDATE PASSWORD</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
