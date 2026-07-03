import { callGeminiVision } from './gemini';
import { callGroq } from './groq';
import type {
  GeminiEyeOutput,
  GroqEyeOutput,
  GeminiMedication,
  GeminiPrescriptionOutput,
  PrescriptionAnalysisResult,
  EnrichedFoodItem,
  RiskLevel,
} from '@/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { mapBrandsToGenerics } from '@/lib/services/drug-mapping';
import { checkDrugInteractions } from '@/lib/services/drug-interaction';
import { calculateTotalNutrition } from '@/lib/services/calorie';

/**
 * Nayan AI — two-agent ophthalmic screening pipeline.
 *
 *  Step 1: Gemini 2.5 Flash (Vision)  → raw clinical findings (GeminiEyeOutput)
 *  Step 2: Groq Llama 3.3 70B         → patient-friendly triage report (GroqEyeOutput)
 *
 *  If Groq is unavailable, fall back to Gemini 2.5 Flash (text) with a combined
 *  prompt so the user still gets a result instead of a hard failure.
 */

export interface EyeAnalysisResult {
  diagnosis: string
  severity: GroqEyeOutput['severity']
  recommendation_en: string
  recommendation_bn: string
  urgency_days: number
  next_steps: string[]
  specialist_needed: string
  disease_description_en: string
  disease_description_bn: string
  disease_stage: string
  confidence: number
  gemini_raw_output: object
  used_fallback: boolean
}

// --- Prompts ---------------------------------------------------------------

const EYE_GEMINI_PROMPT = `
You are an ophthalmic screening AI. Analyze this eye image for signs of:
cataracts (pupillary cloudiness or haziness), diabetic retinopathy (red lesions,
exudates, neovascularization), glaucoma (disc abnormalities), or normal appearance.
Return ONLY valid JSON — no text outside the JSON object:
{
  "detected_conditions": ["string"],
  "pupillary_clarity": "clear|cloudy|severely_cloudy",
  "retinal_observations": "string describing what you see",
  "confidence": 0.85,
  "image_quality": "good|poor|unusable",
  "raw_findings": "string"
}
If image quality is poor, return image_quality: "poor" with your best attempt.`

const EYE_GROQ_PROMPT = `
You are a clinical AI assistant for rural Bangladesh healthcare.
You receive raw ophthalmic screening findings from a Vision AI.
Generate a patient-friendly triage report in simple language.
The patient may have low literacy — use simple words only.
Output ONLY a JSON object:
{
  "diagnosis": "string (e.g., 'Possible Cataract', 'Normal Eye', 'Suspected Retinal Damage')",
  "severity": "Normal|Low|Medium|High|Critical",
  "recommendation_en": "string (simple English, max 3 sentences, no medical jargon)",
  "recommendation_bn": "বাংলা string (সহজ বাংলায়, সর্বোচ্চ ৩ বাক্য)",
  "urgency_days": 0,
  "next_steps": ["string", "string"],
  "specialist_needed": "Ophthalmologist|General Physician|None",
  "disease_description_en": "string — 2-3 sentence plain-English explanation of what this eye condition is, what causes it, and how it progresses if untreated. Written for a patient with no medical background.",
  "disease_description_bn": "বাংলা string — same 2-3 sentences in simple Bengali. Use everyday language a rural patient understands.",
  "disease_stage": "string — Early|Moderate|Advanced|Unknown based on the visual findings."
}
urgency_days: 0 = emergency, 7 = urgent, 30 = soon, 90 = routine, 365 = annual checkup`

// --- Helpers ----------------------------------------------------------------

