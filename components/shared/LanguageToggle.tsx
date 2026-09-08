'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'

export function LanguageToggle() {
  const { lang, setLang } = useLanguage()

  return (
    <div className="inline-flex items-center p-1 rounded-full bg-gray-100/90 dark:bg-gray-800/80 border border-gray-200/60 dark:border-gray-700/60 shadow-xs">
      <button
        type="button"
        onClick={() => setLang('bn')}
        className={cn(
          'px-3 py-1 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer',
          lang === 'bn'
            ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-sm'
            : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
        )}
      >
        বাংলা
      </button>
      <button
        type="button"
        onClick={() => setLang('en')}
        className={cn(
          'px-3 py-1 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer',
          lang === 'en'
            ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-sm'
            : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
        )}
      >
        EN
      </button>
    </div>
  )
}
