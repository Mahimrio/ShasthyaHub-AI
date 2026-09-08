import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ChatAgent, ScopedChatContext } from '@/types'

/**
 * Validation + serialization of the page state that the scoped composers send
 * along with each message. Serialized in English only: Bengali tokenizes at
 * roughly one token per character and would eat the Groq 8K TPM budget.
 */

const str = (max: number) => z.string().default('').transform((v) => v.trim().slice(0, max))
const strList = (max: number, itemMax = 200) => z.array(str(itemMax)).max(max).default([])

const scriptGuardSchema = z.object({
  agent: z.literal('scriptguard'),
  drugs: z
    .array(
      z.object({
        brand_name: str(120),
        generic_name: str(120),
        drug_class: str(80),
        dosage: str(80),
        frequency: str(80),
        duration: str(80),
        instructions: str(200),
      })
    )
    .max(12),
  interactions: z
    .array(
      z.object({
        drugs_involved: z.tuple([str(120), str(120)]),
        severity: z.enum(['Mild', 'Moderate', 'Severe', 'Critical']),
        risk_en: str(400),
        recommendation_en: str(400),
      })
    )
    .max(8),
  has_dangerous_interactions: z.boolean(),
  schedule: z.object({
    morning: strList(12, 120),
    afternoon: strList(12, 120),
    evening: strList(12, 120),
    night: strList(12, 120),
  }),
  duration_days: z.number().int().min(0).max(365).catch(0),
  special_instructions_en: strList(10),
})

const glycoVisionSchema = z.object({
  agent: z.literal('glycovision'),
  items: z
    .array(
      z.object({
        name_en: str(120),
        estimated_grams: z.number().min(0).catch(0),
        calories: z.number().min(0).catch(0),
        carbs_g: z.number().min(0).catch(0),
        protein_g: z.number().min(0).catch(0),
        fat_g: z.number().min(0).catch(0),
      })
    )
    .max(15),
  total_calories: z.number().min(0).catch(0),
  total_carbs_g: z.number().min(0).catch(0),
  total_protein_g: z.number().min(0).catch(0),
  total_fat_g: z.number().min(0).catch(0),
  glycemic_load: z.number().min(0).catch(0),
  risk_level: z.enum(['Green', 'Yellow', 'Red']),
  risk_summary_en: str(400),
  chronic_disease_risks: z
    .array(z.object({ disease_en: str(80), status: z.enum(['Safe', 'Caution', 'Danger']) }))
    .max(8),
  meal_modifications: strList(8, 240),
})

const lokhonSchema = z.object({
  agent: z.literal('lokhon'),
  disease_slug: str(60),
  disease_name_en: str(120),
  disease_description_en: str(400).nullable(),
  current_question_en: str(300).optional(),
  questions_en: strList(15, 300).optional(),
  result: z
    .object({
      risk_band: z.enum(['Low', 'Moderate', 'High', 'Urgent']),
      risk_percentage: z.number().min(0).max(100).optional(),
      is_red_flag: z.boolean(),
      advice_en: str(600),
      doctor_type_en: str(120),
      urgency: str(80),
      top_symptoms_en: strList(6, 200),
      requires_immediate_support: z.boolean(),
    })
    .optional(),
})

export const scopedContextSchema = z.discriminatedUnion('agent', [scriptGuardSchema, glycoVisionSchema, lokhonSchema])

export const chatAgentSchema = z.enum(['scriptguard', 'glycovision', 'lokhon'])

const round = (n: number) => Math.round(n)

/** What the assistant can talk about before any analysis exists on the page. */
export function describeIdleContext(agent: ChatAgent): string {
  switch (agent) {
    case 'scriptguard':
      return 'No prescription has been analysed on this page yet. Help the user understand what ScriptGuard does (reads a prescription photo, maps brand names to generics, builds a daily schedule, and flags drug interactions), how to photograph a prescription clearly, and what the results will show. Do not invent medicines.'
    case 'glycovision':
      return 'No meal has been analysed on this page yet. Help the user understand what GlycoVision does (estimates calories, carbs, protein, fat and glycemic load from a plate photo, and flags diabetes/BP/heart risk), how to photograph a plate from above, and how to read the results. Do not invent a meal.'
    case 'lokhon':
      return 'The user has not started or finished a Lokhon screening on this page yet. Explain how the questionnaire works (answer each statement 1 to 5, the app weighs the answers into a risk band), and that it is a screening aid, not a diagnosis.'
  }
}