/** Narrow an unknown object into a GroqEyeOutput with safe defaults. */
function coerceGroqOutput(raw: unknown): GroqEyeOutput {
  const o = (raw ?? {}) as Record<string, unknown>
  const severity = o['severity'] as GroqEyeOutput['severity']
  const validSeverities: GroqEyeOutput['severity'][] = [
    'Normal',
    'Low',
    'Medium',
    'High',
    'Critical',
  ]
  const nextSteps = Array.isArray(o['next_steps'])
    ? (o['next_steps'] as unknown[]).map((s) => String(s))
    : []

  const validStages = ['Early', 'Moderate', 'Advanced', 'Unknown']

  return {
    diagnosis: typeof o['diagnosis'] === 'string' ? o['diagnosis'] : 'Unable to determine',
    severity: validSeverities.includes(severity) ? severity : 'Low',
    recommendation_en:
      typeof o['recommendation_en'] === 'string' ? o['recommendation_en'] : '',
    recommendation_bn:
      typeof o['recommendation_bn'] === 'string' ? o['recommendation_bn'] : '',
    urgency_days:
      typeof o['urgency_days'] === 'number' && Number.isFinite(o['urgency_days'])
        ? (o['urgency_days'] as number)
        : 90,
    next_steps: nextSteps.length > 0 ? nextSteps : ['Consult a doctor if symptoms persist.'],
    specialist_needed:
      typeof o['specialist_needed'] === 'string' ? o['specialist_needed'] : 'Ophthalmologist',
    disease_description_en:
      typeof o['disease_description_en'] === 'string' ? o['disease_description_en'] : '',
    disease_description_bn:
      typeof o['disease_description_bn'] === 'string' ? o['disease_description_bn'] : '',
    disease_stage:
      typeof o['disease_stage'] === 'string' && validStages.includes(o['disease_stage'] as string)
        ? (o['disease_stage'] as string)
        : 'Unknown',
  }
}

/** Pull the 0–1 confidence value out of the vision model's raw output. */
function extractConfidence(geminiOutput: unknown): number {
  const o = (geminiOutput ?? {}) as Record<string, unknown>
  const c = o['confidence']
  if (typeof c === 'number' && Number.isFinite(c)) {
    return Math.min(Math.max(c, 0), 1)
  }
  return 0
}

// --- Pipeline ---------------------------------------------------------------

/**
 * Analyze an eye image through the two-agent pipeline.
 *
 * @param imageBase64 base64-encoded image bytes (no data: prefix)
 * @param mimeType    one of image/jpeg | image/png | image/webp
 */
export async function analyzeEyeImage(
  imageBase64: string,
  mimeType: string
): Promise<EyeAnalysisResult> {
  // Step 1 — Vision: Gemini 2.5 Flash
  const geminiOutput = await callGeminiVision(
    imageBase64,
    mimeType as 'image/jpeg' | 'image/png' | 'image/webp',
    EYE_GEMINI_PROMPT
  )

  // Step 2 — Triage: Groq Llama 3.3 70B (with internal Gemini fallback)
  const raw = await callGroq(JSON.stringify(geminiOutput), EYE_GROQ_PROMPT)
  const groqOutput = coerceGroqOutput(raw)
  const usedFallback = (raw as Record<string, unknown>)?.['_fallback_used'] === true

  return {
    diagnosis: groqOutput.diagnosis,
    severity: groqOutput.severity,
    recommendation_en: groqOutput.recommendation_en,
    recommendation_bn: groqOutput.recommendation_bn,
    urgency_days: groqOutput.urgency_days,
    next_steps: groqOutput.next_steps,
    specialist_needed: groqOutput.specialist_needed,
    disease_description_en: groqOutput.disease_description_en,
    disease_description_bn: groqOutput.disease_description_bn,
    disease_stage: groqOutput.disease_stage,
    confidence: extractConfidence(geminiOutput),
    gemini_raw_output: geminiOutput,
    used_fallback: usedFallback,
  }
}

// ===========================================================================
// ScriptGuard — prescription OCR → drug mapping → interaction pipeline
// ===========================================================================

