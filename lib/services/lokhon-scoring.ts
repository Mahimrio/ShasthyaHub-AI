import type { LokhonQuestion, LokhonAnswer, RiskBand } from '@/types'

export interface ScoringInput {
  questions: LokhonQuestion[]
  answers: LokhonAnswer[]
}

export interface ScoringOutput {
  riskPercentage: number
  riskBand: RiskBand
  isRedFlag: boolean
  topSymptoms: { text_en: string; text_bn: string; value: number }[]
  requiresImmediateSupport: boolean
}

const RISK_BANDS: [number, number, RiskBand][] = [
  [0, 24, 'Low'],
  [25, 49, 'Moderate'],
  [50, 74, 'High'],
  [75, 100, 'Urgent'],
]

function findRiskBand(percentage: number): RiskBand {
  for (const [min, max, band] of RISK_BANDS) {
    if (percentage >= min && percentage <= max) return band
  }
  return 'Low'
}

export function calculateRisk(input: ScoringInput): ScoringOutput {
  const { questions, answers } = input

  const answerMap = new Map<string, number>()
  for (const a of answers) {
    answerMap.set(a.questionId, a.value)
  }

  let totalWeighted = 0
  let totalWeight = 0
  let isRedFlag = false
  const flaggedAnswers: { question: LokhonQuestion; normalized: number }[] = []

  for (const q of questions) {
    const rawValue = answerMap.get(q.id)
    if (rawValue === undefined) continue

    const normalized = (rawValue - 1) / 4
    totalWeighted += normalized * q.weight
    totalWeight += q.weight

    if (q.is_red_flag && rawValue >= 4) {
      isRedFlag = true
    }

    flaggedAnswers.push({ question: q, normalized: rawValue })
  }

  const rawPercentage = totalWeight > 0 ? (totalWeighted / totalWeight) * 100 : 0
  const riskPercentage = Math.round(rawPercentage * 10) / 10

  const riskBand = isRedFlag ? 'Urgent' : findRiskBand(riskPercentage)

  const topSymptoms = flaggedAnswers
    .filter((f) => f.normalized >= 3)
    .sort((a, b) => b.normalized - a.normalized)
    .slice(0, 3)
    .map((f) => ({
      text_en: f.question.text_en,
      text_bn: f.question.text_bn,
      value: f.normalized,
    }))

  const selfHarmValue = answerMap.get('self_harm_thoughts')
  const requiresImmediateSupport = selfHarmValue !== undefined && selfHarmValue >= 3

  return { riskPercentage, riskBand, isRedFlag, topSymptoms, requiresImmediateSupport }
}
