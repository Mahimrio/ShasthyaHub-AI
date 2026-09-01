'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Activity, ChevronRight, Trash2, HeartPulse } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useDeleteFamilyConnection } from '@/hooks/useFamily'
import { RELATIONS_MAP, getRelationLabel } from '@/lib/family/relations'
import type { FamilyConnection } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface FamilyMemberCardProps {
  connection: FamilyConnection
  onViewHealth: (memberId: string) => void
}

export function FamilyMemberCard({ connection, onViewHealth }: FamilyMemberCardProps) {
  const { lang } = useLanguage()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const deleteMutation = useDeleteFamilyConnection()

  const meta = RELATIONS_MAP[connection.relation_type] || RELATIONS_MAP.Other
  const member = connection.other_user

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(connection.id)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all group"
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
    </motion.div>
  )
}
