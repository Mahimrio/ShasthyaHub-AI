import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface HealthCheckResponse {
  supabase: 'ok' | 'error'
  gemini: 'ok' | 'rate_limited' | 'error'
  groq: 'ok' | 'error'
  timestamp: string
  version: string
}

/**
 * GET /api/health
 *
 * Probes all three external services with real (but minimal) API calls.
 * Returns 200 if everything is ok, 503 if any service is down.
 */
export async function GET(): Promise<NextResponse<HealthCheckResponse>> {
  const [supabaseStatus, geminiStatus, groqStatus] = await Promise.all([
    checkSupabase(),
    checkGemini(),
    checkGroq(),
  ])

  const body: HealthCheckResponse = {
    supabase: supabaseStatus,
    gemini: geminiStatus,
    groq: groqStatus,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  }

  const allOk =
    body.supabase === 'ok' &&
    (body.gemini === 'ok' || body.gemini === 'rate_limited') &&
    body.groq === 'ok'

  return NextResponse.json(body, { status: allOk ? 200 : 503 })
}

// ── Service probes ─────────────────────────────────────────────────────────

async function checkSupabase(): Promise<'ok' | 'error'> {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .limit(1)

    return error ? 'error' : 'ok'
  } catch {
    return 'error'
  }
}

async function checkGemini(): Promise<'ok' | 'rate_limited' | 'error'> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return 'error'

  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const result = await model.generateContent('Reply with exactly one word: OK')
    const text = result.response.text().trim()

    return text ? 'ok' : 'error'
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('rate')) {
      return 'rate_limited'
    }
    return 'error'
  }
}

async function checkGroq(): Promise<'ok' | 'error'> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return 'error'

  try {
    const { default: Groq } = await import('groq-sdk')
    const groq = new Groq({ apiKey })
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: 'Reply with exactly one word: OK' }],
      temperature: 0.1,
      max_tokens: 10,
    })
    const text = completion.choices[0]?.message?.content?.trim()
    return text ? 'ok' : 'error'
  } catch {
    return 'error'
  }
}