/**
 * ScriptGuard — prescription analysis pipeline.
 *
 *  Step 1: Gemini 2.5 Flash (Vision)  → OCR the prescription (GeminiPrescriptionOutput)
 *  Step 2: Drug mapping               → brand→generic via Supabase / Groq / static
 *  Step 3: Collect generic names
 *  Step 4: Drug interactions          → OpenFDA evidence + Groq reasoning
 *  Step 5: Assemble result (interactions + danger flag + raw OCR)
 */

const GEMINI_SCRIPT_PROMPT = `
You are a medical OCR specialist. Extract ALL text from this handwritten
Bangladeshi doctor prescription. Prescriptions typically contain drug names,
dosages (mg, ml), frequency (BD=twice, TDS=thrice, 1+0+1=morning+noon+night),
and duration (days). Return ONLY valid JSON:
{
  "raw_text": "string (all readable text exactly as written)",
  "medications": [{
    "written_text": "string (exactly as handwritten)",
    "dosage": "string",
    "frequency": "string",
    "duration": "string",
    "instructions": "string (e.g., after meal, with water)"
  }],
  "prescriber_qualification": "string|null",
  "prescription_date": "string|null",
  "ocr_confidence": 0.85
}
For illegible text write [illegible] rather than guessing.
Do not include any explanatory text outside the JSON object.`;

/**
 * Narrow Gemini's raw JSON into a well-typed GeminiPrescriptionOutput with safe
 * defaults. An empty/unreadable prescription still yields a valid (empty) shape
 * rather than throwing — downstream steps handle an empty drug list gracefully.
 */
function coercePrescriptionOutput(raw: unknown): GeminiPrescriptionOutput {
  const o = (raw ?? {}) as Record<string, unknown>;

  const rawMedications = Array.isArray(o['medications']) ? o['medications'] : [];
  const medications: GeminiMedication[] = rawMedications
    .map((m): GeminiMedication | null => {
      if (typeof m !== 'object' || m === null) return null;
      const drug = m as Record<string, unknown>;
      const written =
        typeof drug['written_text'] === 'string' ? drug['written_text'] : '';
      if (!written.trim()) return null; // a drug with no written text is useless
      return {
        written_text: written,
        dosage: typeof drug['dosage'] === 'string' ? drug['dosage'] : '',
        frequency: typeof drug['frequency'] === 'string' ? drug['frequency'] : '',
        duration: typeof drug['duration'] === 'string' ? drug['duration'] : '',
        instructions:
          typeof drug['instructions'] === 'string' ? drug['instructions'] : '',
      };
    })
    .filter((m): m is GeminiMedication => m !== null);

  return {
    raw_text: typeof o['raw_text'] === 'string' ? o['raw_text'] : '',
    medications,
    prescriber_qualification:
      typeof o['prescriber_qualification'] === 'string' &&
      o['prescriber_qualification'].trim()
        ? o['prescriber_qualification']
        : null,
    prescription_date:
      typeof o['prescription_date'] === 'string' && o['prescription_date'].trim()
        ? o['prescription_date']
        : null,
    ocr_confidence:
      typeof o['ocr_confidence'] === 'number' && Number.isFinite(o['ocr_confidence'])
        ? Math.min(Math.max(o['ocr_confidence'], 0), 1)
        : 0,
  };
}

/**
 * Run the full prescription analysis pipeline.
 *
 * @param imageBase64 base64-encoded prescription image bytes (no data: prefix)
 * @param mimeType    one of image/jpeg | image/png | image/webp
 * @param supabase    server Supabase client (used for bd_drugs lookup)
 * @returns extracted drugs, interaction warnings, and a danger flag
 */
