'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, X, Clock, Loader2 } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useRespondFamilyInvitation, useDeleteFamilyConnection } from '@/hooks/useFamily'
import { RELATIONS_MAP, ALL_RELATION_OPTIONS, getRelationLabel } from '@/lib/family/relations'
import type { FamilyConnection, RelationType } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface InvitationCardProps {
  connection: FamilyConnection
  onSelectMember?: (memberId: string) => void
}

export function InvitationCard({ connection }: InvitationCardProps) {
  const { lang } = useLanguage()
  const respondMutation = useRespondFamilyInvitation()
  const deleteMutation = useDeleteFamilyConnection()

  const isReceived = !connection.is_requester
  const [selectedRelation, setSelectedRelation] = useState<RelationType>(
    connection.relation_type || 'Other'
  )

  const handleAccept = async () => {
    await respondMutation.mutateAsync({
      connectionId: connection.id,
      action: 'accept',
      reverse_relation_type: selectedRelation,
    })
  }

  const handleReject = async () => {
    await respondMutation.mutateAsync({
      connectionId: connection.id,
      action: 'reject',
    })
  }

  const handleCancel = async () => {
    await deleteMutation.mutateAsync(connection.id)
  }

  const isLoading = respondMutation.isPending || deleteMutation.isPending
  const meta = RELATIONS_MAP[connection.relation_type] || RELATIONS_MAP.Other

  if (isReceived) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-sky-200 dark:border-sky-800 shadow-sm relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 via-cyan-400 to-emerald-400 flex items-center justify-center text-white text-base font-black shrink-0 shadow-md shadow-sky-500/20">
              {connection.other_user.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                  {connection.other_user.name || 'User'}
                </h4>
                {connection.other_user.username && (
                  <span className="text-[11px] font-mono text-gray-400">
                    @{connection.other_user.username}
                  </span>
                )}
                <Badge variant="outline" className={`text-[10px] px-2 py-0.5 rounded-lg ${meta.badgeColor}`}>
                  {getRelationLabel(connection.relation_type, lang)}
                </Badge>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {lang === 'bn'
                  ? `আপনাকে পরিবারে যুক্ত করার অনুরোধ পাঠিয়েছেন (${connection.other_user.district || 'বাংলাদেশ'})`
                  : `Sent you a family connection request (${connection.other_user.district || 'Bangladesh'})`}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1.5">
              <label className="text-[11px] text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {lang === 'bn' ? 'সম্পর্ক নিশ্চিত করুন:' : 'Confirm Relation:'}
              </label>
              <select
                value={selectedRelation}
                onChange={(e) => setSelectedRelation(e.target.value as RelationType)}
                className="text-xs py-1.5 px-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-medium focus:ring-1 focus:ring-sky-500 focus:outline-none"
              >
                {ALL_RELATION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {lang === 'bn' ? opt.labelBn : opt.labelEn}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 pt-1 sm:pt-0">
              <Button
                size="sm"
                onClick={handleAccept}
                disabled={isLoading}
                className="flex-1 sm:flex-initial h-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 shadow-sm"
              >
                {respondMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5 mr-1" />
                )}
                <span>{lang === 'bn' ? 'গ্রহণ করুন' : 'Accept'}</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleReject}
                disabled={isLoading}
                className="flex-1 sm:flex-initial h-8 rounded-xl text-xs text-gray-600 dark:text-gray-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 px-3"
              >
                <X className="h-3.5 w-3.5 mr-1" />
                <span>{lang === 'bn' ? 'প্রত্যাখ্যান' : 'Decline'}</span>
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  // Sent pending invitation
  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 text-sm font-bold shrink-0">
          {connection.other_user.name?.[0]?.toUpperCase() || 'U'}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">
              {connection.other_user.name || 'User'}
            </h4>
            {connection.other_user.username && (
              <span className="text-[11px] font-mono text-gray-400">
                @{connection.other_user.username}
              </span>
            )}
            <Badge variant="outline" className={`text-[10px] px-2 py-0.5 rounded-lg ${meta.badgeColor}`}>
              {getRelationLabel(connection.relation_type, lang)}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 mt-0.5">
            <Clock className="h-3 w-3 animate-pulse" />
            <span>
              {lang === 'bn' ? 'আমন্ত্রণ পাঠানো হয়েছে — সম্মতির অপেক্ষায়' : 'Invitation sent — awaiting acceptance'}
            </span>
          </div>
        </div>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleCancel}
        disabled={isLoading}
        className="h-8 rounded-xl text-xs text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
      >
        {deleteMutation.isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <X className="h-3.5 w-3.5 mr-1" />
        )}
        <span>{lang === 'bn' ? 'বাতিল' : 'Cancel'}</span>
      </Button>
    </div>
  )
}
