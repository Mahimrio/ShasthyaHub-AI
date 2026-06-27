import { NextResponse } from 'next/server'
import type { ApiError, ApiSuccess } from '@/types'

/**
 * SUPABASE_SERVICE_ROLE_KEY must NEVER be prefixed with NEXT_PUBLIC_.
 * It is a server-only secret that grants admin access to your Supabase project.
 * Only use it in server-side code (API routes, server actions, middleware).
 * Client-side code must use NEXT_PUBLIC_SUPABASE_ANON_KEY (the anon/public key).
 */

export function sanitizeResponsePayload<T extends Record<string, unknown>>(
  payload: T
): T {
  if (process.env.NODE_ENV === 'production') {
    const sensitiveKeys = [
      'password',
      'password_hash',
      'supabase_access_token',
      'supabase_refresh_token',
      'session_token',
      'gemini_raw',
      'gemini_raw_output',
      'groq_processed_output',
    ]
    const sanitized = { ...payload }
    for (const key of sensitiveKeys) {
      if (key in sanitized) {
        delete sanitized[key]
      }
    }
    return sanitized
  }
  return payload
}

export function sendSuccess<T>(data: T): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ success: true, data })
}

export function sendError(
  message: string,
  messageBn: string,
  code: string,
  status: number
): NextResponse<ApiError> {
  return NextResponse.json(
    { success: false, error: message, error_bn: messageBn, code },
    { status }
  )
}
