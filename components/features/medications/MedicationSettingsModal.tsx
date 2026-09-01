'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  useReminderSettings,
  useUpdateReminderSettings,
} from '@/hooks/useMedicationReminders'
import { audioChime } from '@/lib/services/audio-chime'
import {
  Bell,
  Moon,
  Settings2,
  Sun,
  Sunrise,
  Sunset,
  Users,
  Volume2,
} from 'lucide-react'
import type { UserReminderSettings } from '@/types'

interface MedicationSettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function MedicationSettingsForm({
  settings,
  onClose,
  isBn,
}: {
  settings?: UserReminderSettings
  onClose: () => void
  isBn: boolean
}) {
  const updateSettings = useUpdateReminderSettings()

  const [breakfast, setBreakfast] = useState(settings?.breakfast_time || '08:00')
  const [lunch, setLunch] = useState(settings?.lunch_time || '13:30')
  const [dinner, setDinner] = useState(settings?.dinner_time || '21:30')
  const [bedtime, setBedtime] = useState(settings?.bedtime || '22:30')
  const [soundEnabled, setSoundEnabled] = useState(settings?.sound_enabled ?? true)
  const [notifEnabled, setNotifEnabled] = useState(settings?.notifications_enabled ?? true)
  const [caregiverEnabled, setCaregiverEnabled] = useState(settings?.notify_caregivers_on_missed ?? true)

  const handleRequestPushPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const perm = await Notification.requestPermission()
      if (perm === 'granted') {
        audioChime.playReminderChime()
      }
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    await updateSettings.mutateAsync({
      breakfast_time: breakfast,
      lunch_time: lunch,
      dinner_time: dinner,
      bedtime,
      sound_enabled: soundEnabled,
      notifications_enabled: notifEnabled,
      notify_caregivers_on_missed: caregiverEnabled,
    })
    onClose()
  }

  return (
    <form onSubmit={handleSave} className="space-y-4 pt-2">
      {/* Meal Times Grid */}
      <div className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          {isBn ? 'প্রতিদিনের খাবারের সময়সূচি' : 'Daily Meal Schedule'}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
              <Sunrise className="h-3.5 w-3.5 text-amber-500" />
              <span>{isBn ? 'সকালের নাস্তা' : 'Breakfast'}</span>
            </Label>
            <Input
              type="time"
              value={breakfast}
              onChange={(e) => setBreakfast(e.target.value)}
              className="rounded-xl border-gray-200 dark:border-gray-700 text-xs h-9"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
              <Sun className="h-3.5 w-3.5 text-orange-500" />
              <span>{isBn ? 'দুপুরের খাবার' : 'Lunch'}</span>
            </Label>
            <Input
              type="time"
              value={lunch}
              onChange={(e) => setLunch(e.target.value)}
              className="rounded-xl border-gray-200 dark:border-gray-700 text-xs h-9"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
              <Sunset className="h-3.5 w-3.5 text-indigo-500" />
              <span>{isBn ? 'রাতের খাবার' : 'Dinner'}</span>
            </Label>
            <Input
              type="time"
              value={dinner}
              onChange={(e) => setDinner(e.target.value)}
              className="rounded-xl border-gray-200 dark:border-gray-700 text-xs h-9"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
              <Moon className="h-3.5 w-3.5 text-purple-500" />
              <span>{isBn ? 'ঘুমানোর সময়' : 'Bedtime'}</span>
            </Label>
            <Input
              type="time"
              value={bedtime}
              onChange={(e) => setBedtime(e.target.value)}
              className="rounded-xl border-gray-200 dark:border-gray-700 text-xs h-9"
            />
          </div>
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-800">
        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          {isBn ? 'অ্যালার্ট ও নোটিফিকেশন' : 'Alert & Notification Channels'}
        </p>

        <div className="flex items-center justify-between p-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60">
          <div className="flex items-center gap-2.5">
            <Volume2 className="h-4 w-4 text-emerald-500" />
            <div>
              <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                {isBn ? 'অ্যালার্ম সাউন্ড (Chime)' : 'Audio Reminder Chime'}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">
                {isBn ? 'ঔষধের সময় হলে মিষ্টি সুর বাজবে' : 'Plays a soothing melodic chime'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setSoundEnabled(!soundEnabled)
              if (!soundEnabled) audioChime.playReminderChime()
            }}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
              soundEnabled ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-700'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                soundEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60">
          <div className="flex items-center gap-2.5">
            <Bell className="h-4 w-4 text-sky-500" />
            <div>
              <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                {isBn ? 'ব্রাউজার নোটিফিকেশন' : 'Browser Push Notification'}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">
                {isBn ? 'ট্যাব বন্ধ থাকলেও পপআপ আসবে' : 'Show desktop & mobile popups'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setNotifEnabled(!notifEnabled)
              if (!notifEnabled) handleRequestPushPermission()
            }}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
              notifEnabled ? 'bg-sky-500' : 'bg-gray-300 dark:bg-gray-700'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                notifEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60">
          <div className="flex items-center gap-2.5">
            <Users className="h-4 w-4 text-teal-500" />
            <div>
              <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                {isBn ? 'পরিবারকে মিসড অ্যালার্ট' : 'Family Caregiver Alerts'}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">
                {isBn ? 'ঔষধ মিস হলে স্বজনদের নোটিফিকেশন' : 'Notify family tree if dose is missed'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCaregiverEnabled(!caregiverEnabled)}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
              caregiverEnabled ? 'bg-teal-500' : 'bg-gray-300 dark:bg-gray-700'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                caregiverEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          disabled={updateSettings.isPending}
          className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold h-11 text-xs shadow-md"
        >
          <span>{isBn ? 'সেটিংস সংরক্ষণ করুন' : 'Save Routine'}</span>
        </Button>
      </div>
    </form>
  )
}

export function MedicationSettingsModal({
  open,
  onOpenChange,
}: MedicationSettingsModalProps) {
  const { lang } = useLanguage()
  const isBn = lang === 'bn'
  const { data: settings } = useReminderSettings()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xl">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-sm">
              <Settings2 className="h-5 w-5" />
            </div>
            <DialogTitle className="text-base font-bold text-gray-900 dark:text-gray-100">
              {isBn ? 'রিমাইন্ডার ও খাবারের সময়সূচি' : 'Reminder & Meal Routine'}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-gray-500 dark:text-gray-400">
            {isBn
              ? 'আপনার প্রতিদিনের খাবারের সময়ের সাথে ঔষধের নোটিফিকেশন স্বয়ংক্রিয়ভাবে সমন্বিত হবে।'
              : 'Adjust daily meal times to automatically align prescription alarms with your lifestyle.'}
          </DialogDescription>
        </DialogHeader>

        <MedicationSettingsForm
          key={settings?.updated_at || 'initial'}
          settings={settings}
          onClose={() => onOpenChange(false)}
          isBn={isBn}
        />
      </DialogContent>
    </Dialog>
  )
}
