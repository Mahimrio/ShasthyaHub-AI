'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AtSign, Check, Loader2, Copy, Mail, IdCard } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useSetProfileUsername } from '@/hooks/useFamily'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'

interface SetUsernameProps {
  currentUsername: string | null
  userName?: string | null
  userEmail?: string | null
}

export function SetUsername({ currentUsername, userName, userEmail }: SetUsernameProps) {
  const { lang } = useLanguage()
  const [usernameInput, setUsernameInput] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [showIdCard, setShowIdCard] = useState(false)
  const [copiedType, setCopiedType] = useState<'email' | 'username' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const setUsernameMutation = useSetProfileUsername()

  const handleCopy = (text: string, type: 'email' | 'username') => {
    navigator.clipboard.writeText(text)
    setCopiedType(type)
    setTimeout(() => setCopiedType(null), 2000)
  }

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

  return (
    <>
      <div className="p-4 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {/* Identity & Identifiers */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-400 via-cyan-400 to-emerald-400 flex items-center justify-center text-white text-base font-black shrink-0 shadow-md shadow-sky-500/15">
              {userName?.[0]?.toUpperCase() || userEmail?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                  {lang === 'bn' ? 'পারিবারিক সার্চ আইডি (ডিফল্ট):' : 'Family Search ID (Default):'}
                </span>
                {userEmail ? (
                  <button
                    type="button"
                    onClick={() => handleCopy(userEmail, 'email')}
                    className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-2.5 py-1 rounded-xl border border-sky-200/60 dark:border-sky-800/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 transition-colors"
                  >
                    <Mail className="h-3 w-3 text-sky-500" />
                    <span>{userEmail}</span>
                    {copiedType === 'email' ? (
                      <Check className="h-3 w-3 text-emerald-500 ml-0.5" />
                    ) : (
                      <Copy className="h-3 w-3 text-gray-400 ml-0.5" />
                    )}
                  </button>
                ) : (
                  <span className="text-xs text-gray-400">Loading...</span>
                )}
              </div>

              {/* Username badge or Prompt */}
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-[11px] text-gray-500 dark:text-gray-400">
                  {lang === 'bn' ? 'ইউজারনেম:' : 'Custom Username:'}
                </span>
                {currentUsername ? (
                  <button
                    type="button"
                    onClick={() => handleCopy(`@${currentUsername}`, 'username')}
                    className="inline-flex items-center gap-1 font-mono text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-200/60 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors"
                  >
                    <span>@{currentUsername}</span>
                    {copiedType === 'username' ? (
                      <Check className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <Copy className="h-3 w-3 text-gray-400" />
                    )}
                  </button>
                ) : (
                  <Badge variant="outline" className="text-[10px] text-amber-600 bg-amber-50 border-amber-200">
                    {lang === 'bn' ? 'নির্ধারণ করা হয়নি' : 'Not set yet'}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-gray-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowIdCard(true)}
              className="h-8 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700"
            >
              <IdCard className="h-3.5 w-3.5 mr-1 text-sky-500" />
              <span>{lang === 'bn' ? 'আইডি কার্ড দেখুন' : 'Show ID Card'}</span>
            </Button>
            <Button
              variant={currentUsername ? 'ghost' : 'default'}
              size="sm"
              onClick={() => {
                setUsernameInput(currentUsername || '')
                setIsEditing(!isEditing)
              }}
              className={`h-8 rounded-xl text-xs font-semibold ${
                currentUsername
                  ? 'text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40'
                  : 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white'
              }`}
            >
              <AtSign className="h-3.5 w-3.5 mr-1" />
              <span>
                {currentUsername
                  ? lang === 'bn' ? 'ইউজারনেম পরিবর্তন' : 'Edit Username'
                  : lang === 'bn' ? 'ইউজারনেম তৈরি করুন' : 'Set Username'}
              </span>
            </Button>
          </div>
        </div>

        {/* Username Edit Drawer / Form */}
        <AnimatePresence>
          {isEditing && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleSave}
              className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-2 overflow-hidden"
            >
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                {lang === 'bn'
                  ? 'পরিবারের সদস্যরা আপনার জিমেইল ছাড়া এই কাস্টম ইউজারনেম দিয়েও আপনাকে খুঁজে পাবেন:'
                  : 'Family members can find you via your Gmail or this custom username handle:'}
              </p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-xs">
                    @
                  </span>
                  <Input
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="e.g. rahim_99"
                    className="pl-7 text-xs font-mono bg-gray-50 dark:bg-gray-800 h-9 rounded-xl border-gray-200 dark:border-gray-700"
                    maxLength={30}
                    autoFocus
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={setUsernameMutation.isPending || !usernameInput.trim()}
                    className="h-9 px-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold"
                  >
                    {setUsernameMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5 mr-1" />
                    )}
                    <span>{lang === 'bn' ? 'সংরক্ষণ' : 'Save'}</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                    className="h-9 text-xs rounded-xl"
                  >
                    {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive" className="py-1.5 px-3 text-xs rounded-xl">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      {/* Show Family ID Card Dialog (Great for Elderly Parents to Show Family) */}
      <Dialog open={showIdCard} onOpenChange={setShowIdCard}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-3xl border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xl">
          <div className="p-6 bg-gradient-to-br from-sky-500 via-cyan-500 to-emerald-500 text-white text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="w-16 h-16 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white text-2xl font-black mx-auto mb-3 shadow-lg border border-white/30">
              {userName?.[0]?.toUpperCase() || userEmail?.[0]?.toUpperCase() || 'U'}
            </div>
            <DialogTitle className="text-lg font-black text-white">
              {userName || 'Family Member'}
            </DialogTitle>
            <DialogDescription className="text-xs text-white/80 mt-0.5">
              {lang === 'bn'
                ? 'পরিবারে যুক্ত হতে এই জিমেইল আইডি বা ইউজারনেম স্বজনকে দিন'
                : 'Share this Gmail or Username to connect on Family Tree'}
            </DialogDescription>
          </div>

          <div className="p-6 space-y-4">
            {/* Primary Search Gmail */}
            <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-sky-700 dark:text-sky-300">
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  {lang === 'bn' ? 'ডিফল্ট সার্চ জিমেইল আইডি' : 'Default Search Gmail ID'}
                </span>
                <Badge variant="outline" className="text-[9px] bg-sky-100 text-sky-700 dark:bg-sky-900/60 dark:text-sky-300 border-sky-300">
                  {lang === 'bn' ? 'সহজ অনুসন্ধান' : 'Easy Find'}
                </Badge>
              </div>
              <p className="font-mono text-sm font-bold text-gray-900 dark:text-gray-100 break-all select-all">
                {userEmail || 'N/A'}
              </p>
              {userEmail && (
                <Button
                  size="sm"
                  onClick={() => handleCopy(userEmail, 'email')}
                  className="w-full mt-2 h-8 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold"
                >
                  {copiedType === 'email' ? (
                    <Check className="h-3.5 w-3.5 mr-1" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 mr-1" />
                  )}
                  <span>{copiedType === 'email' ? (lang === 'bn' ? 'কপি হয়েছে!' : 'Copied!') : (lang === 'bn' ? 'জিমেইল আইডি কপি করুন' : 'Copy Gmail ID')}</span>
                </Button>
              )}
            </div>

            {/* Custom Username */}
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-gray-700 dark:text-gray-300">
                <span className="flex items-center gap-1.5">
                  <AtSign className="h-3.5 w-3.5" />
                  {lang === 'bn' ? 'কাস্টম ইউজারনেম' : 'Custom Username'}
                </span>
              </div>
              <p className="font-mono text-sm font-bold text-gray-900 dark:text-gray-100">
                {currentUsername ? `@${currentUsername}` : (lang === 'bn' ? 'এখনো তৈরি করা হয়নি' : 'Not configured')}
              </p>
              {currentUsername && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopy(`@${currentUsername}`, 'username')}
                  className="w-full mt-2 h-8 rounded-xl text-xs font-semibold"
                >
                  {copiedType === 'username' ? (
                    <Check className="h-3.5 w-3.5 mr-1 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 mr-1" />
                  )}
                  <span>{copiedType === 'username' ? (lang === 'bn' ? 'কপি হয়েছে!' : 'Copied!') : (lang === 'bn' ? 'ইউজারনেম কপি করুন' : 'Copy Username')}</span>
                </Button>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowIdCard(false)}
              className="w-full rounded-xl text-xs text-gray-500"
            >
              {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
