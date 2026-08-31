import { extractJsonSafely } from './gemini'

/**
 * OpenRouter client — OpenAI-compatible fallback provider.
 * Sits between Groq and Gemini in the reasoning fallback chain, giving the
 * pipeline a third independent quota pool. Configure with OPENROUTER_API_KEY
 * (and optionally OPENROUTER_MODEL to override the default free model).
 */

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const TIMEOUT_MS = 45_000

export function isOpenRouterConfigured(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY)
}

export async function callOpenRouter(
  userContent: string,
  systemPrompt: string,
  model = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct:free',
  maxTokens = 3500
): Promise<object> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not set in the environment.')
  }

  const ac = new AbortController()
  const timer = setTimeout(() => ac.abort(), TIMEOUT_MS)
  const start = Date.now()

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      signal: ac.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        // OpenRouter attribution headers (optional but recommended)
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'ShasthyaHub-AI',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
        max_tokens: maxTokens,
      }),
    })

    if (!res.ok) {
      const errText = (await res.text()).slice(0, 300)
      throw new Error(`OpenRouter ${res.status}: ${errText}`)
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[]
    }
    const content = json.choices?.[0]?.message?.content
    if (!content) {
      throw new Error('Empty response content from OpenRouter.')
    }

    // Free models occasionally ignore json_object mode — extract defensively.
    return extractJsonSafely(content)
  } catch (error) {
    console.error('[OpenRouter Error]', {
      model,
      error: error instanceof Error ? error.message : String(error),
      elapsed_ms: Date.now() - start,
      timestamp: new Date().toISOString(),
    })
    throw error
  } finally {
    clearTimeout(timer)
  }
}
