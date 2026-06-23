import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Health check should not be cached — we want a live probe on every call.
export const dynamic = 'force-dynamic'

interface ServiceStatus {
  status: 'ok' | 'error'
  latency_ms?: number
  detail?: string
}

interface HealthResponse {
  supabase: ServiceStatus
  gemini: ServiceStatus
  groq: ServiceStatus
  timestamp: string
}

/**
 * Lightweight liveness/readiness probe.
 *
 * Each dependency is probed with the cheapest call possible so this stays fast:
 *  - Supabase: `select count` on profiles (authed admin not needed for the count)
 *  - Gemini:   key presence check (no API call — avoids burning quota on every hit)
 *  - Groq:     key presence check
 *
 * Returns 200 if everything is ok, 503 if any service is down.
 */
export async function GET(): Promise<NextResponse<HealthResponse>> {
  const [supabaseStatus, geminiStatus, groqStatus] = await Promise.all([
    checkSupabase(),
    checkGemini(),
    checkGroq(),
  ])

  const body: HealthResponse = {
    supabase: supabaseStatus,
    gemini: geminiStatus,
    groq: groqStatus,
    timestamp: new Date().toISOString(),
  }

  const allOk =
    supabaseStatus.status === 'ok' &&
    geminiStatus.status === 'ok' &&
    groqStatus.status === 'ok'

  return NextResponse.json(body, { status: allOk ? 200 : 503 })
}

async function checkSupabase(): Promise<ServiceStatus> {
  const start = Date.now()
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).limit(1)
    if (error) {
      return { status: 'error', detail: error.message }
    }
    return { status: 'ok', latency_ms: Date.now() - start }
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    return { status: 'error', detail }
  }
}

async function checkGemini(): Promise<ServiceStatus> {
  if (!process.env.GEMINI_API_KEY) {
    return { status: 'error', detail: 'GEMINI_API_KEY is not set' }
  }
  return { status: 'ok' }
}

async function checkGroq(): Promise<ServiceStatus> {
  if (!process.env.GROQ_API_KEY) {
    return { status: 'error', detail: 'GROQ_API_KEY is not set' }
  }
  return { status: 'ok' }
}
