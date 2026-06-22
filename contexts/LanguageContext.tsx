'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { Language } from '@/types'

interface LanguageContextType {
  lang: Language
  setLang: (l: Language) => void
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'bn',
  setLang: () => {},
})

function getInitialLang(): Language {
  if (typeof window === 'undefined') return 'bn'
  try {
    const stored = localStorage.getItem('shasthya_lang') as Language | null
    return stored || 'bn'
  } catch {
    return 'bn'
  }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>(getInitialLang)

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback(async (l: Language) => {
    setLangState(l)
    localStorage.setItem('shasthya_lang', l)
    document.documentElement.lang = l

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('profiles')
          .update({ preferred_language: l })
          .eq('id', user.id)
      }
    } catch {
      // Supabase client not available (e.g. during prerendering)
    }
  }, [])

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      <div className={lang === 'bn' ? 'font-bengali leading-bengali' : 'font-sans'}>
        {children}
      </div>
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)
