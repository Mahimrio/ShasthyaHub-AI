import { callGroq } from '@/lib/ai/groq';
import type { ExtractedMedication, MedicationSchedule, ScheduleSlot } from '@/types';

/**
 * Medication schedule generator for ScriptGuard.
 *
 * Converts an extracted drug list into a clear daily schedule with a Bengali
 * audio script for `window.speechSynthesis({ lang: 'bn-BD' })`.
 *
 * Resolution order:
 *   1. Groq LLM  → natural, flowing Bengali audio + structured slots
 *   2. Local deterministic parser → parses frequency codes (1+0+1, BD, TDS…)
 *      and emits a generic canned audio script. Never throws.
 */

// --- Prompt -----------------------------------------------------------------

const SCHEDULE_PROMPT = `
You are a pharmacist AI for rural Bangladesh.
Convert this prescription drug list into a clear daily medication schedule.
Frequency codes: BD=twice daily, TDS=three times, QID=four times,
1+0+1=morning+night, 1+1+1=morning+noon+night, 0+0+1=night only, etc.
Return ONLY JSON:
{
  "schedule": {
    "morning":   [{ "drug_en": "string", "drug_bn": "string", "dosage": "string",
                    "instructions_en": "string", "instructions_bn": "string" }],
    "afternoon": [...],
    "evening":   [...],
    "night":     [...]
  },
  "duration_days": integer,
  "special_instructions_en": ["string"],
  "special_instructions_bn": ["string"],
  "audio_script_bn": "string — a single paragraph in Bengali that reads the full
    schedule aloud naturally, as a pharmacist would explain it to a patient.
    Write flowing, grammatically correct Bangla suitable for text-to-speech.
    Example: 'সকালে আপনার ওষুধ হলো: সেকলো বড়ি একটি খাবেন খাবার পরে। রাতে...'"
}
Rules:
- drug_bn must be the Bangladeshi brand name; drug_en the generic/English name.
- Every instructions_bn must use simple layperson Bengali.
- audio_script_bn MUST be one natural paragraph, no English, no markdown,
  readable aloud with no abbreviation or Latin terms.
- If a drug has no clear time slot, place it in the morning slot.
Do not include any explanatory text outside the JSON object.`;

// --- Type guarding ----------------------------------------------------------

const SLOT_KEYS: ReadonlyArray<keyof ScheduleSlot> = [
  'drug_en',
  'drug_bn',
  'dosage',
  'instructions_en',
  'instructions_bn',
];

type SlotKey = 'morning' | 'afternoon' | 'evening' | 'night';

/** Validate that a value is a well-shaped ScheduleSlot. */
function isScheduleSlot(val: unknown): val is ScheduleSlot {
  if (typeof val !== 'object' || val === null) return false;
  const o = val as Record<string, unknown>;
  return SLOT_KEYS.every((k) => typeof o[k] === 'string');
}

function asSlotArray(val: unknown): ScheduleSlot[] {
  return Array.isArray(val) ? val.filter(isScheduleSlot) : [];
}

/**
 * Narrow Groq's raw response into a well-typed MedicationSchedule with safe
 * defaults. Returns null if the structure is unusable (caller falls back to the
 * local parser). Mirrors the coercion style used in drug-interaction.ts.
 */
