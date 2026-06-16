# Gemini Vision API — Medical Image Analysis Patterns

## Setup

```typescript
// lib/ai/gemini.ts
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const proModel   = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })
const flashModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
```

## Vision Call Pattern

```typescript
export async function callGeminiVision(
  imageBase64: string,
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp',
  prompt: string,
  usePro = true
): Promise<Record<string, unknown>> {
  const model = usePro ? proModel : flashModel
  const result = await model.generateContent([
    { inlineData: { data: imageBase64, mimeType } },
    prompt
  ])
  const text = result.response.text()
  return extractJsonSafely(text)
}
```

## JSON Extraction (LLMs don't always output clean JSON)

```typescript
export function extractJsonSafely(text: string): Record<string, unknown> {
  // Attempt 1: Direct parse
  try { return JSON.parse(text) } catch {}

  // Attempt 2: Strip markdown fences
  const stripped = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
  try { return JSON.parse(stripped) } catch {}

  // Attempt 3: Find first { to last }
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start !== -1 && end !== -1) {
    try { return JSON.parse(text.slice(start, end + 1)) } catch {}
  }

  // All failed
  console.error('[Gemini] JSON extraction failed. Raw:', text.slice(0, 200))
  throw new Error('Could not extract JSON from AI response')
}
```

## Prompt Engineering Rules for Medical Context

1. ALWAYS say "Return ONLY valid JSON — no text outside the JSON object"
2. ALWAYS provide the exact JSON schema with field names and types
3. ALWAYS tell it what to do for edge cases (poor image, unreadable text)
4. Use "you are a [specific role]" framing — it improves accuracy significantly
5. For OCR: add "write [illegible] for text you cannot read" — prevents hallucination

GOOD MEDICAL PROMPT STRUCTURE:
```
You are a [specific medical specialist] AI screening tool.
[Specific task description with medical context].
[Edge case handling instruction].
Return ONLY valid JSON with this exact structure:
{
  "field1": "type and description",
  "field2": "type and description"
}
Do not include any explanatory text outside the JSON object.
```

## Rate Limit Handling

```typescript
export async function callGeminiWithRetry(
  imageBase64: string,
  mimeType: string,
  prompt: string
): Promise<Record<string, unknown>> {
  try {
    return await callGeminiVision(imageBase64, mimeType, prompt, true) // Pro first
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    if (message.includes('429') || message.includes('quota')) {
      await new Promise(r => setTimeout(r, 5000)) // Wait 5s
      return await callGeminiVision(imageBase64, mimeType, prompt, false) // Flash fallback
    }
    throw error
  }
}
```

## Image Size Optimization

Before sending to Gemini:
- Resize to max 1024x1024 (Gemini works well at this resolution)
- Use JPEG quality 85 (balance between quality and token cost)
- Strip EXIF metadata (privacy for medical images)
- Gemini Pro handles up to 20MB but 1-2MB is optimal for speed

## Free Tier Awareness

Gemini 1.5 Pro: 2 RPM, 50 requests/day in free tier.
Strategy: use Gemini Flash for text tasks, Pro only for vision.
Cache results in Supabase — never re-analyze the same image twice.
For demo mode: ALWAYS serve pre-cached results, never call the API.