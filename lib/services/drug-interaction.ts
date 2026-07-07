import type { DrugInteraction } from '@/types';
import { callGroq } from '@/lib/ai/groq';

/**
 * Drug-interaction screening for a co-prescribed drug list.
 *
 * Resolution order:
 *   1. OpenFDA label API → raw warnings (context only)
 *   2. Groq LLM           → authoritative bilingual clinical assessment
 *   3. Curated static list → last-resort safety net (only if Groq fails)
 *
 * OpenFDA is treated as an evidence source that *enriches* the Groq call, not
 * as the final authority — its label search misses many real interactions and
 * returns 404 for clean pairs, which must not be treated as an error.
 */

// --- Tier 3: curated static fallback ----------------------------------------
// Used only when Groq is unavailable. Different shape (drug1/drug2/minor…) from
// the canonical DrugInteraction, so it is remapped at retrieval time.

interface StaticInteraction {
  drug1: string;
  drug2: string;
  severity: 'minor' | 'moderate' | 'major';
  description: string;
}

export const drugInteractions: StaticInteraction[] = [
  // Metformin interactions
  { drug1: 'metformin', drug2: 'furosemide', severity: 'moderate', description: 'Furosemide may increase metformin levels, risk of lactic acidosis. Monitor renal function.' },
  { drug1: 'metformin', drug2: 'diclofenac', severity: 'moderate', description: 'NSAIDs may reduce metformin effectiveness and affect kidney function.' },
  { drug1: 'metformin', drug2: 'atenolol', severity: 'minor', description: 'Beta-blockers may mask hypoglycemia symptoms. Monitor blood glucose.' },

  // Warfarin interactions
  { drug1: 'warfarin', drug2: 'aspirin', severity: 'major', description: 'Increased bleeding risk. Avoid combination unless absolutely necessary.' },
  { drug1: 'warfarin', drug2: 'diclofenac', severity: 'major', description: 'NSAIDs significantly increase bleeding risk with warfarin.' },
  { drug1: 'warfarin', drug2: 'ciprofloxacin', severity: 'major', description: 'Ciprofloxacin potentiates warfarin effect. Monitor INR closely.' },
  { drug1: 'warfarin', drug2: 'metronidazole', severity: 'major', description: 'Metronidazole potentiates warfarin effect. Monitor INR closely.' },
  { drug1: 'warfarin', drug2: 'omeprazole', severity: 'moderate', description: 'May slightly increase warfarin effect. Monitor INR.' },

  // ACE Inhibitor interactions
  { drug1: 'enalapril', drug2: 'spironolactone', severity: 'major', description: 'Risk of severe hyperkalemia. Monitor potassium levels closely.' },
  { drug1: 'ramipril', drug2: 'spironolactone', severity: 'major', description: 'Risk of severe hyperkalemia. Monitor potassium levels closely.' },
  { drug1: 'enalapril', drug2: 'furosemide', severity: 'moderate', description: 'Enhanced hypotensive effect. Monitor blood pressure.' },
  { drug1: 'ramipril', drug2: 'furosemide', severity: 'moderate', description: 'Enhanced hypotensive effect. Monitor blood pressure.' },
  { drug1: 'enalapril', drug2: 'diclofenac', severity: 'moderate', description: 'NSAIDs reduce antihypertensive effect of ACE inhibitors.' },
  { drug1: 'ramipril', drug2: 'diclofenac', severity: 'moderate', description: 'NSAIDs reduce antihypertensive effect of ACE inhibitors.' },

  // Statin interactions
  { drug1: 'atorvastatin', drug2: 'warfarin', severity: 'moderate', description: 'Atorvastatin may slightly increase INR. Monitor.' },
  { drug1: 'simvastatin', drug2: 'amlodipine', severity: 'moderate', description: 'Increased risk of myopathy/rhabdomyolysis. Limit simvastatin to 20mg.' },

  // Antibiotic interactions
  { drug1: 'ciprofloxacin', drug2: 'metformin', severity: 'moderate', description: 'Ciprofloxacin may enhance metformin effect. Monitor blood glucose.' },
  { drug1: 'azithromycin', drug2: 'warfarin', severity: 'moderate', description: 'May potentiate warfarin effect. Monitor INR.' },

  // Diuretic interactions
  { drug1: 'furosemide', drug2: 'diclofenac', severity: 'moderate', description: 'NSAIDs reduce diuretic effectiveness. Monitor fluid status.' },
  { drug1: 'furosemide', drug2: 'atenolol', severity: 'moderate', description: 'Enhanced hypotensive effect. Monitor blood pressure.' },
  { drug1: 'spironolactone', drug2: 'losartan', severity: 'major', description: 'Risk of severe hyperkalemia. Avoid combination or monitor potassium closely.' },

  // Clopidogrel interactions
  { drug1: 'clopidogrel', drug2: 'aspirin', severity: 'moderate', description: 'Increased bleeding risk. Use only when clinically indicated (e.g., DAPT after stent).' },
  { drug1: 'clopidogrel', drug2: 'omeprazole', severity: 'moderate', description: 'Omeprazole may reduce clopidogrel effectiveness. Consider pantoprazole instead.' },

  // Insulin interactions
  { drug1: 'insulin', drug2: 'atenolol', severity: 'moderate', description: 'Beta-blockers may mask hypoglycemia symptoms. Monitor blood glucose closely.' },

  // Digoxin interactions
  { drug1: 'digoxin', drug2: 'furosemide', severity: 'major', description: 'Furosemide-induced hypokalemia increases digoxin toxicity risk. Monitor potassium.' },
  { drug1: 'digoxin', drug2: 'spironolactone', severity: 'moderate', description: 'May increase digoxin levels. Monitor digoxin levels.' },
];

