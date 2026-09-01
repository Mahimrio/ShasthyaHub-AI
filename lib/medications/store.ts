import fs from 'fs'
import path from 'path'
import type {
  MedicationScheduleItem,
  DoseLog,
  UserReminderSettings,
} from '@/types'

const DATA_DIR = path.join(process.cwd(), '.data')
const SCHEDULES_FILE = path.join(DATA_DIR, 'medication_schedules.json')
const DOSE_LOGS_FILE = path.join(DATA_DIR, 'dose_logs.json')
const SETTINGS_FILE = path.join(DATA_DIR, 'reminder_settings.json')

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

// ── 1. Settings Store ────────────────────────────────────────

const DEFAULT_SETTINGS: Omit<UserReminderSettings, 'user_id'> = {
  breakfast_time: '08:00',
  lunch_time: '13:30',
  dinner_time: '21:30',
  bedtime: '22:30',
  notifications_enabled: true,
  sound_enabled: true,
  notify_caregivers_on_missed: true,
  grace_period_minutes: 45,
}

export function getLocalSettings(userId: string): UserReminderSettings {
  ensureDir()
  if (!fs.existsSync(SETTINGS_FILE)) {
    return { user_id: userId, ...DEFAULT_SETTINGS }
  }
  try {
    const raw = fs.readFileSync(SETTINGS_FILE, 'utf-8')
    const all: Record<string, UserReminderSettings> = JSON.parse(raw) || {}
    return all[userId] || { user_id: userId, ...DEFAULT_SETTINGS }
  } catch {
    return { user_id: userId, ...DEFAULT_SETTINGS }
  }
}

export function saveLocalSettings(settings: UserReminderSettings): UserReminderSettings {
  ensureDir()
  let all: Record<string, UserReminderSettings> = {}
  if (fs.existsSync(SETTINGS_FILE)) {
    try {
      all = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8')) || {}
    } catch {
      all = {}
    }
  }
  const updated = {
    ...settings,
    updated_at: new Date().toISOString(),
  }
  all[settings.user_id] = updated
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(all, null, 2), 'utf-8')
  return updated
}

// ── 2. Medication Schedules Store ────────────────────────────

export function getLocalSchedules(userId: string): MedicationScheduleItem[] {
  ensureDir()
  if (!fs.existsSync(SCHEDULES_FILE)) {
    return []
  }
  try {
    const raw = fs.readFileSync(SCHEDULES_FILE, 'utf-8')
    const all: MedicationScheduleItem[] = JSON.parse(raw) || []
    return all.filter((s) => s.user_id === userId)
  } catch {
    return []
  }
}

export function saveLocalSchedule(item: MedicationScheduleItem): MedicationScheduleItem {
  ensureDir()
  let all: MedicationScheduleItem[] = []
  if (fs.existsSync(SCHEDULES_FILE)) {
    try {
      all = JSON.parse(fs.readFileSync(SCHEDULES_FILE, 'utf-8')) || []
    } catch {
      all = []
    }
  }
  const existingIdx = all.findIndex((s) => s.id === item.id)
  if (existingIdx >= 0) {
    all[existingIdx] = item
  } else {
    all.push(item)
  }
  fs.writeFileSync(SCHEDULES_FILE, JSON.stringify(all, null, 2), 'utf-8')
  return item
}

export function saveLocalBatchSchedules(items: MedicationScheduleItem[]): MedicationScheduleItem[] {
  ensureDir()
  let all: MedicationScheduleItem[] = []
  if (fs.existsSync(SCHEDULES_FILE)) {
    try {
      all = JSON.parse(fs.readFileSync(SCHEDULES_FILE, 'utf-8')) || []
    } catch {
      all = []
    }
  }
  for (const item of items) {
    const idx = all.findIndex((s) => s.id === item.id)
    if (idx >= 0) {
      all[idx] = item
    } else {
      all.push(item)
    }
  }
  fs.writeFileSync(SCHEDULES_FILE, JSON.stringify(all, null, 2), 'utf-8')
  return items
}

export function deleteLocalSchedule(userId: string, scheduleId: string): boolean {
  ensureDir()
  if (!fs.existsSync(SCHEDULES_FILE)) return false
  try {
    const all: MedicationScheduleItem[] = JSON.parse(fs.readFileSync(SCHEDULES_FILE, 'utf-8')) || []
    const filtered = all.filter((s) => !(s.id === scheduleId && s.user_id === userId))
    fs.writeFileSync(SCHEDULES_FILE, JSON.stringify(filtered, null, 2), 'utf-8')
    return true
  } catch {
    return false
  }
}

// ── 3. Dose Logs Store ───────────────────────────────────────

export function getLocalDoseLogs(userId: string, dateStr?: string): DoseLog[] {
  ensureDir()
  if (!fs.existsSync(DOSE_LOGS_FILE)) {
    return []
  }
  try {
    const raw = fs.readFileSync(DOSE_LOGS_FILE, 'utf-8')
    const all: DoseLog[] = JSON.parse(raw) || []
    const userLogs = all.filter((l) => l.user_id === userId)
    if (dateStr) {
      // Filter by date portion of scheduled_for (YYYY-MM-DD)
      return userLogs.filter((l) => l.scheduled_for.startsWith(dateStr))
    }
    return userLogs
  } catch {
    return []
  }
}

export function saveLocalDoseLog(log: DoseLog): DoseLog {
  ensureDir()
  let all: DoseLog[] = []
  if (fs.existsSync(DOSE_LOGS_FILE)) {
    try {
      all = JSON.parse(fs.readFileSync(DOSE_LOGS_FILE, 'utf-8')) || []
    } catch {
      all = []
    }
  }
  const existingIdx = all.findIndex(
    (l) => l.schedule_id === log.schedule_id && l.scheduled_for === log.scheduled_for
  )
  if (existingIdx >= 0) {
    all[existingIdx] = { ...all[existingIdx], ...log }
  } else {
    all.push(log)
  }
  fs.writeFileSync(DOSE_LOGS_FILE, JSON.stringify(all, null, 2), 'utf-8')
  return log
}
