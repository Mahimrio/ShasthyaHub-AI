import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzeFood } from '@/lib/ai/orchestrator'
import { validateImageFile, fileToBase64, createErrorResponse, ImageValidationError } from '@/lib/utils'
import { rateLimit } from '@/lib/rate-limit'
import type { ApiError, ApiSuccess, FoodAnalysis } from '@/types'

export const maxDuration = 60

const STORAGE_BUCKET = 'food-images'

type GlycoVisionAnalyzeData = {
  id: string
  identified_items: Awaited<ReturnType<typeof analyzeFood>>['identified_items']
  total_calories: number
  total_carbs_g: number
  total_protein_g: number
  total_fat_g: number
  glycemic_load: number
  risk_level: Awaited<ReturnType<typeof analyzeFood>>['risk_level']
  risk_summary_en: string
  risk_summary_bn: string
  glucose_impact: Awaited<ReturnType<typeof analyzeFood>>['glucose_impact']
  chronic_disease_risks: Awaited<ReturnType<typeof analyzeFood>>['chronic_disease_risks']
  meal_modifications: Awaited<ReturnType<typeof analyzeFood>>['meal_modifications']
}

type GlycoVisionResponse = ApiSuccess<GlycoVisionAnalyzeData> | ApiError

export async function POST(request: NextRequest): Promise<NextResponse<GlycoVisionResponse>> {
  let userId: string | undefined

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json<ApiError>(
        { success: false, error: 'You must be signed in to analyze a food image.', error_bn: 'খাবারের ছবি বিশ্লেষণ করতে লগইন করুন।', code: 'UNAUTHORIZED' },
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
      throw new ImageValidationError('No image was provided. Please upload a food photo. / কোনো ছবি পাওয়া যায়নি। একটি খাবারের ছবি আপলোড করুন।')
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
      console.error('[glycovision/analyze] storage upload failed:', uploadError.message)
    }

    const result = await analyzeFood(base64, mimeType, supabase)

    const insertPayload = {
      user_id: userId,
      status: 'complete' as const,
      identified_items: result.identified_items,
      total_calories: result.total_calories,
      total_carbs_g: result.total_carbs_g,
      total_protein_g: result.total_protein_g,
      total_fat_g: result.total_fat_g,
      glycemic_load: result.glycemic_load,
      risk_level: result.risk_level,
      risk_summary_en: result.risk_summary_en,
      risk_summary_bn: result.risk_summary_bn,
      chronic_disease_risks: result.chronic_disease_risks,
      meal_modifications: result.meal_modifications,
    }

    const { data: inserted, error: insertError } = await supabase
      .from('food_analyses')
      .insert(insertPayload)
      .select('id')
      .single()

    if (insertError || !inserted) {
      console.error('[glycovision/analyze] insert failed:', insertError?.message)
    }

    if (!uploadError) {
      const { error: deleteError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([storagePath])
      if (deleteError) {
        console.error('[glycovision/analyze] storage delete failed:', deleteError.message)
      }
    }

    const data: GlycoVisionAnalyzeData = {
      id: inserted?.id ?? crypto.randomUUID(),
      identified_items: result.identified_items,
      total_calories: result.total_calories,
      total_carbs_g: result.total_carbs_g,
      total_protein_g: result.total_protein_g,
      total_fat_g: result.total_fat_g,
      glycemic_load: result.glycemic_load,
      risk_level: result.risk_level,
      risk_summary_en: result.risk_summary_en,
      risk_summary_bn: result.risk_summary_bn,
      glucose_impact: result.glucose_impact,
      chronic_disease_risks: result.chronic_disease_risks,
      meal_modifications: result.meal_modifications,
    }

    return NextResponse.json<ApiSuccess<GlycoVisionAnalyzeData>>({ success: true, data })
  } catch (error) {
    console.error('[glycovision/analyze] unhandled error:', error)

    try {
      if (userId) {
        const supabase = await createClient()
        await supabase.from('food_analyses').insert({
          user_id: userId,
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    } catch {
      console.error('[glycovision/analyze] failed to persist error record')
    }

    return createErrorResponse(error, 'glycovision/analyze')
  }
}

export type { FoodAnalysis }