export async function analyzePrescription(
  imageBase64: string,
  mimeType: string,
  supabase: SupabaseClient
): Promise<PrescriptionAnalysisResult> {
  // Step 1 — Vision OCR: Gemini 2.5 Flash
  const rawOutput = await callGeminiVision(
    imageBase64,
    mimeType as 'image/jpeg' | 'image/png' | 'image/webp',
    GEMINI_SCRIPT_PROMPT
  );
  const geminiOutput = coercePrescriptionOutput(rawOutput);

  // Step 2 — Map each OCR'd drug to brand / generic / class.
  const extracted_drugs = await mapBrandsToGenerics(
    geminiOutput.medications,
    supabase
  );

  // Step 3 — Collect generic names for interaction screening. Skip entries that
  // were never truly mapped (empty generic, or generic echoing the raw text —
  // which is how the unmapped placeholder is shaped) to avoid feeding noise to
  // OpenFDA/Groq.
  const genericNames = extracted_drugs
    .map((d) => d.generic_name.trim())
    .filter((name, idx) => {
      if (!name) return false;
      const written = extracted_drugs[idx]!.written_text.trim().toLowerCase();
      // Unmapped placeholder → generic_name === written_text.
      return name.toLowerCase() !== written;
    });

  // Step 4 — Interaction check (OpenFDA + Groq, with static fallback).
  const interaction_warnings = await checkDrugInteractions(genericNames);

  // Step 5 — Assemble. The danger flag is recomputed here for safety even
  // though the service layer also tracks it.
  const has_dangerous_interactions = interaction_warnings.some(
    (i) => i.severity === 'Critical' || i.severity === 'Severe'
  );

  return {
    extracted_drugs,
    interaction_warnings,
    has_dangerous_interactions,
    gemini_raw: geminiOutput,
  };
}

// ===========================================================================
// GlycoVision — food photo → nutrition → diabetes risk pipeline
// ===========================================================================

const FOOD_GEMINI_PROMPT = `
You are a South Asian clinical dietitian AI. Analyze this meal photo carefully and identify ALL food items visible. Focus on Bangladeshi cuisine.

Common Bangladeshi foods with typical portion gram ranges:
- Grains: ভাত/rice (200-350g plate), খিচুড়ি/khichuri (250-400g), পোলাও/polao (200-300g), বিরিয়ানি/biryani (250-400g), রুটি/roti (40-60g each), পরোটা/paratha (50-80g each), পুরি/puri (20-30g each), নান/naan (80-120g), মুড়ি/muri (30-50g)
- Lentils: ডাল/dal (150-250g bowl) — মসুর/masoor (red lentil), মুগ/moog (mung), ছোলা/chola (chickpea)
- Fish: মাছ/fish — ইলিশ/hilsa (80-120g piece), রুই/rui (80-120g), পাবদা/pabda, টেংরা/tengra, কই/koi — plus ~30-50g oil/gravy
- Meat: মুরগি/chicken (80-150g), গরু/beef (60-120g), খাসি/mutton (60-120g), ডিম/egg (50-60g each) — plus ~30-50g gravy
- Vegetables: ভর্তা/bhorta (80-150g), তরকারি/torkari mixed veg (100-200g), শাক/shak leafy greens (80-150g)
- Snacks: সিঙ্গারা/singara (30-50g each), পিয়াজু/piyaju (20-30g), জিলাপি/jilapi (30-50g), চানাচুর/chanachur (20-40g)
- Fruits: কলা/banana (100-120g), আম/mango (150-250g), পেঁপে/papaya (100-200g), তরমুজ/watermelon (150-300g)
- Beverages: চা/tea (150-200ml), দুধ/milk (200ml), লাচ্ছি/lassi (200ml), ডাবের পানি/coconut water (200-300ml)

For mixed dishes (curries, bhorta), estimate each component separately when possible. E.g., fish curry = fish meat (~100g) + oil/gravy (~40g). Be conservative with oil — ~5-15g per curry serving.

Use specific names — not "vegetable curry" but "potato and pea curry" or "eggplant bhorta". List rice and dal as separate items.

Return ONLY valid JSON:
{
  "food_items": [
    {
      "name_en": "specific food name e.g. 'White Rice (cooked)', 'Red Lentil Dal', 'Hilsa Fish Curry', 'Mustard Oil'",
      "name_bn": "বাংলা নাম",
      "estimated_grams": integer,
      "confidence": 0.0-1.0
    }
  ],
  "meal_type": "Breakfast|Lunch|Dinner|Snack",
  "plate_fully_visible": boolean,
  "notes": "string|null (cooking method, visible oil estimate, substitutions)"
}`;

