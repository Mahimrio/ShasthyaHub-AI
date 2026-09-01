'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { AtSign, Check, Loader2, Copy, Mail, Sparkles, AlertCircle } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useSetProfileUsername } from '@/hooks/useFamily'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface UpdateUsernameDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentUsername: string | null
  userEmail: string | null
  userName?: string | null
}

export function UpdateUsernameDialog({
  open,
  onOpenChange,
  currentUsername,
  userEmail,
}: UpdateUsernameDialogProps) {
  const { lang } = useLanguage()
  const [usernameInput, setUsernameInput] = useState(currentUsername || '')
  const [copiedType, setCopiedType] = useState<'email' | 'username' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const setUsernameMutation = useSetProfileUsername()

  const handleCopy = (text: string, type: 'email' | 'username') => {
    navigator.clipboard.writeText(text)
    setCopiedType(type)
    setTimeout(() => setCopiedType(null), 2000)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    const cleaned = usernameInput.toLowerCase().trim().replace(/[^a-z0-9_]/g, '')

    if (cleaned.length < 3 || cleaned.length > 30) {
      setError(
        lang === 'bn'
          ? 'ইউজারনেম ৩ থেকে ৩০ অক্ষরের হতে হবে (শুধুমাত্র ছোট হাতের অক্ষর a-z, সংখ্যা ০-৯ ও আন্ডারস্কোর _)'
          : 'Username must be 3-30 characters (lowercase letters a-z, numbers 0-9, underscore only)'
      )
      return
    }

    try {
      await setUsernameMutation.mutateAsync(cleaned)
      setSuccess(true)
      setTimeout(() => {
        onOpenChange(false)
        setSuccess(false)
      }, 1200)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update username'
      setError(message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-2xl">
        <DialogHeader className="space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 via-teal-500 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20 mb-1">
            <AtSign className="h-6 w-6" />
          </div>
          <DialogTitle className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {currentUsername
              ? lang === 'bn' ? 'ইউজারনেম পরিবর্তন ও আইডি' : 'Update Username & Family ID'
              : lang === 'bn' ? 'কাস্টম ইউজারনেম তৈরি করুন' : 'Set Custom Username'}
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500 dark:text-gray-400">
            {lang === 'bn'
              ? 'আপনার পরিবারের সদস্যরা এই ইউনিক ইউজারনেম বা জিমেইল সার্চ করে আপনাকে ফ্যামিলি ট্রিতে যুক্ত করতে পারবেন।'
              : 'Family members can search and connect with you using your Gmail ID or this unique username handle.'}
          </DialogDescription>
        </DialogHeader>

        {/* Current ID Info Box */}
        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/70 dark:border-gray-700/60 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Mail className="h-4 w-4 text-sky-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                  {lang === 'bn' ? 'ডিফল্ট সার্চ জিমেইল' : 'Default Search Gmail'}
                </p>
                <p className="text-xs font-mono font-semibold text-gray-800 dark:text-gray-200 truncate">
                  {userEmail || 'No email'}
                </p>
              </div>
            </div>
            {userEmail && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(userEmail, 'email')}
                className="h-7 px-2 text-xs rounded-lg text-gray-500 hover:text-sky-600"
              >
                {copiedType === 'email' ? (
                  <span className="flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                    <Check className="h-3 w-3" /> {lang === 'bn' ? 'কপি হয়েছে' : 'Copied'}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px]">
                    <Copy className="h-3 w-3" /> {lang === 'bn' ? 'কপি' : 'Copy'}
                  </span>
                )}
              </Button>
            )}
          </div>

          {currentUsername && (
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-200/60 dark:border-gray-700/50">
              <div className="flex items-center gap-2 min-w-0">
                <AtSign className="h-4 w-4 text-emerald-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                    {lang === 'bn' ? 'বর্তমান ইউনিক ইউজারনেম' : 'Current Unique Username'}
                  </p>
                  <p className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 truncate">
                    @{currentUsername}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(`@${currentUsername}`, 'username')}
                className="h-7 px-2 text-xs rounded-lg text-gray-500 hover:text-emerald-600"
              >
                {copiedType === 'username' ? (
                  <span className="flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                    <Check className="h-3 w-3" /> {lang === 'bn' ? 'কপি হয়েছে' : 'Copied'}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px]">
                    <Copy className="h-3 w-3" /> {lang === 'bn' ? 'কপি' : 'Copy'}
                  </span>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Update Username Form */}
        <form onSubmit={handleSave} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center justify-between">
              <span>{lang === 'bn' ? 'নতুন ইউজারনেম লিখুন' : 'Enter New Username'}</span>
              <span className="text-[10px] font-mono text-gray-400 font-normal">
                {usernameInput.length}/30
              </span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-sm font-bold">
                @
              </span>
              <Input
                value={usernameInput}
                onChange={(e) =>
                  setUsernameInput(
                    e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')
                  )
                }
                placeholder="e.g. rahim_99"
                className="pl-8 text-xs font-mono font-semibold bg-gray-50 dark:bg-gray-800 h-10 rounded-2xl border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-sky-500"
                maxLength={30}
                autoFocus
              />
            </div>
            <p className="text-[10px] text-gray-400">
              {lang === 'bn'
                ? 'অনুমোদিত: ৩–৩০টি ছোট হাতের অক্ষর (a-z), সংখ্যা (০-৯) এবং _'
                : 'Allowed: 3–30 lowercase letters (a-z), numbers (0-9), and _'}
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="py-2.5 rounded-2xl text-xs">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs ml-1">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-emerald-700 dark:text-emerald-300 text-xs font-bold"
            >
              <Check className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>{lang === 'bn' ? 'ইউজারনেম সফলভাবে আপডেট হয়েছে!' : 'Username updated successfully!'}</span>
            </motion.div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-9 px-4 rounded-xl text-xs font-semibold"
            >
              {lang === 'bn' ? 'বাতিল' : 'Cancel'}
            </Button>
            <Button
              type="submit"
              disabled={setUsernameMutation.isPending || !usernameInput.trim()}
              className="h-9 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-600 hover:to-teal-600 text-white shadow-xs"
            >
              {setUsernameMutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  <span>{lang === 'bn' ? 'যাচাই করা হচ্ছে...' : 'Saving...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  <span>{lang === 'bn' ? 'ইউজারনেম সংরক্ষণ করুন' : 'Save Username'}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
