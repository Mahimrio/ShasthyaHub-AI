'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  CheckCircle2,
  Clock,
  Flame,
  HelpCircle,
  Pill,
  Plus,
  RotateCcw,
  Settings2,
  Trash2,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  useMedicationDoses,
  useRecordDoseAction,
  useDeleteMedicationSchedule,
} from '@/hooks/useMedicationReminders'
import { MissedDoseAlertModal } from './MissedDoseAlertModal'
import { AddManualMedicationModal } from './AddManualMedicationModal'
import { MedicationSettingsModal } from './MedicationSettingsModal'
import type { ActiveDoseWithStatus } from '@/types'

export function MedicationNotificationDrawer() {
  const { lang } = useLanguage()
  const isBn = lang === 'bn'

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedMissedDose, setSelectedMissedDose] = useState<ActiveDoseWithStatus | null>(null)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [settingsModalOpen, setSettingsModalOpen] = useState(false)

  const { data: dosesData, isLoading } = useMedicationDoses()
  const recordAction = useRecordDoseAction()
  const deleteSchedule = useDeleteMedicationSchedule()

  const doses = dosesData?.doses || []
  const summary = dosesData?.summary
  const dueOrMissedCount = doses.filter((d) => d.isDueNow || d.isMissed).length

  return (
    <>
      {/* Top Navbar Bell Trigger */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          title={isBn ? 'ঔষধের রিমাইন্ডার ও নোটিফিকেশন' : 'Medication Reminders & Alarms'}
          className="relative p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <Bell className="h-4 w-4" />
          {dueOrMissedCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-rose-500 text-[9px] font-black text-white shadow-sm ring-2 ring-white dark:ring-gray-900 animate-pulse">
              {dueOrMissedCount}
            </span>
          )}
        </button>
      </div>

      {/* Drawer Overlay */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 bg-black/40 dark:bg-black/60 z-50 backdrop-blur-xs"
            />

            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 35 }}
              className="fixed top-0 right-0 z-50 h-full w-full max-w-sm sm:max-w-md bg-white dark:bg-gray-900 border-l border-gray-100 dark:border-gray-800 shadow-2xl flex flex-col"
            >
              {/* Drawer Header */}
              <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/60 dark:bg-gray-950/40">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-teal-500 flex items-center justify-center text-white shadow-sm">
                    <Pill className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      {isBn ? 'ঔষধের রিমাইন্ডার' : 'Medication Reminders'}
                    </h3>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">
                      {isBn ? 'আজকের সময়সূচি ও অ্যালার্ট' : 'Today’s schedule & adherence'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSettingsModalOpen(true)}
                    title={isBn ? 'খাবারের সময়সূচি সেটিংস' : 'Settings'}
                    className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <Settings2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDrawerOpen(false)}
                    className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Drawer Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Adherence Summary Bar */}
                {summary && (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-sky-500/10 via-teal-500/5 to-transparent border border-sky-200/60 dark:border-sky-800/40 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                        {isBn ? 'আজকের নিয়মিততা' : 'Today’s Adherence'}
                      </span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xl font-black text-gray-900 dark:text-gray-100">
                          {summary.adherencePercentage}%
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          ({summary.takenToday}/{summary.totalDosesToday}{' '}
                          {isBn ? 'সম্পন্ন' : 'taken'})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1.5 rounded-xl border border-amber-200/60 dark:border-amber-800/40">
                      <Flame className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                      <span>
                        {summary.weeklyStreakDays} {isBn ? 'দিনের স্ট্রিক' : 'd streak'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Missed Dose Banner if any */}
                {doses.some((d) => d.isMissed && d.status !== 'taken') && (
                  <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200/80 dark:border-red-900/60 space-y-2">
                    <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                      <Clock className="h-4 w-4 text-red-500 shrink-0" />
                      <p className="text-xs font-bold">
                        {isBn
                          ? 'একটি ঔষধের নির্ধারিত সময় পার হয়ে গেছে'
                          : 'You have missed a scheduled dose'}
                      </p>
                    </div>
                    {doses
                      .filter((d) => d.isMissed && d.status !== 'taken')
                      .map((d) => (
                        <div
                          key={d.schedule.id}
                          className="flex items-center justify-between pt-1 border-t border-red-100 dark:border-red-900/40"
                        >
                          <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                            {isBn ? d.schedule.drug_name_bn : d.schedule.drug_name_en} ({d.dueTime})
                          </span>
                          <Button
                            size="sm"
                            onClick={() => setSelectedMissedDose(d)}
                            className="h-7 text-[11px] font-bold rounded-xl bg-red-500 hover:bg-red-600 text-white px-2.5"
                          >
                            <HelpCircle className="h-3 w-3 mr-1" />
                            <span>{isBn ? 'পরামর্শ' : 'Advice'}</span>
                          </Button>
                        </div>
                      ))}
                  </div>
                )}

                {/* Doses List */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      {isBn ? 'আজকের সময়সূচি' : 'Today’s Timeline'}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAddModalOpen(true)}
                      className="h-7 text-xs text-sky-600 dark:text-sky-400 font-bold hover:bg-sky-50 dark:hover:bg-sky-950/50"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      <span>{isBn ? 'নতুন ঔষধ' : 'Add'}</span>
                    </Button>
                  </div>

                  {isLoading ? (
                    <div className="py-8 text-center text-xs text-gray-400">
                      {isBn ? 'লোড হচ্ছে...' : 'Loading reminders...'}
                    </div>
                  ) : doses.length === 0 ? (
                    <div className="p-8 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 text-center space-y-2">
                      <Pill className="h-8 w-8 mx-auto text-gray-300 dark:text-gray-600" />
                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                        {isBn ? 'কোনো সক্রিয় ঔষধের শিডিউল নেই' : 'No active medication schedule'}
                      </p>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500">
                        {isBn
                          ? 'প্রেসক্রিপশন স্ক্যান করে বা ম্যানুয়ালি ঔষধ যোগ করুন'
                          : 'Scan a prescription in ScriptGuard or add medicines manually'}
                      </p>
                      <Button
                        size="sm"
                        onClick={() => setAddModalOpen(true)}
                        className="mt-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        <span>{isBn ? 'ঔষধ যোগ করুন' : 'Add Medication'}</span>
                      </Button>
                    </div>
                  ) : (
                    doses.map((dose) => {
                      const isTaken = dose.status === 'taken'
                      const isSkipped = dose.status === 'skipped'
                      const isDue = dose.isDueNow && !isTaken
                      const isMissed = dose.isMissed && !isTaken

                      return (
                        <div
                          key={dose.schedule.id}
                          className={`p-3.5 rounded-2xl border transition-all ${
                            isTaken
                              ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-900/40'
                              : isDue
                              ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 ring-1 ring-amber-400/30'
                              : isMissed
                              ? 'bg-red-50/60 dark:bg-red-950/30 border-red-200 dark:border-red-900/50'
                              : 'bg-white dark:bg-gray-800/80 border-gray-100 dark:border-gray-800 shadow-2xs'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100">
                                  {isBn ? dose.schedule.drug_name_bn : dose.schedule.drug_name_en}
                                </h4>
                                <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                                  {dose.schedule.dosage}
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                <Clock className="h-3 w-3 text-sky-500" />
                                <span>{dose.dueTime}</span>
                                <span>•</span>
                                <span>
                                  {dose.schedule.meal_timing === 'before_meal'
                                    ? isBn
                                      ? 'খাবার আগে'
                                      : 'Before meal'
                                    : dose.schedule.meal_timing === 'empty_stomach'
                                    ? isBn
                                      ? 'খালি পেটে'
                                      : 'Empty stomach'
                                    : isBn
                                    ? 'খাবার পর'
                                    : 'After meal'}
                                </span>
                              </p>
                            </div>

                            {/* Status Pill */}
                            {isTaken ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>{isBn ? 'গৃহীত' : 'Taken'}</span>
                              </span>
                            ) : isSkipped ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                                <span>{isBn ? 'বাদ' : 'Skipped'}</span>
                              </span>
                            ) : isDue ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded-full animate-pulse">
                                <span>{isBn ? 'সময় হয়েছে' : 'Due Now'}</span>
                              </span>
                            ) : isMissed ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/80 px-2 py-0.5 rounded-full">
                                <span>{isBn ? 'মিসড' : 'Missed'}</span>
                              </span>
                            ) : null}
                          </div>

                          {/* Quick Action Buttons */}
                          {!isTaken && !isSkipped && (
                            <div className="flex items-center gap-1.5 pt-2.5 mt-2 border-t border-gray-100 dark:border-gray-800/80">
                              <Button
                                size="sm"
                                onClick={() =>
                                  recordAction.mutate({
                                    schedule_id: dose.schedule.id,
                                    status: 'taken',
                                    scheduled_time: dose.schedule.scheduled_time,
                                  })
                                }
                                disabled={recordAction.isPending}
                                className="h-7 text-[11px] font-bold rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white px-3 shadow-2xs"
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                <span>{isBn ? 'খেয়েছি' : 'Taken'}</span>
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  recordAction.mutate({
                                    schedule_id: dose.schedule.id,
                                    status: 'snoozed',
                                    snooze_minutes: 15,
                                  })
                                }
                                disabled={recordAction.isPending}
                                className="h-7 text-[11px] font-bold rounded-xl border-gray-200 dark:border-gray-700 px-2.5"
                              >
                                <RotateCcw className="h-3 w-3 mr-1" />
                                <span>{isBn ? '১৫ মি:' : '15m'}</span>
                              </Button>

                              {isMissed && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setSelectedMissedDose(dose)}
                                  className="h-7 text-[11px] font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 px-2"
                                >
                                  <HelpCircle className="h-3 w-3 mr-1" />
                                  <span>{isBn ? 'পরামর্শ' : 'Advice'}</span>
                                </Button>
                              )}

                              <button
                                onClick={() => deleteSchedule.mutate(dose.schedule.id)}
                                title={isBn ? 'রিমাইন্ডার মুছে ফেলুন' : 'Delete'}
                                className="ml-auto p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/30">
                <Button
                  onClick={() => setAddModalOpen(true)}
                  className="w-full rounded-2xl bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-600 hover:to-teal-600 text-white text-xs font-bold h-10 shadow-sm"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  <span>{isBn ? 'নতুন ঔষধ রিমাইন্ডার যোগ করুন' : 'Add Medication Reminder'}</span>
                </Button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Sub Modals */}
      <MissedDoseAlertModal
        dose={selectedMissedDose}
        open={!!selectedMissedDose}
        onOpenChange={(open) => !open && setSelectedMissedDose(null)}
      />

      <AddManualMedicationModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
      />

      <MedicationSettingsModal
        open={settingsModalOpen}
        onOpenChange={setSettingsModalOpen}
      />
    </>
  )
}
