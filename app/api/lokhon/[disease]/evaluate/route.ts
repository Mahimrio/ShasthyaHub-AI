import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateRisk } from '@/lib/services/lokhon-scoring'
import { generateAdvice } from '@/lib/services/lokhon-advice'
import { createErrorResponse } from '@/lib/utils'
import { FALLBACK_DISEASES, FALLBACK_QUESTIONS } from '@/lib/services/lokhon-data'
import type { ApiSuccess, ApiError, LokhonAnswer, LokhonQuestion, LokhonDisease } from '@/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const DISCLAIMER =
  'This tool does not replace professional diagnosis. Please consult a doctor for proper evaluation. / এই টুল পেশাদার রোগ নির্ণয়ের বিকল্প নয়। সঠিক মূল্যায়নের জন্য একজন ডাক্তারের পরামর্শ নিন।'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ disease: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      // Anonymous users get a result but no DB persistence
    }

    const { disease } = await params

    // Parse body
    const body = await request.json().catch(() => null)
    if (!body || !Array.isArray(body.answers)) {
      return NextResponse.json<ApiError>(
        { success: false, error: 'Invalid request body. Expected { answers: [...] }', code: 'INVALID_BODY' },
        { status: 400 }
      )
    }

    const answers = body.answers as LokhonAnswer[]

    // Validate values
    for (const a of answers) {
      if (typeof a.value !== 'number' || a.value < 1 || a.value > 5) {
        return NextResponse.json<ApiError>(
          { success: false, error: `Invalid answer value for ${a.questionId}. Must be 1-5.`, code: 'INVALID_VALUE' },
          { status: 400 }
        )
      }
    }

    // Fetch questions for this disease (DB with fallback)
    let questions: LokhonQuestion[] | null = null
    let questionsErr: unknown = null
    try {
      const result = await supabase
        .from('lokhon_questions')
        .select('*')
        .eq('disease_slug', disease)
        .order('order_index')
      questions = result.data
      questionsErr = result.error
    } catch {
      questionsErr = new Error('DB unavailable')
    }

    if (questionsErr || !questions || questions.length === 0) {
      const fallback = FALLBACK_QUESTIONS.filter((q) => q.disease_slug === disease)
      if (fallback.length === 0) {
        return NextResponse.json<ApiError>(
          { success: false, error: `Unknown disease: ${disease}`, code: 'DISEASE_NOT_FOUND' },
          { status: 404 }
        )
      }
      questions = fallback
    }

    // Validate all questions answered
    const questionIds = new Set(questions.map((q: LokhonQuestion) => q.id))
    const answeredIds = new Set(answers.map((a) => a.questionId))
    const missing = [...questionIds].filter((id) => !answeredIds.has(id))
    if (missing.length > 0) {
      return NextResponse.json<ApiError>(
        { success: false, error: `Missing answers for: ${missing.join(', ')}`, code: 'MISSING_ANSWERS' },
        { status: 400 }
      )
    }

    // Fetch disease info (DB with fallback)
    let diseaseInfo: LokhonDisease | null = null
    try {
      const result = await supabase
        .from('lokhon_diseases')
        .select('*')
        .eq('slug', disease)
        .single()
      diseaseInfo = result.data
    } catch {
      diseaseInfo = null
    }
    if (!diseaseInfo) {
      diseaseInfo = FALLBACK_DISEASES.find((d) => d.slug === disease) ?? null
    }

    // Score
    const scoringOutput = calculateRisk({ questions: questions as LokhonQuestion[], answers })

    // Generate advice (Groq with fallback)
    const advice = await generateAdvice(
      disease,
      (diseaseInfo as LokhonDisease | null)?.name_en ?? disease,
      (diseaseInfo as LokhonDisease | null)?.name_bn ?? disease,
      scoringOutput.riskBand,
      scoringOutput.topSymptoms
    )

    // Persist for logged-in users (best-effort)
    let analysisId = `anon-${crypto.randomUUID()}`
    if (user) {
      try {
        const { data: inserted, error: insErr } = await supabase
          .from('lokhon_analyses')
          .insert({
            user_id: user.id,
            disease_slug: disease,
            answers: Object.fromEntries(answers.map((a) => [a.questionId, a.value])),
            risk_percentage: scoringOutput.riskPercentage,
            risk_band: scoringOutput.riskBand,
            is_red_flag: scoringOutput.isRedFlag,
            advice,
            doctor_type: advice,
          })
          .select('id')
          .single()

        if (!insErr && inserted) {
          analysisId = inserted.id
        }
      } catch {
        // DB unavailable — proceed with anon ID
      }
    }

    return NextResponse.json<ApiSuccess<{
      id: string
      riskPercentage: number
      riskBand: string
      isRedFlag: boolean
      advice: typeof advice
      topSymptoms: typeof scoringOutput.topSymptoms
      disclaimer: string
      diseaseSlug: string
      diseaseNameEn: string
      diseaseNameBn: string
      requiresImmediateSupport?: boolean
      crisisResources?: { helpline: string; messageEn: string; messageBn: string }
    }>>({
      success: true,
      data: {
        id: analysisId,
        riskPercentage: disease === 'depression' ? 0 : scoringOutput.riskPercentage,
        riskBand: scoringOutput.riskBand,
        isRedFlag: scoringOutput.isRedFlag,
        advice,
        topSymptoms: scoringOutput.topSymptoms,
        disclaimer: disease === 'depression'
          ? 'This is not a diagnostic tool. Please speak with a mental health professional for proper evaluation. / এটি একটি রোগ নির্ণয়ের টুল নয়। সঠিক মূল্যায়নের জন্য একজন মানসিক স্বাস্থ্য পেশাদারের সাথে কথা বলুন।'
          : DISCLAIMER,
        diseaseSlug: disease,
        diseaseNameEn: (diseaseInfo as LokhonDisease | null)?.name_en ?? disease,
        diseaseNameBn: (diseaseInfo as LokhonDisease | null)?.name_bn ?? disease,
        requiresImmediateSupport: scoringOutput.requiresImmediateSupport,
        ...(scoringOutput.requiresImmediateSupport
          ? {
              crisisResources: {
                helpline: '16463',
                messageEn: 'Your responses suggest you may need immediate support. Please call the national crisis helpline (Shuchona Foundation: 16463) or go to the nearest hospital. You are not alone.',
                messageBn: 'আপনার উত্তর ইঙ্গিত দেয় যে আপনার অবিলম্বে সাহায্যের প্রয়োজন হতে পারে। অনুগ্রহ করে জাতীয় ক্রাইসিস হেল্পলাইনে (সুচোনা ফাউন্ডেশন: ১৬৪৬৩) কল করুন বা নিকটস্থ হাসপাতালে যান। আপনি একা নন।',
              },
            }
          : {}),
      },
    })
  } catch (error) {
    return createErrorResponse(error, 'lokhon/evaluate')
  }
}
