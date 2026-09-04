'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import type { ReactNode } from 'react'

interface ResultCardProps {
  title: string
  titleBn?: string
  icon?: ReactNode
  badge?: { label: string; variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'critical' | 'high' | 'medium' | 'low' | 'normal' | 'green' | 'yellow' | 'red' }
  children: ReactNode
  defaultExpanded?: boolean
  actions?: ReactNode
}

export function ResultCard({ title, badge, icon, children, defaultExpanded = true, actions }: ResultCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  return (
    <div className="glass-card rounded-3xl overflow-hidden transition-all duration-300">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-5 hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          {icon && <span className="text-sky-500 shrink-0">{icon}</span>}
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{title}</h3>
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
