'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, UserPlus, X, Check, Loader2, HeartPulse, Mail } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useSearchFamilyUsers, useSendFamilyInvitation } from '@/hooks/useFamily'
import { ALL_RELATION_OPTIONS, getReciprocalRelation, getRelationLabel } from '@/lib/family/relations'
import type { RelationType, UserSearchResult } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'

interface AddFamilyMemberProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddFamilyMember({ open, onOpenChange }: AddFamilyMemberProps) {
  const { lang } = useLanguage()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null)
  const [relationType, setRelationType] = useState<RelationType>('Father')
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const { data: searchResults, isLoading: isSearching } = useSearchFamilyUsers(searchTerm)
  const sendInviteMutation = useSendFamilyInvitation()

  const handleSelectUser = (user: UserSearchResult) => {
    setSelectedUser(user)
    setError(null)
    setSuccessMessage(null)
  }

  const handleSendInvite = async () => {
    if (!selectedUser) return
    setError(null)
    setSuccessMessage(null)

    try {
      await sendInviteMutation.mutateAsync({
        target_id: selectedUser.id,
        relation_type: relationType,
        reverse_relation_type: getReciprocalRelation(relationType),
      })

      setSuccessMessage(
        lang === 'bn'
          ? `${selectedUser.name || selectedUser.email || 'সদস্য'} কে সফলভাবে আমন্ত্রণ পাঠানো হয়েছে!`
          : `Invitation successfully sent to ${selectedUser.name || selectedUser.email || 'member'}!`
      )

      setTimeout(() => {
        setSelectedUser(null)
        setSearchTerm('')
        setSuccessMessage(null)
        onOpenChange(false)
      }, 1500)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send invitation'
      setError(message)
    }
  }

  const reciprocal = getReciprocalRelation(relationType)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-3xl border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xl">
        {/* Header with gradient accent */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-sky-500/10 via-cyan-500/5 to-emerald-500/10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-gray-900 dark:text-gray-100">
                {lang === 'bn' ? 'পরিবারে নতুন সদস্য যুক্ত করুন' : 'Add Family Member'}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 dark:text-gray-400">
                {lang === 'bn'
                  ? 'জিমেইল (Gmail) বা ইউজারনেম দিয়ে খুঁজে সদস্যকে আমন্ত্রণ পাঠান'
                  : 'Search by Gmail (Default) or Username to send a family invite'}
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={lang === 'bn' ? 'জিমেইল বা ইউজারনেম লিখুন (যেমন: mugdho@gmail.com বা @rahim)' : 'Enter Gmail or username (e.g. parent@gmail.com or @rahim)'}
              className="pl-10 h-11 text-xs rounded-2xl bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-900"
              autoFocus
            />
            {isSearching && (
              <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-sky-500" />
            )}
          </div>

          {/* Search Results / Selected User */}
          <div className="min-h-[160px] max-h-[220px] overflow-y-auto space-y-2 pr-1">
            {searchTerm.trim().length < 2 && !selectedUser && (
              <div className="flex flex-col items-center justify-center h-36 text-center text-gray-400 p-4">
                <Mail className="h-8 w-8 text-sky-400/50 mb-2" />
                <p className="text-xs font-medium">
                  {lang === 'bn'
                    ? 'সদস্যের জিমেইল (Gmail) বা ইউজারনেম দিয়ে সন্ধান করুন'
                    : 'Search using member\'s Gmail address or username'}
                </p>
                <p className="text-[11px] text-gray-400/80 mt-0.5">
                  {lang === 'bn'
                    ? 'যেমন: mugdho@gmail.com বা rahim_99'
                    : 'e.g. mugdho@gmail.com or rahim_99'}
                </p>
              </div>
            )}

            {searchTerm.trim().length >= 2 && !isSearching && (!searchResults || searchResults.length === 0) && !selectedUser && (
              <div className="flex flex-col items-center justify-center h-36 text-center text-gray-400 p-4">
                <p className="text-xs">
                  {lang === 'bn' ? 'কোনো ব্যবহারকারী পাওয়া যায়নি' : 'No user found with this Gmail or username'}
                </p>
              </div>
            )}

            {searchResults && searchResults.length > 0 && !selectedUser && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-1">
                  {lang === 'bn' ? 'অনুসন্ধান ফলাফল' : 'Search Results'}
                </p>
                {searchResults.map((user) => {
                  const isAlready = user.connectionStatus && user.connectionStatus !== 'none'
                  return (
                    <button
                      key={user.id}
                      type="button"
                      disabled={isAlready}
                      onClick={() => handleSelectUser(user)}
                      className={`w-full p-3 rounded-2xl flex items-center justify-between gap-3 text-left transition-all ${
                        isAlready
                          ? 'opacity-60 bg-gray-50 dark:bg-gray-800/40 cursor-not-allowed'
                          : 'hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:border-sky-200 dark:hover:border-sky-800 bg-white dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 cursor-pointer shadow-xs'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-cyan-400 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-xs">
                          {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
                            {user.name || (user.email ? user.email.split('@')[0] : 'User')}
                          </p>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {user.email && (
                              <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
                                <Mail className="h-3 w-3 text-gray-400" />
                                {user.email}
                              </span>
                            )}
                            {user.username && (
                              <span className="text-[10px] font-mono text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50 px-1.5 py-0.2 rounded border border-sky-200/50 dark:border-sky-800/50">
                                @{user.username}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        {user.connectionStatus === 'accepted' ? (
                          <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-600 border-emerald-200">
                            {lang === 'bn' ? 'সংযুক্ত' : 'Connected'}
                          </Badge>
                        ) : user.connectionStatus === 'pending' ? (
                          <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-600 border-amber-200">
                            {lang === 'bn' ? 'অপেক্ষমান' : 'Pending'}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] bg-sky-50 text-sky-600 border-sky-200">
                            {lang === 'bn' ? 'যুক্ত করুন' : 'Select'}
                          </Badge>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Selected User & Relation Configuration */}
            {selectedUser && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-2xl bg-sky-50/50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 flex items-center justify-center text-white text-sm font-bold shadow-md shadow-sky-500/20 shrink-0">
                      {selectedUser.name?.[0]?.toUpperCase() || selectedUser.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                        {selectedUser.name || 'Family Member'}
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                        {selectedUser.email || (selectedUser.username ? `@${selectedUser.username}` : 'user')}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedUser(null)}
                    className="h-7 w-7 p-0 rounded-full text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Relation Selector */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">
                    {lang === 'bn' ? 'তিনি আপনার কী হন?' : 'What is their relation to you?'}
                  </label>
                  <select
                    value={relationType}
                    onChange={(e) => setRelationType(e.target.value as RelationType)}
                    className="w-full text-xs py-2.5 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none shadow-xs"
                  >
                    {ALL_RELATION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {lang === 'bn' ? opt.labelBn : opt.labelEn}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Reciprocal Preview Note */}
                <div className="p-2.5 rounded-xl bg-white/80 dark:bg-gray-900/60 border border-sky-100 dark:border-sky-900/50 text-[11px] text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <HeartPulse className="h-4 w-4 text-sky-500 shrink-0" />
                  <span>
                    {lang === 'bn'
                      ? `তাঁর কাছে আপনি "${getRelationLabel(reciprocal, 'bn')}" হিসেবে প্রদর্শিত হবেন`
                      : `You will appear as their "${getRelationLabel(reciprocal, 'en')}"`}
                  </span>
                </div>
              </motion.div>
            )}
          </div>

          {error && (
            <Alert variant="destructive" className="py-2 px-3 text-xs rounded-xl">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <Alert className="py-2 px-3 text-xs rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300">
              <AlertDescription className="flex items-center gap-1.5">
                <Check className="h-4 w-4" />
                <span>{successMessage}</span>
              </AlertDescription>
            </Alert>
          )}

          {/* Action footer */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="rounded-xl text-xs h-9"
            >
              {lang === 'bn' ? 'বাতিল' : 'Cancel'}
            </Button>
            <Button
              size="sm"
              disabled={!selectedUser || sendInviteMutation.isPending}
              onClick={handleSendInvite}
              className="rounded-xl text-xs h-9 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white font-bold px-4 shadow-sm"
            >
              {sendInviteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <UserPlus className="h-4 w-4 mr-1" />
              )}
              <span>{lang === 'bn' ? 'আমন্ত্রণ পাঠান' : 'Send Invitation'}</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
