/**
 * Environment Variable Audit Script
 *
 * Run: node scripts/check-env.mjs
 *
 * Validates that all required environment variables are set.
 * In CI (process.env.CI === 'true'), uses console.warn instead of
 * process.exit(1) to avoid breaking GitHub Actions where environment
 * variables may be injected at a different stage.
 */

const requiredServerVars = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'GEMINI_API_KEY',
  'GROQ_API_KEY',
]

const requiredPublicVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
]

function checkEnv() {
  const missing = []
  const isCI = process.env.CI === 'true'

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

  if (isCI) {
    console.warn(message)
    console.warn('[check-env] CI detected — skipping hard failure. Ensure these are injected at deploy time.')
  } else {
    console.error(message)
    process.exit(1)
  }
}

checkEnv()
