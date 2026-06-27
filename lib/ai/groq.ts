import Groq from 'groq-sdk'
import { callGeminiText } from './gemini'
import { GroqError } from '@/lib/utils'

/**
 * Groq client — Llama 3.3 70B for clinical triage / report generation.
 * Initialized lazily so `next build` prerendering never throws on a missing key.
 *
 * If Groq is unavailable, callGroq falls back to Gemini 2.5 Flash (text) with
 * the same prompt so the pipeline never hard-fails on a transient outage.
 */
let groqClient: Groq | null = null

function getClient(): Groq {
  if (groqClient) return groqClient
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    throw new GroqError('GROQ_API_KEY is not set in the environment.')
  }
  groqClient = new Groq({ apiKey })
  return groqClient
}

/**
 * Call Groq Llama 3.3 70B with a system/user message pair.
 *
 * On any error, falls back to Gemini 2.5 Flash (text) with the same prompt.
 * The fallback result includes `_fallback_used: true` so callers can log it.
 *
 * @returns parsed JSON object (with optional _fallback_used flag)
 */
export async function callGroq(
  userContent: string,
  systemPrompt: string,
  model = 'llama-3.3-70b-versatile'
): Promise<object> {
  // --- Primary attempt: Groq ---
  try {
    const completion = await getClient().chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new GroqError('Empty response content from Groq.')
    }

    try {
      return JSON.parse(content)
    } catch {
      throw new GroqError(
        `Groq returned non-JSON content despite json_object mode: ${content.slice(0, 200)}`
      )
    }
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    console.warn('[Groq Fallback]', {
      reason,
      fallback: 'gemini-2.5-flash',
      timestamp: new Date().toISOString(),
    })

    // --- Fallback: Gemini 2.5 Flash (text) ---
    // Disable JSON mode — Gemini uses a different mechanism.
    try {
      const combinedPrompt = `${systemPrompt}\n\n${userContent}`
      const raw = await callGeminiText(combinedPrompt)
      // The result is already parsed by extractJsonSafely inside callGeminiText.
      return { ...raw, _fallback_used: true }
    } catch (fallbackError) {
      const fallbackReason = fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
      console.error('[Groq Fallback] Gemini fallback also failed:', {
        reason: fallbackReason,
        timestamp: new Date().toISOString(),
      })
      throw new GroqError(
        `Groq call failed and Gemini fallback also failed. Groq: ${reason} | Gemini: ${fallbackReason}`
      )
    }
  }
}
