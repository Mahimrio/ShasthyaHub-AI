import { Buffer } from 'node:buffer'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzeEyeImage } from '@/lib/ai/orchestrator'
import { validateImageFile, fileToBase64, createErrorResponse, ImageValidationError } from '@/lib/utils'
import { rateLimit } from '@/lib/rate-limit'
import type { ApiError, ApiSuccess, EyeAnalysis, Severity } from '@/types'

export const maxDuration = 60

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

export async function POST(request: NextRequest): Promise<NextResponse<NayanAnalyzeResponse>> {
  let userId: string | undefined

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json<ApiError>(
        { success: false, error: 'You must be signed in to analyze an image.', error_bn: 'ছবি বিশ্লেষণ করতে লগইন করুন।', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }
    userId = user.id

    if (!rateLimit(userId)) {
      return NextResponse.json<ApiError>(
        {
          success: false,
          error: 'Too many requests. Please wait a minute.',
          error_bn: 'অনেক বেশি অনুরোধ। এক মিনিট অপেক্ষা করুন।',
          code: 'RATE_LIMITED',
        },
        { status: 429 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('image')
    if (!(file instanceof File)) {
      throw new ImageValidationError('No image was provided. Please upload an eye photo. / কোনো ছবি পাওয়া যায়নি। একটি চোখের ছবি আপলোড করুন।')
    }

    validateImageFile(file)
    const { base64, mimeType } = await fileToBase64(file)

    const extension = mimeType.split('/')[1]
    const ext = extension === 'jpeg' ? 'jpg' : extension
    const storagePath = `${userId}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, Buffer.from(base64, 'base64'), { contentType: mimeType, upsert: false })

    if (uploadError) {
      console.error('[nayan/analyze] storage upload failed:', uploadError.message)
    }

    const result = await analyzeEyeImage(base64, mimeType)

    const insertPayload = {
      user_id: userId,
      status: 'complete' as const,
      diagnosis: result.diagnosis,
      confidence_score: Math.round(result.confidence * 100),
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
      if (!uploadError) {
        await supabase.storage.from(STORAGE_BUCKET).remove([storagePath])
      }
      throw new Error(insertError?.message ?? 'Failed to save analysis result.')
    }

    if (!uploadError) {
      await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]).catch(() => {})
    }

    const data: NayanAnalyzeData = {
      id: inserted.id,
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

    return createErrorResponse(error, 'nayan/analyze')
  }
}

export type { EyeAnalysis }
