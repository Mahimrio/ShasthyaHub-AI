import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  BdDrug,
  ExtractedMedication,
  GeminiMedication,
  MappingConfidence,
} from '@/types';
import { callGroq } from '@/lib/ai/groq';

/**
 * Drug brand → generic mapping for Bangladeshi prescriptions.
 *
 * Resolution order per medication:
 *   1. Supabase `bd_drugs` fuzzy lookup  (confidence: 'high')
 *   2. Groq LLM                          (confidence: 'medium' | 'low')
 *   3. Curated static map                (confidence: 'low') — last resort
 */

// --- Tier 3: curated static fallback ---------------------------------------
// Last-resort safety net used only when both Supabase and Groq are unavailable.
// Never silently fail — the patient still needs a best-effort mapping.

export const drugMapping: Record<string, string> = {
  napa: 'paracetamol',
  ace: 'paracetamol',
  paracip: 'paracetamol',
  monas: 'montelukast',
  seclo: 'omeprazole',
  losectil: 'lansoprazole',
  maxpro: 'pantoprazole',
  nexivum: 'esomeprazole',
  azimax: 'azithromycin',
  cipro: 'ciprofloxacin',
  metro: 'metronidazole',
  flagyl: 'metronidazole',
  glucophage: 'metformin',
  lortan: 'losartan',
  fexo: 'fexofenadine',
  neoceptin: 'ranitidine',
  omidon: 'domperidone',
  oradexon: 'dexamethasone',
  amoxil: 'amoxicillin',
  clavulin: 'amoxicillin+clavulanate',
  sefalin: 'cefalexin',
  diclofenac: 'diclofenac',
  naprosyn: 'naproxen',
  brufen: 'ibuprofen',
  trika: 'triazolam',
  rivotril: 'clonazepam',
  lexapro: 'escitalopram',
  sertraline: 'sertraline',
  atorva: 'atorvastatin',
  lipovas: 'simvastatin',
  rosuvas: 'rosuvastatin',
  amlodipine: 'amlodipine',
  tenolol: 'atenolol',
  concor: 'bisoprolol',
  lasix: 'furosemide',
  diamicron: 'gliclazide',
  amaryl: 'glimepiride',
  ventolin: 'salbutamol',
  mebex: 'mebendazole',
};

/** Coarse drug-class label for the common generics in the static map. */
const STATIC_CLASS: Record<string, string> = {
  paracetamol: 'Analgesic/Antipyretic',
  omeprazole: 'Proton Pump Inhibitor',
  lansoprazole: 'Proton Pump Inhibitor',
  pantoprazole: 'Proton Pump Inhibitor',
  esomeprazole: 'Proton Pump Inhibitor',
  azithromycin: 'Macrolide Antibiotic',
  ciprofloxacin: 'Fluoroquinolone Antibiotic',
  metronidazole: 'Nitroimidazole Antibiotic',
  metformin: 'Biguanide Antidiabetic',
  losartan: 'ARB Antihypertensive',
  diclofenac: 'NSAID',
  naproxen: 'NSAID',
  ibuprofen: 'NSAID',
  atorvastatin: 'Statin (Lipid-lowering)',
  simvastatin: 'Statin (Lipid-lowering)',
  rosuvastatin: 'Statin (Lipid-lowering)',
  amlodipine: 'Calcium Channel Blocker',
  atenolol: 'Beta-blocker',
  bisoprolol: 'Beta-blocker',
  furosemide: 'Loop Diuretic',
  gliclazide: 'Sulfonylurea Antidiabetic',
  glimepiride: 'Sulfonylurea Antidiabetic',
  salbutamol: 'Bronchodilator',
};

// --- Prompts ----------------------------------------------------------------

const GROQ_MAP_BATCH_PROMPT = `
You are a South Asian (Bangladesh/India) pharmacology assistant. You receive a
JSON array of raw medication lines from one handwritten prescription. For EACH
line, identify the most likely brand name and international generic (INN) name.
Return ONLY valid JSON — no text outside the JSON object:
{
  "mappings": [
    {
      "written_text": "the input line, echoed verbatim",
      "brand_name": "string",
      "generic_name": "string (lowercase INN; for combination drugs join with ' + ')",
      "drug_class": "string",
      "confidence": "medium" | "low"
    }
  ]
}
Rules:
- Return mappings in the SAME ORDER as the input array, one per line.
- Use "medium" for well-known brands; "low" only when guessing.
- If a line is illegible or not a drug, return generic_name as "" and confidence "low".
`;

