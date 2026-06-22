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
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-none border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
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
