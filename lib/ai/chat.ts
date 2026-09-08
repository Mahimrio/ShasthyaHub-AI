import { GoogleGenerativeAI } from '@google/generative-ai'
import { getGeminiKeys, GEMINI_MODEL } from './gemini'
import type { ChatAgent, ScopedChatOptions } from '@/types'

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

function languageRule(lang: 'bn' | 'en'): string {
  return lang === 'bn'
    ? 'Reply in Bengali (বাংলা). Use simple, warm, everyday Bengali a villager understands.'
    : 'Reply in English. Use simple, warm language.'
}

/** Safety rules shared by every assistant persona in the app. */
export const SAFETY_RULES = [
  'You are NOT a doctor. Never diagnose, never prescribe medicines or doses. For anything serious, tell the user to see a qualified doctor.',
  'For emergencies (chest pain, breathing trouble, heavy bleeding, unconsciousness): tell them to call 999 (national emergency) or 16263 (Shastho Batayon health line) IMMEDIATELY, before anything else.',
  'If the user mentions suicide or self-harm: respond with warmth and care, and share the Shuchona mental health helpline 16463 and Kaan Pete Roi. Never be dismissive.',
]

export function buildChatSystemPrompt(
  lang: 'bn' | 'en',
  profile?: { name?: string | null; district?: string | null } | null,
  reportLines?: string[]
): string {
  const langRule = languageRule(lang)

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
- ${SAFETY_RULES.join('\n- ')}
- Keep answers SHORT: under 180 words. Plain sentences and simple "-" bullet lists only. No tables, no headers, no code, no emojis.
- General health education, hygiene, nutrition, diabetes/BP lifestyle advice, explaining this app's features, and explaining the user's own reports listed above are all fine.
- If asked something unrelated to health or this app, politely steer back in one sentence.
- End answers about symptoms or reports with a one-line reminder to consult a doctor for confirmation.`
}

// ── Page-scoped prompt (ScriptGuard / GlycoVision / Lokhon composers) ───────

const AGENT_BRIEF: Record<ChatAgent, { name: string; domain: string; offTopic: string }> = {
  scriptguard: {
    name: 'ScriptGuard',
    domain:
      'prescriptions: the medicines written on them, what each medicine is generally for, how the schedule works, food/timing instructions, and the drug-interaction warnings the app found',
    offTopic: 'other health topics, food analysis, eye problems or symptom checks',
  },
  glycovision: {
    name: 'GlycoVision',
    domain:
      'the analysed meal: its food items, calories and macros, glycemic load, the diabetes/BP/heart risk flags the app raised, portion changes and healthier Bangladeshi alternatives',
    offTopic: 'medicines, eye problems, symptom checks or unrelated health topics',
  },
  lokhon: {
    name: 'Lokhon',
    domain:
      'this symptom questionnaire: what a question means, what the risk band and flagged symptoms indicate, which type of doctor to see and how urgently, and how to prepare for that visit',
    offTopic: 'medicines, food analysis, eye problems or unrelated health topics',
  },
}

/**
 * Prompt for an in-page assistant that only talks about one agent's domain and
 * the analysis currently on screen. `contextBlock` is the serialized analysis
 * (or a note that none exists yet); `historyLines` are prior results.
 */
export function buildScopedSystemPrompt(
  agent: ChatAgent,
  lang: 'bn' | 'en',
  contextBlock: string,
  options: ScopedChatOptions,
  historyLines: string[] = []
): string {
  const brief = AGENT_BRIEF[agent]
  const wordLimit = options.simple ? 120 : 180

  const styleRules: string[] = []
  if (options.simple) {
    styleRules.push(
      'SIMPLE MODE: the user may not read well. Use the plainest everyday words, very short sentences, and explain any medical or English term in brackets right after it. No more than 5 bullets.'
    )
  }
  if (options.doctorQuestions) {
    styleRules.push(
      'DOCTOR-QUESTIONS MODE: answer as a numbered list of 4 to 6 short questions the user should ask their doctor about this result, each on its own line, then ONE closing line saying how soon to go. Nothing else.'
    )
  }

  const historyBlock =
    historyLines.length > 0
      ? `\n\nThe user's previous ${brief.name} results (only mention when asked about earlier results or changes over time):\n${historyLines.join('\n')}`
      : ''

  const lokhonRules =
    agent === 'lokhon'
      ? [
          'Lokhon is a screening questionnaire, not a test result. Say "screening suggests", never "you have".',
          'If the context is the depression questionnaire, NEVER state a score or percentage; speak about feelings and support only.',
          'If the context says immediate support is required, begin the reply with warmth and the Shuchona helpline 16463 before anything else.',
        ]
      : []

  return `You are the ${brief.name} assistant inside ShasthyaHub-AI, a health app for rural Bangladesh. You live on the ${brief.name} page and help ONLY with ${brief.domain}.

${contextBlock}${historyBlock}

Strict rules:
- ${languageRule(lang)}
- ${SAFETY_RULES.join('\n- ')}
- Stay on topic. If the user asks about ${brief.offTopic}, reply with ONE sentence saying this box only covers ${brief.name}, and that Shasthya Bondhu on the Home page can help with the rest. Do not answer the off-topic question.
- Ground every answer in the context above. If something is not in the context, say the app did not detect it rather than guessing.
- Never tell the user to change, stop or start a medicine or a dose on their own; that is the doctor's decision.
- Keep answers under ${wordLimit} words. Plain sentences and simple "-" bullet lists only. No tables, no headers, no code, no emojis.
${lokhonRules.map((r) => `- ${r}`).join('\n')}${styleRules.map((r) => `\n- ${r}`).join('')}
- End with a one-line reminder to confirm with a qualified doctor.`
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
