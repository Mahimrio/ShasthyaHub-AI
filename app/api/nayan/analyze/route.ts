import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzeEyeImage } from '@/lib/ai/orchestrator'
import type { ApiError, ApiSuccess, EyeAnalysis, Severity } from '@/types'

// Vercel serverless function timeout. The two-agent pipeline (vision + LLM)
// can take ~20–40s under load; 60s is the max on Vercel Hobby/Pro.
export const maxDuration = 60

// --- Validation constants ---------------------------------------------------

const ALLOWED_MIME_TYPES: ReadonlySet<string> = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
])

const MAX_FILE_BYTES = 5 * 1024 * 1024 // 5 MB — matches storage-setup.sql bucket limit

const STORAGE_BUCKET = 'eye-images'

type NayanAnalyzeData = {
  id: string
  diagnosis: string
  severity: Severity | null
  recommendation_en: string
  recommendation_bn: string
  urgency_days: number
  next_steps: string[]
  specialist_needed: string
  confidence_score: number
}

type NayanAnalyzeResponse = ApiSuccess<NayanAnalyzeData> | ApiError

function errorResponse(
  status: number,
  error: string,
  errorBn: string,
  code: string
): NextResponse<NayanAnalyzeResponse> {
  return NextResponse.json<ApiError>(
    { success: false, error, error_bn: errorBn, code },
    { status }
  )
}

// --- Handler ----------------------------------------------------------------

export async function POST(request: NextRequest): Promise<NextResponse<NayanAnalyzeResponse>> {
  // (a) Auth — get the authenticated user. 401 if no session.
  let userId: string | undefined
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return errorResponse(
        401,
        'You must be signed in to analyze an image.',
        'ছবি বিশ্লেষণ করতে লগইন করুন।',
        'UNAUTHORIZED'
      )
    }
    userId = user.id

    // (b) Parse multipart form data, extract the 'image' File.
    const formData = await request.formData()
    const file = formData.get('image')

    if (!(file instanceof File)) {
      return errorResponse(
        400,
        'No image was provided. Please upload an eye photo.',
        'কোনো ছবি পাওয়া যায়নি। একটি চোখের ছবি আপলোড করুন।',
        'NO_IMAGE'
      )
    }

    // (c) Validate mime type + size.
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return errorResponse(
        400,
        'Unsupported file type. Please use JPG, PNG, or WebP.',
        'এই ধরনের ফাইল সমর্থিত নয়। JPG, PNG বা WebP ব্যবহার করুন।',
        'INVALID_TYPE'
      )
    }

    if (file.size > MAX_FILE_BYTES) {
      return errorResponse(
        413,
        'Image is too large. Maximum size is 5 MB.',
        'ছবিটি অনেক বড়। সর্বোচ্চ আকার ৫ এমবি।',
        'FILE_TOO_LARGE'
      )
    }

    // (d) File → Buffer → base64.
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64 = buffer.toString('base64')

    // (e) Upload to Supabase Storage for the audit trail.
    //     Path: eye-images/{userId}/{timestamp}.jpg  (folder-scoped by RLS)
    const extension = file.type.split('/')[1] // jpeg → jpg
    const ext = extension === 'jpeg' ? 'jpg' : extension
    const storagePath = `${userId}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, buffer, { contentType: file.type, upsert: false })

    if (uploadError) {
      console.error('[nayan/analyze] storage upload failed:', uploadError.message)
      // Non-fatal: we can still run analysis on the base64 in memory.
    }

    // (f) Run the two-agent pipeline.
    const result = await analyzeEyeImage(base64, file.type)

    // (g) Insert the completed record into eye_analyses.
    const insertPayload = {
      user_id: userId,
      status: 'complete' as const,
      diagnosis: result.diagnosis,
      confidence_score: Math.round(result.confidence * 100), // store as 0–100
      severity: result.severity,
      recommendation_en: result.recommendation_en,
      recommendation_bn: result.recommendation_bn,
      urgency_days: result.urgency_days,
      specialist_needed: result.specialist_needed,
      gemini_raw_output: result.gemini_raw_output,
      groq_processed_output: {
        diagnosis: result.diagnosis,
        severity: result.severity,
        recommendation_en: result.recommendation_en,
        recommendation_bn: result.recommendation_bn,
        urgency_days: result.urgency_days,
        next_steps: result.next_steps,
        specialist_needed: result.specialist_needed,
        used_fallback: result.used_fallback,
      },
    }

    const { data: inserted, error: insertError } = await supabase
      .from('eye_analyses')
      .insert(insertPayload)
      .select('id')
      .single()

    if (insertError || !inserted) {
      console.error('[nayan/analyze] insert failed:', insertError?.message)
      // Don't fail the whole request — the analysis succeeded, just persistence failed.
    }

    // (h) Delete the uploaded image from storage (privacy — keep nothing on disk).
    if (!uploadError) {
      const { error: deleteError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([storagePath])
      if (deleteError) {
        console.error('[nayan/analyze] storage delete failed:', deleteError.message)
      }
    }

    // (i) Return the result.
    const data: NayanAnalyzeData = {
      id: inserted?.id ?? crypto.randomUUID(),
      diagnosis: result.diagnosis,
      severity: result.severity,
      recommendation_en: result.recommendation_en,
      recommendation_bn: result.recommendation_bn,
      urgency_days: result.urgency_days,
      next_steps: result.next_steps,
      specialist_needed: result.specialist_needed,
      confidence_score: Math.round(result.confidence * 100),
    }

    return NextResponse.json<ApiSuccess<NayanAnalyzeData>>({ success: true, data })
  } catch (error) {
    console.error('[nayan/analyze] unhandled error:', error)

    // (j) Record the failure if we have a user.
    try {
      if (userId) {
        const supabase = await createClient()
        await supabase.from('eye_analyses').insert({
          user_id: userId,
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    } catch {
      console.error('[nayan/analyze] failed to persist error record')
    }

    const message = error instanceof Error ? error.message : 'Unknown error'
    return errorResponse(
      500,
      `We could not analyze the image. ${message}`,
      'দুঃখিত, ছবি বিশ্লেষণ করা যায়নি। আবার চেষ্টা করুন।',
      'ANALYSIS_FAILED'
    )
  }
}

// Reference the type so it's kept in sync with the DB shape (schema.sql).
export type { EyeAnalysis }
