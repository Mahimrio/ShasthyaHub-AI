'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  Flame,
  Package,
  PackagePlus,
  Palette,
  Pill,
  Plus,
  Search,
  Settings2,
  Tag,
  Trash2,
  Utensils,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useLanguage } from '@/contexts/LanguageContext'
import { PillAvatar } from '@/components/shared/PillAvatar'
import {
  useMedicationDoses,
  useRecordDoseAction,
  useRefillMedication,
  useDeleteMedicationSchedule,
} from '@/hooks/useMedicationReminders'
import {
  formatTimeDisplay,
  groupSchedulesIntoCabinetSummaries,
} from '@/lib/services/medication-reminder'
import { AddManualMedicationModal } from '@/components/features/medications/AddManualMedicationModal'
import { MedicationSettingsModal } from '@/components/features/medications/MedicationSettingsModal'
import { MissedDoseAlertModal } from '@/components/features/medications/MissedDoseAlertModal'
import { PillCustomizerModal } from '@/components/features/medications/PillCustomizerModal'
import type { ActiveDoseWithStatus, MedicationScheduleItem } from '@/types'

function drugCardColor(name: string) {
  const colors = [
    {
      badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      bar: 'from-emerald-500 to-teal-500',
      iconBg: 'from-emerald-400 to-teal-500',
    },
    {
      badge: 'bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border-sky-200 dark:border-sky-800',
      bar: 'from-sky-500 to-cyan-500',
      iconBg: 'from-sky-400 to-cyan-500',
    },
    {
      badge: 'bg-violet-100 text-violet-800 dark:bg-violet-950/80 dark:text-violet-300 border-violet-200 dark:border-violet-800',
      bar: 'from-violet-500 to-purple-500',
      iconBg: 'from-violet-400 to-purple-500',
    },
    {
      badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      bar: 'from-amber-500 to-orange-500',
      iconBg: 'from-amber-400 to-orange-500',
    },
    {
      badge: 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      bar: 'from-rose-500 to-pink-500',
      iconBg: 'from-rose-400 to-pink-500',
    },
  ]
  const code = (name || 'a').charCodeAt(0) || 0
  return colors[code % colors.length]
}