const RISK_GROQ_PROMPT = `
You are a senior clinical dietitian specializing in geriatric nutrition and chronic disease management for South Asian patients. Analyze this meal's nutritional data:
Total Calories: {X} kcal
Total Carbohydrates: {Y}g
Total Protein: {P}g
Total Fat: {F}g
Glycemic Load estimate: {Z}
Food items: {ITEMS}

Assess the health risks of this specific meal composition for a Bangladeshi senior citizen managing chronic conditions. Consider typical Bangladeshi diet patterns (white rice staple, oil/ghee in curries, salt in dal and sauces, fried items, lentil-based dishes). Compute glycemic_load based on the carbohydrate quality of the specific foods listed — use glycemic index of 70+ for white rice, 30-40 for lentils, 50-60 for fruits. For hypertension and heart disease, evaluate based on visible oil, ghee, salt-heavy sauces, and fatty meat content.

Return ONLY a valid JSON object matching this exact structure:
{
  "glycemic_load": number,
  "risk_level": "Green|Yellow|Red",
  "risk_summary_en": "string (2-3 sentences, simple language)",
  "risk_summary_bn": "বাংলা string (২-৩ বাক্য, সহজ ভাষায়)",
  "glucose_impact": "Low|Moderate|High|Very High",

  "chronic_disease_risks": [
    {
      "disease_en": "Type 2 Diabetes",
      "disease_bn": "টাইপ-২ ডায়াবেটিস",
      "status": "Safe|Caution|Danger",
      "reason_bn": "১-২ বাক্যে ব্যাখ্যা কেন এই খাবারটি ক্ষতিকর বা উপকারী"
    },
    {
      "disease_en": "Hypertension (High Blood Pressure)",
      "disease_bn": "উচ্চ রক্তচাপ (হাই ব্লাড প্রেসার)",
      "status": "Safe|Caution|Danger",
      "reason_bn": "১-২ বাক্যে ব্যাখ্যা"
    },
    {
      "disease_en": "Heart Disease",
      "disease_bn": "হৃদরোগ",
      "status": "Safe|Caution|Danger",
      "reason_bn": "১-২ বাক্যে ব্যাখ্যা"
    }
  ],

  "meal_modifications": [
    {
      "suggestion_en": "string (specific, actionable)",
      "suggestion_bn": "বাংলা string",
      "impact": "High|Medium|Low",
      "icon": "emoji"
    }
  ]
}

Risk levels: Green=safe (<400 cal, GL<10), Yellow=moderate warning, Red=high risk (>700 cal or GL>20). Chronic disease statuses: Safe=beneficial or neutral, Caution=moderate concern, Danger=clearly harmful for that condition.`;

export interface ChronicDiseaseRisk {
  disease_en: string
  disease_bn: string
  status: 'Safe' | 'Caution' | 'Danger'
  reason_bn: string
}

export interface FoodAnalysisResult {
  identified_items: EnrichedFoodItem[]
  total_calories: number
  total_carbs_g: number
  total_protein_g: number
  total_fat_g: number
  glycemic_load: number
  risk_level: RiskLevel
  risk_summary_en: string
  risk_summary_bn: string
  glucose_impact: 'Low' | 'Moderate' | 'High' | 'Very High'
  chronic_disease_risks: ChronicDiseaseRisk[]
  meal_modifications: {
    suggestion_en: string
    suggestion_bn: string
    impact: 'High' | 'Medium' | 'Low'
    icon: string
  }[]
  gemini_raw_output: object
  used_fallback: boolean
}

