"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion, type Variants } from "framer-motion";
import {
  ShieldCheck,
  Activity,
  HeartPulse,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Utensils,
  Eye as EyeIcon,
  CheckCircle2,
  WifiOff,
  LogIn,
  UserPlus,
} from "lucide-react";
import { WarmBackground } from "./WarmBackground";
import { PulsingOrb } from "./PulsingOrb";
import { BANGLADESH_DISTRICTS } from "@/types";
import { friendlyAuthError } from "@/lib/auth-errors";
import { sendCacheAll } from "@/lib/cache-all";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/shared/LanguageToggle";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

interface AuthLandingPageProps {
  defaultMode?: "login" | "register";
  onLoginSuccess?: () => void;
}

const formVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 28 : -28,
    opacity: 0,
    filter: "blur(4px)",
  }),
  center: {
    x: 0,
    opacity: 1,
    filter: "blur(0px)",
    transition: {
      x: { type: "spring" as const, stiffness: 380, damping: 32 },
      opacity: { duration: 0.22, ease: "easeOut" },
      filter: { duration: 0.22 },
    },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -28 : 28,
    opacity: 0,
    filter: "blur(4px)",
    transition: {
      x: { type: "spring" as const, stiffness: 380, damping: 32 },
      opacity: { duration: 0.18, ease: "easeIn" },
      filter: { duration: 0.18 },
    },
  }),
};

