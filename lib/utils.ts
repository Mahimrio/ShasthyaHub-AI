import { Buffer } from 'node:buffer'
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { NextResponse } from 'next/server'
import type { ApiError } from '@/types'

// ── Tailwind class merger ──────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ── Date / time formatters ─────────────────────────────────────────────────

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-BD', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString('en-BD', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ── Custom error classes ───────────────────────────────────────────────────

export class GeminiError extends Error {
  statusCode: number

  constructor(message: string, statusCode: number) {
    super(message)
    this.name = 'GeminiError'
    this.statusCode = statusCode
  }
}

export class GroqError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GroqError'
  }
}

export class JsonExtractionError extends Error {
  rawText: string

  constructor(text: string) {
    super('JSON extraction failed: no valid JSON object found in response.')
    this.name = 'JsonExtractionError'
    this.rawText = text
  }
}

export class ImageValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ImageValidationError'
  }
}

// ── Image validation ───────────────────────────────────────────────────────

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_FILE_BYTES = 5 * 1024 * 1024

export function validateImageFile(file: File): void {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new ImageValidationError(
      'Unsupported file type. Please use JPG, PNG, or WebP. / এই ধরনের ফাইল সমর্থিত নয়। JPG, PNG বা WebP ব্যবহার করুন।'
    )
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new ImageValidationError(
      'Image is too large. Maximum size is 5 MB. / ছবিটি অনেক বড়। সর্বোচ্চ আকার ৫ এমবি।'
    )
  }
  if (file.size === 0) {
    throw new ImageValidationError(
      'The uploaded image is empty. Please choose a different file. / আপলোড করা ছবিটি খালি। অনুগ্রহ করে ভিন্ন ফাইল নির্বাচন করুন।'
    )
  }
}

// ── File → base64 ──────────────────────────────────────────────────────────

export async function fileToBase64(
  file: File
): Promise<{ base64: string; mimeType: string }> {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  return { base64: buffer.toString('base64'), mimeType: file.type }
}

// ── Unified API error response ─────────────────────────────────────────────

export function createErrorResponse(
  error: unknown,
  feature: string
): NextResponse<ApiError> {
  const timestamp = new Date().toISOString()

  if (error instanceof ImageValidationError) {
    return NextResponse.json<ApiError>(
      {
        success: false,
        error: error.message,
        error_bn: error.message.includes('/')
          ? error.message.split('/')[1].trim()
          : 'অনুগ্রহ করে সঠিক ছবি আপলোড করুন।',
        code: 'IMAGE_VALIDATION_ERROR',
      },
      { status: 400 }
    )
  }

  if (error instanceof GeminiError && error.statusCode === 429) {
    console.error(`[${feature}] Gemini rate limited:`, error.message, timestamp)
    return NextResponse.json<ApiError>(
      {
        success: false,
        error: 'AI service is currently busy. Please try again in a moment.',
        error_bn: 'AI সেবাটি এই মুহূর্তে ব্যস্ত রয়েছে। একটু পর আবার চেষ্টা করুন।',
        code: 'RATE_LIMITED',
      },
      { status: 429 }
    )
  }

  if (error instanceof GeminiError) {
    console.error(`[${feature}] Gemini error:`, {
      message: error.message,
      statusCode: error.statusCode,
      timestamp,
    })
    return NextResponse.json<ApiError>(
      {
        success: false,
        error: 'The AI analysis engine encountered an error. Please try again.',
        error_bn: 'AI বিশ্লেষণ ইঞ্জিন একটি ত্রুটির সম্মুখীন হয়েছে। আবার চেষ্টা করুন।',
        code: 'AI_SERVICE_ERROR',
      },
      { status: 502 }
    )
  }

  if (error instanceof GroqError) {
    // Groq errors are already handled by the fallback in groq.ts;
    // if it reaches here, the Groq call AND the Gemini fallback both failed.
    console.error(`[${feature}] Both Groq and Gemini fallback failed:`, {
      message: error.message,
      timestamp,
    })
    return NextResponse.json<ApiError>(
      {
        success: false,
        error: 'Analysis service is currently unavailable. Please try again later.',
        error_bn: 'বিশ্লেষণ সেবাটি বর্তমানে অনুপলব্ধ। দয়া করে পরে আবার চেষ্টা করুন।',
        code: 'AI_SERVICE_UNAVAILABLE',
      },
      { status: 503 }
    )
  }

  return NextResponse.json<ApiError>(
    {
      success: false,
      error: 'Analysis failed. Please try again.',
      error_bn: 'বিশ্লেষণ ব্যর্থ হয়েছে। আবার চেষ্টা করুন।',
      code: 'ANALYSIS_FAILED',
    },
    { status: 500 }
  )
}
