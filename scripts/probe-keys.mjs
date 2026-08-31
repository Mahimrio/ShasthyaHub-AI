// Temp probe: validates Gemini key pool + OpenRouter key. Prints statuses only.
import { readFileSync } from 'node:fs'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
)

const geminiKeys = (env.GEMINI_API_KEYS || env.GEMINI_API_KEY || '').split(',').map((k) => k.trim()).filter(Boolean)

for (let i = 0; i < geminiKeys.length; i++) {
  try {
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiKeys[i] },
      body: JSON.stringify({ contents: [{ parts: [{ text: 'Reply with the single word: ok' }] }] }),
    })
    const body = await r.json().catch(() => ({}))
    const reply = body?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
    console.log(`Gemini key #${i + 1}: HTTP ${r.status}${reply ? ` reply="${reply.slice(0, 20)}"` : ` err=${JSON.stringify(body?.error?.message || '').slice(0, 120)}`}`)
  } catch (e) {
    console.log(`Gemini key #${i + 1}: FETCH ERROR ${e.message}`)
  }
}

if (env.OPENROUTER_API_KEY) {
  try {
    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.3-70b-instruct:free',
        messages: [{ role: 'user', content: 'Reply with the single word: ok' }],
        max_tokens: 10,
      }),
    })
    const body = await r.json().catch(() => ({}))
    const reply = body?.choices?.[0]?.message?.content?.trim()
    console.log(`OpenRouter: HTTP ${r.status}${reply ? ` reply="${reply.slice(0, 20)}"` : ` err=${JSON.stringify(body?.error?.message || '').slice(0, 160)}`}`)
  } catch (e) {
    console.log(`OpenRouter: FETCH ERROR ${e.message}`)
  }
} else {
  console.log('OpenRouter: no key set')
}