export default function AuthLandingPage({
  defaultMode = "login",
  onLoginSuccess,
}: AuthLandingPageProps) {
  const router = useRouter();
  const { lang, setLang } = useLanguage();
  const shouldReduceMotion = useReducedMotion();

  // Mode and transition direction
  const [[mode, direction], setModeWithDirection] = useState<
    ["login" | "register", number]
  >([defaultMode, 0]);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [district, setDistrict] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [preferredLang, setPreferredLang] = useState<"bn" | "en">(lang || "bn");

  const switchMode = (newMode: "login" | "register") => {
    if (newMode === mode) return;
    const dir = newMode === "register" ? 1 : -1;
    setModeWithDirection([newMode, dir]);
    setError(null);
    setSuccessMessage(null);
  };

  // Quick fill demo credentials
  const fillDemoCredentials = () => {
    setEmail("demo@antigravity.ai");
    setPassword("DemoPass123!");
    setError(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!email.trim() || !password) {
        throw new Error(
          lang === "bn"
            ? "অনুগ্রহ করে ইমেইল ও পাসওয়ার্ড উভয়ই প্রদান করুন।"
            : "Please enter both email and password."
        );
      }

      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(friendlyAuthError(signInError.message));
        setLoading(false);
        return;
      }

      sendCacheAll();
      if (onLoginSuccess) {
        onLoginSuccess();
      } else {
        router.push("/nayan-ai");
      }
    } catch (err: unknown) {
      setError(
        friendlyAuthError(
          err instanceof Error ? err.message : "Authentication failed"
        )
      );
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (!name.trim()) {
        throw new Error(
          lang === "bn" ? "আপনার পুরো নাম লিখুন।" : "Please enter your full name."
        );
      }
      if (!email.trim()) {
        throw new Error(
          lang === "bn" ? "সঠিক ইমেইল ঠিকানা লিখুন।" : "Please enter a valid email address."
        );
      }
      if (!/^01[3-9]\d{8}$/.test(phone.trim())) {
        throw new Error(
          lang === "bn"
            ? "সঠিক বাংলাদেশী মোবাইল নম্বর দিন (০১XXXXXXXXX)"
            : "Enter a valid Bangladeshi phone number (01XXXXXXXXX)"
        );
      }
      if (!district) {
        throw new Error(
          lang === "bn" ? "অনুগ্রহ করে আপনার জেলা নির্বাচন করুন।" : "Please select your district."
        );
      }
      if (password.length < 8) {
        throw new Error(
          lang === "bn"
            ? "পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।"
            : "Password must be at least 8 characters long."
        );
      }
      if (password !== confirmPassword) {
        throw new Error(
          lang === "bn"
            ? "পাসওয়ার্ড দুটি মিলছে না।"
            : "Passwords do not match."
        );
      }

      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            name: name.trim(),
            phone: phone.trim(),
            district,
            preferred_language: preferredLang,
          },
        },
      });

      if (signUpError) {
        setError(friendlyAuthError(signUpError.message));
        setLoading(false);
        return;
      }

      setSuccessMessage(
        lang === "bn"
          ? "আপনার ইমেইলে নিশ্চিতকরণ লিঙ্ক পাঠানো হয়েছে। অনুগ্রহ করে ইনবক্স বা স্প্যাম ফোল্ডার চেক করুন।"
          : "Verification link sent! Please check your email inbox and spam folder."
      );
      setLoading(false);
    } catch (err: unknown) {
      setError(
        friendlyAuthError(
          err instanceof Error ? err.message : "Registration failed"
        )
      );
      setLoading(false);
    }
  };

  const stats = [
    {
      value: lang === "bn" ? "৪টি এআই" : "4-Agent",
      label: lang === "bn" ? "ক্লিনিক্যাল ইঞ্জিন" : "Clinical Engine",
    },
    {
      value: "100%",
      label: lang === "bn" ? "অন-ডিভাইস অফলাইন" : "Offline Ready",
    },
    {
      value: lang === "bn" ? "১৫০+" : "150+",
      label: lang === "bn" ? "দেশি ওষুধ ও খাবার" : "BD Drugs & Foods",
    },
    {
      value: "100%",
      label: lang === "bn" ? "ব্যক্তিগত ও নিরাপদ" : "Encrypted",
    },
  ];

  const features = [
    {
      icon: EyeIcon,
      gradient: "from-sky-500 to-cyan-500",
      shadow: "shadow-sky-500/25",
      badgeEn: "Offline Ready",
      badgeBn: "অফলাইনে চলে",
      badgeClass: "bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400 border border-sky-500/20",
      titleEn: "Nayan AI",
      titleBn: "নয়ান AI",
      descEn: "Retinopathy & Cataract Screening (TF.js CNN)",
      descBn: "অন-ডিভাইস রেটিনোপ্যাথি ও ছানি স্ক্রিনিং",
    },
    {
      icon: FileText,
      gradient: "from-emerald-500 to-teal-500",
      shadow: "shadow-emerald-500/25",
      badgeEn: "65+ BD Drugs",
      badgeBn: "৬৫+ দেশী ওষুধ",
      badgeClass: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/20",
      titleEn: "ScriptGuard",
      titleBn: "স্ক্রিপ্টগার্ড",
      descEn: "Prescription OCR & Safety Drug Checker",
      descBn: "প্রেসক্রিপশন বিশ্লেষণ ও ওষুধের সুরক্ষা",
    },
    {
      icon: Utensils,
      gradient: "from-amber-500 to-orange-500",
      shadow: "shadow-amber-500/25",
      badgeEn: "85+ BD Foods",
      badgeBn: "৮৫+ দেশী খাবার",
      badgeClass: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/20",
      titleEn: "GlycoVision",
      titleBn: "গ্লাইকোভিশন",
      descEn: "Meal Nutrition & Glycemic Load Tracker",
      descBn: "খাদ্য পুষ্টিমান ও ডায়াবেটিস ঝুঁকি ট্র্যাকার",
    },
    {
      icon: Activity,
      gradient: "from-rose-500 to-pink-500",
      shadow: "shadow-rose-500/25",
      badgeEn: "2-Min Triage",
      badgeBn: "২ মিনিটে যাচাই",
      badgeClass: "bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-500/20",
      titleEn: "Lokhon & Bondhu",
      titleBn: "লক্ষণ ও বন্ধু",
      descEn: "Clinical Symptom Triage & AI Voice Chat",
      descBn: "লক্ষণ যাচাই ও কণ্ঠস্বরে সার্বক্ষণিক চ্যাট",
    },
  ];

  return (
    <div className="min-h-screen w-full relative flex flex-col justify-between overflow-x-hidden bg-gray-50/80 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors">
      <WarmBackground />

      {/* ── 1. UNIFIED FULL-WIDTH HEADER (Settled Logo & Aligned Navigation Controls) ── */}
      <header className="relative z-20 w-full max-w-[1560px] mx-auto px-6 sm:px-12 lg:px-20 xl:px-24 pt-6 sm:pt-8 pb-3 flex items-center justify-between">
        {/* Left: Settled Brand Logo + Identity */}
        <Link href="/" className="flex items-center gap-3.5 group">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-sky-500 via-cyan-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-sky-500/25 dark:shadow-sky-500/20 group-hover:scale-105 transition-transform">
            <HeartPulse className="w-6 h-6 text-white" strokeWidth={2.6} />
          </div>
          <div className="flex items-center gap-2.5">
            <span className="font-extrabold text-2xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-cyan-500 to-emerald-500 dark:from-sky-400 dark:via-cyan-400 dark:to-emerald-400">
              ShasthyaHub-AI
            </span>
            <span className="hidden sm:inline-block text-xs px-2.5 py-0.5 rounded-full font-bold bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/25 shadow-xs">
              v2.5 · Multi-Agent Suite
            </span>
          </div>
        </Link>

        {/* Right: Controls (Demos + Theme + Language) cleanly grouped */}
        <div className="flex items-center gap-3 sm:gap-3.5">
          <Link
            href="/demo"
            className="group inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-sky-700 dark:text-sky-300 bg-white/90 dark:bg-gray-900/90 hover:bg-white dark:hover:bg-gray-800 border border-sky-200 dark:border-sky-800/80 shadow-xs hover:shadow-md transition-all"
          >
            <Sparkles className="w-4 h-4 text-amber-500 group-hover:rotate-12 transition-transform" />
            <span className={lang === "bn" ? "font-bengali text-xs sm:text-[13px] font-semibold" : ""}>
              {lang === "bn" ? "ডেমো দেখুন" : "Explore Demos"}
            </span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <div className="h-5 w-px bg-gray-200 dark:bg-gray-800 hidden sm:block" />

          <ThemeToggle />
          <LanguageToggle />
        </div>
      </header>

      {/* ── 2. PROMINENT 2-COLUMN HERO & AUTH WORKSPACE (Extra Spacious Center Separation) ── */}
      <main className="relative z-10 w-full max-w-[1560px] mx-auto px-6 sm:px-12 lg:px-20 xl:px-24 flex-1 grid lg:grid-cols-12 gap-12 lg:gap-20 xl:gap-32 items-center justify-between py-6 lg:py-10">
        
        {/* ── LEFT COLUMN: Generous Clinical Showcase (7 Cols, Positioned with Left Affinity) ── */}
        <div className="lg:col-span-7 flex flex-col items-center text-center gap-6 my-auto w-full max-w-2xl lg:mr-auto">
          {/* Prominent Glowing Pulsing Orb */}
          <div className="flex justify-center w-full">
            <PulsingOrb size="lg" />
          </div>

          {/* Headline with Rich Display Sizing */}
          <div className="max-w-xl mx-auto text-center space-y-2.5">
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className={
                lang === "bn"
                  ? "font-bengali text-3xl sm:text-4xl xl:text-[44px] font-bold leading-[1.3] text-gray-900 dark:text-gray-100 text-center"
                  : "text-4xl sm:text-5xl xl:text-[50px] font-black leading-[1.12] tracking-tight text-gray-900 dark:text-gray-100 text-center"
              }
            >
              {lang === "bn" ? (
                <>
                  স্বাস্থ্যসেবা,{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-cyan-500 to-emerald-500 dark:from-sky-400 dark:via-cyan-400 dark:to-emerald-400">
                    সবার জন্য
                  </span>
                </>
              ) : (
                <>
                  Meet{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-cyan-500 to-emerald-500 dark:from-sky-400 dark:via-cyan-400 dark:to-emerald-400">
                    ShasthyaHub AI
                  </span>
                </>
              )}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={
                lang === "bn"
                  ? "font-bengali text-sm sm:text-[15px] leading-[1.7] text-gray-600 dark:text-gray-300 max-w-lg mx-auto text-center"
                  : "text-sm sm:text-base leading-relaxed text-gray-600 dark:text-gray-300 font-normal max-w-lg mx-auto text-center"
              }
            >
              {lang === "bn"
                ? "বাংলাদেশের জন্য তৈরি ক্লিনিক্যাল এআই প্ল্যাটফর্ম। প্রেসক্রিপশন ও ওষুধের নির্ভুল যাচাই, অফলাইনে চোখের স্ক্রিনিং, দেশি খাবারের পুষ্টি ট্র্যাকিং এবং তাৎক্ষণিক লক্ষণ বিশ্লেষণ।"
                : "Next-generation healthcare intelligence built for Bangladesh. Zero-hallucination drug verification, on-device offline eye screening, localized diet insights, and instant clinical triage."}
            </motion.p>
          </div>

          {/* Spacious Stats Bar */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
            className="w-full grid grid-cols-2 sm:grid-cols-4 gap-3 py-3.5 px-6 rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/80 dark:border-gray-800/80 shadow-md shadow-sky-500/5 ring-1 ring-gray-900/5 dark:ring-white/5"
          >
            {stats.map((s, i) => (
              <div key={i} className="text-center px-1">
                <div className="text-xl sm:text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-cyan-500 dark:from-sky-400 dark:to-cyan-400 font-sans">
                  {s.value}
                </div>
                <div
                  className={
                    lang === "bn"
                      ? "font-bengali text-[11.5px] font-semibold text-gray-500 dark:text-gray-400 mt-0.5"
                      : "text-[10.5px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mt-0.5"
                  }
                >
                  {s.label}
                </div>
              </div>
            ))}
          </motion.div>

          {/* Generous 2x2 Bento Feature Cards (Filling Left Column Space) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.36 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full"
          >
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={i}
                  whileHover={
                    shouldReduceMotion
                      ? undefined
                      : {
                          y: -2,
                          boxShadow: "0 12px 28px rgba(14, 165, 233, 0.12)",
                        }
                  }
                  className="flex flex-col gap-2 p-3.5 sm:p-4 rounded-2xl bg-white/85 dark:bg-gray-900/85 backdrop-blur-xl border border-gray-200/80 dark:border-gray-800/80 shadow-sm ring-1 ring-gray-900/5 dark:ring-white/5 transition-all text-left"
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-br ${f.gradient} shadow-md ${f.shadow}`}
                    >
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        f.badgeClass
                      } ${lang === "bn" ? "font-bengali" : "uppercase tracking-wide"}`}
                    >
                      {lang === "bn" ? f.badgeBn : f.badgeEn}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p
                      className={
                        lang === "bn"
                          ? "font-bengali text-sm sm:text-[15px] font-bold text-gray-900 dark:text-gray-100 leading-snug"
                          : "text-sm sm:text-[14px] font-bold text-gray-900 dark:text-gray-100 leading-snug tracking-tight"
                      }
                    >
                      {lang === "bn" ? f.titleBn : f.titleEn}
                    </p>
                    <p
                      className={
                        lang === "bn"
                          ? "font-bengali text-xs text-gray-500 dark:text-gray-400 leading-[1.55] mt-0.5"
                          : "text-xs text-gray-500 dark:text-gray-400 leading-normal mt-0.5 font-normal"
                      }
                    >
                      {lang === "bn" ? f.descBn : f.descEn}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* ── RIGHT COLUMN: Spacious & Tactile Auth Suite (5 Cols) ── */}
        <div className="lg:col-span-5 flex flex-col items-center lg:items-end justify-center w-full my-auto">
          <div className="w-full max-w-lg">
            {/* Reviewer Demo Credentials Fast-Fill */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full mb-3 flex items-center justify-between px-4 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500/10 via-cyan-500/10 to-emerald-500/10 dark:from-sky-500/15 dark:to-emerald-500/15 border border-sky-500/25 dark:border-sky-500/35 shadow-xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                <span
                  className={
                    lang === "bn"
                      ? "font-bengali text-xs sm:text-[13px] font-semibold text-gray-700 dark:text-gray-200 truncate"
                      : "text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 truncate"
                  }
                >
                  {lang === "bn"
                    ? "টেস্ট / জাজ ডেমো অ্যাকাউন্ট"
                    : "Reviewer demo credentials"}
                </span>
              </div>

              <button
                type="button"
                onClick={fillDemoCredentials}
                className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white transition-all active:scale-95 shadow-sm cursor-pointer"
              >
                <span className={lang === "bn" ? "font-bengali" : ""}>
                  {lang === "bn" ? "অটো-ফিল" : "Auto-Fill"}
                </span>
              </button>
            </motion.div>

            {/* Main Premium Glassmorphic Auth Card */}
            <motion.div
              layout
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              className="rounded-3xl overflow-hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl border border-gray-200/80 dark:border-gray-800/80 shadow-[0_20px_50px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-gray-900/5 dark:ring-white/10"
            >
              {/* Sleek 3px Gradient Top Accent Strip */}
              <div className="h-[3px] bg-gradient-to-r from-sky-500 via-cyan-400 to-emerald-400 bg-[length:200%_100%] animate-gradient-x shadow-xs" />

              {/* Segmented Tab Switcher with Fluid Pill Indicator */}
              <div className="p-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/50">
                <div className="flex rounded-2xl bg-gray-200/70 dark:bg-gray-800/70 p-1 relative">
                  {(["login", "register"] as const).map((m) => {
                    const isActive = mode === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => switchMode(m)}
                        className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors relative z-10 text-center cursor-pointer ${
                          isActive
                            ? "text-gray-900 dark:text-white"
                            : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                        } ${lang === "bn" ? "font-bengali" : ""}`}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="auth-tab-pill"
                            className="absolute inset-0 rounded-xl bg-white dark:bg-gray-900 shadow-sm border border-gray-200/60 dark:border-gray-700/60"
                            transition={{
                              type: "spring",
                              stiffness: 420,
                              damping: 32,
                            }}
                          />
                        )}
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          {m === "login" ? (
                            <>
                              <LogIn className="w-4 h-4 text-sky-500" />
                              <span>{lang === "bn" ? "লগইন" : "Sign In"}</span>
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-4 h-4 text-emerald-500" />
                              <span>{lang === "bn" ? "নতুন অ্যাকাউন্ট" : "Create Account"}</span>
                            </>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Error Alert */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-6 pt-4"
                  >
                    <div className="text-xs sm:text-[13px] px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/50 leading-relaxed font-medium">
                      {error}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Success Message Alert (Registration) */}
              <AnimatePresence>
                {successMessage && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-7 text-center space-y-4"
                  >
                    <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <p
                      className={
                        lang === "bn"
                          ? "font-bengali text-sm text-gray-800 dark:text-gray-200 leading-relaxed font-medium"
                          : "text-sm text-gray-800 dark:text-gray-200 leading-relaxed font-medium"
                      }
                    >
                      {successMessage}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        switchMode("login");
                        setSuccessMessage(null);
                      }}
                      className="w-full py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-600 hover:to-emerald-600 shadow-md transition-all cursor-pointer"
                    >
                      <span className={lang === "bn" ? "font-bengali" : ""}>
                        {lang === "bn" ? "লগইন পৃষ্ঠায় যান" : "Go to Sign In"}
                      </span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* --- TAB CONTENT AREA WITH DIRECTIONAL SLIDE ANIMATION --- */}
              <div className="relative overflow-hidden">
                <AnimatePresence mode="wait" custom={direction} initial={false}>
                  {mode === "login" && !successMessage ? (
                    <motion.form
                      key="login-form"
                      custom={direction}
                      variants={formVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      onSubmit={handleLoginSubmit}
                      className="p-6 sm:p-7 flex flex-col gap-4 text-left"
                    >
                      <div className="space-y-1.5">
                        <label
                          className={
                            lang === "bn"
                              ? "block font-bengali text-xs font-semibold text-gray-600 dark:text-gray-300"
                              : "block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                          }
                        >
                          {lang === "bn" ? "ইমেইল ঠিকানা" : "Email Address"}
                        </label>
                        <div className="relative">
                          <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 dark:text-gray-500" />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            autoComplete="email"
                            required
                            className="w-full h-11.5 pl-10.5 pr-4 rounded-xl text-sm font-medium transition-all bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label
                            className={
                              lang === "bn"
                                ? "block font-bengali text-xs font-semibold text-gray-600 dark:text-gray-300"
                                : "block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                            }
                          >
                            {lang === "bn" ? "পাসওয়ার্ড" : "Password"}
                          </label>
                          <Link
                            href="/forgot-password"
                            className={
                              lang === "bn"
                                ? "font-bengali text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                                : "text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                            }
                          >
                            {lang === "bn" ? "পাসওয়ার্ড ভুলে গেছেন?" : "Forgot password?"}
                          </Link>
                        </div>
                        <div className="relative">
                          <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 dark:text-gray-500" />
                          <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            autoComplete="current-password"
                            required
                            className="w-full h-11.5 pl-10.5 pr-11 rounded-xl text-sm font-medium transition-all bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 cursor-pointer"
                          >
                            {showPassword ? (
                              <EyeOff className="w-4.5 h-4.5" />
                            ) : (
                              <Eye className="w-4.5 h-4.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <motion.button
                        type="submit"
                        disabled={loading}
                        whileHover={shouldReduceMotion ? undefined : { scale: 1.01 }}
                        whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                        className="w-full h-11.5 rounded-xl font-bold text-sm sm:text-[15px] text-white disabled:opacity-60 mt-1.5 flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 bg-[length:200%_100%] animate-gradient-x shadow-md hover:shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
                      >
                        {loading ? (
                          <motion.div
                            className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                          />
                        ) : (
                          <>
                            <span className={lang === "bn" ? "font-bengali font-bold" : ""}>
                              {lang === "bn" ? "লগইন সম্পন্ন করুন" : "Sign In to ShasthyaHub"}
                            </span>
                            <ArrowRight className="w-4.5 h-4.5" />
                          </>
                        )}
                      </motion.button>
                    </motion.form>
                  ) : mode === "register" && !successMessage ? (
                    <motion.form
                      key="register-form"
                      custom={direction}
                      variants={formVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      onSubmit={handleRegisterSubmit}
                      className="p-6 sm:p-7 flex flex-col gap-3 text-left"
                    >
                      {/* Full Name */}
                      <div className="space-y-1">
                        <label
                          className={
                            lang === "bn"
                              ? "block font-bengali text-xs font-semibold text-gray-600 dark:text-gray-300"
                              : "block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                          }
                        >
                          {lang === "bn" ? "পুরো নাম" : "Full Name"}
                        </label>
                        <div className="relative">
                          <User className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={lang === "bn" ? "যেমন: মোহাম্মদ রহিম" : "e.g. Alex Morgan"}
                            autoComplete="name"
                            required
                            className="w-full h-10.5 pl-10 pr-3.5 rounded-xl text-sm font-medium transition-all bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none"
                          />
                        </div>
                      </div>

                      {/* Email Address */}
                      <div className="space-y-1">
                        <label
                          className={
                            lang === "bn"
                              ? "block font-bengali text-xs font-semibold text-gray-600 dark:text-gray-300"
                              : "block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                          }
                        >
                          {lang === "bn" ? "ইমেইল" : "Email Address"}
                        </label>
                        <div className="relative">
                          <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@domain.com"
                            autoComplete="email"
                            required
                            className="w-full h-10.5 pl-10 pr-3.5 rounded-xl text-sm font-medium transition-all bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none"
                          />
                        </div>
                      </div>

                      {/* Phone & District 2-Col */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <label
                            className={
                              lang === "bn"
                                ? "block font-bengali text-xs font-semibold text-gray-600 dark:text-gray-300"
                                : "block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                            }
                          >
                            {lang === "bn" ? "ফোন নম্বর" : "Phone"}
                          </label>
                          <div className="relative">
                            <Phone className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                            <input
                              type="tel"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="01XXXXXXXXX"
                              autoComplete="tel"
                              required
                              className="w-full h-10.5 pl-8.5 pr-2.5 rounded-xl text-sm font-medium transition-all bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label
                            className={
                              lang === "bn"
                                ? "block font-bengali text-xs font-semibold text-gray-600 dark:text-gray-300"
                                : "block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                            }
                          >
                            {lang === "bn" ? "জেলা" : "District"}
                          </label>
                          <div className="relative">
                            <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                            <select
                              value={district}
                              onChange={(e) => setDistrict(e.target.value)}
                              required
                              className="w-full h-10.5 pl-8.5 pr-3 rounded-xl text-sm font-medium transition-all bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none cursor-pointer"
                            >
                              <option value="">{lang === "bn" ? "জেলা নির্বাচন" : "Select District"}</option>
                              {BANGLADESH_DISTRICTS.map((d) => (
                                <option key={d} value={d}>
                                  {d}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Password & Confirm Password */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <label
                            className={
                              lang === "bn"
                                ? "block font-bengali text-xs font-semibold text-gray-600 dark:text-gray-300"
                                : "block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                            }
                          >
                            {lang === "bn" ? "পাসওয়ার্ড" : "Password"}
                          </label>
                          <div className="relative">
                            <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                            <input
                              type={showPassword ? "text" : "password"}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="••••••••"
                              required
                              minLength={8}
                              className="w-full h-10.5 pl-8.5 pr-8 rounded-xl text-sm font-medium transition-all bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              aria-label={showPassword ? "Hide password" : "Show password"}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 cursor-pointer"
                            >
                              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label
                            className={
                              lang === "bn"
                                ? "block font-bengali text-xs font-semibold text-gray-600 dark:text-gray-300"
                                : "block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                            }
                          >
                            {lang === "bn" ? "নিশ্চিত করুন" : "Confirm"}
                          </label>
                          <div className="relative">
                            <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                            <input
                              type={showConfirmPassword ? "text" : "password"}
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="••••••••"
                              required
                              minLength={8}
                              className="w-full h-10.5 pl-8.5 pr-8 rounded-xl text-sm font-medium transition-all bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 cursor-pointer"
                            >
                              {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Preferred Language Buttons */}
                      <div className="space-y-1">
                        <label
                          className={
                            lang === "bn"
                              ? "block font-bengali text-xs font-semibold text-gray-600 dark:text-gray-300"
                              : "block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                          }
                        >
                          {lang === "bn" ? "পছন্দের ভাষা" : "Preferred Language"}
                        </label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setPreferredLang("bn");
                              setLang("bn");
                            }}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer font-bengali ${
                              preferredLang === "bn"
                                ? "bg-sky-500 text-white border-sky-500 shadow-xs"
                                : "bg-white/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700"
                            }`}
                          >
                            বাংলা
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPreferredLang("en");
                              setLang("en");
                            }}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                              preferredLang === "en"
                                ? "bg-sky-500 text-white border-sky-500 shadow-xs"
                                : "bg-white/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700"
                            }`}
                          >
                            English
                          </button>
                        </div>
                      </div>

                      {/* Submit Button */}
                      <motion.button
                        type="submit"
                        disabled={loading}
                        whileHover={shouldReduceMotion ? undefined : { scale: 1.01 }}
                        whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                        className="w-full h-11.5 rounded-xl font-bold text-sm sm:text-[15px] text-white disabled:opacity-60 mt-1 flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 bg-[length:200%_100%] animate-gradient-x shadow-md hover:shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
                      >
                        {loading ? (
                          <motion.div
                            className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                          />
                        ) : (
                          <>
                            <span className={lang === "bn" ? "font-bengali font-bold" : ""}>
                              {lang === "bn" ? "নিবন্ধন সম্পন্ন করুন" : "Create My Account"}
                            </span>
                            <ArrowRight className="w-4.5 h-4.5" />
                          </>
                        )}
                      </motion.button>
                    </motion.form>
                  ) : null}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Privacy Badges */}
            <div className="mt-4 flex items-center justify-center gap-5 text-xs text-gray-500 dark:text-gray-400 font-medium">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-sky-500" /> AI-powered
              </span>
              <span className="flex items-center gap-1.5">
                <WifiOff className="w-3.5 h-3.5 text-cyan-500" /> Works offline
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Private & secure
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* ── 3. UNIFIED BOTTOM TRUST BAR ── */}
      <footer className="relative z-10 w-full max-w-[1560px] mx-auto px-6 sm:px-12 lg:px-20 xl:px-24 py-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200/60 dark:border-gray-800/60">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-sky-500" />
          <span className={lang === "bn" ? "font-bengali text-xs sm:text-[13px]" : ""}>
            {lang === "bn"
              ? "এন্ড-টু-এন্ড এনক্রিপ্টেড · অফলাইন প্রাইভেট সেশন"
              : "End-to-end encrypted · Private offline sessions"}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span className={`font-semibold text-emerald-600 dark:text-emerald-400 ${lang === "bn" ? "font-bengali text-xs sm:text-[13px]" : ""}`}>
            {lang === "bn" ? "নিরাপদ ও ব্যক্তিগত" : "Privacy Guaranteed"}
          </span>
        </div>
      </footer>
    </div>
  );
}
