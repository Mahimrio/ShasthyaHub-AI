'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'
import { useDarkMode } from '@/contexts/DarkModeContext'
import { cn } from '@/lib/utils'

export function ThemeToggle({ className }: { className?: string }) {
  const { dark, toggle } = useDarkMode()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  if (!mounted) {
    return (
      <button
        className={cn(
          'p-2 rounded-lg transition-colors',
          'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800',
          className
        )}
        aria-label="Toggle theme"
      >
        <span className="inline-block h-4 w-4" />
      </button>
    )
  }

  return (
    <button
      onClick={toggle}
      className={cn(
        'p-2 rounded-lg transition-colors',
        'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800',
        className
      )}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  )
}
