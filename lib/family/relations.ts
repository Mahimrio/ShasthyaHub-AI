import type { RelationType } from '@/types'

export interface RelationMetadata {
  type: RelationType | string
  labelEn: string
  labelBn: string
  reciprocalDefault: string
  generation: number // -2 to 2
  category: 'ancestor' | 'peer' | 'descendant' | 'care'
  badgeColor: string
}

export const RELATIONS_MAP: Record<string, RelationMetadata> = {
  Grandfather: {
    type: 'Grandfather',
    labelEn: 'Grandfather',
    labelBn: 'দাদা / নানা',
    reciprocalDefault: 'Grandson',
    generation: -2,
    category: 'ancestor',
    badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  },
  Grandmother: {
    type: 'Grandmother',
    labelEn: 'Grandmother',
    labelBn: 'দাদী / নানী',
    reciprocalDefault: 'Granddaughter',
    generation: -2,
    category: 'ancestor',
    badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  },
  Father: {
    type: 'Father',
    labelEn: 'Father',
    labelBn: 'বাবা',
    reciprocalDefault: 'Son',
    generation: -1,
    category: 'ancestor',
    badgeColor: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800',
  },
  Mother: {
    type: 'Mother',
    labelEn: 'Mother',
    labelBn: 'মা',
    reciprocalDefault: 'Son',
    generation: -1,
    category: 'ancestor',
    badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800',
  },
  Uncle: {
    type: 'Uncle',
    labelEn: 'Uncle',
    labelBn: 'চাচা / মামা / ফুফা',
    reciprocalDefault: 'Nephew',
    generation: -1,
    category: 'ancestor',
    badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
  },
  Aunt: {
    type: 'Aunt',
    labelEn: 'Aunt',
    labelBn: 'চাচী / খালা / ফুফু',
    reciprocalDefault: 'Niece',
    generation: -1,
    category: 'ancestor',
    badgeColor: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-800',
  },
  Guardian: {
    type: 'Guardian',
    labelEn: 'Guardian',
    labelBn: 'অভিভাবক',
    reciprocalDefault: 'Other',
    generation: -1,
    category: 'care',
    badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  },
  Husband: {
    type: 'Husband',
    labelEn: 'Husband',
    labelBn: 'স্বামী',
    reciprocalDefault: 'Wife',
    generation: 0,
    category: 'peer',
    badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  },
  Wife: {
    type: 'Wife',
    labelEn: 'Wife',
    labelBn: 'স্ত্রী',
    reciprocalDefault: 'Husband',
    generation: 0,
    category: 'peer',
    badgeColor: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-800',
  },
  Brother: {
    type: 'Brother',
    labelEn: 'Brother',
    labelBn: 'ভাই',
    reciprocalDefault: 'Brother',
    generation: 0,
    category: 'peer',
    badgeColor: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800',
  },
  Sister: {
    type: 'Sister',
    labelEn: 'Sister',
    labelBn: 'বোন',
    reciprocalDefault: 'Sister',
    generation: 0,
    category: 'peer',
    badgeColor: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-800',
  },
  Cousin: {
    type: 'Cousin',
    labelEn: 'Cousin',
    labelBn: 'কাজিন',
    reciprocalDefault: 'Cousin',
    generation: 0,
    category: 'peer',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  },
  Caregiver: {
    type: 'Caregiver',
    labelEn: 'Caregiver',
    labelBn: 'সেবাকারী / যত্নকারী',
    reciprocalDefault: 'Other',
    generation: 0,
    category: 'care',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  },
  Son: {
    type: 'Son',
    labelEn: 'Son',
    labelBn: 'ছেলে',
    reciprocalDefault: 'Father',
    generation: 1,
    category: 'descendant',
    badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  },
  Daughter: {
    type: 'Daughter',
    labelEn: 'Daughter',
    labelBn: 'মেয়ে',
    reciprocalDefault: 'Father',
    generation: 1,
    category: 'descendant',
    badgeColor: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-800',
  },
  Grandson: {
    type: 'Grandson',
    labelEn: 'Grandson',
    labelBn: 'নাতি',
    reciprocalDefault: 'Grandfather',
    generation: 2,
    category: 'descendant',
    badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  },
  Granddaughter: {
    type: 'Granddaughter',
    labelEn: 'Granddaughter',
    labelBn: 'নাতনি',
    reciprocalDefault: 'Grandmother',
    generation: 2,
    category: 'descendant',
    badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  },
  Other: {
    type: 'Other',
    labelEn: 'Family Member',
    labelBn: 'পারিবারিক সদস্য',
    reciprocalDefault: 'Other',
    generation: 0,
    category: 'peer',
    badgeColor: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800',
  },
}

