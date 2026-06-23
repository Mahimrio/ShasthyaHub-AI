import type { Severity } from '@/types'

/**
 * Severity → visual style map. Shared by EyeResultCard, the page result section,
 * and the history list so medical severity colors stay consistent everywhere.
 *
 * Rule (medical_ux skill): red is reserved exclusively for danger — never
 * decoration. green/yellow/orange/red form the universal traffic-light order.
 */
export interface SeverityStyle {
  /** Left-accent border classes for the banner card. */
  border: string
  /** Tinted background (light + dark) for the banner body. */
  bg: string
  /** Badge variant matching components/ui/badge.tsx custom variants. */
  badge: 'green' | 'low' | 'medium' | 'high' | 'critical'
  /** Text color class for strong labels inside the banner. */
  text: string
  /** Small dot indicator color. */
  dot: string
  /** Progress-bar fill color (used by the confidence meter). */
  bar: string
}

export const severityStyles: Record<Severity, SeverityStyle> = {
  Normal: {
    border: 'border-l-4 border-green-500',
    bg: 'bg-green-50 dark:bg-green-900/30',
    badge: 'green',
    text: 'text-green-800 dark:text-green-200',
    dot: 'bg-green-500',
    bar: 'bg-green-500',
  },
  Low: {
    border: 'border-l-4 border-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    badge: 'low',
    text: 'text-blue-800 dark:text-blue-200',
    dot: 'bg-blue-500',
    bar: 'bg-blue-500',
  },
  Medium: {
    border: 'border-l-4 border-yellow-500',
    bg: 'bg-yellow-50 dark:bg-yellow-900/30',
    badge: 'medium',
    text: 'text-yellow-800 dark:text-yellow-200',
    dot: 'bg-yellow-500',
    bar: 'bg-yellow-500',
  },
  High: {
    border: 'border-l-4 border-orange-500',
    bg: 'bg-orange-50 dark:bg-orange-900/30',
    badge: 'high',
    text: 'text-orange-800 dark:text-orange-200',
    dot: 'bg-orange-500',
    bar: 'bg-orange-500',
  },
  Critical: {
    border: 'border-l-4 border-red-500',
    bg: 'bg-red-50 dark:bg-red-900/30',
    badge: 'critical',
    text: 'text-red-800 dark:text-red-200',
    dot: 'bg-red-500',
    bar: 'bg-red-500',
  },
}

/** Human-readable severity label in the requested language. */
export function severityLabel(severity: Severity, lang: 'en' | 'bn'): string {
  const labels: Record<Severity, { en: string; bn: string }> = {
    Normal: { en: 'Normal', bn: 'স্বাভাবিক' },
    Low: { en: 'Low Risk', bn: 'কম ঝুঁকি' },
    Medium: { en: 'Medium Risk', bn: 'মাঝারি ঝুঁকি' },
    High: { en: 'High Risk', bn: 'উচ্চ ঝুঁকি' },
    Critical: { en: 'Critical', bn: 'গুরুতর' },
  }
  return lang === 'bn' ? labels[severity].bn : labels[severity].en
}
