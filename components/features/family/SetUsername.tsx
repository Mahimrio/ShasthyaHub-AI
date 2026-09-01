'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { AtSign, Check, Loader2, Sparkles } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useSetProfileUsername } from '@/hooks/useFamily'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface SetUsernameProps {
  currentUsername: string | null
  userName?: string | null
}

export function SetUsername({ currentUsername, userName: _userName }: SetUsernameProps) {
  const { lang } = useLanguage()
  const [usernameInput, setUsernameInput] = useState('')
  const [isEditing, setIsEditing] = useState(!currentUsername)
  const [error, setError] = useState<string | null>(null)
  const setUsernameMutation = useSetProfileUsername()

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const cleaned = usernameInput.toLowerCase().trim().replace(/[^a-z0-9_]/g, '')

    if (cleaned.length < 3 || cleaned.length > 30) {
      setError(
        lang === 'bn'
          ? 'ইউজারনেম ৩ থেকে ৩০ অক্ষরের হতে হবে (শুধুমাত্র ছোট হাতের অক্ষর, সংখ্যা ও আন্ডারস্কোর)'
          : 'Username must be 3-30 characters (lowercase letters, numbers, underscore only)'
      )
      return
    }

    try {
      await setUsernameMutation.mutateAsync(cleaned)
      setIsEditing(false)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save username'
      setError(message)
    }
  }

  if (currentUsername && !isEditing) {
    return (
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-sky-500/10 via-cyan-500/5 to-emerald-500/10 border border-sky-500/20 dark:border-sky-400/20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-500/15 dark:bg-sky-400/15 flex items-center justify-center text-sky-600 dark:text-sky-400 font-bold">
            <AtSign className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                {lang === 'bn' ? 'আপনার পারিবারিক ইউজারনেম:' : 'Your Family Username:'}
              </span>
              <span className="font-mono text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50 px-2 py-0.5 rounded-md border border-sky-200/60 dark:border-sky-800/60">
                @{currentUsername}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 dark:text-gray-500">
              {lang === 'bn'
                ? 'পারিবারিক সদস্যগণ এই ইউজারনেম দিয়ে আপনাকে যুক্ত করতে পারবেন'
                : 'Family members can search and connect with you using this handle'}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setUsernameInput(currentUsername)
            setIsEditing(true)
          }}
          className="text-xs h-8 rounded-xl"
        >
          {lang === 'bn' ? 'পরিবর্তন' : 'Edit'}
        </Button>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-2xl bg-gradient-to-br from-sky-50 via-cyan-50/50 to-emerald-50/40 dark:from-sky-950/30 dark:via-cyan-950/20 dark:to-emerald-950/20 border border-sky-200/80 dark:border-sky-800/80 shadow-sm"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-sky-500/20">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
            {lang === 'bn' ? 'আপনার ইউজারনেম নির্ধারণ করুন' : 'Set Your Family Username'}
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
            {lang === 'bn'
              ? 'আপনার পরিবারের সদস্যরা এই ইউজারনেম দিয়ে আপনাকে সহজে খুঁজে পেয়ে পরিবারে যুক্ত করতে পারবে।'
              : 'Family members can find and connect with you using your unique username.'}
          </p>

          <form onSubmit={handleSave} className="mt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-sm">
                @
              </span>
              <Input
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="username (e.g. rahim_99)"
                className="pl-8 text-xs font-mono bg-white dark:bg-gray-900 h-9 rounded-xl border-gray-200 dark:border-gray-700"
                maxLength={30}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="submit"
                size="sm"
                disabled={setUsernameMutation.isPending || !usernameInput.trim()}
                className="h-9 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white text-xs font-semibold shadow-sm"
              >
                {setUsernameMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5 mr-1" />
                )}
                <span>{lang === 'bn' ? 'সংরক্ষণ করুন' : 'Save Username'}</span>
              </Button>
              {currentUsername && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  className="h-9 text-xs rounded-xl text-gray-500"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </Button>
              )}
            </div>
          </form>

          {error && (
            <Alert variant="destructive" className="mt-2 py-2 px-3 text-xs rounded-xl">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </motion.div>
  )
}
