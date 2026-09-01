import fs from 'fs'
import path from 'path'
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

const DATA_DIR = path.join(process.cwd(), '.data')
const CONNECTIONS_FILE = path.join(DATA_DIR, 'family_connections.json')
const USERNAMES_FILE = path.join(DATA_DIR, 'usernames.json')

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

export function getLocalConnections(): StoredFamilyConnection[] {
  ensureDir()
  if (!fs.existsSync(CONNECTIONS_FILE)) {
    return []
  }
  try {
    const raw = fs.readFileSync(CONNECTIONS_FILE, 'utf-8')
    return JSON.parse(raw) || []
  } catch {
    return []
  }
}

export function saveLocalConnections(connections: StoredFamilyConnection[]) {
  ensureDir()
  fs.writeFileSync(CONNECTIONS_FILE, JSON.stringify(connections, null, 2), 'utf-8')
}

export function getLocalUsernames(): Record<string, string> {
  ensureDir()
  if (!fs.existsSync(USERNAMES_FILE)) {
    return {}
  }
  try {
    const raw = fs.readFileSync(USERNAMES_FILE, 'utf-8')
    return JSON.parse(raw) || {}
  } catch {
    return {}
  }
}

export function saveLocalUsername(userId: string, username: string) {
  ensureDir()
  const map = getLocalUsernames()
  map[userId] = username.toLowerCase().trim()
  fs.writeFileSync(USERNAMES_FILE, JSON.stringify(map, null, 2), 'utf-8')
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