export function MyMedicinesCabinet() {
  const { lang } = useLanguage()
  const isBn = lang === 'bn'

  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'low_stock' | 'active'>('all')
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [settingsModalOpen, setSettingsModalOpen] = useState(false)
  const [selectedMissedDose, setSelectedMissedDose] = useState<ActiveDoseWithStatus | null>(null)
  const [refillSuccessId, setRefillSuccessId] = useState<string | null>(null)
  const [customizerItem, setCustomizerItem] = useState<{
    schedule: MedicationScheduleItem
    drugNameEn: string
    drugNameBn: string
  } | null>(null)

  const { data: dosesData, isLoading } = useMedicationDoses()
  const recordAction = useRecordDoseAction()
  const refillMutation = useRefillMedication()
  const deleteMutation = useDeleteMedicationSchedule()

  const rawDoses = dosesData?.doses
  const doses = useMemo(() => rawDoses || [], [rawDoses])
  const schedules = useMemo(() => doses.map((d) => d.schedule), [doses])
  const doseLogs = useMemo(
    () =>
      doses
        .filter((d) => d.todayLog)
        .map((d) => ({
          schedule_id: d.schedule.id,
          status: d.todayLog!.status,
        })),
    [doses]
  )

  const cabinetItems = useMemo(
    () => groupSchedulesIntoCabinetSummaries(schedules, doseLogs),
    [schedules, doseLogs]
  )

  // Filter items
  const filteredItems = useMemo(() => {
    return cabinetItems.filter((item) => {
      const matchesSearch =
        item.drugNameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.drugNameBn.includes(searchQuery) ||
        item.indicationEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.indicationBn.includes(searchQuery)

      if (!matchesSearch) return false
      if (filterType === 'low_stock') return item.isLowStock
      if (filterType === 'active') return item.isActive
      return true
    })
  }, [cabinetItems, searchQuery, filterType])

  const totalMedicines = cabinetItems.length
  const lowStockCount = cabinetItems.filter((i) => i.isLowStock).length
  const avgAdherence =
    totalMedicines > 0
      ? Math.round(
          cabinetItems.reduce((acc, curr) => acc + curr.adherenceRate, 0) / totalMedicines
        )
      : 100

  const handleRefill = async (scheduleId: string, amount: number = 10) => {
    await refillMutation.mutateAsync({
      schedule_id: scheduleId,
      refill_amount: amount,
    })
    setRefillSuccessId(scheduleId)
    setTimeout(() => setRefillSuccessId(null), 3000)
  }

  const handleDelete = async (scheduleIds: string[]) => {
    for (const id of scheduleIds) {
      await deleteMutation.mutateAsync(id)
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. Overview Metric Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: Total Active Medicines */}
        <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {isBn ? 'সক্রিয় ঔষধ' : 'Active Medicines'}
            </span>
            <Pill className="h-4 w-4 text-sky-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-gray-900 dark:text-gray-100">
              {totalMedicines}
            </span>
            <span className="text-xs text-gray-500 font-medium">{isBn ? 'টি আইটেম' : 'drugs'}</span>
          </div>
        </div>

        {/* Metric 2: Adherence Rate */}
        <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {isBn ? 'কোর্স নিয়মিততা' : 'Adherence Rate'}
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {avgAdherence}%
            </span>
            <span className="text-xs text-gray-500 font-medium">{isBn ? 'অন-টাইম' : 'on-time'}</span>
          </div>
        </div>

        {/* Metric 3: Low Stock Alerts */}
        <div
          className={`p-4 rounded-2xl border shadow-2xs space-y-1 transition-all ${
            lowStockCount > 0
              ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200/80 dark:border-amber-900/60'
              : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800'
          }`}
        >
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {isBn ? 'রিফিল অ্যালার্ট' : 'Refill Alerts'}
            </span>
            <Package className="h-4 w-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-2xl font-black ${
                lowStockCount > 0
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-gray-900 dark:text-gray-100'
              }`}
            >
              {lowStockCount}
            </span>
            <span className="text-xs text-gray-500 font-medium">
              {isBn ? 'ঔষধ স্টক কম' : 'low stock'}
            </span>
          </div>
        </div>

        {/* Metric 4: Streak & Routine */}
        <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {isBn ? 'দৈনিক রুটিন' : 'Daily Routine'}
            </span>
            <Flame className="h-4 w-4 text-orange-500 fill-orange-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-gray-900 dark:text-gray-100">
              {doses.filter((d) => d.status === 'taken').length}/{doses.length}
            </span>
            <span className="text-xs text-gray-500 font-medium">{isBn ? 'আজ সম্পন্ন' : 'today'}</span>
          </div>
        </div>
      </div>

      {/* 2. Controls & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={isBn ? 'ঔষধ বা রোগের নাম খুঁজুন...' : 'Search medicine or symptom...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9.5 rounded-2xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs h-10 shadow-2xs"
          />
        </div>

        {/* Filter Chips & Add Action */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center p-1 rounded-2xl bg-gray-100 dark:bg-gray-800/80 border border-gray-200/50 dark:border-gray-700/50">
            {[
              { key: 'all', en: 'All', bn: 'সব' },
              { key: 'low_stock', en: 'Low Stock ⚠️', bn: 'স্টক কম ⚠️' },
              { key: 'active', en: 'Active', bn: 'চলমান' },
            ].map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilterType(f.key as typeof filterType)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  filterType === f.key
                    ? 'bg-white dark:bg-gray-700 text-sky-600 dark:text-sky-400 shadow-2xs'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                {isBn ? f.bn : f.en}
              </button>
            ))}
          </div>

          <Button
            size="sm"
            onClick={() => setSettingsModalOpen(true)}
            variant="outline"
            className="rounded-2xl border-gray-200 dark:border-gray-700 text-xs font-bold h-10 px-3 hover:bg-gray-50"
          >
            <Settings2 className="h-3.5 w-3.5 mr-1 text-amber-500" />
            <span>{isBn ? 'খাবারের সময়' : 'Meal Routine'}</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setAddModalOpen(true)}
            className="rounded-2xl bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-600 hover:to-teal-600 text-white text-xs font-bold h-10 px-3.5 shadow-sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            <span>{isBn ? 'ঔষধ যোগ' : 'Add Medicine'}</span>
          </Button>
        </div>
      </div>

      {/* 3. Medication Cards Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-gray-400">
          {isBn ? 'ঔষধ তালিকা লোড হচ্ছে...' : 'Loading medication cabinet...'}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-12 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-500 flex items-center justify-center mx-auto">
            <Pill className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
            {isBn ? 'কোনো ঔষধের রেকর্ড পাওয়া যায়নি' : 'No medication records found'}
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            {isBn
              ? 'প্রেসক্রিপশন স্ক্যান করে রিমাইন্ডার চালু করুন অথবা "ঔষধ যোগ" বাটনে ক্লিক করুন।'
              : 'Scan a prescription in ScriptGuard or click "Add Medicine" to track pill inventory and daily reminders.'}
          </p>
          <Button
            size="sm"
            onClick={() => setAddModalOpen(true)}
            className="rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            <span>{isBn ? 'নতুন ঔষধ যোগ করুন' : 'Add First Medicine'}</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item) => {
            const colors = drugCardColor(item.drugNameEn)
            const isRefilled = refillSuccessId === item.primaryScheduleId

            return (
              <motion.div
                key={item.drugKey}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-xs hover:shadow-md transition-all space-y-4"
              >
                {/* Card Header: Drug Identity with Visual Pill Avatar */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setCustomizerItem({
                          schedule: schedules.find((s) => s.id === item.primaryScheduleId) || item as unknown as MedicationScheduleItem,
                          drugNameEn: item.drugNameEn,
                          drugNameBn: item.drugNameBn,
                        })
                      }
                      className="p-1 rounded-2xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200/60 dark:border-gray-700/60 hover:border-purple-400 dark:hover:border-purple-500 transition-all group/pill shrink-0 shadow-xs relative"
                      title={isBn ? 'রঙ ও রূপ পরিবর্তন করুন' : 'Click to customize appearance'}
                    >
                      <PillAvatar
                        shape={item.pillShape}
                        color={item.pillColor}
                        colorSecondary={item.pillColorSecondary}
                        size="md"
                      />
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-purple-500 text-white flex items-center justify-center opacity-0 group-hover/pill:opacity-100 transition-opacity shadow-xs">
                        <Palette className="h-2.5 w-2.5" />
                      </span>
                    </button>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                          {isBn ? item.drugNameBn : item.drugNameEn}
                        </h3>
                        <span className="text-xs font-mono font-bold text-gray-500 dark:text-gray-400">
                          {item.dosage}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                          {item.drugNameEn}
                        </span>
                        <span className="text-gray-300 dark:text-gray-700">•</span>
                        <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.2 rounded-md border border-purple-200/60 dark:border-purple-800/60">
                          {isBn ? item.pillDescriptorBn : item.pillDescriptorEn}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Indication / Category Tag */}
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${colors.badge}`}
                  >
                    <Tag className="h-3 w-3" />
                    <span>{isBn ? item.indicationBn : item.indicationEn}</span>
                  </span>
                </div>

                {/* Schedule & Timing Badges */}
                <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-sky-500" />
                      <span>{isBn ? 'গ্রহণের সময়সূচি' : 'Daily Dosing Times'}</span>
                    </span>
                    <span className="text-[11px] font-medium text-gray-500 flex items-center gap-1">
                      <Utensils className="h-3 w-3 text-teal-500" />
                      <span>
                        {item.mealTiming === 'before_meal'
                          ? isBn
                            ? 'খাবার ৩০ মি: আগে'
                            : 'Before meal'
                          : item.mealTiming === 'empty_stomach'
                          ? isBn
                            ? 'খালি পেটে'
                            : 'Empty stomach'
                          : isBn
                          ? 'খাবার পর'
                          : 'After meal'}
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {item.times.map((t) => (
                      <span
                        key={t}
                        className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 shadow-2xs"
                      >
                        {formatTimeDisplay(t, lang)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Pill Inventory & Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      <Package className="h-3.5 w-3.5 text-amber-500" />
                      <span>{isBn ? 'অবশিষ্ট স্টক' : 'Pill Inventory'}</span>
                    </span>
                    <span
                      className={`font-bold ${
                        item.isLowStock
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-gray-900 dark:text-gray-100'
                      }`}
                    >
                      {item.remainingQuantity} {isBn ? 'টি ট্যাবলেট বাকি' : 'pills left'}{' '}
                      <span className="text-[11px] text-gray-400 font-normal">
                        ({item.daysRemaining} {isBn ? 'দিনের সরবরাহ' : 'd supply'})
                      </span>
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-100 dark:bg-gray-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${colors.bar} rounded-full transition-all duration-500`}
                      style={{ width: `${item.courseProgressPercent}%` }}
                    />
                  </div>

                  {/* Low Stock Warning Banner */}
                  {item.isLowStock && (
                    <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-900/60 text-amber-800 dark:text-amber-200 text-xs">
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                        <span className="font-semibold text-[11px]">
                          {isBn
                            ? 'স্টক কম — শীঘ্রই রিফিল করুন'
                            : 'Low supply — refill soon'}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRefill(item.primaryScheduleId, 10)}
                        className="text-[11px] font-bold text-amber-700 dark:text-amber-300 underline hover:no-underline"
                      >
                        {isBn ? '+১০টি যোগ' : '+10 Refill'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Adherence Stats & Missed History */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      ✓ {item.takenCount} {isBn ? 'গৃহীত' : 'taken'}
                    </span>
                    {item.missedCount > 0 && (
                      <span className="font-semibold text-red-500">
                        ⚠ {item.missedCount} {isBn ? 'মিসড' : 'missed'}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-bold bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md">
                    {item.adherenceRate}% {isBn ? 'নিয়মিত' : 'adherence'}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  {/* Mark Taken */}
                  <Button
                    size="sm"
                    onClick={() =>
                      recordAction.mutate({
                        schedule_id: item.primaryScheduleId,
                        status: 'taken',
                        scheduled_time: item.times[0],
                      })
                    }
                    disabled={recordAction.isPending}
                    className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-bold h-9 shadow-2xs"
                  >
                    <Check className="h-3.5 w-3.5 mr-1" />
                    <span>{isBn ? 'আজ খেয়েছি' : 'Log Taken'}</span>
                  </Button>

                  {/* Refill Button */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRefill(item.primaryScheduleId, 14)}
                    disabled={refillMutation.isPending}
                    className="rounded-xl border-gray-200 dark:border-gray-700 text-xs font-semibold h-9 px-3 hover:bg-gray-50"
                  >
                    <PackagePlus className="h-3.5 w-3.5 mr-1 text-sky-500" />
                    <span>
                      {isRefilled
                        ? isBn
                          ? 'রিফিল হয়েছে!'
                          : 'Refilled!'
                        : isBn
                        ? '+১৪টি রিফিল'
                        : '+14 Refill'}
                    </span>
                  </Button>

                  {/* Delete / Archive */}
                  <button
                    onClick={() => handleDelete(item.allScheduleIds)}
                    title={isBn ? 'ঔষধ মুছে ফেলুন' : 'Delete'}
                    className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Sub Modals */}
      <AddManualMedicationModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
      />

      <MedicationSettingsModal
        open={settingsModalOpen}
        onOpenChange={setSettingsModalOpen}
      />

      <MissedDoseAlertModal
        dose={selectedMissedDose}
        open={!!selectedMissedDose}
        onOpenChange={(open) => !open && setSelectedMissedDose(null)}
      />

      {customizerItem && (
        <PillCustomizerModal
          open={!!customizerItem}
          onOpenChange={(open) => !open && setCustomizerItem(null)}
          schedule={customizerItem.schedule}
          drugNameEn={customizerItem.drugNameEn}
          drugNameBn={customizerItem.drugNameBn}
        />
      )}
    </div>
  )
}
