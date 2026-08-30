'use client'

import { WifiOff, RotateCcw } from 'lucide-react'

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-sky-50/40 to-emerald-50/30 dark:from-gray-950 dark:via-sky-950/20 dark:to-emerald-950/10 p-6">
      <div className="text-center max-w-md bg-white/85 dark:bg-gray-900/85 backdrop-blur-sm rounded-3xl border border-gray-200/60 dark:border-gray-700/60 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
        <div className="mx-auto mb-5 h-14 w-14 rounded-2xl bg-gradient-to-br from-sky-500 via-cyan-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-sky-500/25">
          <span className="text-white text-xl font-black">S</span>
        </div>
        <div className="w-14 h-14 bg-amber-50 dark:bg-amber-950/40 rounded-full flex items-center justify-center mx-auto mb-5">
          <WifiOff className="h-7 w-7 text-amber-500" />
        </div>
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">
          You are offline
        </h1>
        <p className="font-bengali text-base text-gray-600 dark:text-gray-300 mb-4">
          আপনি অফলাইনে আছেন
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
          Please check your internet connection and try again. Previous analyses
          are saved and will be available when you reconnect.
        </p>
        <p className="font-bengali text-sm text-gray-500 dark:text-gray-400 leading-relaxed mt-2 mb-6">
          ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করুন। আপনার আগের বিশ্লেষণগুলো
          সংরক্ষিত আছে — সংযোগ ফিরে এলেই দেখতে পাবেন।
        </p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 bg-[length:200%_100%] animate-gradient-x text-white rounded-xl text-sm font-semibold shadow-lg shadow-sky-500/25 hover:shadow-xl hover:shadow-sky-500/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all"
        >
          <RotateCcw className="h-4 w-4" />
          Try Again / আবার চেষ্টা করুন
        </button>
      </div>
    </div>
  )
}
