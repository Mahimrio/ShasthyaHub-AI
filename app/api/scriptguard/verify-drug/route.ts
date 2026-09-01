import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { drugMapping } from '@/lib/services/drug-mapping'
import { checkDrugInteractions } from '@/lib/services/drug-interaction'
import { inferDrugIndication, inferPillAvatar } from '@/lib/services/medication-reminder'
import { callGroq } from '@/lib/ai/groq'
import type { BdDrug, DrugInteraction, MappingConfidence, PillShapeType } from '@/types'

export interface VerifiedDrugPayload {
  written_query: string
  matched_brand_en: string
  matched_brand_bn: string
  generic_name: string
  drug_class: string
  suggested_dosage: string
  indication_en: string
  indication_bn: string
  pill_shape: PillShapeType
  pill_color: string
  pill_color_secondary?: string
  descriptor_bn: string
  confidence: MappingConfidence
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { query, current_generics = [] } = body

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'Query is required' }, { status: 400 })
    }

    const cleanQuery = query.trim()
    const lowerQuery = cleanQuery.toLowerCase()

    let matchedBrandEn = cleanQuery
    let matchedBrandBn = cleanQuery
    let genericName = ''
    let drugClass = 'General Prescription'
    const suggestedDosage = '1 unit'
    let confidence: MappingConfidence = 'low'

    // ── Tier 1: Check Supabase bd_drugs ───────────────────────
    try {
      const supabase = await createServerSupabaseClient()
      const { data: dbMatches } = await supabase
        .from('bd_drugs')
        .select('*')
        .or(`brand_name.ilike.%${cleanQuery}%,generic_name.ilike.%${cleanQuery}%`)
        .limit(1)

      if (dbMatches && dbMatches.length > 0) {
        const match = dbMatches[0] as BdDrug
        matchedBrandEn = match.brand_name
        matchedBrandBn = match.brand_name
        genericName = match.generic_name
        drugClass = match.drug_class || 'Therapeutic Agent'
        confidence = 'high'
      }
    } catch {
      // Supabase search fallback
    }

    // ── Tier 2: Check Static Mapping ─────────────────────────
    if (!genericName) {
      for (const [brand, gen] of Object.entries(drugMapping)) {
        if (lowerQuery.includes(brand) || brand.includes(lowerQuery)) {
          matchedBrandEn = cleanQuery
          genericName = gen
          confidence = 'medium'
          break
        }
      }
    }

    // ── Tier 3: Groq LLM Reasoning Matcher ───────────────────
    if (!genericName) {
      try {
        const prompt = `You are a Bangladeshi clinical pharmacologist. A user typed the drug name: "${cleanQuery}".
Match this to the official Bangladeshi pharmaceutical brand name, generic formulation, therapeutic drug class, and standard dosage.
Respond ONLY with a JSON object in this exact schema:
{
  "matched_brand_en": "Official Brand Name e.g. Napa Extra 500mg",
  "matched_brand_bn": "বাংলা ব্র্যান্ড নাম e.g. নাপা এক্সট্রা ৫০০ মিগ্রা",
  "generic_name": "Generic Name e.g. Paracetamol + Caffeine",
  "drug_class": "Therapeutic Class e.g. Analgesic & Antipyretic",
  "suggested_dosage": "e.g. 500mg + 65mg"
}`

        const groqRes = (await callGroq(
          prompt,
          'You are an authoritative drug dictionary parser. Return valid JSON only.',
          'openai/gpt-oss-120b',
          300
        )) as Record<string, string>

        if (groqRes && groqRes.generic_name) {
          matchedBrandEn = groqRes.matched_brand_en || cleanQuery
          matchedBrandBn = groqRes.matched_brand_bn || matchedBrandEn
          genericName = groqRes.generic_name
          drugClass = groqRes.drug_class || drugClass
          confidence = 'medium'
        }
      } catch {
        // fallback
      }
    }

    // Default generic fallback if completely unknown
    if (!genericName) {
      genericName = cleanQuery
      confidence = 'low'
    }

    // Infer indication & visual pill avatar
    const indication = inferDrugIndication(matchedBrandEn || genericName)
    const avatar = inferPillAvatar(matchedBrandEn || genericName, suggestedDosage)

    const verifiedDrug: VerifiedDrugPayload = {
      written_query: cleanQuery,
      matched_brand_en: matchedBrandEn,
      matched_brand_bn: matchedBrandBn,
      generic_name: genericName,
      drug_class: drugClass,
      suggested_dosage: suggestedDosage,
      indication_en: indication.en,
      indication_bn: indication.bn,
      pill_shape: avatar.shape,
      pill_color: avatar.color,
      pill_color_secondary: avatar.colorSecondary,
      descriptor_bn: avatar.descriptorBn,
      confidence,
    }

    // ── Dynamic Drug Interaction Revalidation ────────────────
    let recalculatedInteractions: DrugInteraction[] = []
    let hasDangerousInteractions = false

    if (current_generics.length > 0) {
      const allGenerics = Array.from(
        new Set([...current_generics, genericName.toLowerCase().trim()])
      )
      if (allGenerics.length >= 2) {
        try {
          const interactions = await checkDrugInteractions(allGenerics)
          recalculatedInteractions = interactions
          hasDangerousInteractions = interactions.some(
            (i) => i.severity === 'Severe' || i.severity === 'Critical'
          )
        } catch {
          // fallback
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        verified_drug: verifiedDrug,
        recalculated_interactions: recalculatedInteractions,
        has_dangerous_interactions: hasDangerousInteractions,
      },
    })
  } catch (error) {
    console.error('[VerifyDrug API Error]:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to verify drug' },
      { status: 500 }
    )
  }
}
