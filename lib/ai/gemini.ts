import { GoogleGenerativeAI } from '@google/generative-ai'
import { GeminiError, JsonExtractionError } from '@/lib/utils'

/**
 * Gemini client — Vision + Text pipeline for ShasthyaHub-AI.
 * Initialized lazily so the client is only built when an API key exists,
 * which keeps `next build` prerendering from throwing on a missing key.
 */

let genAI: GoogleGenerativeAI | null = null

function getClient(): GoogleGenerativeAI {
  if (genAI) return genAI
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new GeminiError('GEMINI_API_KEY is not set in the environment.', 500)
  }
  genAI = new GoogleGenerativeAI(apiKey)
  return genAI
}

export type ImageMimeType = 'image/jpeg' | 'image/png' | 'image/webp'

// ── JSON extraction (3 attempts) ───────────────────────────────────────────

/**
 * Attempt to parse a JSON object from an LLM response string.
 *
 * Attempt 1: Direct JSON.parse
 * Attempt 2: Strip markdown fences, then parse
 * Attempt 3: Regex-extract the first {…} block, then parse
 *
 * Throws JsonExtractionError if all 3 attempts fail.
 */
export function extractJsonSafely(text: string): object {
  const trimmed = text.trim()
  if (!trimmed) {
    throw new JsonExtractionError(text)
  }

  // Attempt 1 — Direct parse (best case: clean JSON).
  try {
    return JSON.parse(trimmed)
  } catch {
    // fall through
  }

  // Attempt 2 — Strip markdown fences.
  const noFences = trimmed
    .replace(/```json\n?/gi, '')
    .replace(/```\n?/gi, '')
    .trim()
  if (noFences && noFences !== trimmed) {
    try {
      return JSON.parse(noFences)
    } catch {
      // fall through
    }
  }

  // Attempt 3 — Regex: find the first { … } block.
  const match = trimmed.match(/\{[\s\S]*\}/)
  if (match) {
    try {
      return JSON.parse(match[0])
    } catch {
      // fall through to throw
    }
  }

  throw new JsonExtractionError(text)
}

// ── Sleep helper ───────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// ── Concurrency limiter ────────────────────────────────────────────────────
// Free-tier Gemini 2.5 Flash allows ~10 RPM.  This ensures at most 1
// outstanding request at a time so multiple simultaneous analyses don't all
// hit the rate limit simultaneously.
let activeRequests = 0
const MAX_CONCURRENT = 1

async function withConcurrencyLimit<T>(fn: () => Promise<T>): Promise<T> {
  for (let i = 0; i < 120; i++) {
    if (activeRequests < MAX_CONCURRENT) {
      activeRequests++
      try {
        return await fn()
      } finally {
        activeRequests--
      }
    }
    await sleep(1000)
  }
  throw new GeminiError('Concurrency limit wait timed out.', 503)
}

// ── Shared retry helper ────────────────────────────────────────────────────

async function attemptWithRetry(
  modelName: string,
  callFn: (model: string) => Promise<object>,
  feature: string,
  start: number
): Promise<object> {
  const delays = [5000, 15000, 30000]

  for (let attempt = 0; attempt <= delays.length; attempt++) {
    try {
      return await callFn(modelName)
    } catch (error) {
      const elapsed = Date.now() - start
      console.error(`[Gemini Error] attempt ${attempt + 1}`, {
        feature,
        model: modelName,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
        elapsed_ms: elapsed,
      })

      const errorMessage = error instanceof Error ? error.message : ''
      const is429 =
        errorMessage.includes('429') ||
        errorMessage.includes('RESOURCE_EXHAUSTED') ||
        errorMessage.includes('rate')
      const is503 =
        errorMessage.includes('503') ||
        errorMessage.includes('UNAVAILABLE') ||
        errorMessage.includes('Service Unavailable')

      // Non-retryable errors — throw immediately.
      if (!is429 && !is503) {
        if (error instanceof JsonExtractionError) throw error
        throw new GeminiError(
          `Analysis failed: ${error instanceof Error ? error.message : String(error)}`,
          error instanceof GeminiError ? error.statusCode : 500
        )
      }

      // Retryable — wait with exponential backoff.
      if (attempt < delays.length) {
        const wait = delays[attempt]!
        console.warn(`[Gemini] ${is429 ? 'Rate limited (429)' : 'Unavailable (503)'}. Waiting ${wait}ms before retry ${attempt + 2}...`)
        await sleep(wait)
        continue
      }

      // All retries exhausted.
      const statusCode = is429 ? 429 : 503
      throw new GeminiError(
        `${is429 ? 'Rate limited' : 'Unavailable'} after ${delays.length + 1} attempts: ${error instanceof Error ? error.message : String(error)}`,
        statusCode
      )
    }
  }

  throw new GeminiError(`Unexpected: all retries exhausted without result.`, 500)
}

// ── callGeminiVision with retry ────────────────────────────────────────────

/**
 * Run Gemini on an image + prompt and return a parsed JSON object.
 * Retries with exponential backoff on 429 / 503.
 */
export async function callGeminiVision(
  imageBase64: string,
  mimeType: ImageMimeType,
  systemPrompt: string
): Promise<object> {
  const feature = 'gemini-vision'
  const start = Date.now()

  async function callFn(modelName: string): Promise<object> {
    const model = getClient().getGenerativeModel({ model: modelName })
    const result = await model.generateContent([
      { inlineData: { data: imageBase64, mimeType } },
      { text: systemPrompt },
    ])
    const text = result.response.text()
    return extractJsonSafely(text)
  }

  return withConcurrencyLimit(() => attemptWithRetry('gemini-2.5-flash', callFn, feature, start))
}

// ── callGeminiText with retry ──────────────────────────────────────────────

/**
 * Run Gemini 2.5 Flash on a text-only prompt and return a parsed JSON object.
 * Used for fallback paths when Groq is unavailable and for the health check.
 * Same retry logic (exponential backoff, concurrency limit) as the vision path.
 */
export async function callGeminiText(prompt: string): Promise<object> {
  const feature = 'gemini-text'
  const start = Date.now()

  async function callFn(modelName: string): Promise<object> {
    const model = getClient().getGenerativeModel({ model: modelName })
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    return extractJsonSafely(text)
  }

  return withConcurrencyLimit(() => attemptWithRetry('gemini-2.5-flash', callFn, feature, start))
}