function coerceSchedule(raw: unknown): MedicationSchedule | null {
  const o = (raw ?? {}) as Record<string, unknown>;
  // The spec's JSON wraps the slots under a "schedule" key.
  const scheduleObj = (o['schedule'] ?? o) as Record<string, unknown>;

  const slots = {
    morning: asSlotArray(scheduleObj['morning']),
    afternoon: asSlotArray(scheduleObj['afternoon']),
    evening: asSlotArray(scheduleObj['evening']),
    night: asSlotArray(scheduleObj['night']),
  } satisfies Pick<MedicationSchedule, 'morning' | 'afternoon' | 'evening' | 'night'>;

  const totalSlots =
    slots.morning.length + slots.afternoon.length + slots.evening.length + slots.night.length;

  const durationRaw = o['duration_days'];
  const duration_days =
    typeof durationRaw === 'number' && Number.isFinite(durationRaw)
      ? Math.max(0, Math.round(durationRaw))
      : 0;

  const audio = o['audio_script_bn'];
  const audio_script_bn = typeof audio === 'string' && audio.trim() ? audio.trim() : '';

  const stringArr = (key: string): string[] =>
    Array.isArray(o[key]) ? o[key].filter((s): s is string => typeof s === 'string') : [];

  // If Groq gave us no slots at all AND no audio, the response is unusable.
  if (totalSlots === 0 && !audio_script_bn) return null;

  return {
    ...slots,
    duration_days,
    special_instructions_en: stringArr('special_instructions_en'),
    special_instructions_bn: stringArr('special_instructions_bn'),
    audio_script_bn,
  };
}

// --- Local deterministic fallback -------------------------------------------

/**
 * Map of frequency tokens → which day-parts they cover.
 *   morning / afternoon(evening) / night
 */
const FREQ_TO_SLOTS: { pattern: RegExp; slots: SlotKey[] }[] = [
  // Numeric shorthand: 1+0+1 (morning+night), 1+1+1 (morning+noon+night), 0+0+1
  { pattern: /^1\+0\+1$/i, slots: ['morning', 'night'] },
  { pattern: /^0\+1\+1$/i, slots: ['afternoon', 'night'] },
  { pattern: /^1\+1\+0$/i, slots: ['morning', 'afternoon'] },
  { pattern: /^0\+0\+1$/i, slots: ['night'] },
  { pattern: /^1\+0\+0$/i, slots: ['morning'] },
  { pattern: /^0\+0\+0\+1$/i, slots: ['night'] },
  { pattern: /^1\+1\+1\+1$/i, slots: ['morning', 'afternoon', 'evening', 'night'] },
  { pattern: /^1\+1\+1$/i, slots: ['morning', 'afternoon', 'night'] },
  // Word codes
  { pattern: /^(bd|b\.d\.|1\+0\+1|bid)$/i, slots: ['morning', 'night'] },
  { pattern: /^(tds|t\.d\.s\.|tid)$/i, slots: ['morning', 'afternoon', 'night'] },
  { pattern: /^(qid|q\.i\.d\.)$/i, slots: ['morning', 'afternoon', 'evening', 'night'] },
  { pattern: /^(qd|o\.d\.|once daily)$/i, slots: ['morning'] },
  { pattern: /^(hs|at bedtime|night only| nocte)$/i, slots: ['night'] },
  { pattern: /^(prn|as needed|sos)$/i, slots: ['morning'] },
];

/** Decide which day-parts a drug belongs to from its frequency string. */
function slotsForFrequency(frequency: string): SlotKey[] {
  const f = frequency.trim();
  if (!f) return ['morning']; // default placement
  for (const { pattern, slots } of FREQ_TO_SLOTS) {
    if (pattern.test(f)) return slots;
  }
  // Last resort: any "1" digits in positions morning/noon/night notation.
  const digits = f.match(/[01]/g);
  if (digits && digits.length >= 2) {
    const map: SlotKey[] = ['morning', 'afternoon', 'night'];
    const picked = digits
      .slice(0, 3)
      .map((d, i) => (d === '1' ? map[i] ?? 'morning' : null))
      .filter((s): s is SlotKey => s !== null);
    if (picked.length > 0) return Array.from(new Set(picked));
  }
  return ['morning'];
}

/** Parse the first integer out of a duration string ("7 days", "x2/2 wks"). */
function parseDurationDays(duration: string): number {
  const m = duration.match(/\d+/);
  return m ? Math.max(0, parseInt(m[0]!, 10)) : 0;
}

/**
 * Build a best-effort schedule from the extracted drugs without any LLM call.
 * Parses frequency codes, derives duration, and emits a generic audio line that
 * is safe to speak aloud.
 */
