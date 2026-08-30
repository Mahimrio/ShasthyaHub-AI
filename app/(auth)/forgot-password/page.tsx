'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { ArrowLeft, KeyRound, Loader2, MailCheck, Send } from 'lucide-react'
import { friendlyAuthError } from '@/lib/auth-errors'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

const forgotSchema = z.object({
  email: z.string().email('Please enter a valid email'),
})

type ForgotForm = z.infer<typeof forgotSchema>

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07 },
  },
}

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
}

export default function ForgotPasswordPage() {
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
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="w-full max-w-sm"
    >
      <Card className="border-0 bg-white/80 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.08),0_4px_12px_rgba(14,165,233,0.06)] dark:bg-gray-900/80 dark:backdrop-blur-xl dark:shadow-[0_10px_40px_rgba(0,0,0,0.4),0_4px_12px_rgba(14,165,233,0.08)]">
        <div className="h-1.5 bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 bg-[length:200%_100%] animate-gradient-x rounded-t-xl" />

        <CardHeader className="text-center pb-2 pt-8">
          <motion.div variants={item}>
            <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-sky-500/25 dark:shadow-sky-500/10">
              <KeyRound className="h-7 w-7 text-white" />
            </div>
          </motion.div>
          <motion.div variants={item}>
            <CardTitle className="text-2xl font-black tracking-tight text-gray-900 dark:text-gray-100">
              Reset Password
            </CardTitle>
          </motion.div>
          <motion.div variants={item}>
            <CardDescription className="font-bengali text-base text-gray-500 dark:text-gray-400">
              পাসওয়ার্ড পুনরুদ্ধার করুন
            </CardDescription>
          </motion.div>
        </CardHeader>

        <CardContent className="px-6 pb-8">
          {sent ? (
            <motion.div variants={item} className="text-center space-y-4 py-2">
              <div className="mx-auto h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center">
                <MailCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                If an account exists for that email, a reset link is on its way — check your inbox and spam folder.
              </p>
              <p className="text-sm font-bengali text-gray-500 dark:text-gray-400 leading-relaxed">
                এই ইমেইলে অ্যাকাউন্ট থাকলে একটি রিসেট লিঙ্ক পাঠানো হয়েছে — ইনবক্স ও স্প্যাম ফোল্ডার দেখুন।
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to login / লগইনে ফিরুন
              </Link>
            </motion.div>
          ) : (
            <>
              {apiError && (
                <motion.div variants={item}>
                  <Alert variant="destructive" className="mb-5 rounded-xl border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30">
                    <AlertDescription className="text-xs text-red-700 dark:text-red-400">
                      {apiError}
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}

              <motion.div variants={item}>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 leading-relaxed">
                  Enter your account email and we&apos;ll send you a reset link.
                  <span className="block font-bengali mt-1">
                    আপনার ইমেইল লিখুন — আমরা একটি রিসেট লিঙ্ক পাঠাবো।
                  </span>
                </p>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Email / ইমেইল
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      className="h-11 rounded-xl border-gray-200 bg-white/60 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-100 dark:placeholder:text-gray-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 transition-all"
                      {...register('email')}
                    />
                    {errors.email && (
                      <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 bg-[length:200%_100%] animate-gradient-x text-white font-semibold text-base shadow-md hover:shadow-lg active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Send Reset Link / লিঙ্ক পাঠান</span>
                      </>
                    )}
                  </Button>
                </form>
              </motion.div>

              <motion.div variants={item}>
                <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to login / লগইনে ফিরুন
                  </Link>
                </p>
              </motion.div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