export function serializeScopedContext(ctx: ScopedChatContext): string {
  switch (ctx.agent) {
    case 'scriptguard': {
      const meds = ctx.drugs.map((d, i) => {
        const generic = [d.generic_name, d.drug_class].filter(Boolean).join(', ')
        const regimen = [d.dosage, d.frequency, d.duration].filter(Boolean).join(', ')
        return `${i + 1}. ${d.brand_name || d.generic_name || 'Unreadable'}${generic ? ` (${generic})` : ''}${regimen ? ` — ${regimen}` : ''}${d.instructions ? `. ${d.instructions}` : ''}`
      })
      const interactions =
        ctx.interactions.length === 0
          ? 'Interactions found: none.'
          : `Interactions found: ${ctx.interactions.length} (dangerous: ${ctx.has_dangerous_interactions ? 'YES' : 'no'})\n` +
            ctx.interactions
              .map((x) => `- ${x.drugs_involved[0]} + ${x.drugs_involved[1]} — ${x.severity}: ${x.risk_en}${x.recommendation_en ? ` Advice: ${x.recommendation_en}` : ''}`)
              .join('\n')
      const slot = (list: string[]) => (list.length ? list.join(', ') : '—')
      return [
        'Current prescription analysis (ScriptGuard):',
        `Medicines (${ctx.drugs.length}):`,
        ...meds,
        interactions,
        `Daily schedule — morning: ${slot(ctx.schedule.morning)}; afternoon: ${slot(ctx.schedule.afternoon)}; evening: ${slot(ctx.schedule.evening)}; night: ${slot(ctx.schedule.night)}. Duration: ${ctx.duration_days || 'unknown'} days.`,
        ctx.special_instructions_en.length ? `Special instructions: ${ctx.special_instructions_en.join(' | ')}` : '',
      ]
        .filter(Boolean)
        .join('\n')
    }
    case 'glycovision': {
      const items = ctx.items.map(
        (i) => `- ${i.name_en} ${round(i.estimated_grams)} g — ${round(i.calories)} kcal (carbs ${round(i.carbs_g)} g, protein ${round(i.protein_g)} g, fat ${round(i.fat_g)} g)`
      )
      return [
        'Current meal analysis (GlycoVision):',
        `Items (${ctx.items.length}):`,
        ...items,
        `Totals: ${round(ctx.total_calories)} kcal, carbs ${round(ctx.total_carbs_g)} g, protein ${round(ctx.total_protein_g)} g, fat ${round(ctx.total_fat_g)} g. Glycemic load: ${round(ctx.glycemic_load)} (risk level ${ctx.risk_level}).`,
        ctx.risk_summary_en ? `App summary: ${ctx.risk_summary_en}` : '',
        ctx.chronic_disease_risks.length
          ? `Chronic-disease flags: ${ctx.chronic_disease_risks.map((r) => `${r.disease_en} — ${r.status}`).join('; ')}`
          : '',
        ctx.meal_modifications.length ? `App suggestions:\n${ctx.meal_modifications.map((m) => `- ${m}`).join('\n')}` : '',
      ]
        .filter(Boolean)
        .join('\n')
    }
    case 'lokhon': {
      const head = `Lokhon screening: ${ctx.disease_name_en}${ctx.disease_description_en ? ` — ${ctx.disease_description_en}` : ''}`
      if (!ctx.result) {
        return [
          head,
          ctx.current_question_en ? `The user is currently answering: "${ctx.current_question_en}"` : '',
          ctx.questions_en?.length ? `All statements in this screening:\n${ctx.questions_en.map((q, i) => `${i + 1}. ${q}`).join('\n')}` : '',
          'No result yet — the user has not finished the questionnaire.',
        ]
          .filter(Boolean)
          .join('\n')
      }
      const r = ctx.result
      const isDepression = ctx.disease_slug === 'depression'
      return [
        `${head} — RESULT`,
        `Risk band: ${r.risk_band}${!isDepression && typeof r.risk_percentage === 'number' ? ` (score ${round(r.risk_percentage)}%)` : isDepression ? ' (no score is shown for this screening)' : ''}`,
        `Red-flag symptoms present: ${r.is_red_flag ? 'YES' : 'no'}`,
        r.top_symptoms_en.length ? `Symptoms the user flagged most: ${r.top_symptoms_en.join('; ')}` : '',
        `App advice: ${r.advice_en}`,
        `Doctor type: ${r.doctor_type_en}. Urgency: ${r.urgency}.`,
        r.requires_immediate_support ? 'IMMEDIATE SUPPORT REQUIRED — Shuchona helpline 16463.' : '',
      ]
        .filter(Boolean)
        .join('\n')
    }
  }
}

/** One-line summaries of the user's earlier results from the same agent. */
export async function fetchAgentHistory(
  supabase: SupabaseClient,
  userId: string,
  agent: ChatAgent,
  excludeId?: string | null
): Promise<string[]> {
  const day = (iso: string) => iso.slice(0, 10)
  const lines: string[] = []
  try {
    if (agent === 'scriptguard') {
      const { data } = await supabase
        .from('prescription_analyses')
        .select('id, extracted_drugs, has_dangerous_interactions, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(4)
      for (const row of data ?? []) {
        if (row.id === excludeId) continue
        const drugs = ((row.extracted_drugs ?? []) as { brand_name?: string; generic_name?: string }[])
          .map((d) => d.brand_name || d.generic_name)
          .filter(Boolean)
        lines.push(`- [${day(row.created_at)}] ${drugs.length} medicines (${drugs.slice(0, 6).join(', ') || 'unreadable'}) — dangerous interactions: ${row.has_dangerous_interactions ? 'yes' : 'no'}`)
      }
    } else if (agent === 'glycovision') {
      const { data } = await supabase
        .from('food_analyses')
        .select('id, total_calories, glycemic_load, risk_level, identified_items, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(4)
      for (const row of data ?? []) {
        if (row.id === excludeId) continue
        const items = ((row.identified_items ?? []) as { name_en?: string }[]).map((i) => i.name_en).filter(Boolean)
        lines.push(`- [${day(row.created_at)}] ${round(row.total_calories ?? 0)} kcal, glycemic load ${round(row.glycemic_load ?? 0)}, risk ${row.risk_level ?? 'n/a'} — ${items.slice(0, 5).join(', ') || 'items unknown'}`)
      }
    } else {
      const { data } = await supabase
        .from('lokhon_analyses')
        .select('id, disease_slug, risk_band, risk_percentage, is_red_flag, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(4)
      for (const row of data ?? []) {
        if (row.id === excludeId) continue
        const score = row.disease_slug === 'depression' || row.risk_percentage == null ? '' : ` (${round(row.risk_percentage)}%)`
        lines.push(`- [${day(row.created_at)}] ${row.disease_slug} screening: band ${row.risk_band ?? 'n/a'}${score}, red flag: ${row.is_red_flag ? 'yes' : 'no'}`)
      }
    }
  } catch (e) {
    console.warn('[chat-scoped] history fetch failed:', e)
  }
  return lines.slice(0, 3)
}
