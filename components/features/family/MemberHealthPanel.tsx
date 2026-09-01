'use client'

import { useState } from 'react'
import {
  X,
  Eye,
  FileText,
  Utensils,
  AlertTriangle,
  Bell,
  Sun,
  Sunset,
  Moon,
  Coffee,
  CheckCircle2,
  Clock,
  Loader2,
  Pill,
  ShieldAlert,
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  useMemberHealthReports,
  useCaregiverAlerts,
  useToggleCaregiverAlertSubscription,
  useSendCaregiverNudge,
} from '@/hooks/useFamily'
import { RELATIONS_MAP, getRelationLabel } from '@/lib/family/relations'
import type { RelationType, MedicationSchedule } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PillAvatar } from '@/components/shared/PillAvatar'
import { formatTimeDisplay } from '@/lib/services/medication-reminder'

interface ExtractedDrugItem {
  brand_name?: string
  generic_name?: string
  written_text?: string
  dosage?: string
  frequency?: string
}

interface PrescriptionItem {
  id: string
  created_at: string
  has_dangerous_interactions?: boolean
  extracted_drugs?: ExtractedDrugItem[]
}

interface EyeScanItem {
  id: string
  created_at: string
  diagnosis?: string
  severity?: string
  recommendation_bn?: string
  recommendation_en?: string
  urgency_days?: number
}

interface FoodLogItem {
  id: string
  created_at: string
  total_calories?: number
  risk_level?: string
  risk_summary_bn?: string
  risk_summary_en?: string
}

interface MemberHealthPanelProps {
  memberId: string | null
  onClose: () => void
}

