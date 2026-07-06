'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Loader2, UserPlus } from 'lucide-react'

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
import { BANGLADESH_DISTRICTS } from '@/types'

const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email'),
    phone: z
      .string()
      .regex(/^01[3-9]\d{8}$/, 'Enter a valid Bangladeshi phone number (01XXXXXXXXX)'),
    district: z.string().min(1, 'Please select a district'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    preferred_language: z.enum(['en', 'bn']),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type RegisterForm = z.infer<typeof registerSchema>

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
}

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      preferred_language: 'bn',
    },
  })

  // eslint-disable-next-line react-hooks/incompatible-library
  const preferredLanguage = watch('preferred_language')

  const onSubmit = async (data: RegisterForm) => {
    setApiError(null)
    setSuccessMessage(null)

    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
          phone: data.phone,
          district: data.district,
          preferred_language: data.preferred_language,
        },
      },
    })

    if (error) {
      setApiError(error.message)
      return
    }

    setSuccessMessage(
      'Check your email for a verification link. You may need to check your spam folder. / আপনার ইমেলে যাচাইকরণ লিঙ্ক দেখুন। স্প্যাম ফোল্ডারও চেক করুন।'
    )
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="w-full max-w-md"
    >
      <Card className="border-0 bg-white/80 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.08),0_4px_12px_rgba(14,165,233,0.06)] dark:bg-gray-900/80 dark:backdrop-blur-xl dark:shadow-[0_10px_40px_rgba(0,0,0,0.4),0_4px_12px_rgba(14,165,233,0.08)]">
        {/* Animated gradient accent bar */}
        <div className="h-1.5 bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 bg-[length:200%_100%] animate-gradient-x rounded-t-xl" />

        <CardHeader className="text-center pb-2 pt-8">
          <motion.div variants={item}>
            <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-sky-500/25 dark:shadow-sky-500/10">
              <UserPlus className="h-7 w-7 text-white" />
            </div>
          </motion.div>
          <motion.div variants={item}>
            <CardTitle className="text-2xl font-black tracking-tight text-gray-900 dark:text-gray-100">
              Create Account
            </CardTitle>
          </motion.div>
          <motion.div variants={item}>
            <CardDescription className="font-bengali text-base text-gray-500 dark:text-gray-400">
              নিবন্ধন করুন
            </CardDescription>
          </motion.div>
        </CardHeader>

        <CardContent className="px-6 pb-8">
          {apiError && (
            <motion.div variants={item}>
              <Alert variant="destructive" className="mb-5 rounded-xl border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30">
                <AlertDescription className="text-xs text-red-700 dark:text-red-400">
                  {apiError}
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {successMessage && (
            <motion.div variants={item}>
              <Alert className="mb-5 rounded-xl border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/30">
                <AlertDescription className="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed">
                  {successMessage}
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {!successMessage && (
            <motion.div variants={item}>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Full Name / পুরো নাম
                  </Label>
                  <Input
                    id="name"
                    placeholder="Your full name"
                    autoComplete="name"
                    className="h-11 rounded-xl border-gray-200 bg-white/60 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-100 dark:placeholder:text-gray-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 transition-all"
                    {...register('name')}
                  />
                  {errors.name && (
                    <p className="text-xs text-destructive mt-1">{errors.name.message}</p>
                  )}
                </div>

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

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Phone / ফোন
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="01XXXXXXXXX"
                      autoComplete="tel"
                      className="h-11 rounded-xl border-gray-200 bg-white/60 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-100 dark:placeholder:text-gray-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 transition-all"
                      {...register('phone')}
                    />
                    {errors.phone && (
                      <p className="text-xs text-destructive mt-1">{errors.phone.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="district" className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      District / জেলা
                    </Label>
                    <select
                      id="district"
                      className="h-11 w-full rounded-xl border border-gray-200 bg-white/60 px-3 text-sm shadow-sm transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 focus:outline-none dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-100"
                      {...register('district')}
                    >
                      <option value="">Select / নির্বাচন করুন</option>
                      {BANGLADESH_DISTRICTS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                    {errors.district && (
                      <p className="text-xs text-destructive mt-1">{errors.district.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Password / পাসওয়ার্ড
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="At least 8 characters"
                      autoComplete="new-password"
                      className="h-11 rounded-xl border-gray-200 bg-white/60 pr-11 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-100 dark:placeholder:text-gray-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 transition-all"
                      {...register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-destructive mt-1">{errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Confirm Password / পাসওয়ার্ড নিশ্চিত করুন
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Re-enter your password"
                      autoComplete="new-password"
                      className="h-11 rounded-xl border-gray-200 bg-white/60 pr-11 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-100 dark:placeholder:text-gray-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 transition-all"
                      {...register('confirmPassword')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-destructive mt-1">{errors.confirmPassword.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Language / ভাষা
                  </Label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setValue('preferred_language', 'bn')}
                      className={`flex-1 h-11 rounded-xl border text-sm font-medium transition-all ${
                        preferredLanguage === 'bn'
                          ? 'border-sky-500 bg-sky-50 text-sky-700 shadow-sm dark:border-sky-400 dark:bg-sky-950/40 dark:text-sky-300'
                          : 'border-gray-200 bg-white/60 text-gray-500 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-400 dark:hover:border-gray-600'
                      }`}
                    >
                      বাংলা
                    </button>
                    <button
                      type="button"
                      onClick={() => setValue('preferred_language', 'en')}
                      className={`flex-1 h-11 rounded-xl border text-sm font-medium transition-all ${
                        preferredLanguage === 'en'
                          ? 'border-sky-500 bg-sky-50 text-sky-700 shadow-sm dark:border-sky-400 dark:bg-sky-950/40 dark:text-sky-300'
                          : 'border-gray-200 bg-white/60 text-gray-500 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-400 dark:hover:border-gray-600'
                      }`}
                    >
                      English
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 bg-[length:200%_100%] animate-gradient-x text-white font-semibold text-base shadow-md hover:shadow-lg active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      <span>Creating account...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-5 w-5" />
                      <span>Create Account / নিবন্ধন করুন</span>
                    </>
                  )}
                </Button>
              </form>
            </motion.div>
          )}

          {!successMessage && (
            <motion.div variants={item}>
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Already have an account?{' '}
                  <Link
                    href="/login"
                    className="font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 transition-colors"
                  >
                    Login / লগইন
                  </Link>
                </p>
              </div>
            </motion.div>
          )}

          {successMessage && (
            <motion.div variants={item}>
              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className="font-semibold text-sm text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 transition-colors"
                >
                  Go to Login / লগইন পৃষ্ঠায় যান
                </Link>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
