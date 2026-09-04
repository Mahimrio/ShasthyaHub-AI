import fs from 'fs'
import path from 'path'
import os from 'os'
import type { RelationType, FamilyConnectionStatus } from '@/types'

export interface StoredFamilyConnection {
  id: string
  requester_id: string
  target_id: string
  relation_type: RelationType
  reverse_relation_type: RelationType
  status: FamilyConnectionStatus
  created_at: string
  accepted_at: string | null
}

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)
const DATA_DIR = isServerless
  ? path.join(os.tmpdir(), '.shasthya-data')
  : path.join(process.cwd(), '.data')
const CONNECTIONS_FILE = path.join(DATA_DIR, 'family_connections.json')
const USERNAMES_FILE = path.join(DATA_DIR, 'usernames.json')

// In-memory fallbacks if disk is strictly read-only
let memoryConnections: StoredFamilyConnection[] = []
let memoryUsernames: Record<string, string> = {}

function ensureDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
  } catch {
    // Ignore read-only filesystem errors
  }
}

export function getLocalConnections(): StoredFamilyConnection[] {
  ensureDir()
  try {
    if (fs.existsSync(CONNECTIONS_FILE)) {
      const raw = fs.readFileSync(CONNECTIONS_FILE, 'utf-8')
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryConnections = parsed
        return parsed
      }
    }
  } catch {
    // Fallback to in-memory
  }
  return memoryConnections
}

export function saveLocalConnections(connections: StoredFamilyConnection[]) {
  memoryConnections = [...connections]
  ensureDir()
  try {
    fs.writeFileSync(CONNECTIONS_FILE, JSON.stringify(connections, null, 2), 'utf-8')
  } catch {
    // Read-only filesystem — memoryConnections retains the data
  }
}

export function getLocalUsernames(): Record<string, string> {
  ensureDir()
  try {
    if (fs.existsSync(USERNAMES_FILE)) {
      const raw = fs.readFileSync(USERNAMES_FILE, 'utf-8')
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') {
        memoryUsernames = { ...memoryUsernames, ...parsed }
        return memoryUsernames
      }
    }
  } catch {
    // Fallback to in-memory
  }
  return memoryUsernames
}

export function saveLocalUsername(userId: string, username: string) {
  const map = getLocalUsernames()
  map[userId] = username.toLowerCase().trim()
  memoryUsernames = { ...map }
  ensureDir()
  try {
    fs.writeFileSync(USERNAMES_FILE, JSON.stringify(map, null, 2), 'utf-8')
  } catch {
    // Read-only filesystem — memoryUsernames retains the data
  }
}

export function getLocalUsername(userId: string): string | null {
  const map = getLocalUsernames()
  return map[userId] || null
}

export function isLocalUsernameAvailable(username: string, currentUserId?: string): boolean {
  const map = getLocalUsernames()
  const clean = username.toLowerCase().trim()
  for (const [uid, u] of Object.entries(map)) {
    if (u === clean && uid !== currentUserId) {
      return false
    }
  }
  return true
}