// --- Helpers ----------------------------------------------------------------

/** Dose-form prefixes that precede the brand name on BD prescriptions. */
const DOSE_FORM_WORDS = new Set([
  'tab', 'tab.', 'tablet', 'cap', 'cap.', 'capsule', 'syp', 'syp.', 'syn', 'syrup',
  'susp', 'susp.', 'suspension', 'inj', 'inj.', 'injection', 'oint', 'ointment',
  'cream', 'gel', 'drops', 'drop', 'spray', 'inh', 'inhaler', 'sol', 'solution',
  // unit fragments left over after stripping digits ("500mg" → "mg")
  'mg', 'ml', 'mcg', 'gm', 'g', 'iu',
])

/** First brand-like token: skips list numbers and dose forms ("1. Tab Napa 500mg" → "napa").
 * Tokens under 3 chars are ignored — prescription shorthand ("T.", "C.") would
 * otherwise substring-match half the reference table. */
function brandToken(text: string): string {
  const tokens = text.trim().toLowerCase().split(/\s+/)
  for (const t of tokens) {
    const clean = t.replace(/[^a-z\u0980-\u09ff]/g, '')
    if (clean.length < 3 || DOSE_FORM_WORDS.has(clean)) continue
    return clean
  }
  return ''
}

/** Escape a user-provided term for use inside a PostgREST ILIKE pattern. */
function escapeIlike(term: string): string {
  return term.replace(/[%_\\]/g, (m) => `\\${m}`);
}

/** A safe, empty-but-shaped mapping used when every tier fails. */
function unmappedMedication(med: GeminiMedication): ExtractedMedication {
  const brand = med.written_text.trim() || 'Unknown';
  return {
    written_text: med.written_text,
    brand_name: brand,
    generic_name: brand,
    drug_class: 'Unknown',
    dosage: med.dosage,
    frequency: med.frequency,
    duration: med.duration,
    instructions: med.instructions,
    mapping_confidence: 'low',
  };
}

function coerceMappingConfidence(value: unknown): MappingConfidence {
  return value === 'medium' ? 'medium' : 'low';
}

// --- Resolution tiers -------------------------------------------------------

/** Tier 1 — fuzzy lookup against the curated bd_drugs reference table. */
async function lookupInDatabase(
  searchTerm: string,
  supabase: SupabaseClient
): Promise<BdDrug | null> {
  if (!searchTerm) return null;
  // Prefix match: prescriptions start with the brand word, and substring
  // patterns ("%t%") false-match most of the table on short/junk tokens.
  const pattern = `${escapeIlike(searchTerm)}%`;
  const { data, error } = await supabase
    .from('bd_drugs')
    .select('id, brand_name, generic_name, manufacturer, drug_class, atc_code, common_in_bd')
    .or(`brand_name.ilike.${pattern},generic_name.ilike.${pattern}`)
    .limit(3);

  if (error) {
    console.warn('[drug-mapping] Supabase lookup error:', error.message);
    return null;
  }
  if (!data || data.length === 0) return null;
  return data[0] as BdDrug;
}

/** Tier 2 — ONE batched Groq call for every drug the DB couldn't map.
 * A single call keeps a 10-drug prescription inside the free-tier TPM
 * window — per-drug parallel calls rate-limit the whole pipeline. */
async function lookupWithGroqBatch(writtenTexts: string[]): Promise<
  Map<number, {
    brand_name: string;
    generic_name: string;
    drug_class: string;
    confidence: MappingConfidence;
  }>
> {
  const out = new Map<number, {
    brand_name: string;
    generic_name: string;
    drug_class: string;
    confidence: MappingConfidence;
  }>();
  if (writtenTexts.length === 0) return out;

  const raw = await callGroq(
    JSON.stringify(writtenTexts),
    GROQ_MAP_BATCH_PROMPT,
    // 120b knows regional brands the smaller models hallucinate on; the small
    // output budget keeps this call + the interaction check inside one TPM window.
    'openai/gpt-oss-120b',
    2000
  );
  const mappings = (raw as Record<string, unknown>)['mappings'];
  if (!Array.isArray(mappings)) return out;

  mappings.forEach((entry, i) => {
    if (i >= writtenTexts.length) return;
    const o = (entry ?? {}) as Record<string, unknown>;
    const generic = typeof o['generic_name'] === 'string' ? o['generic_name'].trim() : '';
    if (!generic) return; // illegible / not a drug — leave unmapped
    out.set(i, {
      brand_name:
        typeof o['brand_name'] === 'string' && o['brand_name'].trim()
          ? o['brand_name'].trim()
          : writtenTexts[i]!.trim(),
      generic_name: generic.toLowerCase(),
      drug_class: typeof o['drug_class'] === 'string' ? o['drug_class'] : 'Unknown',
      confidence: coerceMappingConfidence(o['confidence']),
    });
  });
  return out;
}

