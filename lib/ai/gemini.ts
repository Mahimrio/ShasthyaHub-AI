import { GoogleGenerativeAI } from '@google/generative-ai'
import { GeminiError, JsonExtractionError } from '@/lib/utils'

/**
 * Gemini client — Vision + Text pipeline for ShasthyaHub-AI.
 * Initialized lazily so the client is only built when an API key exists,
 * which keeps `next build` prerendering from throwing on a missing key.
 *
 * Supports a key pool: GEMINI_API_KEYS (comma-separated, one per Cloud
 * project) rotates on 429 since quotas are per-project. Falls back to the
 * single GEMINI_API_KEY.
 */

let keyIndex = 0
const clientCache = new Map<string, GoogleGenerativeAI>()

/** All configured Gemini keys — GEMINI_API_KEYS wins over GEMINI_API_KEY. */
export function getGeminiKeys(): string[] {
  const multi = process.env.GEMINI_API_KEYS
  if (multi) {
    const keys = multi.split(',').map((k) => k.trim()).filter(Boolean)
    if (keys.length > 0) return keys
  }
  return process.env.GEMINI_API_KEY ? [process.env.GEMINI_API_KEY] : []
}

function getClient(): GoogleGenerativeAI {
  const keys = getGeminiKeys()
  if (keys.length === 0) {
    throw new GeminiError('GEMINI_API_KEY is not set in the environment.', 500)
  }
  const key = keys[keyIndex % keys.length]
  let client = clientCache.get(key)
  if (!client) {
    client = new GoogleGenerativeAI(key)
    clientCache.set(key, client)
  }
  return client
}

/** Advance to the next key (separate project = separate quota). False if there is nothing to rotate to. */
function rotateGeminiKey(): boolean {
  const keys = getGeminiKeys()
  if (keys.length < 2) return false
  keyIndex = (keyIndex + 1) % keys.length
  console.warn(`[Gemini] Rate limited — rotated to API key #${(keyIndex % keys.length) + 1} of ${keys.length}`)
  return true
}

export type ImageMimeType = 'image/jpeg' | 'image/png' | 'image/webp'

// New AQ.-style keys are gated to Gemini 3.x — gemini-2.5-* now 404s for new projects.
export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash'
const GEMINI_FALLBACK_MODEL = 'gemini-3.5-flash-lite'

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

// ── callGeminiVision with retry ────────────────────────────────────────────

/**
 * Run Gemini on an image + prompt and return a parsed JSON object.
 *
 * Retry logic:
 *   HTTP 429 (rate limit)  → wait 5000ms, retry once with gemini-1.5-flash
 *   HTTP 503 (unavailable) → wait 3000ms, retry once
 *   Other errors           → throw GeminiError immediately
 */
export async function callGeminiVision(
  imageBase64: string,
  mimeType: ImageMimeType,
  systemPrompt: string
): Promise<object> {
  const feature = 'gemini-vision'
  const start = Date.now()

  async function attempt(modelName: string): Promise<object> {
    const model = getClient().getGenerativeModel({ model: modelName })
    const result = await model.generateContent([
      { inlineData: { data: imageBase64, mimeType } },
      { text: systemPrompt },
    ])
    const text = result.response.text()
    return extractJsonSafely(text)
  }

  try {
    return await attempt(GEMINI_MODEL)
  } catch (error) {
    const elapsed = Date.now() - start
    console.error('[Gemini Error]', {
      feature,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
      elapsed_ms: elapsed,
    })

    // Check if the SDK extracted an HTTP status from the error.
    const errorMessage = error instanceof Error ? error.message : ''
    const is429 =
      errorMessage.includes('429') ||
      errorMessage.includes('RESOURCE_EXHAUSTED') ||
      errorMessage.includes('rate')
    const is503 =
      errorMessage.includes('503') ||
      errorMessage.includes('UNAVAILABLE') ||
      errorMessage.includes('Service Unavailable')

    if (is429) {
      // A different project's key has its own quota — rotating beats waiting.
      if (rotateGeminiKey()) {
        try {
          return await attempt(GEMINI_MODEL)
        } catch (rotateError) {
          console.warn('[Gemini] Rotated key also failed:', rotateError)
          // fall through to the wait-and-downgrade path
        }
      }
      console.warn(`[Gemini] Rate limited (429). Waiting 5s, retrying with ${GEMINI_FALLBACK_MODEL}...`)
      await sleep(5000)
      try {
        return await attempt(GEMINI_FALLBACK_MODEL)
      } catch (retryError) {
        console.error(`[Gemini] Retry with ${GEMINI_FALLBACK_MODEL} also failed:`, retryError)
        throw new GeminiError(
          `Vision analysis rate limited: ${retryError instanceof Error ? retryError.message : String(retryError)}`,
          429
        )
      }
    }

    if (is503) {
      console.warn('[Gemini] Service unavailable (503). Waiting 3s, retrying...')
      await sleep(3000)
      try {
        return await attempt(GEMINI_MODEL)
      } catch (retryError) {
        console.error('[Gemini] Retry after 503 also failed:', retryError)
        throw new GeminiError(
          `Vision analysis unavailable: ${retryError instanceof Error ? retryError.message : String(retryError)}`,
          503
        )
      }
    }

    // Wrap any other Gemini error.
    if (error instanceof JsonExtractionError) {
      throw error // re-throw as-is
    }
    throw new GeminiError(
      `Vision analysis failed: ${error instanceof Error ? error.message : String(error)}`,
      error instanceof GeminiError ? error.statusCode : 500
    )
  }
}

// ── callGeminiText ─────────────────────────────────────────────────────────

/**
 * Run Gemini 2.5 Flash on a text-only prompt and return a parsed JSON object.
 * Used for fallback paths when Groq is unavailable and for the health check.
 */
export async function callGeminiText(prompt: string): Promise<object> {
  const feature = 'gemini-text'
  const start = Date.now()

  async function attempt(): Promise<object> {
    const model = getClient().getGenerativeModel({ model: GEMINI_MODEL })
    const result = await model.generateContent(prompt)
    return extractJsonSafely(result.response.text())
  }

  try {
    return await attempt()
  } catch (error) {
    console.error('[Gemini Error]', {
      feature,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
      elapsed_ms: Date.now() - start,
    })

    const msg = error instanceof Error ? error.message : ''
    const is429 = msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('rate')
    if (is429 && rotateGeminiKey()) {
      try {
        return await attempt()
      } catch (retryError) {
        throw new GeminiError(
          `Text analysis rate limited after key rotation: ${retryError instanceof Error ? retryError.message : String(retryError)}`,
          429
        )
      }
    }

    if (error instanceof JsonExtractionError) {
      throw error
    }
    throw new GeminiError(
      `Text analysis failed: ${error instanceof Error ? error.message : String(error)}`,
      500
    )
  }
}
