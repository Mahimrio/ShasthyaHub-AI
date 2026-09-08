import { cn } from '@/lib/utils'

interface BrandWordmarkProps {
  /** Size/weight utilities for the whole mark, e.g. "text-base". */
  className?: string
  /** Appended to "Hub" in the neutral colour, e.g. "-AI". */
  suffix?: string
}

/** "Shasthya" in the brand gradient, "Hub" neutral — the one wordmark used everywhere. */
export function BrandWordmark({ className, suffix }: BrandWordmarkProps) {
  return (
    <span className={cn('font-display whitespace-nowrap', className)}>
      <span className="bg-gradient-to-r from-sky-600 via-cyan-500 to-emerald-500 bg-clip-text text-transparent dark:from-sky-400 dark:via-cyan-400 dark:to-emerald-400">
        Shasthya
      </span>
      <span className="text-gray-900 dark:text-white">
        Hub{suffix}
      </span>
    </span>
  )
}
