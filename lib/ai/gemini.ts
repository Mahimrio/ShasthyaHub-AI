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
    return await attempt('gemini-2.5-flash')
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
      console.warn('[Gemini] Rate limited (429). Waiting 5s, retrying with gemini-1.5-flash...')
      await sleep(5000)
      try {
        return await attempt('gemini-1.5-flash')
      } catch (retryError) {
        console.error('[Gemini] Retry with gemini-1.5-flash also failed:', retryError)
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
        return await attempt('gemini-2.5-flash')
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

  try {
    const model = getClient().getGenerativeModel({ model: 'gemini-2.5-flash' })
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    return extractJsonSafely(text)
  } catch (error) {
    console.error('[Gemini Error]', {
      feature,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
      elapsed_ms: Date.now() - start,
    })

    if (error instanceof JsonExtractionError) {
      throw error
    }
    throw new GeminiError(
      `Text analysis failed: ${error instanceof Error ? error.message : String(error)}`,
      500
    )
  }
}