// --- Prompts ----------------------------------------------------------------

const GROQ_INTERACTION_PROMPT = `
You are a clinical pharmacology AI assistant for rural Bangladesh.
You receive a list of generic drugs prescribed together and, where available,
warnings extracted from the US FDA drug labels. Your job is to flag dangerous
drug-drug interactions for a patient with limited medical literacy.

Focus especially on: anticoagulants, NSAIDs, SSRIs, sedatives, antibiotics,
and antihypertensives.

Return ONLY valid JSON — no text outside the JSON object:
{
  "has_dangerous_interactions": boolean,
  "interactions": [
    {
      "drugs_involved": ["generic_a", "generic_b"],
      "severity": "Mild" | "Moderate" | "Severe" | "Critical",
      "mechanism_en": "string — short pharmacological reason",
      "risk_en": "string — what could happen, plain English",
      "risk_bn": "বাংলা string — সহজ বাংলায় কী হতে পারে",
      "recommendation_en": "string — what the patient should do",
      "recommendation_bn": "বাংলা string — রোগীর করণীয়"
    }
  ]
}

Rules:
- Only report interactions that are clinically meaningful — do not pad the list.
- If there are no meaningful interactions, return has_dangerous_interactions: false and an empty interactions array.
- Every recommendation must be actionable (see a doctor, do not combine, monitor, etc.).
- All Bengali fields must use simple, layperson-friendly language.
`;

// --- OpenFDA (tier 1: evidence gathering) -----------------------------------

const OPENFDA_BASE = 'https://api.fda.gov/drug/label.json';

/** Canonical DrugInteraction.severity values. */
const SEVERITIES = ['Mild', 'Moderate', 'Severe', 'Critical'] as const;

/** One drug pair, lowercased + sorted so (a,b) and (b,a) dedupe. */
interface DrugPair {
  a: string;
  b: string;
  key: string;
}

function makePairs(generics: string[]): DrugPair[] {
  const pairs: DrugPair[] = [];
  for (let i = 0; i < generics.length; i++) {
    for (let j = i + 1; j < generics.length; j++) {
      const [a, b] = [generics[i]!, generics[j]!].sort();
      pairs.push({ a: a!, b: b!, key: `${a}__${b}` });
    }
  }
  return pairs;
}

/**
 * Query OpenFDA for label warnings mentioning both drugs. A 404 means "no
 * matching label" — a valid "no interaction found" result, not an error.
 * Any other failure (5xx, network, malformed JSON) returns null so the pair is
 * simply skipped without aborting the batch.
 */
