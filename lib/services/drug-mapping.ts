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

const GROQ_MAP_PROMPT = `
You are a Bangladeshi pharmacology assistant. Given text written on a local
prescription, identify the most likely Bangladeshi brand name and the
international generic (INN) name.
Return ONLY valid JSON — no text outside the JSON object:
{
  "brand_name": "string",
  "generic_name": "string",
  "drug_class": "string",
  "atc_code": "string or null",
  "confidence": "medium" | "low"
}
Rules:
- Use "medium" confidence for well-known Bangladeshi brands; "low" only when guessing.
- generic_name must be the lowercase international nonproprietary name (e.g. "omeprazole").
- If the text is illegible or not a drug, return generic_name as an empty string and confidence "low".
`;

// --- Helpers ----------------------------------------------------------------

/** First whitespace-delimited token of a string, lowercased, for DB searching. */
function firstWord(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return '';
  return trimmed.split(/\s+/)[0]!.toLowerCase();
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
  const pattern = `%${escapeIlike(searchTerm)}%`;
  const { data, error } = await supabase
    .from('bd_drugs')
    .select('id, brand_name, generic_name, manufacturer, drug_class, atc_code, common_in_bd')
    .ilike('brand_name', pattern)
    .or(`generic_name.ilike.${pattern}`)
    .limit(3);

  if (error) {
    console.warn('[drug-mapping] Supabase lookup error:', error.message);
    return null;
  }
  if (!data || data.length === 0) return null;
  return data[0] as BdDrug;
}

/** Tier 2 — Groq LLM reasoning for drugs absent from the local DB. */
async function lookupWithGroq(writtenText: string): Promise<{
  brand_name: string;
  generic_name: string;
  drug_class: string;
  atc_code: string | null;
  confidence: MappingConfidence;
} | null> {
  const raw = await callGroq(
    `A Bangladeshi prescription contains: "${writtenText}". What is the most likely Bangladeshi brand name and international generic name?`,
    GROQ_MAP_PROMPT
  );
  const o = raw as Record<string, unknown>;
  const genericName =
    typeof o['generic_name'] === 'string' ? o['generic_name'].trim() : '';
  // An empty generic_name means Groq couldn't identify the drug — treat as a miss.
  if (!genericName) return null;

  return {
    brand_name:
      typeof o['brand_name'] === 'string' && o['brand_name'].trim()
        ? o['brand_name'].trim()
        : writtenText.trim(),
    generic_name: genericName.toLowerCase(),
    drug_class: typeof o['drug_class'] === 'string' ? o['drug_class'] : 'Unknown',
    atc_code:
      typeof o['atc_code'] === 'string' && o['atc_code'].trim()
        ? o['atc_code'].trim()
        : null,
    confidence: coerceMappingConfidence(o['confidence']),
  };
}

/**
 * Tier 3 — curated in-memory map. Used only when Supabase and Groq both fail,
 * so the pipeline never throws just because external services are down.
 */
function lookupStatic(writtenText: string): ExtractedMedication | null {
  const term = firstWord(writtenText);
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
 * Resolution tiers per medication (first hit wins):
 *   1. Supabase `bd_drugs` fuzzy lookup → confidence 'high'
 *   2. Groq LLM                         → confidence 'medium' | 'low'
 *   3. Curated static map               → confidence 'low'
 *
 * A failure on any single medication never aborts the whole list — the
 * offending entry is returned with confidence 'low' and its raw written_text.
 *
 * @param medications raw OCR'd medications from Gemini (no brand/generic yet)
 * @param supabase    server Supabase client (RLS-enforced)
 * @returns enriched medications with brand_name, generic_name, drug_class
 */
export async function mapBrandsToGenerics(
  medications: GeminiMedication[],
  supabase: SupabaseClient
): Promise<ExtractedMedication[]> {
  const results = await Promise.all(
    medications.map(async (med): Promise<ExtractedMedication> => {
      const searchTerm = firstWord(med.written_text);
      const baseFields = {
        written_text: med.written_text,
        dosage: med.dosage,
        frequency: med.frequency,
        duration: med.duration,
        instructions: med.instructions,
      };

      try {
        // Tier 1 — database
        const dbHit = await lookupInDatabase(searchTerm, supabase);
        if (dbHit) {
          return {
            ...baseFields,
            brand_name: dbHit.brand_name,
            generic_name: dbHit.generic_name.toLowerCase(),
            drug_class: dbHit.drug_class ?? 'Unknown',
            mapping_confidence: 'high',
          };
        }

        // Tier 2 — Groq
        const groqHit = await lookupWithGroq(med.written_text);
        if (groqHit) {
          return {
            ...baseFields,
            brand_name: groqHit.brand_name,
            generic_name: groqHit.generic_name,
            drug_class: groqHit.drug_class,
            mapping_confidence: groqHit.confidence,
          };
        }
      } catch (err) {
        console.warn(
          '[drug-mapping] dynamic lookup failed for "%s", falling back to static:',
          med.written_text,
          err
        );
      }

      // Tier 3 — curated static map (never throws)
      const staticHit = lookupStatic(med.written_text);
      if (staticHit) {
        return { ...staticHit, ...baseFields };
      }

      // All tiers exhausted — return a clearly-unmapped placeholder.
      return unmappedMedication(med);
    })
  );

  return results;
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