function buildScheduleLocally(mappedDrugs: ExtractedMedication[]): MedicationSchedule {
  const slots: Record<SlotKey, ScheduleSlot[]> = {
    morning: [],
    afternoon: [],
    evening: [],
    night: [],
  };

  let duration_days = 0;
  for (const drug of mappedDrugs) {
    duration_days = duration_days || parseDurationDays(drug.duration);
    const dayParts = slotsForFrequency(drug.frequency);
    const slot: ScheduleSlot = {
      drug_en: drug.generic_name || drug.brand_name || drug.written_text,
      drug_bn: drug.brand_name || drug.written_text,
      dosage: drug.dosage,
      instructions_en: drug.instructions || 'Take as directed by your doctor.',
      instructions_bn: drug.instructions
        ? drug.instructions
        : 'ডাক্তারের নির্দেশ অনুযায়ী খাবেন।',
    };
    for (const part of dayParts) slots[part].push(slot);
  }

  const count = mappedDrugs.length;
  const audio_script_bn = buildCannedAudioBn(count, duration_days);

  return {
    morning: slots.morning,
    afternoon: slots.afternoon,
    evening: slots.evening,
    night: slots.night,
    duration_days,
    special_instructions_en: [],
    special_instructions_bn: [],
    audio_script_bn,
  };
}

/**
 * Generic, always-valid Bengali audio script. Used only when Groq is unavailable
 * — it announces how many drugs were found and the course duration, then reminds
 * the patient to follow the printed schedule.
 */
function buildCannedAudioBn(drugCount: number, durationDays: number): string {
  const bnDigits = (n: number) =>
    n.toLocaleString('bn-BD', { useGrouping: false, maximumFractionDigits: 0 });
  const countBn = bnDigits(drugCount);
  const durationPart =
    durationDays > 0
      ? ` মোট ${bnDigits(durationDays)} দিনের জন্য।`
      : '';
  return `আপনার জন্য মোট ${countBn} টি ওষুধ নির্ধারিত হয়েছে।${durationPart} প্রতিটি ওষুধ নির্দিষ্ট সময়ে এবং ডাক্তারের নির্দেশ অনুযায়ী খাবেন। কোনো সমস্যা হলে ডাক্তার বা ফার্মাসিস্টের সাথে কথা বলুন।`;
}

// --- Public API -------------------------------------------------------------

/**
 * Generate a daily medication schedule (with a Bengali audio script) from an
 * extracted prescription drug list.
 *
 * Tries Groq first for natural, flowing Bengali. If Groq fails or returns a
 * structurally invalid response, falls back to a local deterministic parser
 * that interprets Bangladeshi frequency codes (1+0+1, BD, TDS, QID…) and emits
 * a generic canned audio script. The function never throws.
 *
 * @param mappedDrugs enriched medications from the mapping pipeline
 * @returns a complete MedicationSchedule, always valid (possibly with a canned audio)
 */
export async function generateMedicationSchedule(
  mappedDrugs: ExtractedMedication[]
): Promise<MedicationSchedule> {
  // Empty prescription — nothing to schedule. Avoids a pointless Groq call.
  if (mappedDrugs.length === 0) {
    return buildScheduleLocally([]);
  }

  try {
    const userContent = mappedDrugs
      .map(
        (d, i) =>
          `${i + 1}. ${d.brand_name || d.written_text} | generic: ${d.generic_name} | ` +
          `dosage: ${d.dosage || 'n/a'} | frequency: ${d.frequency || 'n/a'} | ` +
          `duration: ${d.duration || 'n/a'} | instructions: ${d.instructions || 'n/a'}`
      )
      .join('\n');

    const raw = await callGroq(
      `Prescription drug list — convert into a daily schedule:\n${userContent}`,
      SCHEDULE_PROMPT
    );
    const schedule = coerceSchedule(raw);
    if (schedule) return schedule;

    console.warn('[schedule] Groq returned an unusable schedule, falling back to local parser.');
  } catch (err) {
    console.warn('[schedule] Groq call failed, falling back to local parser:', err);
  }

  return buildScheduleLocally(mappedDrugs);
}
