import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzePrescription } from '@/lib/ai/orchestrator'
import { generateMedicationSchedule } from '@/lib/services/schedule'
import { validateImageFile, fileToBase64, createErrorResponse, ImageValidationError } from '@/lib/utils'
import { rateLimit } from '@/lib/rate-limit'
import { sanitizeResponsePayload } from '@/lib/api-utils'
import type { ApiError, ApiSuccess, MedicationSchedule } from '@/types'

export const maxDuration = 60

type ScriptGuardAnalyzeData = {
  id: string
  extracted_drugs: Awaited<ReturnType<typeof analyzePrescription>>['extracted_drugs']
  interaction_warnings: Awaited<ReturnType<typeof analyzePrescription>>['interaction_warnings']
  has_dangerous_interactions: boolean
  gemini_raw: Awaited<ReturnType<typeof analyzePrescription>>['gemini_raw']
  schedule: Pick<MedicationSchedule, 'morning' | 'afternoon' | 'evening' | 'night'>
  duration_days: number
  special_instructions_en: string[]
  special_instructions_bn: string[]
  audio_script_bn: string
}

type ScriptGuardAnalyzeResponse = ApiSuccess<ScriptGuardAnalyzeData> | ApiError

export async function POST(request: NextRequest): Promise<NextResponse<ScriptGuardAnalyzeResponse>> {
  let userId: string | undefined

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json<ApiError>(
        { success: false, error: 'You must be signed in to analyze a prescription.', error_bn: 'প্রেসক্রিপশন বিশ্লেষণ করতে লগইন করুন।', code: 'UNAUTHORIZED' },
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
      throw new ImageValidationError('No image was provided. Please upload a prescription photo. / কোনো ছবি পাওয়া যায়নি। একটি প্রেসক্রিপশনের ছবি আপলোড করুন।')
    }

    validateImageFile(file)
    const { base64, mimeType } = await fileToBase64(file)

    const result = await analyzePrescription(base64, mimeType, supabase)
    const schedule = await generateMedicationSchedule(result.extracted_drugs)

    const insertPayload = {
      user_id: userId,
      status: 'complete' as const,
      extracted_drugs: result.extracted_drugs,
      interaction_warnings: result.interaction_warnings,
      has_dangerous_interactions: result.has_dangerous_interactions,
      digital_schedule: {
        morning: schedule.morning,
        afternoon: schedule.afternoon,
        evening: schedule.evening,
        night: schedule.night,
        duration_days: schedule.duration_days,
        special_instructions_en: schedule.special_instructions_en,
      },
      digital_schedule_bn: {
        morning: schedule.morning,
        afternoon: schedule.afternoon,
        evening: schedule.evening,
        night: schedule.night,
        duration_days: schedule.duration_days,
        special_instructions_bn: schedule.special_instructions_bn,
        audio_script_bn: schedule.audio_script_bn,
      },
    }

    const { data: inserted, error: insertError } = await supabase
      .from('prescription_analyses')
      .insert(insertPayload)
      .select('id')
      .single()

    if (insertError || !inserted) {
      console.error('[scriptguard/analyze] insert failed:', insertError?.message)
    }

    const data: ScriptGuardAnalyzeData = {
      id: inserted?.id ?? crypto.randomUUID(),
      extracted_drugs: result.extracted_drugs,
      interaction_warnings: result.interaction_warnings,
      has_dangerous_interactions: result.has_dangerous_interactions,
      gemini_raw: result.gemini_raw,
      schedule: {
        morning: schedule.morning,
        afternoon: schedule.afternoon,
        evening: schedule.evening,
        night: schedule.night,
      },
      duration_days: schedule.duration_days,
      special_instructions_en: schedule.special_instructions_en,
      special_instructions_bn: schedule.special_instructions_bn,
      audio_script_bn: schedule.audio_script_bn,
    }

    const sanitized = sanitizeResponsePayload(data as unknown as Record<string, unknown>)

    return NextResponse.json<ApiSuccess<ScriptGuardAnalyzeData>>({ success: true, data: sanitized as unknown as ScriptGuardAnalyzeData })
  } catch (error) {
    console.error('[scriptguard/analyze] unhandled error:', error)

    try {
      if (userId) {
        const supabase = await createClient()
        await supabase.from('prescription_analyses').insert({
          user_id: userId,
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    } catch {
      console.error('[scriptguard/analyze] failed to persist error record')
    }

    return createErrorResponse(error, 'scriptguard/analyze')
  }
}
