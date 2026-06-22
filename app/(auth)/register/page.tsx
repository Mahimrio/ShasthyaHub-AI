'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

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
import { createClient } from '@/lib/supabase/client'
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

  const preferredLanguage = watch('preferred_language')

  const onSubmit = async (data: RegisterForm) => {
    setApiError(null)
    setSuccessMessage(null)

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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-md"
    >
      <Card className="border-0 shadow-xl">
        <div className="h-2 bg-gradient-to-r from-sky-500 to-emerald-500 rounded-t-xl" />

        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center">
            <span className="text-xl font-black text-white">S</span>
          </div>
          <CardTitle className="text-xl font-bold">Create Account</CardTitle>
          <CardDescription className="font-bengali text-base">
            নিবন্ধন করুন
          </CardDescription>
        </CardHeader>

        <CardContent>
          {apiError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{apiError}</AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <Alert className="mb-4 border-emerald-500 bg-emerald-50 text-emerald-800">
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}

          {!successMessage && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name / পুরো নাম</Label>
                <Input
                  id="name"
                  placeholder="Your full name"
                  autoComplete="name"
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email / ইমেইল</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone / ফোন</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="01XXXXXXXXX"
                  autoComplete="tel"
                  {...register('phone')}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="district">
                  District / জেলা
                </Label>
                <select
                  id="district"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm"
                  {...register('district')}
                >
                  <option value="">Select a district / জেলা নির্বাচন করুন</option>
                  {BANGLADESH_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                {errors.district && (
                  <p className="text-sm text-destructive">
                    {errors.district.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password / পাসওয়ার্ড</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    className="pr-10"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
                  <p className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  Confirm Password / পাসওয়ার্ড নিশ্চিত করুন
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    className="pr-10"
                    {...register('confirmPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
                  <p className="text-sm text-destructive">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Language / ভাষা</Label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setValue('preferred_language', 'bn')}
                    className={`flex-1 h-10 rounded-lg border text-sm font-medium transition-colors ${
                      preferredLanguage === 'bn'
                        ? 'border-sky-500 bg-sky-50 text-sky-700'
                        : 'border-input bg-background text-muted-foreground'
                    }`}
                  >
                    বাংলা
                  </button>
                  <button
                    type="button"
                    onClick={() => setValue('preferred_language', 'en')}
                    className={`flex-1 h-10 rounded-lg border text-sm font-medium transition-colors ${
                      preferredLanguage === 'en'
                        ? 'border-sky-500 bg-sky-50 text-sky-700'
                        : 'border-input bg-background text-muted-foreground'
                    }`}
                  >
                    English
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-sky-500 to-emerald-500 hover:opacity-90 text-white font-semibold"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create Account / নিবন্ধন করুন'
                )}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-medium text-primary hover:underline"
            >
              Login / লগইন
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
