'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'

export function LanguageToggle() {
  const { lang, setLang } = useLanguage()

  return (
    <div
      className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
      style={{ transition: 'opacity 0.2s ease-in-out' }}
    >
      <button
        onClick={() => setLang('bn')}
        className={cn(
          'flex-1 px-2 py-1.5 text-xs font-medium transition-colors',
          lang === 'bn'
            ? 'bg-sky-500 text-white'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
        )}
      >
        বাংলা
      </button>
      <button
        onClick={() => setLang('en')}
        className={cn(
          'flex-1 px-2 py-1.5 text-xs font-medium tracking-wide transition-colors',
          lang === 'en'
            ? 'bg-sky-500 text-white'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
        )}
      >
        EN
      </button>
    </div>
  )
}
