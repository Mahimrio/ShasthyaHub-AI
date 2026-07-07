/**
 * Environment Variable Audit Script
 *
 * Run: node scripts/check-env.mjs
 *
 * Validates that all required environment variables are set.
 * Loads .env.local automatically to support local development.
 * On CI platforms (Vercel, GitHub Actions), uses console.warn instead of
 * process.exit(1) to avoid breaking builds where environment variables
 * may be injected at a different stage.
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..')

// Load .env.local so this script works during prebuild (Next.js hasn't loaded it yet)
try {
  const envLocal = readFileSync(resolve(rootDir, '.env.local'), 'utf-8')
  for (const line of envLocal.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim()
    if (key && !process.env[key]) {
      process.env[key] = val
    }
  }
} catch {
  // .env.local not found — vars must come from the environment
}

const requiredServerVars = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'GEMINI_API_KEY',
  'GROQ_API_KEY',
]

const requiredPublicVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
]

function isCI() {
  return (
    process.env.CI === 'true' ||
    process.env.CI === '1' ||
    process.env.VERCEL === '1' ||
    process.env.VERCEL_ENV !== undefined
  )
}

function checkEnv() {
  const missing = []
  const ci = isCI()

  for (const name of requiredServerVars) {
    if (!process.env[name]) {
      missing.push(name)
    }
  }

  for (const name of requiredPublicVars) {
    if (!process.env[name]) {
      missing.push(name)
    }
  }

  if (missing.length === 0) {
    console.log('[check-env] All required environment variables are set.')
    return
  }

  const message = `[check-env] Missing environment variables: ${missing.join(', ')}`

  if (ci) {
    console.warn(message)
    console.warn('[check-env] CI detected — skipping hard failure. Ensure these are injected at deploy time.')
  } else {
    console.error(message)
    process.exit(1)
  }
}

checkEnv()
