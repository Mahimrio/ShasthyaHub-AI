# Groq API — Fast Logic Engine Patterns

## Setup

```typescript
// lib/ai/groq.ts
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! })

// Model guide:
// llama-3.3-70b-versatile — best quality, ~2s response, use for clinical reasoning
// llama-3.1-8b-instant — ultra-fast <0.5s, use for simple text + Bengali translation
// mixtral-8x7b-32768 — good for structured data, large context
```

## JSON Mode Pattern (ALWAYS use for structured outputs)

```typescript
export async function callGroq(
  userContent: string,
  systemPrompt: string,
  model = 'llama-3.3-70b-versatile'
): Promise<Record<string, unknown>> {
  const completion = await groq.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent }
    ],
    response_format: { type: 'json_object' }, // CRITICAL: forces JSON output
    temperature: 0.1, // Low temperature = more consistent medical outputs
    max_tokens: 2048
  })

  const text = completion.choices[0]?.message?.content ?? '{}'
  try {
    return JSON.parse(text)
  } catch {
    // response_format should prevent this, but just in case:
    return extractJsonSafely(text) // import from gemini.ts
  }
}
```

## Bengali Output Patterns

Groq Llama 3.3 70B outputs excellent Bengali. Use these prompt patterns:

```
// In your system prompt, specify Bengali output explicitly:
"recommendation_bn": "string — এটি বাংলায় লিখুন। সহজ এবং স্পষ্ট ভাষা ব্যবহার করুন।
যিনি ডাক্তারের কাছে যাননি তার জন্য উপযুক্ত ভাষা ব্যবহার করুন।"

// For Bengali audio scripts (ScriptGuard schedule):
"audio_script_bn": "string — একজন ফার্মাসিস্ট যেভাবে একজন রোগীকে ওষুধ খাওয়ার নির্দেশ দেন
সেভাবে লিখুন। প্রতিটি সময়ের ওষুধ আলাদাভাবে বলুন।"
```

## Clinical Reasoning Prompt Pattern

```typescript
const CLINICAL_REASONING_SYSTEM = `
You are a clinical AI assistant for rural Bangladesh.
Your audience: patients with limited medical literacy, non-specialist healthcare workers.
Your output must be:
1. In both English (_en suffix) and Bengali (_bn suffix) for every recommendation field
2. Simple language — no Latin medical terms, no jargon
3. Actionable — what should the patient DO, not just what is wrong
4. Culturally appropriate for Bangladesh (reference local healthcare resources)
Always output ONLY a JSON object. Never include text outside the JSON.
`
```

## Fallback Chain

```typescript
export async function callGroqWithFallback(
  userContent: string,
  systemPrompt: string
): Promise<Record<string, unknown>> {
  try {
    return await callGroq(userContent, systemPrompt, 'llama-3.3-70b-versatile')
  } catch (err) {
    console.warn('[Groq] Primary failed, trying 8B instant:', err)
    try {
      return await callGroq(userContent, systemPrompt, 'llama-3.1-8b-instant')
    } catch {
      // Last resort: Gemini Flash
      return await callGeminiText(userContent + '\n\nSystem: ' + systemPrompt)
    systemPrompt)
    }
  }
}
```

## Free Tier Management

Groq free: 14,400 requests/day (very generous).
Llama 3.3 70B: 6,000 tokens/minute rate limit.
Strategy: batch logic in a single Groq call rather than multiple calls.
Never call Groq twice for the same analysis — combine clinical reasoning + Bengali + schedule in one prompt.