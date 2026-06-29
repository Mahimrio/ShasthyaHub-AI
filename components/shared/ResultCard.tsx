'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import type { ReactNode } from 'react'

interface ResultCardProps {
  title: string
  titleBn?: string
  badge?: { label: string; variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'critical' | 'high' | 'medium' | 'low' | 'normal' | 'green' | 'yellow' | 'red' }
  children: ReactNode
  defaultExpanded?: boolean
  actions?: ReactNode
}

export function ResultCard({ title, badge, children, defaultExpanded = true, actions }: ResultCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  return (
    <div className="bg-white/90 backdrop-blur-sm dark:bg-gradient-to-br dark:from-gray-900/90 dark:to-gray-800/70 rounded-2xl border border-gray-200/50 dark:border-gray-700/60 overflow-hidden transition-all duration-300 shadow-[0_10px_40px_rgba(0,0,0,0.1),0_4px_12px_rgba(14,165,233,0.06)] hover:shadow-[0_20px_60px_rgba(14,165,233,0.12),0_8px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.4),0_4px_12px_rgba(14,165,233,0.08)] dark:hover:shadow-[0_20px_60px_rgba(14,165,233,0.15),0_8px_24px_rgba(0,0,0,0.5)]">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
      >
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200">{title}</h3>
          {badge && (
            <Badge variant={badge.variant || 'default'}>{badge.label}</Badge>
          )}
        </div>
        {actions ? (
          <div onClick={(e) => e.stopPropagation()}>{actions}</div>
        ) : (
          expanded ? <ChevronUp className="h-4 w-4 text-gray-400 dark:text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-400 dark:text-gray-500" />
        )}
      </button>
      {expanded && (
        <div className={cn('px-4 pb-4 pt-0 border-t border-gray-50 dark:border-gray-700/50')}>
          {children}
        </div>
      )}
    </div>
  )
}