function coerceFoodOutput(raw: unknown): {
  food_items: { name_en: string; name_bn: string; estimated_grams: number; confidence: number }[]
  meal_type: string
  plate_fully_visible: boolean
  notes: string | null
} {
  const o = (raw ?? {}) as Record<string, unknown>;
  const rawItems = Array.isArray(o['food_items']) ? o['food_items'] : [];
  const food_items = rawItems.map((item: unknown) => {
    const i = (item ?? {}) as Record<string, unknown>;
    return {
      name_en: typeof i['name_en'] === 'string' ? i['name_en'] : 'Unknown food',
      name_bn: typeof i['name_bn'] === 'string' ? i['name_bn'] : '',
      estimated_grams: typeof i['estimated_grams'] === 'number' ? i['estimated_grams'] : 100,
      confidence: typeof i['confidence'] === 'number' ? Math.min(Math.max(i['confidence'], 0), 1) : 0.5,
    };
  });
  return {
    food_items,
    meal_type: typeof o['meal_type'] === 'string' ? o['meal_type'] : 'Meal',
    plate_fully_visible: typeof o['plate_fully_visible'] === 'boolean' ? o['plate_fully_visible'] : false,
    notes: typeof o['notes'] === 'string' ? o['notes'] : null,
  };
}

function coerceRiskOutput(raw: unknown): {
  glycemic_load: number
  risk_level: RiskLevel
  risk_summary_en: string
  risk_summary_bn: string
  glucose_impact: 'Low' | 'Moderate' | 'High' | 'Very High'
  chronic_disease_risks: ChronicDiseaseRisk[]
  meal_modifications: { suggestion_en: string; suggestion_bn: string; impact: 'High' | 'Medium' | 'Low'; icon: string }[]
} {
  const o = (raw ?? {}) as Record<string, unknown>;

  const validRiskLevels: RiskLevel[] = ['Green', 'Yellow', 'Red'];
  const riskLevel = validRiskLevels.includes(o['risk_level'] as RiskLevel)
    ? (o['risk_level'] as RiskLevel)
    : 'Yellow';

  const validImpacts: ('Low' | 'Moderate' | 'High' | 'Very High')[] = ['Low', 'Moderate', 'High', 'Very High'];
  const glucoseImpact = validImpacts.includes(o['glucose_impact'] as 'Low' | 'Moderate' | 'High' | 'Very High')
    ? (o['glucose_impact'] as 'Low' | 'Moderate' | 'High' | 'Very High')
    : 'Moderate';

  const validStatuses = ['Safe', 'Caution', 'Danger'] as const;
  const rawRisks = Array.isArray(o['chronic_disease_risks']) ? o['chronic_disease_risks'] : [];
  const chronic_disease_risks: ChronicDiseaseRisk[] = rawRisks.map((risk: unknown) => {
    const r = (risk ?? {}) as Record<string, unknown>;
    const status = r['status'] as string;
    return {
      disease_en: typeof r['disease_en'] === 'string' ? r['disease_en'] : '',
      disease_bn: typeof r['disease_bn'] === 'string' ? r['disease_bn'] : '',
      status: validStatuses.includes(status as 'Safe' | 'Caution' | 'Danger')
        ? (status as 'Safe' | 'Caution' | 'Danger')
        : 'Caution',
      reason_bn: typeof r['reason_bn'] === 'string' ? r['reason_bn'] : '',
    };
  });

  const rawMods = Array.isArray(o['meal_modifications']) ? o['meal_modifications'] : [];
  const meal_modifications = rawMods.map((mod: unknown) => {
    const m = (mod ?? {}) as Record<string, unknown>;
    return {
      suggestion_en: typeof m['suggestion_en'] === 'string' ? m['suggestion_en'] : '',
      suggestion_bn: typeof m['suggestion_bn'] === 'string' ? m['suggestion_bn'] : '',
      impact: (['High', 'Medium', 'Low'] as const).includes(m['impact'] as 'High' | 'Medium' | 'Low')
        ? (m['impact'] as 'High' | 'Medium' | 'Low')
        : 'Medium',
      icon: typeof m['icon'] === 'string' ? m['icon'] : '⚠️',
    };
  });

  return {
    glycemic_load: typeof o['glycemic_load'] === 'number' ? o['glycemic_load'] : 0,
    risk_level: riskLevel,
    risk_summary_en: typeof o['risk_summary_en'] === 'string' ? o['risk_summary_en'] : '',
    risk_summary_bn: typeof o['risk_summary_bn'] === 'string' ? o['risk_summary_bn'] : '',
    glucose_impact: glucoseImpact,
    chronic_disease_risks,
    meal_modifications,
  };
}

