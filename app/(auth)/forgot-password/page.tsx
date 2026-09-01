'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, KeyRound, Loader2, MailCheck, Send, Mail } from 'lucide-react'
import { friendlyAuthError } from '@/lib/auth-errors'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageToggle } from '@/components/shared/LanguageToggle'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { WarmBackground } from '@/components/auth/WarmBackground'

const forgotSchema = z.object({
  email: z.string().email('Please enter a valid email'),
})

type ForgotForm = z.infer<typeof forgotSchema>

export default function ForgotPasswordPage() {
  const { lang } = useLanguage()
  const shouldReduceMotion = useReducedMotion()
  const [apiError, setApiError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
  })

  const onSubmit = async (data: ForgotForm) => {
    setApiError(null)

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/login`,
      })

      if (error) {
        setApiError(friendlyAuthError(error.message))
        return
      }
    } catch (err) {
      setApiError(friendlyAuthError(err instanceof Error ? err.message : 'network'))
      return
    }

    setSent(true)
  }

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 overflow-hidden transition-colors">
      <WarmBackground />

      {/* Top Controls */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-2">
        <ThemeToggle />
        <LanguageToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="rounded-3xl overflow-hidden bg-white/85 dark:bg-gray-900/85 backdrop-blur-2xl border border-gray-200/70 dark:border-gray-800/70 shadow-[0_16px_48px_rgba(0,0,0,0.08)] dark:shadow-[0_16px_48px_rgba(0,0,0,0.5)] ring-1 ring-gray-900/5 dark:ring-white/10">
          <div className="h-1.5 bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 bg-[length:200%_100%] animate-gradient-x" />

          {/* Header */}
          <div className="text-center px-6 pt-8 pb-4">
            <div className="mx-auto mb-4 w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 via-cyan-500 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-sky-500/25">
              <KeyRound className="w-6 h-6 text-white" strokeWidth={2.4} />
            </div>

            <h1 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-cyan-500 to-emerald-500 dark:from-sky-400 dark:via-cyan-400 dark:to-emerald-400">
              {lang === 'bn' ? 'পাসওয়ার্ড রিসেট' : 'Reset Password'}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
              {lang === 'bn'
                ? 'পাসওয়ার্ড পুনরুদ্ধার লিংক পেতে আপনার ইমেইল দিন'
                : 'Enter your account email to receive a password reset link'}
            </p>
          </div>

          <div className="px-6 pb-8">
            {sent ? (
              <div className="text-center space-y-4 py-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                  <MailCheck className="w-6 h-6" />
                </div>
                <p className="text-xs sm:text-sm text-gray-800 dark:text-gray-200 leading-relaxed font-medium">
                  {lang === 'bn'
                    ? 'এই ইমেইলে অ্যাকাউন্ট থাকলে একটি রিসেট লিঙ্ক পাঠানো হয়েছে — ইনবক্স ও স্প্যাম ফোল্ডার চেক করুন।'
                    : 'If an account exists for that email, a password reset link has been dispatched — check your inbox and spam folder.'}
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {lang === 'bn' ? 'লগইনে ফিরুন' : 'Back to Sign In'}
                </Link>
              </div>
            ) : (
              <>
                {apiError && (
                  <div className="mb-4 text-xs px-3.5 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/50 leading-relaxed font-medium">
                    {apiError}
                  </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      {lang === 'bn' ? 'ইমেইল ঠিকানা' : 'Email Address'}
                    </label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        autoComplete="email"
                        required
                        className="w-full h-11 pl-10 pr-3.5 rounded-xl text-sm transition-all bg-white/70 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none"
                        {...register('email')}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-xs text-red-500 mt-1 font-medium">{errors.email.message}</p>
                    )}
                  </div>

                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    whileHover={shouldReduceMotion ? undefined : { scale: 1.01 }}
                    whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                    className="w-full h-12 rounded-xl font-bold text-sm text-white disabled:opacity-60 flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 bg-[length:200%_100%] animate-gradient-x shadow-md hover:shadow-lg shadow-sky-500/25 transition-all cursor-pointer"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>{lang === 'bn' ? 'রিসেট লিঙ্ক পাঠান' : 'Send Reset Link'}</span>
                      </>
                    )}
                  </motion.button>
                </form>

                <div className="mt-6 text-center">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    {lang === 'bn' ? 'লগইনে ফিরে যান' : 'Back to login'}
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
