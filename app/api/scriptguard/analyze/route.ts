import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzePrescription } from '@/lib/ai/orchestrator'
import { generateMedicationSchedule } from '@/lib/services/schedule'
import type { ApiError, ApiSuccess, MedicationSchedule } from '@/types'

// Vercel serverless function timeout. The OCR + mapping + interaction pipeline
// (Gemini + per-drug Groq + OpenFDA + final Groq) can run 20–40s under load.
export const maxDuration = 60

// --- Validation constants ---------------------------------------------------

const ALLOWED_MIME_TYPES: ReadonlySet<string> = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
])

const MAX_FILE_BYTES = 5 * 1024 * 1024 // 5 MB

// --- Response types ---------------------------------------------------------

type ScriptGuardAnalyzeData = {
  id: string
  extracted_drugs: Awaited<ReturnType<typeof analyzePrescription>>['extracted_drugs']
  interaction_warnings: Awaited<ReturnType<typeof analyzePrescription>>['interaction_warnings']
  has_dangerous_interactions: boolean
  gemini_raw: Awaited<ReturnType<typeof analyzePrescription>>['gemini_raw']
  // Flattened schedule fields (from generateMedicationSchedule).
  schedule: Pick<MedicationSchedule, 'morning' | 'afternoon' | 'evening' | 'night'>
  duration_days: number
  special_instructions_en: string[]
  special_instructions_bn: string[]
  // Bengali paragraph ready for window.speechSynthesis({ lang: 'bn-BD' }).
  audio_script_bn: string
}

type ScriptGuardAnalyzeResponse = ApiSuccess<ScriptGuardAnalyzeData> | ApiError

function errorResponse(
  status: number,
  error: string,
  errorBn: string,
  code: string
): NextResponse<ScriptGuardAnalyzeResponse> {
  return NextResponse.json<ApiError>(
    { success: false, error, error_bn: errorBn, code },
    { status }
  )
}

// --- Handler ----------------------------------------------------------------

/**
 * POST /api/scriptguard/analyze
 *
 * Accepts a multipart `image` (the prescription photo), runs the OCR →
 * brand/generic mapping → interaction-screening pipeline, persists the result
 * to `prescription_analyses`, and returns it to the client.
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ScriptGuardAnalyzeResponse>> {
  let userId: string | undefined

  try {
    // (a) Auth — 401 if no session.
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return errorResponse(
        401,
        'You must be signed in to analyze a prescription.',
        'প্রেসক্রিপশন বিশ্লেষণ করতে লগইন করুন।',
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
        'No image was provided. Please upload a prescription photo.',
        'কোনো ছবি পাওয়া যায়নি। একটি প্রেসক্রিপশনের ছবি আপলোড করুন।',
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

    // (d) File → Buffer → base64. The image is NOT persisted to storage —
    //     prescriptions are highly sensitive; we keep only the derived data.
    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')

    // (e) Run the OCR + mapping + interaction pipeline.
    const result = await analyzePrescription(base64, file.type, supabase)

    // (f) Generate the daily schedule + Bengali audio script. This has its own
    //     internal fallback (local deterministic parser) so it never breaks the
    //     request even if Groq is down.
    const schedule = await generateMedicationSchedule(result.extracted_drugs)

    // (g) Insert the completed record into prescription_analyses. The two
    //     JSONB schedule columns are split by language:
    //       - digital_schedule    : English-instruction projection
    //       - digital_schedule_bn : Bengali-instruction projection + audio script
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
      // Non-fatal: the analysis succeeded, only persistence failed.
    }

    // (h) Return the result.
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

    return NextResponse.json<ApiSuccess<ScriptGuardAnalyzeData>>({
      success: true,
      data,
    })
  } catch (error) {
    console.error('[scriptguard/analyze] unhandled error:', error)

    // (h) Record the failure if we have a user.
    try {
      if (userId) {
        const supabase = await createClient()
        await supabase.from('prescription_analyses').insert({
          user_id: userId,
          status: 'failed',
          error_message:
            error instanceof Error ? error.message : 'Unknown error',
        })
      }
    } catch {
      console.error('[scriptguard/analyze] failed to persist error record')
    }

    const message = error instanceof Error ? error.message : 'Unknown error'
    return errorResponse(
      500,
      `We could not analyze the prescription. ${message}`,
      'দুঃখিত, প্রেসক্রিপশন বিশ্লেষণ করা যায়নি। আবার চেষ্টা করুন।',
      'ANALYSIS_FAILED'
    )
  }
}
