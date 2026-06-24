import { callGeminiVision, callGeminiText } from './gemini';
import { callGroq } from './groq';
import type {
  GeminiEyeOutput,
  GroqEyeOutput,
  GeminiMedication,
  GeminiPrescriptionOutput,
  PrescriptionAnalysisResult,
} from '@/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { mapBrandsToGenerics } from '@/lib/services/drug-mapping';
import { checkDrugInteractions } from '@/lib/services/drug-interaction';

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
  // Triage report from the second agent (Groq, or Flash fallback).
  diagnosis: string
  severity: GroqEyeOutput['severity']
  recommendation_en: string
  recommendation_bn: string
  urgency_days: number
  next_steps: string[]
  specialist_needed: string
  // Confidence reported by the vision model (0–1).
  confidence: number
  // Preserved for the audit trail / DB record.
  gemini_raw_output: object
  // True when the result came from the Flash fallback rather than Groq.
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
  "specialist_needed": "Ophthalmologist|General Physician|None"
}
urgency_days: 0 = emergency, 7 = urgent, 30 = soon, 90 = routine, 365 = annual checkup`

const EYE_FLASH_FALLBACK_PROMPT = `
You are a clinical AI assistant for rural Bangladesh healthcare.
A vision model already analyzed an eye image and produced these raw findings.
Generate a patient-friendly triage report in simple language.
The patient may have low literacy — use simple words only.
Output ONLY a JSON object with exactly these keys:
{
  "diagnosis": "string",
  "severity": "Normal|Low|Medium|High|Critical",
  "recommendation_en": "string (simple English, max 3 sentences)",
  "recommendation_bn": "বাংলা string (সহজ বাংলায়, সর্বোচ্চ ৩ বাক্য)",
  "urgency_days": "number (0 = emergency, 7 = urgent, 30 = soon, 90 = routine, 365 = annual)",
  "next_steps": ["string"],
  "specialist_needed": "Ophthalmologist|General Physician|None",
  "confidence": "number 0-1"
}
Here are the raw vision findings as JSON:
`

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

  // Step 2 — Triage: Groq Llama 3.3 70B (with Flash fallback)
  let groqOutput: GroqEyeOutput
  let usedFallback = false

  try {
    const raw = await callGroq(JSON.stringify(geminiOutput), EYE_GROQ_PROMPT)
    groqOutput = coerceGroqOutput(raw)
  } catch (groqError) {
    console.warn('[orchestrator] Groq failed, falling back to Gemini Flash:', groqError)
    usedFallback = true
    const raw = await callGeminiText(EYE_FLASH_FALLBACK_PROMPT + JSON.stringify(geminiOutput))
    groqOutput = coerceGroqOutput(raw)
  }

  return {
    diagnosis: groqOutput.diagnosis,
    severity: groqOutput.severity,
    recommendation_en: groqOutput.recommendation_en,
    recommendation_bn: groqOutput.recommendation_bn,
    urgency_days: groqOutput.urgency_days,
    next_steps: groqOutput.next_steps,
    specialist_needed: groqOutput.specialist_needed,
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

export type { GeminiEyeOutput, GroqEyeOutput }
