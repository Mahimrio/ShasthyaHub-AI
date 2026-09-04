import fs from 'fs'
import path from 'path'
import os from 'os'
import type {
  MedicationScheduleItem,
  DoseLog,
  UserReminderSettings,
} from '@/types'

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)
const DATA_DIR = isServerless
  ? path.join(os.tmpdir(), '.shasthya-data')
  : path.join(process.cwd(), '.data')
const SCHEDULES_FILE = path.join(DATA_DIR, 'medication_schedules.json')
const DOSE_LOGS_FILE = path.join(DATA_DIR, 'dose_logs.json')
const SETTINGS_FILE = path.join(DATA_DIR, 'reminder_settings.json')

// In-memory fallbacks if disk is strictly read-only
const memorySettings: Record<string, UserReminderSettings> = {}
let memorySchedules: MedicationScheduleItem[] = []
let memoryDoseLogs: DoseLog[] = []

function ensureDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
  } catch {
    // Ignore read-only filesystem errors
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
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const raw = fs.readFileSync(SETTINGS_FILE, 'utf-8')
      const all: Record<string, UserReminderSettings> = JSON.parse(raw) || {}
      if (all[userId]) {
        memorySettings[userId] = all[userId]
        return all[userId]
      }
    }
  } catch {
    // Fallback to in-memory
  }
  return memorySettings[userId] || { user_id: userId, ...DEFAULT_SETTINGS }
}

export function saveLocalSettings(settings: UserReminderSettings): UserReminderSettings {
  const updated = {
    ...settings,
    updated_at: new Date().toISOString(),
  }
  memorySettings[settings.user_id] = updated
  ensureDir()
  try {
    let all: Record<string, UserReminderSettings> = {}
    if (fs.existsSync(SETTINGS_FILE)) {
      try {
        all = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8')) || {}
      } catch {
        all = {}
      }
    }
    all[settings.user_id] = updated
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(all, null, 2), 'utf-8')
  } catch {
    // Read-only filesystem — memorySettings retains the data
  }
  return updated
}

// ── 2. Medication Schedules Store ────────────────────────────

export function getLocalSchedules(userId: string): MedicationScheduleItem[] {
  ensureDir()
  try {
    if (fs.existsSync(SCHEDULES_FILE)) {
      const raw = fs.readFileSync(SCHEDULES_FILE, 'utf-8')
      const all: MedicationScheduleItem[] = JSON.parse(raw) || []
      if (Array.isArray(all) && all.length > 0) {
        memorySchedules = all
        return all.filter((s) => s.user_id === userId)
      }
    }
  } catch {
    // Fallback to in-memory
  }
  return memorySchedules.filter((s) => s.user_id === userId)
}

export function saveLocalSchedule(item: MedicationScheduleItem): MedicationScheduleItem {
  const existingIdx = memorySchedules.findIndex((s) => s.id === item.id)
  if (existingIdx >= 0) {
    memorySchedules[existingIdx] = item
  } else {
    memorySchedules.push(item)
  }

  ensureDir()
  try {
    let all: MedicationScheduleItem[] = []
    if (fs.existsSync(SCHEDULES_FILE)) {
      try {
        all = JSON.parse(fs.readFileSync(SCHEDULES_FILE, 'utf-8')) || []
      } catch {
        all = []
      }
    }
    const idx = all.findIndex((s) => s.id === item.id)
    if (idx >= 0) {
      all[idx] = item
    } else {
      all.push(item)
    }
    fs.writeFileSync(SCHEDULES_FILE, JSON.stringify(all, null, 2), 'utf-8')
  } catch {
    // Read-only filesystem — memorySchedules retains the data
  }
  return item
}

export function saveLocalBatchSchedules(items: MedicationScheduleItem[]): MedicationScheduleItem[] {
  for (const item of items) {
    const idx = memorySchedules.findIndex((s) => s.id === item.id)
    if (idx >= 0) {
      memorySchedules[idx] = item
    } else {
      memorySchedules.push(item)
    }
  }

  ensureDir()
  try {
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
  } catch {
    // Read-only filesystem
  }
  return items
}

export function deleteLocalSchedule(userId: string, scheduleId: string): boolean {
  memorySchedules = memorySchedules.filter((s) => !(s.id === scheduleId && s.user_id === userId))
  ensureDir()
  try {
    if (!fs.existsSync(SCHEDULES_FILE)) return true
    const all: MedicationScheduleItem[] = JSON.parse(fs.readFileSync(SCHEDULES_FILE, 'utf-8')) || []
    const filtered = all.filter((s) => !(s.id === scheduleId && s.user_id === userId))
    fs.writeFileSync(SCHEDULES_FILE, JSON.stringify(filtered, null, 2), 'utf-8')
    return true
  } catch {
    return true
  }
}

// ── 3. Dose Logs Store ───────────────────────────────────────

export function getLocalDoseLogs(userId: string, dateStr?: string): DoseLog[] {
  ensureDir()
  try {
    if (fs.existsSync(DOSE_LOGS_FILE)) {
      const raw = fs.readFileSync(DOSE_LOGS_FILE, 'utf-8')
      const all: DoseLog[] = JSON.parse(raw) || []
      if (Array.isArray(all) && all.length > 0) {
        memoryDoseLogs = all
      }
    }
  } catch {
    // Fallback to in-memory
  }
  const userLogs = memoryDoseLogs.filter((l) => l.user_id === userId)
  if (dateStr) {
    return userLogs.filter((l) => l.scheduled_for.startsWith(dateStr))
  }
  return userLogs
}

export function saveLocalDoseLog(log: DoseLog): DoseLog {
  const existingIdx = memoryDoseLogs.findIndex(
    (l) => l.schedule_id === log.schedule_id && l.scheduled_for === log.scheduled_for
  )
  if (existingIdx >= 0) {
    memoryDoseLogs[existingIdx] = { ...memoryDoseLogs[existingIdx], ...log }
  } else {
    memoryDoseLogs.push(log)
  }

  ensureDir()
  try {
    let all: DoseLog[] = []
    if (fs.existsSync(DOSE_LOGS_FILE)) {
      try {
        all = JSON.parse(fs.readFileSync(DOSE_LOGS_FILE, 'utf-8')) || []
      } catch {
        all = []
      }
    }
    const idx = all.findIndex(
      (l) => l.schedule_id === log.schedule_id && l.scheduled_for === log.scheduled_for
    )
    if (idx >= 0) {
      all[idx] = { ...all[idx], ...log }
    } else {
      all.push(log)
    }
    fs.writeFileSync(DOSE_LOGS_FILE, JSON.stringify(all, null, 2), 'utf-8')
  } catch {
    // Read-only filesystem
  }
  return log
}
