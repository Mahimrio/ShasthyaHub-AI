import fs from 'fs'
import path from 'path'
import os from 'os'

export interface CaregiverNudge {
  id: string
  sender_id: string
  target_id: string
  sender_relation: string
  message: string | null
  created_at: string
  seen_at: string | null
}

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)
const DATA_DIR = isServerless
  ? path.join(os.tmpdir(), '.shasthya-data')
  : path.join(process.cwd(), '.data')
const NUDGES_FILE = path.join(DATA_DIR, 'caregiver_nudges.json')

let memoryNudges: CaregiverNudge[] = []

function ensureDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  } catch {
    // read-only filesystem
  }
}

function loadAll(): CaregiverNudge[] {
  ensureDir()
  try {
    if (fs.existsSync(NUDGES_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(NUDGES_FILE, 'utf-8'))
      if (Array.isArray(parsed)) memoryNudges = parsed
    }
  } catch {
    // fall back to memory
  }
  return memoryNudges
}

export function saveLocalNudge(nudge: CaregiverNudge): CaregiverNudge {
  const all = loadAll()
  all.push(nudge)
  memoryNudges = all
  try {
    fs.writeFileSync(NUDGES_FILE, JSON.stringify(all, null, 2), 'utf-8')
  } catch {
    // read-only filesystem — memory retains it
  }
  return nudge
}

/** Unseen nudges addressed to a user, newest first. */
export function getLocalUnseenNudges(targetId: string): CaregiverNudge[] {
  return loadAll()
    .filter((n) => n.target_id === targetId && !n.seen_at)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export function markLocalNudgesSeen(targetId: string, ids: string[]): void {
  const all = loadAll()
  const now = new Date().toISOString()
  for (const n of all) {
    if (n.target_id === targetId && ids.includes(n.id) && !n.seen_at) n.seen_at = now
  }
  memoryNudges = all
  try {
    fs.writeFileSync(NUDGES_FILE, JSON.stringify(all, null, 2), 'utf-8')
  } catch {
    // read-only filesystem
  }
}