export function MemberHealthPanel({ memberId, onClose }: MemberHealthPanelProps) {
  const { lang } = useLanguage()
  const { data: healthData, isLoading, error } = useMemberHealthReports(memberId)
  const { data: caregiverData } = useCaregiverAlerts()
  const toggleSubscription = useToggleCaregiverAlertSubscription()
  const nudgeMutation = useSendCaregiverNudge()
  const [nudgeSent, setNudgeSent] = useState(false)

  const handleNudge = async () => {
    if (!memberId) return
    await nudgeMutation.mutateAsync({ memberId })
    setNudgeSent(true)
    setTimeout(() => setNudgeSent(false), 3500)
  }

  if (!memberId) return null

  const member = healthData?.member
  const relationMeta = member ? RELATIONS_MAP[member.relation as RelationType] || RELATIONS_MAP.Other : null

  // Latest prescription with schedule
  const latestRx = healthData?.prescriptions?.[0]
  const schedule = (latestRx?.digital_schedule || null) as MedicationSchedule | null
  const extractedDrugs = (latestRx?.extracted_drugs || []) as Array<{
    written_text?: string
    brand_name?: string
    generic_name?: string
    dosage?: string
    frequency?: string
    instructions?: string
  }>

  return (
    <Dialog open={!!memberId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 rounded-3xl border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xl">
        {/* Header with gradient strip */}
        <div className="sticky top-0 z-20 p-5 border-b border-gray-100 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 via-cyan-400 to-emerald-400 flex items-center justify-center text-white text-lg font-black shrink-0 shadow-md shadow-sky-500/20">
                {member?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 truncate">
                    {member?.name || (isLoading ? 'Loading...' : 'Family Member')}
                  </h3>
                  {member?.username && (
                    <span className="text-xs font-mono text-gray-400">
                      @{member.username}
                    </span>
                  )}
                  {relationMeta && (
                    <Badge variant="outline" className={`text-[10px] px-2 py-0.5 rounded-lg ${relationMeta.badgeColor}`}>
                      {getRelationLabel(member.relation, lang)}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-2">
                  <span>{member?.district || 'Bangladesh'}</span>
                  <span className="text-gray-300 dark:text-gray-700">•</span>
                  <span className="text-sky-600 dark:text-sky-400 font-medium">
                    {lang === 'bn' ? 'স্বাস্থ্য ট্র্যাকিং ড্যাশবোর্ড' : 'Health Monitoring'}
                  </span>
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Body content */}
        <div className="p-5 space-y-5">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400">
              <Loader2 className="h-8 w-8 animate-spin text-sky-500 mb-3" />
              <p className="text-xs font-medium">
                {lang === 'bn' ? 'স্বাস্থ্য তথ্য লোড হচ্ছে...' : 'Loading health records...'}
              </p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400">
              {error.message}
            </div>
          )}

          {healthData && (
            <>
              {/* Quick Health Summary Strip */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="p-3 rounded-2xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/40 text-center">
                  <div className="w-7 h-7 rounded-lg bg-sky-500/15 dark:bg-sky-400/15 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto mb-1">
                    <FileText className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-lg font-black text-sky-700 dark:text-sky-300">
                    {healthData.prescriptions.length}
                  </span>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                    {lang === 'bn' ? 'প্রেসক্রিপশন' : 'Prescriptions'}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-center">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/15 dark:bg-emerald-400/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-1">
                    <Eye className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-lg font-black text-emerald-700 dark:text-emerald-300">
                    {healthData.eyeAnalyses.length}
                  </span>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                    {lang === 'bn' ? 'চোখের পরীক্ষা' : 'Eye Scans'}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 text-center">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/15 dark:bg-amber-400/15 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-1">
                    <Utensils className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-lg font-black text-amber-700 dark:text-amber-300">
                    {healthData.foodAnalyses.length}
                  </span>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                    {lang === 'bn' ? 'খাদ্য বিশ্লেষণ' : 'Meal Logs'}
                  </p>
                </div>
              </div>

              {/* Caregiver Missed Dose Alerts & Subscription Controller */}
              {(() => {
                const memberAlert = caregiverData?.alerts.find((a) => a.memberId === memberId)
                const missedDoses = memberAlert?.missedDoses || []
                const isSubscribed =
                  caregiverData?.subscriptions[memberId] !== undefined
                    ? caregiverData.subscriptions[memberId]
                    : ['Father', 'Mother', 'Grandfather', 'Grandmother', 'Child'].includes(
                        member?.relation || ''
                      )

                return (
                  <div className="space-y-3">
                    {/* Active Missed Dose Warning Banner */}
                    {missedDoses.length > 0 && (
                      <div className="p-4 rounded-3xl bg-gradient-to-br from-red-500/15 via-rose-500/10 to-amber-500/10 border border-red-300/80 dark:border-red-800/60 shadow-xs space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-red-500 text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                              <ShieldAlert className="h-4 w-4" />
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-red-900 dark:text-red-200">
                                {lang === 'bn'
                                  ? `${member?.name || 'এই সদস্যের'} ${missedDoses.length}টি ওষুধের নির্ধারিত সময় পার হয়েছে`
                                  : `${member?.name || 'Member'} missed ${missedDoses.length} scheduled dose(s)`}
                              </h4>
                              <p className="text-[11px] text-red-700/80 dark:text-red-300/80 mt-0.5">
                                {lang === 'bn'
                                  ? 'নির্ধারিত সময়ের ৪৫ মিনিট অতিবাহিত হয়েছে। অনুগ্রহ করে মনে করিয়ে দিন।'
                                  : 'Scheduled time passed by 45+ minutes. Send a gentle reminder.'}
                              </p>
                            </div>
                          </div>

                          <Button
                            size="sm"
                            onClick={handleNudge}
                            disabled={nudgeMutation.isPending || nudgeSent}
                            className={`h-8 text-xs font-bold rounded-xl px-3 shrink-0 shadow-sm transition-all ${
                              nudgeSent
                                ? 'bg-emerald-500 text-white'
                                : 'bg-red-600 hover:bg-red-700 text-white'
                            }`}
                          >
                            <Bell className="h-3.5 w-3.5 mr-1" />
                            <span>
                              {nudgeSent
                                ? lang === 'bn'
                                  ? 'মনে করিয়ে দেওয়া হয়েছে! ✓'
                                  : 'Nudged! ✓'
                                : lang === 'bn'
                                ? 'মনে করিয়ে দিন'
                                : 'Send Nudge'}
                            </span>
                          </Button>
                        </div>

                        {/* Missed drugs preview list */}
                        <div className="space-y-1.5 pt-1 border-t border-red-200/60 dark:border-red-900/40">
                          {missedDoses.map((m) => (
                            <div
                              key={m.scheduleId}
                              className="flex items-center justify-between p-2 rounded-xl bg-white/80 dark:bg-gray-800/80 border border-red-100 dark:border-red-900/30 text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <div className="p-0.5 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shrink-0">
                                  <PillAvatar
                                    shape={m.pillShape}
                                    color={m.pillColor}
                                    colorSecondary={m.pillColorSecondary}
                                    size="xs"
                                  />
                                </div>
                                <span className="font-bold text-gray-800 dark:text-gray-200">
                                  {lang === 'bn' ? m.drugNameBn : m.drugNameEn} ({m.dosage})
                                </span>
                              </div>
                              <span className="text-[11px] font-mono text-red-600 dark:text-red-400 font-bold flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{formatTimeDisplay(m.scheduledTime, lang)}</span>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Per-Node Caregiver Notification Subscription Controller */}
                    <div className="p-3.5 rounded-2xl bg-gray-50/80 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/60 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                          <Bell className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
                            {lang === 'bn'
                              ? 'মিসড ডোজের নোটিফিকেশন পান'
                              : 'Receive Missed Dose Alerts'}
                          </p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">
                            {lang === 'bn'
                              ? 'চালু রাখলে এই সদস্যের কোনো ওষুধ মিস হলে আপনার মূল নোটিফিকেশন বারে সতর্কবার্তা পাবেন।'
                              : 'Get alerts in your top navigation bar when this family member misses a dose.'}
                          </p>
                        </div>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={isSubscribed}
                          onChange={(e) =>
                            toggleSubscription.mutate({
                              memberId,
                              enabled: e.target.checked,
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-500" />
                      </label>
                    </div>
                  </div>
                )
              })()}

              {/* Elderly Care Feature Highlight: Daily Medication Schedule */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <Pill className="h-3.5 w-3.5" />
                    </div>
                    <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100">
                      {lang === 'bn'
                        ? 'দৈনিক ওষুধের রুটিন (পিতা-মাতার জন্য রিমাইন্ডার)'
                        : 'Daily Medication Schedule (For Elders)'}
                    </h4>
                  </div>
                  {latestRx && (
                    <span className="text-[10px] text-gray-400">
                      {new Date(latestRx.created_at).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US')}
                    </span>
                  )}
                </div>

                {schedule ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Morning */}
                    <div className="p-3 rounded-2xl bg-amber-500/5 border border-amber-200/50 dark:border-amber-900/30 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 text-xs font-bold">
                        <Sun className="h-3.5 w-3.5" />
                        <span>{lang === 'bn' ? 'সকাল (নাস্তার পর/আগে)' : 'Morning'}</span>
                      </div>
                      {schedule.morning && schedule.morning.length > 0 ? (
                        schedule.morning.map((m, idx) => (
                          <div key={idx} className="text-xs text-gray-800 dark:text-gray-200 bg-white/80 dark:bg-gray-800/80 p-2 rounded-xl border border-amber-100 dark:border-amber-900/30">
                            <p className="font-bold text-gray-900 dark:text-gray-100">
                              {lang === 'bn' ? (m.drug_bn || m.drug_en) : m.drug_en}
                            </p>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400">
                              {m.dosage} • {lang === 'bn' ? (m.instructions_bn || m.instructions_en) : m.instructions_en}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-[11px] text-gray-400 italic">
                          {lang === 'bn' ? 'সকালে কোনো ওষুধ নেই' : 'No morning medication'}
                        </p>
                      )}
                    </div>

                    {/* Afternoon */}
                    <div className="p-3 rounded-2xl bg-sky-500/5 border border-sky-200/50 dark:border-sky-900/30 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-sky-700 dark:text-sky-400 text-xs font-bold">
                        <Coffee className="h-3.5 w-3.5" />
                        <span>{lang === 'bn' ? 'দুপুর (দুপুরের খাবার)' : 'Afternoon'}</span>
                      </div>
                      {schedule.afternoon && schedule.afternoon.length > 0 ? (
                        schedule.afternoon.map((m, idx) => (
                          <div key={idx} className="text-xs text-gray-800 dark:text-gray-200 bg-white/80 dark:bg-gray-800/80 p-2 rounded-xl border border-sky-100 dark:border-sky-900/30">
                            <p className="font-bold text-gray-900 dark:text-gray-100">
                              {lang === 'bn' ? (m.drug_bn || m.drug_en) : m.drug_en}
                            </p>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400">
                              {m.dosage} • {lang === 'bn' ? (m.instructions_bn || m.instructions_en) : m.instructions_en}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-[11px] text-gray-400 italic">
                          {lang === 'bn' ? 'দুপুরে কোনো ওষুধ নেই' : 'No afternoon medication'}
                        </p>
                      )}
                    </div>

                    {/* Evening */}
                    <div className="p-3 rounded-2xl bg-rose-500/5 border border-rose-200/50 dark:border-rose-900/30 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 text-xs font-bold">
                        <Sunset className="h-3.5 w-3.5" />
                        <span>{lang === 'bn' ? 'সন্ধ্যা' : 'Evening'}</span>
                      </div>
                      {schedule.evening && schedule.evening.length > 0 ? (
                        schedule.evening.map((m, idx) => (
                          <div key={idx} className="text-xs text-gray-800 dark:text-gray-200 bg-white/80 dark:bg-gray-800/80 p-2 rounded-xl border border-rose-100 dark:border-rose-900/30">
                            <p className="font-bold text-gray-900 dark:text-gray-100">
                              {lang === 'bn' ? (m.drug_bn || m.drug_en) : m.drug_en}
                            </p>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400">
                              {m.dosage} • {lang === 'bn' ? (m.instructions_bn || m.instructions_en) : m.instructions_en}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-[11px] text-gray-400 italic">
                          {lang === 'bn' ? 'সন্ধ্যায় কোনো ওষুধ নেই' : 'No evening medication'}
                        </p>
                      )}
                    </div>

                    {/* Night */}
                    <div className="p-3 rounded-2xl bg-indigo-500/5 border border-indigo-200/50 dark:border-indigo-900/30 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-400 text-xs font-bold">
                        <Moon className="h-3.5 w-3.5" />
                        <span>{lang === 'bn' ? 'রাত (ঘুমানোর আগে)' : 'Night'}</span>
                      </div>
                      {schedule.night && schedule.night.length > 0 ? (
                        schedule.night.map((m, idx) => (
                          <div key={idx} className="text-xs text-gray-800 dark:text-gray-200 bg-white/80 dark:bg-gray-800/80 p-2 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                            <p className="font-bold text-gray-900 dark:text-gray-100">
                              {lang === 'bn' ? (m.drug_bn || m.drug_en) : m.drug_en}
                            </p>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400">
                              {m.dosage} • {lang === 'bn' ? (m.instructions_bn || m.instructions_en) : m.instructions_en}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-[11px] text-gray-400 italic">
                          {lang === 'bn' ? 'রাতে কোনো ওষুধ নেই' : 'No night medication'}
                        </p>
                      )}
                    </div>
                  </div>
                ) : extractedDrugs.length > 0 ? (
                  <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 space-y-2">
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      {lang === 'bn' ? 'সংযুক্ত প্রেসক্রিপশন অনুযায়ী ওষুধসমূহ:' : 'Medications on current prescription:'}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {extractedDrugs.map((d, i) => (
                        <div key={i} className="p-2 bg-white dark:bg-gray-800 rounded-xl text-xs border border-gray-100 dark:border-gray-700">
                          <p className="font-bold text-gray-900 dark:text-gray-100">
                            {d.brand_name || d.generic_name || d.written_text}
                          </p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400">
                            {d.dosage} {d.frequency && `• ${d.frequency}`}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-dashed border-gray-200 dark:border-gray-700 text-center text-gray-400 text-xs">
                    {lang === 'bn'
                      ? 'এখনো কোনো প্রেসক্রিপশন রুটিন স্ক্যান করা হয়নি'
                      : 'No active prescription routine recorded yet'}
                  </div>
                )}
              </div>

              {/* Categorized Detailed Records */}
              <Tabs defaultValue="prescriptions" className="w-full">
                <TabsList className="grid grid-cols-3 h-10 p-1 bg-gray-100 dark:bg-gray-800/80 rounded-2xl">
                  <TabsTrigger value="prescriptions" className="text-xs rounded-xl font-bold">
                    {lang === 'bn' ? 'প্রেসক্রিপশন' : 'Prescriptions'}
                  </TabsTrigger>
                  <TabsTrigger value="eye" className="text-xs rounded-xl font-bold">
                    {lang === 'bn' ? 'চোখের টেস্ট' : 'Eye Scans'}
                  </TabsTrigger>
                  <TabsTrigger value="food" className="text-xs rounded-xl font-bold">
                    {lang === 'bn' ? 'খাবার তালিকা' : 'Food Logs'}
                  </TabsTrigger>
                </TabsList>

                {/* Prescriptions Tab */}
                <TabsContent value="prescriptions" className="space-y-2.5 pt-2">
                  {healthData.prescriptions.length === 0 ? (
                    <p className="text-xs text-center py-6 text-gray-400">
                      {lang === 'bn' ? 'কোনো প্রেসক্রিপশন পাওয়া যায়নি' : 'No prescription records available'}
                    </p>
                  ) : (
                    healthData.prescriptions.map((rx: PrescriptionItem) => (
                      <div key={rx.id} className="p-3 rounded-2xl bg-white dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-gray-800 dark:text-gray-200">
                            {new Date(rx.created_at).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
                              dateStyle: 'medium',
                            })}
                          </span>
                          {rx.has_dangerous_interactions ? (
                            <Badge variant="outline" className="text-[10px] bg-red-50 text-red-600 border-red-200">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {lang === 'bn' ? 'ওষুধ মিথস্ক্রিয়া ঝুঁকি' : 'Drug Interaction Alert'}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-600 border-emerald-200">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              {lang === 'bn' ? 'নিরাপদ' : 'Safe'}
                            </Badge>
                          )}
                        </div>
                        {rx.extracted_drugs && Array.isArray(rx.extracted_drugs) && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {rx.extracted_drugs.map((d: ExtractedDrugItem, idx: number) => (
                              <span key={idx} className="text-[10px] bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-md">
                                {d.brand_name || d.generic_name || d.written_text} {d.dosage}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </TabsContent>

                {/* Eye Scans Tab */}
                <TabsContent value="eye" className="space-y-2.5 pt-2">
                  {healthData.eyeAnalyses.length === 0 ? (
                    <p className="text-xs text-center py-6 text-gray-400">
                      {lang === 'bn' ? 'কোনো চোখের পরীক্ষা পাওয়া যায়নি' : 'No eye scan records available'}
                    </p>
                  ) : (
                    healthData.eyeAnalyses.map((eye: EyeScanItem) => (
                      <div key={eye.id} className="p-3 rounded-2xl bg-white dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-gray-900 dark:text-gray-100">
                            {eye.diagnosis || (lang === 'bn' ? 'চোখের বিশ্লেষণ' : 'Eye Analysis')}
                          </span>
                          <Badge variant="outline" className="text-[10px] px-2 py-0.5">
                            {eye.severity || 'Normal'}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {lang === 'bn' ? (eye.recommendation_bn || eye.recommendation_en) : eye.recommendation_en}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1">
                          <span>
                            {new Date(eye.created_at).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US')}
                          </span>
                          {eye.urgency_days && (
                            <span className="text-amber-600 font-medium">
                              {lang === 'bn' ? `${eye.urgency_days} দিনের মধ্যে ডাক্তার দেখান` : `See doctor in ${eye.urgency_days} days`}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>

                {/* Food Logs Tab */}
                <TabsContent value="food" className="space-y-2.5 pt-2">
                  {healthData.foodAnalyses.length === 0 ? (
                    <p className="text-xs text-center py-6 text-gray-400">
                      {lang === 'bn' ? 'কোনো খাবারের রেকর্ড পাওয়া যায়নি' : 'No meal records available'}
                    </p>
                  ) : (
                    healthData.foodAnalyses.map((food: FoodLogItem) => (
                      <div key={food.id} className="p-3 rounded-2xl bg-white dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-gray-900 dark:text-gray-100">
                            {food.total_calories ? `${Math.round(food.total_calories)} kcal` : 'Meal Analysis'}
                          </span>
                          <Badge variant="outline" className={`text-[10px] ${
                            food.risk_level === 'Red' ? 'bg-red-50 text-red-600 border-red-200' :
                            food.risk_level === 'Yellow' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                            'bg-emerald-50 text-emerald-600 border-emerald-200'
                          }`}>
                            {food.risk_level || 'Safe'}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {lang === 'bn' ? (food.risk_summary_bn || food.risk_summary_en) : food.risk_summary_en}
                        </p>
                      </div>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
