import { GoogleGenerativeAI } from '@google/generative-ai'
import { getGeminiKeys, GEMINI_MODEL } from './gemini'

/**
 * Shasthya Bondhu chat helpers — PLAIN-TEXT chat (not JSON mode).
 * Deliberately separate from callGroq/callOpenRouter, which are JSON-mode
 * pipelines for the analysis agents.
 */

export type ChatRole = 'user' | 'assistant'
export interface ChatTurn {
  role: ChatRole
  content: string
}

export type RedFlagLevel = 'none' | 'emergency' | 'self-harm'

// ── Red-flag detection (BN + EN) ────────────────────────────────────────────

const EMERGENCY_FLAGS = [
  // English
  'chest pain', "can't breathe", 'cannot breathe', 'difficulty breathing',
  'unconscious', 'not breathing', 'severe bleeding', 'heavy bleeding',
  'stroke', 'seizure', 'convulsion', 'poison', 'overdose', 'heart attack',
  // Bengali
  'বুকে ব্যথা', 'শ্বাস নিতে পারছি না', 'শ্বাসকষ্ট', 'অজ্ঞান',
  'রক্তক্ষরণ', 'স্ট্রোক', 'খিঁচুনি', 'বিষ খেয়ে', 'হার্ট অ্যাটাক',
]

const SELF_HARM_FLAGS = [
  'suicide', 'kill myself', 'end my life', 'self harm', 'self-harm', 'hurt myself',
  'আত্মহত্যা', 'নিজেকে শেষ', 'মরে যেতে চাই', 'বাঁচতে চাই না', 'নিজেকে আঘাত',
]

export function detectRedFlags(text: string): RedFlagLevel {
  const lower = text.toLowerCase()
  if (SELF_HARM_FLAGS.some((f) => lower.includes(f))) return 'self-harm'
  if (EMERGENCY_FLAGS.some((f) => lower.includes(f))) return 'emergency'
  return 'none'
}

// ── History trimming ────────────────────────────────────────────────────────

/** Keep the newest turns within a rough char budget (Groq free tier is 8K TPM). */
export function trimHistory(messages: ChatTurn[], maxChars = 6000, maxTurns = 20): ChatTurn[] {
  const recent = messages.slice(-maxTurns)
  let total = 0
  const kept: ChatTurn[] = []
  for (let i = recent.length - 1; i >= 0; i--) {
    total += recent[i].content.length
    if (total > maxChars && kept.length > 0) break
    kept.unshift(recent[i])
  }
  return kept
}

// ── System prompt ───────────────────────────────────────────────────────────

export function buildChatSystemPrompt(
  lang: 'bn' | 'en',
  profile?: { name?: string | null; district?: string | null } | null,
  reportLines?: string[]
): string {
  const langRule =
    lang === 'bn'
      ? 'Reply in Bengali (বাংলা). Use simple, warm, everyday Bengali a villager understands.'
      : 'Reply in English. Use simple, warm language.'

  const userLine = profile?.name
    ? `The user's name is ${profile.name}${profile.district ? `, from ${profile.district} district, Bangladesh` : ''}.`
    : 'The user is in rural Bangladesh.'

  const reportBlock =
    reportLines && reportLines.length > 0
      ? `\n\nThe user's recent health analyses from this app (use these when they ask about "my report/results"):\n${reportLines.join('\n')}`
      : '\n\nThe user has no analyses in this app yet. If they ask about their reports, suggest running Nayan AI (eye), ScriptGuard (prescription), GlycoVision (food) or Lokhon (symptoms) first.'

  return `You are Shasthya Bondhu (স্বাস্থ্য বন্ধু), the friendly health assistant inside ShasthyaHub-AI, a health app for rural Bangladesh with four AI tools: Nayan AI (eye photo screening), ScriptGuard (prescription safety check), GlycoVision (food/glucose analysis) and Lokhon (symptom checker).

${userLine}${reportBlock}

Strict rules:
- ${langRule}
- You are NOT a doctor. Never diagnose, never prescribe medicines or doses. For anything serious, tell the user to see a qualified doctor.
- For emergencies (chest pain, breathing trouble, heavy bleeding, unconsciousness): tell them to call 999 (national emergency) or 16263 (Shastho Batayon health line) IMMEDIATELY, before anything else.
- If the user mentions suicide or self-harm: respond with warmth and care, and share the Shuchona mental health helpline 16463 and Kaan Pete Roi. Never be dismissive.
- Keep answers SHORT: under 180 words. Plain sentences and simple "-" bullet lists only. No tables, no headers, no code, no emojis.
- General health education, hygiene, nutrition, diabetes/BP lifestyle advice, explaining this app's features, and explaining the user's own reports listed above are all fine.
- If asked something unrelated to health or this app, politely steer back in one sentence.
- End answers about symptoms or reports with a one-line reminder to consult a doctor for confirmation.`
}

// ── Plain-text fallback providers ───────────────────────────────────────────

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

export async function openRouterChatText(
  system: string,
  history: ChatTurn[],
  maxTokens = 1024
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not set.')

  const ac = new AbortController()
  const timer = setTimeout(() => ac.abort(), 40_000)
  try {
    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      signal: ac.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'ShasthyaHub-AI',
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'minimax/minimax-m3:free',
        messages: [{ role: 'system', content: system }, ...history],
        temperature: 0.4,
        max_tokens: maxTokens,
      }),
    })
    if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${(await res.text()).slice(0, 200)}`)
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] }
    const content = json.choices?.[0]?.message?.content?.trim()
    if (!content) throw new Error('Empty OpenRouter chat response.')
    return content
  } finally {
    clearTimeout(timer)
  }
}

export async function geminiChatText(system: string, history: ChatTurn[]): Promise<string> {
  const keys = getGeminiKeys()
  if (keys.length === 0) throw new Error('No Gemini key configured.')
  const client = new GoogleGenerativeAI(keys[0])
  const model = client.getGenerativeModel({ model: GEMINI_MODEL })
  const transcript = history
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n')
  const result = await model.generateContent(`${system}\n\nConversation so far:\n${transcript}\n\nAssistant:`)
  const text = result.response.text().trim()
  if (!text) throw new Error('Empty Gemini chat response.')
  return text
}