/**
 * Tier 3 — curated in-memory map. Used only when Supabase and Groq both fail,
 * so the pipeline never throws just because external services are down.
 */
function lookupStatic(writtenText: string): ExtractedMedication | null {
  const term = brandToken(writtenText);
  const generic = drugMapping[term];
  if (!generic) return null;
  return {
    written_text: writtenText,
    brand_name: term,
    generic_name: generic,
    drug_class: STATIC_CLASS[generic] ?? 'Unknown',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
    mapping_confidence: 'low',
  };
}

// --- Public API -------------------------------------------------------------

/**
 * Map each Gemini-OCR'd medication to its brand name, generic name, and drug
 * class, preserving the dosage/frequency/duration/instructions from the OCR.
 *
 * Resolution tiers (first hit wins):
 *   1. Supabase `bd_drugs` fuzzy lookup (parallel)   → confidence 'high'
 *   2. ONE batched Groq call for all DB misses       → 'medium' | 'low'
 *   3. Curated static map                            → 'low'
 *
 * The batch keeps long prescriptions (10+ drugs) inside Groq's free-tier
 * tokens-per-minute limit — per-drug calls would fire N parallel requests
 * and rate-limit the whole pipeline into slow Gemini fallbacks.
 *
 * @param medications raw OCR'd medications from Gemini (no brand/generic yet)
 * @param supabase    server Supabase client (RLS-enforced)
 * @returns enriched medications with brand_name, generic_name, drug_class
 */
export async function mapBrandsToGenerics(
  medications: GeminiMedication[],
  supabase: SupabaseClient
): Promise<ExtractedMedication[]> {
  // Tier 1 — parallel DB lookups (cheap, no rate limits).
  const dbHits = await Promise.all(
    medications.map((med) =>
      lookupInDatabase(brandToken(med.written_text), supabase).catch(() => null)
    )
  );

  // Tier 2 — one batched Groq call covering every DB miss.
  const missIdx: number[] = [];
  dbHits.forEach((hit, i) => {
    if (!hit) missIdx.push(i);
  });

  let groqHits = new Map<number, {
    brand_name: string;
    generic_name: string;
    drug_class: string;
    confidence: MappingConfidence;
  }>();
  if (missIdx.length > 0) {
    try {
      const batch = await lookupWithGroqBatch(
        missIdx.map((i) => medications[i]!.written_text)
      );
      // Re-key from batch position back to medication index.
      groqHits = new Map(
        [...batch.entries()].map(([pos, val]) => [missIdx[pos]!, val])
      );
    } catch (err) {
      console.warn('[drug-mapping] batched Groq mapping failed, using static fallback:', err);
    }
  }

  return medications.map((med, i): ExtractedMedication => {
    const baseFields = {
      written_text: med.written_text,
      dosage: med.dosage,
      frequency: med.frequency,
      duration: med.duration,
      instructions: med.instructions,
    };

    const dbHit = dbHits[i];
    if (dbHit) {
      return {
        ...baseFields,
        brand_name: dbHit.brand_name,
        generic_name: dbHit.generic_name.toLowerCase(),
        drug_class: dbHit.drug_class ?? 'Unknown',
        mapping_confidence: 'high',
      };
    }

    const groqHit = groqHits.get(i);
    if (groqHit) {
      return {
        ...baseFields,
        brand_name: groqHit.brand_name,
        generic_name: groqHit.generic_name,
        drug_class: groqHit.drug_class,
        mapping_confidence: groqHit.confidence,
      };
    }

    const staticHit = lookupStatic(med.written_text);
    if (staticHit) {
      return { ...staticHit, ...baseFields };
    }

    return unmappedMedication(med);
  });
}

// --- Backward-compatible exports (pre-existing API) -------------------------

/**
 * @deprecated Prefer {@link mapBrandsToGenerics} for the live pipeline.
 * Synchronous lookup against the curated static map only.
 */
export function getGenericName(brandName: string): string {
  return drugMapping[brandName.toLowerCase()] || brandName;
}

/**
 * @deprecated Prefer {@link mapBrandsToGenerics} for the live pipeline.
 */
export function mapDrugs(brandNames: string[]): string[] {
  return brandNames.map(getGenericName);
}
