'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Activity,
  Bell,
  CheckCircle2,
  ChevronRight,
  Clock,
  HeartPulse,
  Trash2,
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  useDeleteFamilyConnection,
  useFamilyMemberMedications,
  useSendCaregiverNudge,
} from '@/hooks/useFamily'
import { RELATIONS_MAP, getRelationLabel } from '@/lib/family/relations'
import type { FamilyConnection } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PillAvatar } from '@/components/shared/PillAvatar'
import { formatTimeDisplay } from '@/lib/services/medication-reminder'

interface FamilyMemberCardProps {
  connection: FamilyConnection
  onViewHealth: (memberId: string) => void
}

export function FamilyMemberCard({ connection, onViewHealth }: FamilyMemberCardProps) {
  const { lang } = useLanguage()
  const isBn = lang === 'bn'
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [nudgeSent, setNudgeSent] = useState(false)

  const deleteMutation = useDeleteFamilyConnection()
  const nudgeMutation = useSendCaregiverNudge()

  const meta = RELATIONS_MAP[connection.relation_type] || {
    badgeColor: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800',
  }
  const member = connection.other_user

  const { data: medStatus } = useFamilyMemberMedications(member.id)

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(connection.id)
  }

  const handleNudge = async () => {
    await nudgeMutation.mutateAsync({ memberId: member.id })
    setNudgeSent(true)
    setTimeout(() => setNudgeSent(false), 3500)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs hover:shadow-md transition-all group space-y-3"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Member Identity */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 via-cyan-400 to-emerald-400 flex items-center justify-center text-white text-base font-black shrink-0 shadow-md shadow-sky-500/10">
            {member.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                {member.name || 'Family Member'}
              </h4>
              {member.username && (
                <span className="text-xs font-mono text-gray-400">
                  @{member.username}
                </span>
              )}
              <Badge variant="outline" className={`text-[10px] px-2 py-0.5 rounded-lg ${meta.badgeColor}`}>
                {getRelationLabel(connection.relation_type, lang)}
              </Badge>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-2">
              <span>{member.district || (lang === 'bn' ? 'বাংলাদেশ' : 'Bangladesh')}</span>
              <span className="text-gray-300 dark:text-gray-700">•</span>
              <span className="text-emerald-600 dark:text-emerald-400 text-[11px] font-medium flex items-center gap-1">
                <HeartPulse className="h-3 w-3" />
                {lang === 'bn' ? 'সংযুক্ত সদস্য' : 'Connected'}
              </span>
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-gray-800">
          {confirmDelete ? (
            <div className="flex items-center gap-1.5 animate-fadeIn">
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="h-8 text-xs rounded-xl px-2.5"
              >
                {lang === 'bn' ? 'মুছে ফেলুন' : 'Confirm Remove'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setConfirmDelete(false)}
                className="h-8 text-xs rounded-xl px-2.5"
              >
                {lang === 'bn' ? 'না' : 'Cancel'}
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmDelete(true)}
              className="h-8 w-8 p-0 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
              title={lang === 'bn' ? 'সংযোগ বিচ্ছিন্ন করুন' : 'Remove connection'}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}

          <Button
            size="sm"
            onClick={() => onViewHealth(member.id)}
            className="h-8 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white text-xs font-semibold px-3 shadow-xs"
          >
            <Activity className="h-3.5 w-3.5 mr-1" />
            <span>{lang === 'bn' ? 'স্বাস্থ্য তথ্য দেখুন' : 'Health Record'}</span>
            <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
          </Button>
        </div>
      </div>

      {/* Medfriend Live Adherence Status Bar */}
      {medStatus && medStatus.totalDosesToday > 0 && (
        <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Status Chip */}
            {medStatus.status === 'all_taken' ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/90 px-2.5 py-1 rounded-xl">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>
                  {isBn
                    ? `আজকের সব ঔষধ গৃহীত (${medStatus.takenDosesToday}/${medStatus.totalDosesToday})`
                    : `All Doses Taken Today (${medStatus.takenDosesToday}/${medStatus.totalDosesToday})`}
                </span>
              </span>
            ) : medStatus.status === 'missed' ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 dark:text-red-300 bg-red-100/80 dark:bg-red-950/90 px-2.5 py-1 rounded-xl">
                <Clock className="h-3.5 w-3.5 text-red-500" />
                <span>
                  {isBn
                    ? `⚠️ ${medStatus.missedDosesToday}টি ডোজ দেরি হয়েছে`
                    : `⚠️ ${medStatus.missedDosesToday} dose(s) missed`}
                </span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 dark:text-sky-300 bg-sky-100/80 dark:bg-sky-950/90 px-2.5 py-1 rounded-xl">
                <Clock className="h-3.5 w-3.5" />
                <span>
                  {isBn
                    ? `পরবর্তী ডোজ: ${formatTimeDisplay(medStatus.nextDoseTime || '08:00', lang)} (${medStatus.takenDosesToday}/${medStatus.totalDosesToday} সম্পন্ন)`
                    : `Next Dose: ${formatTimeDisplay(medStatus.nextDoseTime || '08:00', lang)} (${medStatus.takenDosesToday}/${medStatus.totalDosesToday})`}
                </span>
              </span>
            )}

            {/* Visual Pill Avatars Preview */}
            <div className="flex items-center gap-1">
              {medStatus.activePills.slice(0, 4).map((p, idx) => (
                <div
                  key={`${p.drugNameEn}-${idx}`}
                  title={`${p.drugNameEn} (${p.descriptorBn})`}
                  className="p-1 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-2xs"
                >
                  <PillAvatar
                    shape={p.shape}
                    color={p.color}
                    colorSecondary={p.colorSecondary}
                    size="xs"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Caregiver Nudge Button */}
          {medStatus.status !== 'all_taken' && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleNudge}
              disabled={nudgeMutation.isPending || nudgeSent}
              className={`h-7.5 text-xs font-bold rounded-xl px-2.5 shrink-0 transition-all ${
                nudgeSent
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-300'
                  : 'text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800 hover:bg-amber-50'
              }`}
            >
              <Bell className="h-3 w-3 mr-1" />
              <span>
                {nudgeSent
                  ? isBn
                    ? 'মনে করিয়ে দেওয়া হয়েছে! ✓'
                    : 'Nudged! ✓'
                  : isBn
                  ? 'মনে করিয়ে দিন'
                  : 'Send Nudge'}
              </span>
            </Button>
          )}
        </div>
      )}
    </motion.div>
  )
}
