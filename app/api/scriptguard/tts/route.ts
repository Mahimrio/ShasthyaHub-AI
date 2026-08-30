import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import type { ApiError, ApiSuccess } from '@/types'

export const maxDuration = 60

/**
 * POST /api/scriptguard/tts — Bengali speech synthesis fallback.
 *
 * Most desktop browsers ship no Bengali Web Speech voice, so the AudioGuide
 * calls this route to synthesize the schedule narration server-side with
 * Gemini TTS. Public (the judge-facing demo uses it) but IP rate-limited and
 * length-capped to protect the API key.
 */

const TTS_MODEL = 'gemini-2.5-flash-preview-tts'
const MAX_TEXT_LENGTH = 1600

type TtsData = { wavBase64: string; sampleRate: number }
type TtsResponse = ApiSuccess<TtsData> | ApiError

// Same narration is replayed often — cache a few synthesized scripts per instance.
const audioCache = new Map<string, TtsData>()
const CACHE_MAX = 12

function cacheKey(text: string): string {
  let hash = 5381
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) + hash + text.charCodeAt(i)) | 0
  }
  return `${text.length}:${hash}`
}

/** Wrap raw 16-bit mono PCM in a WAV container. */
function pcmToWav(pcm: Buffer, sampleRate: number): Buffer {
  const header = Buffer.alloc(44)
  header.write('RIFF', 0)
  header.writeUInt32LE(36 + pcm.length, 4)
  header.write('WAVE', 8)
  header.write('fmt ', 12)
  header.writeUInt32LE(16, 16)
  header.writeUInt16LE(1, 20) // PCM
  header.writeUInt16LE(1, 22) // mono
  header.writeUInt32LE(sampleRate, 24)
  header.writeUInt32LE(sampleRate * 2, 28)
  header.writeUInt16LE(2, 32)
  header.writeUInt16LE(16, 34)
  header.write('data', 36)
  header.writeUInt32LE(pcm.length, 40)
  return Buffer.concat([header, pcm])
}

export async function POST(request: NextRequest): Promise<NextResponse<TtsResponse>> {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'anonymous'
    if (!rateLimit(`tts:${ip}`, { windowMs: 60_000, maxRequests: 6 })) {
      return NextResponse.json<ApiError>(
        {
          success: false,
          error: 'Too many audio requests. Please wait a minute.',
          error_bn: 'অনেক বেশি অডিও অনুরোধ। এক মিনিট অপেক্ষা করুন।',
          code: 'RATE_LIMITED',
        },
        { status: 429 }
      )
    }

    const body = (await request.json().catch(() => null)) as { text?: unknown } | null
    const text = typeof body?.text === 'string' ? body.text.trim() : ''
    if (!text || text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json<ApiError>(
        {
          success: false,
          error: `Text is required and must be under ${MAX_TEXT_LENGTH} characters.`,
          error_bn: 'টেক্সট প্রয়োজন এবং খুব দীর্ঘ হওয়া যাবে না।',
          code: 'INVALID_INPUT',
        },
        { status: 400 }
      )
    }

    const key = cacheKey(text)
    const cached = audioCache.get(key)
    if (cached) {
      return NextResponse.json<ApiSuccess<TtsData>>({ success: true, data: cached })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json<ApiError>(
        {
          success: false,
          error: 'Speech service is not configured.',
          error_bn: 'স্পিচ সার্ভিস কনফিগার করা নেই।',
          code: 'SERVICE_UNAVAILABLE',
        },
        { status: 503 }
      )
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${TTS_MODEL}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text }] }],
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
            },
          },
        }),
      }
    )

    if (!res.ok) {
      const errText = (await res.text()).slice(0, 300)
      console.error('[tts] Gemini TTS failed:', res.status, errText)
      return NextResponse.json<ApiError>(
        {
          success: false,
          error: 'Could not generate audio right now. Please try again later.',
          error_bn: 'এই মুহূর্তে অডিও তৈরি করা যায়নি। পরে আবার চেষ্টা করুন।',
          code: 'TTS_FAILED',
        },
        { status: 502 }
      )
    }

    const json = (await res.json()) as {
      candidates?: { content?: { parts?: { inlineData?: { mimeType?: string; data?: string } }[] } }[]
    }
    const inline = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data)?.inlineData
    if (!inline?.data) {
      console.error('[tts] Gemini TTS returned no audio part')
      return NextResponse.json<ApiError>(
        {
          success: false,
          error: 'Speech service returned no audio.',
          error_bn: 'স্পিচ সার্ভিস কোনো অডিও দেয়নি।',
          code: 'TTS_EMPTY',
        },
        { status: 502 }
      )
    }

    const rateMatch = /rate=(\d+)/.exec(inline.mimeType ?? '')
    const sampleRate = rateMatch ? parseInt(rateMatch[1]!, 10) : 24_000
    const wav = pcmToWav(Buffer.from(inline.data, 'base64'), sampleRate)
    const data: TtsData = { wavBase64: wav.toString('base64'), sampleRate }

    if (audioCache.size >= CACHE_MAX) {
      const oldest = audioCache.keys().next().value
      if (oldest) audioCache.delete(oldest)
    }
    audioCache.set(key, data)

    return NextResponse.json<ApiSuccess<TtsData>>({ success: true, data })
  } catch (err) {
    console.error('[tts] Unexpected error:', err)
    return NextResponse.json<ApiError>(
      {
        success: false,
        error: 'Audio generation failed unexpectedly.',
        error_bn: 'অডিও তৈরি ব্যর্থ হয়েছে।',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    )
  }
}