/**
 * Analyze a food photo through the two-agent pipeline.
 *
 * Step 1: Gemini Vision identifies food items and portions.
 * Step 2: Local + USDA + Groq lookup enriches items with nutrition data.
 * Step 3: Groq (or Gemini fallback) produces a diabetes risk assessment.
 *
 * @param imageBase64 base64-encoded image bytes (no data: prefix)
 * @param mimeType    one of image/jpeg | image/png | image/webp
 * @param supabase    server Supabase client (for bd_food_items lookup)
 */
export async function analyzeFood(
  imageBase64: string,
  mimeType: string,
  supabase: SupabaseClient
): Promise<FoodAnalysisResult> {
  // Step 1 — Vision: Gemini identifies food items
  const geminiOutput = await callGeminiVision(
    imageBase64,
    mimeType as 'image/jpeg' | 'image/png' | 'image/webp',
    FOOD_GEMINI_PROMPT
  );
  const foodOutput = coerceFoodOutput(geminiOutput);

  // Step 2 — Enrich with nutrition data (Supabase → USDA → Groq chain)
  const identified_items = await calculateTotalNutrition(foodOutput.food_items, supabase);

  // Step 3 — Aggregate totals
  const total_calories = identified_items.reduce((s, i) => s + i.calories, 0);
  const total_carbs_g = Math.round(identified_items.reduce((s, i) => s + i.carbs_g, 0) * 10) / 10;
  const total_protein_g = Math.round(identified_items.reduce((s, i) => s + i.protein_g, 0) * 10) / 10;
  const total_fat_g = Math.round(identified_items.reduce((s, i) => s + i.fat_g, 0) * 10) / 10;

  // Step 4 — Risk assessment (Groq with Gemini fallback)
  const itemsList = identified_items
    .map((i) => `${i.name_en} (${i.estimated_grams}g, ${i.calories}kcal, ${i.carbs_g}g carbs)`)
    .join('; ');

  const riskPrompt = RISK_GROQ_PROMPT
    .replace('{X}', String(total_calories))
    .replace('{Y}', String(total_carbs_g))
    .replace('{P}', String(total_protein_g))
    .replace('{F}', String(total_fat_g))
    .replace('{Z}', 'see item-level GI below') // Groq will compute from items
    .replace('{ITEMS}', itemsList);

  const raw = await callGroq(
    JSON.stringify({ total_calories, total_carbs_g, total_protein_g, total_fat_g, items: identified_items }),
    riskPrompt
  );
  const riskOutput = coerceRiskOutput(raw);
  const usedFallback = (raw as Record<string, unknown>)?.['_fallback_used'] === true;

  return {
    identified_items,
    total_calories,
    total_carbs_g,
    total_protein_g,
    total_fat_g,
    ...riskOutput,
    gemini_raw_output: geminiOutput,
    used_fallback: usedFallback,
  };
}

export type { GeminiEyeOutput, GroqEyeOutput }