async function queryOpenFda(pair: DrugPair): Promise<string | null> {
  // Deepest-level network guard — never fire a fetch when offline.
  if (typeof window !== 'undefined' && !navigator.onLine) return null;

  const search = `drug_interactions:"${pair.a}"+AND+"${pair.b}"`;
  const url = `${OPENFDA_BASE}?search=${encodeURIComponent(
    search
  ).replace(/%2B/g, '+')}&limit=3`;

  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      // Serverless route — never let a hung FDA call block the response.
      next: { revalidate: 0 },
    });

    if (res.status === 404) return null; // clean: no interaction label found
    if (!res.ok) {
      console.warn('[drug-interaction] OpenFDA non-OK %d for %s+%s', res.status, pair.a, pair.b);
      return null;
    }

    const json = (await res.json()) as { results?: unknown[] };
    const results = Array.isArray(json.results) ? json.results : [];
    if (results.length === 0) return null;

    // Pull any free-text warnings/interactions fields to feed Groq as evidence.
    const snippets: string[] = [];
    for (const entry of results) {
      const obj = entry as Record<string, unknown>;
      for (const field of ['warnings', 'warnings_and_cautions', 'drug_interactions']) {
        const val = obj[field];
        if (Array.isArray(val)) {
          for (const s of val) if (typeof s === 'string') snippets.push(s);
        } else if (typeof val === 'string') {
          snippets.push(val);
        }
      }
    }
    return snippets.length > 0 ? snippets.join(' | ') : null;
  } catch (err) {
    console.warn('[drug-interaction] OpenFDA fetch failed for %s+%s:', pair.a, pair.b, err);
    return null;
  }
}

// --- Groq reasoning (tier 2: authoritative assessment) ----------------------

function isDrugInteractionArray(val: unknown): val is DrugInteraction[] {
  if (!Array.isArray(val)) return false;
  return val.every((item) => {
    if (typeof item !== 'object' || item === null) return false;
    const o = item as Record<string, unknown>;
    return (
      Array.isArray(o['drugs_involved']) &&
      o['drugs_involved'].length === 2 &&
      typeof o['risk_en'] === 'string' &&
      typeof o['risk_bn'] === 'string' &&
      typeof o['recommendation_en'] === 'string' &&
      typeof o['recommendation_bn'] === 'string' &&
      typeof o['severity'] === 'string' &&
      (SEVERITIES as readonly string[]).includes(o['severity'])
    );
  });
}

/**
 * Coerce Groq's response into a clean {@link DrugInteraction}[], dropping
 * malformed entries rather than failing the whole batch.
 */
function coerceInteractions(raw: unknown): DrugInteraction[] {
  const o = (raw ?? {}) as Record<string, unknown>;
  const interactions = o['interactions'];
  if (!isDrugInteractionArray(interactions)) {
    // Best-effort: keep any entries that pass validation, drop the rest.
    if (Array.isArray(interactions)) {
      return interactions.filter((i) =>
        isDrugInteractionArray([i])
      ) as DrugInteraction[];
    }
    return [];
  }
  // Attach optional mechanism_en where present and well-typed.
  return interactions.map((i) => {
    const raw = i as unknown as Record<string, unknown>;
    const mechanism =
      typeof raw['mechanism_en'] === 'string' && raw['mechanism_en'].trim()
        ? (raw['mechanism_en'] as string)
        : undefined;
    return mechanism ? { ...i, mechanism_en: mechanism } : i;
  });
}

// --- Tier 3: curated static fallback ----------------------------------------