export function inferGenerationFromRelation(relation: string): number {
  if (RELATIONS_MAP[relation]) {
    return RELATIONS_MAP[relation].generation
  }

  const lower = relation.toLowerCase()

  // Grandparents (-2)
  if (lower.includes('dada') || lower.includes('dadi') || lower.includes('nana') || lower.includes('nani') || lower.includes('grand')) {
    if (lower.includes('son') || lower.includes('daughter') || lower.includes('child') || lower.includes('nati') || lower.includes('natni')) {
      return 2
    }
    return -2
  }

  // Parents / Elders (-1)
  if (
    lower.includes('baba') || lower.includes('ma') || lower.includes('father') || lower.includes('mother') ||
    lower.includes('uncle') || lower.includes('aunt') || lower.includes('chacha') || lower.includes('chachi') ||
    lower.includes('kaku') || lower.includes('kaki') || lower.includes('mama') || lower.includes('mami') ||
    lower.includes('fupu') || lower.includes('fufa') || lower.includes('khala') || lower.includes('khalu') ||
    lower.includes('shoshur') || lower.includes('shashuri') || lower.includes('in-law') || lower.includes('guardian')
  ) {
    return -1
  }

  // Children / Descendants (+1)
  if (
    lower.includes('son') || lower.includes('daughter') || lower.includes('chele') || lower.includes('meye') ||
    lower.includes('nephew') || lower.includes('niece') || lower.includes('bhatija') || lower.includes('bhatiji') ||
    lower.includes('bhagne') || lower.includes('bhagni')
  ) {
    return 1
  }

  // Grandchildren (+2)
  if (lower.includes('nati') || lower.includes('natni') || lower.includes('grandchild')) {
    return 2
  }

  // Default: Peers / Same generation (0)
  return 0
}

export function getReciprocalRelation(relation: string): string {
  if (RELATIONS_MAP[relation]) {
    return RELATIONS_MAP[relation].reciprocalDefault
  }
  const gen = inferGenerationFromRelation(relation)
  if (gen === -1) return 'Son / Daughter'
  if (gen === 1) return 'Father / Mother'
  if (gen === -2) return 'Grandchild'
  if (gen === 2) return 'Grandparent'
  return 'Other'
}

export function getRelationLabel(relation: string, lang: 'en' | 'bn'): string {
  if (!relation) return lang === 'bn' ? 'সদস্য' : 'Member'
  const meta = RELATIONS_MAP[relation]
  if (meta) {
    return lang === 'bn' ? meta.labelBn : meta.labelEn
  }
  // Return custom relation text directly
  return relation
}

export const ALL_RELATION_OPTIONS: { value: string; labelEn: string; labelBn: string; generation: number }[] = [
  // Generation -2
  { value: 'Grandfather', labelEn: 'Grandfather', labelBn: 'দাদা / নানা', generation: -2 },
  { value: 'Grandmother', labelEn: 'Grandmother', labelBn: 'দাদী / নানী', generation: -2 },
  // Generation -1
  { value: 'Father', labelEn: 'Father', labelBn: 'বাবা', generation: -1 },
  { value: 'Mother', labelEn: 'Mother', labelBn: 'মা', generation: -1 },
  { value: 'Uncle', labelEn: 'Uncle', labelBn: 'চাচা / মামা / ফুফা', generation: -1 },
  { value: 'Aunt', labelEn: 'Aunt', labelBn: 'চাচী / খালা / ফুফু', generation: -1 },
  { value: 'Guardian', labelEn: 'Guardian', labelBn: 'অভিভাবক', generation: -1 },
  // Generation 0
  { value: 'Husband', labelEn: 'Husband', labelBn: 'স্বামী', generation: 0 },
  { value: 'Wife', labelEn: 'Wife', labelBn: 'স্ত্রী', generation: 0 },
  { value: 'Brother', labelEn: 'Brother', labelBn: 'ভাই', generation: 0 },
  { value: 'Sister', labelEn: 'Sister', labelBn: 'বোন', generation: 0 },
  { value: 'Cousin', labelEn: 'Cousin', labelBn: 'কাজিন', generation: 0 },
  { value: 'Caregiver', labelEn: 'Caregiver', labelBn: 'সেবাকারী', generation: 0 },
  // Generation 1
  { value: 'Son', labelEn: 'Son', labelBn: 'ছেলে', generation: 1 },
  { value: 'Daughter', labelEn: 'Daughter', labelBn: 'মেয়ে', generation: 1 },
  // Generation 2
  { value: 'Grandson', labelEn: 'Grandson', labelBn: 'নাতি', generation: 2 },
  { value: 'Granddaughter', labelEn: 'Granddaughter', labelBn: 'নাতনি', generation: 2 },
  // Other / Custom
  { value: 'Other', labelEn: 'Other Relation', labelBn: 'অন্যান্য সম্পর্ক', generation: 0 },
  { value: 'Custom', labelEn: '✨ Custom Relation...', labelBn: '✨ কাস্টম সম্পর্ক...', generation: 0 },
]