function lookupStaticInteractions(generics: string[]): DrugInteraction[] {
  const lower = new Set(generics.map((g) => g.toLowerCase()));
  const out: DrugInteraction[] = [];
  for (const s of drugInteractions) {
    if (lower.has(s.drug1) && lower.has(s.drug2)) {
      out.push({
        drugs_involved: [s.drug1, s.drug2],
        severity:
          s.severity === 'major'
            ? 'Severe'
            : s.severity === 'moderate'
              ? 'Moderate'
              : 'Mild',
        mechanism_en: s.description,
        risk_en: s.description,
        risk_bn: s.description, // static data is English-only; Groq provides Bengali
        recommendation_en:
          s.severity === 'major'
            ? 'Consult a doctor before taking these together.'
            : 'Mention this combination to your doctor or pharmacist.',
        recommendation_bn:
          s.severity === 'major'
            ? 'এই ওষুধগুলো একসাথে খাওয়ার আগে ডাক্তারের পরামর্শ নিন।'
            : 'আপনার ডাক্তার বা ফার্মাসিস্টকে এই সমন্বয় সম্পর্কে জানান।',
      });
    }
  }
  return out;
}

// --- Public API -------------------------------------------------------------

/**
 * Screen a list of co-prescribed generic drugs for dangerous interactions.
 *
 * Pipeline:
 *   1. Query OpenFDA per drug pair (in parallel) to gather label warnings.
 *   2. Send the full drug list + gathered FDA evidence to Groq for a single
 *      authoritative, bilingual clinical assessment.
 *   3. If Groq fails, fall back to the curated static interaction list.
 *
 * With fewer than 2 drugs there are no pairs, so an empty array is returned.
 *
 * @param genericNames lowercase INN generic names (e.g. ["warfarin","ibuprofen"])
 * @returns clinically meaningful interactions, or an empty array if none found
 */
export async function checkDrugInteractions(
  genericNames: string[]
): Promise<DrugInteraction[]> {
  const generics = Array.from(
    new Set(genericNames.map((g) => g.toLowerCase().trim()).filter(Boolean))
  );
  if (generics.length < 2) return [];

  // Network guard — even if called from a client path that forgot to check,
  // never fire fetches when offline.
  if (typeof window !== 'undefined' && !navigator.onLine) return [];

  const pairs = makePairs(generics);

  // Tier 1 — gather OpenFDA evidence per pair (non-fatal on failure).
  const evidenceResults = await Promise.allSettled(pairs.map(queryOpenFda));
  const fdaEvidence: string[] = [];
  for (let i = 0; i < pairs.length; i++) {
    const r = evidenceResults[i];
    if (r?.status === 'fulfilled' && r.value) {
      fdaEvidence.push(`${pairs[i]!.a} + ${pairs[i]!.b}: ${r.value}`);
    }
  }

  // Tier 2 — one Groq call over the whole list + FDA evidence.
  try {
    const drugList = generics.join(', ');
    const evidenceBlock =
      fdaEvidence.length > 0
        ? `\n\nFDA label evidence (use this, but apply clinical judgment):\n${fdaEvidence.join('\n')}`
        : '\n\n(No FDA label matches were found — rely on your pharmacology knowledge.)';

    const raw = await callGroq(
      `These drugs are prescribed together on a Bangladeshi prescription: ${drugList}.${evidenceBlock}`,
      GROQ_INTERACTION_PROMPT
    );
    const interactions = coerceInteractions(raw);
    if (interactions.length > 0) return interactions;

    // Groq found nothing meaningful. That's a valid "no interactions" result —
    // but double-check the static list as a safety net before returning empty.
    const staticHits = lookupStaticInteractions(generics);
    return staticHits;
  } catch (err) {
    console.warn('[drug-interaction] Groq failed, using static fallback:', err);

    // Tier 3 — curated static list (only the pairs present in the prescription).
    return lookupStaticInteractions(generics);
  }
}

// --- Backward-compatible export (pre-existing API, different shape) ---------

/**
 * Synchronous lookup against the curated static interaction list. Returns the
 * legacy shape (drug1/drug2/minor|moderate|major), NOT the canonical
 * DrugInteraction — kept for any older callers.
 *
 * @deprecated Prefer {@link checkDrugInteractions} for the live pipeline.
 */
export function checkInteractions(
  drugs: string[]
): { drug1: string; drug2: string; severity: 'minor' | 'moderate' | 'major'; description: string }[] {
  return drugInteractions.filter(
    (interaction) =>
      drugs.includes(interaction.drug1) && drugs.includes(interaction.drug2)
  );
}

export type { DrugInteraction };
